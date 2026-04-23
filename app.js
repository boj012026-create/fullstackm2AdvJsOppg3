const alpha = {
	index: "adult-black-dragon",
	table: document.getElementById("monster-table-alpha"),
	monsterContainer: document.getElementById("monster-container-alpha")
}

const beta = {
	index: "adult-black-dragon",
	table: document.getElementById("monster-table-beta"),
	monsterContainer: document.getElementById("monster-container-beta")
}


//when using local storage things break
const useLocalStorage = false; //used to avoid api rate limit
//load monsters from local storage

//Monster Imigration policies
const monsterStart = 0; //what index to start picking from
const amountMonsters = 40; //how many monsters to fetch
const monsterEnd = monsterStart + amountMonsters; //for Arr.slice() 

/*************************************************************
 * api doesn't support limit or offset querry parmameters.
 * But does have a rate limit.
 *************************************************************/
const dndApi = {
	url: "https://www.dnd5eapi.co",
	api2014: function() {return `${this.url}/api/2014/`},

	classes: function() {return `${this.api2014()}classes`},
	features: function() {return `${this.api2014()}features`},
	monsters: function() {return `${this.api2014()}monsters`},
	spells: function() {return `${this.api2014()}spells`},
}

//prints a variable with function name. Debugging
function print(funcName, objName, obj) {
	console.log(`${funcName}()/${objName}:\n`, obj);
}


//Getjson() common static stuff
let cache = new Map();

const request = {
	count: 0,
	limit: 99,//amount of requests allowed within a timeframe
	lastReset: Date.now(), //to calculate time before reset
	countResetTime: 60000,//ms. Time before request limit resets
	full: false, 
	queue: async function() {
		if(this.full) {
			await this.openGate();
		} 
		//if we are past reset time
		else if (this.timeToReset() <= 0) {
			this.lastReset = Date.now();
			this.count = 0;
			this.full = false;
		}
		//if request.limit is violated
		else if (this.limit < this.count) {
			this.full = true;
			await this.openGate();
			this.count = 0;
			this.full = false;
		}
		print("request", "count", this.count);
		++this.count;
	},
	openGate: async function() {
		let ms = this.timeToReset();
		return new Promise(resolve => setTimeout(resolve, ms)); 
	},
	timeToReset: function() {
		return this.countResetTime - (Date.now() - this.lastReset);
	}
}

async function getJson(apiUrl) {
	if(cache.has(apiUrl)) {//get json from cache if exist 
		return cache.get(apiUrl);
	} 

	//limit request within api limits
	await request.queue();
	
	const response = await fetch(apiUrl);
	//print("getJson", "response", response)
	
	if (!response.ok) {

	}
	const json = await response.json()
	//print("getJson", "json", json);

	cache.set(apiUrl, json);//stores json to cache 
	return json;
}

/**************************************************************
 * returns one table header with objArr's key  titles
 * ************************************************************/
function buildTableTitles(monsterObjArr) {
	//print("buildTableTitles", "monsterObjArr", monsterObjArr);
	const tableHeader = document.createElement('tr');
	
	const monsterKeys = Object.keys(monsterObjArr[0]);
	//print("buildTableTitles", "monsterKeys", monsterKeys);

	monsterKeys.forEach(key => {
		const title = document.createElement('th');
		title.textContent = key;
		tableHeader.append(title);
	});

	//print("buildTableTitles", "tableHeader", tableHeader);
	return tableHeader
}

/************************************************************
 * builds table rows from given monster Object array
 * returns an array of tableRows
 * ***********************************************************/
function buildTableRows(monsterObjArr, bp) {
	return monsterObjArr.map(m => {
		const dataRow = document.createElement('tr');
		//print("buildTableRows", "m", m) 

		
		Object.keys(m).forEach(key => {
			const data = document.createElement('td');
		
			data.textContent = m[key];
			//print("buildTableRows", "m.key", m[key]);

			dataRow.append(data);
		});

		const rowBtn = document.createElement('button');
		rowBtn.textContent = "Show";
		rowBtn.addEventListener('click', () => {
			bp.index = m.name;
			renderPage();
		});

		dataRow.append(rowBtn);

		//print("buildTablerows", "dataRow", dataRow);
		return dataRow;
	});
}

/************************************************************
 * returns an array of tableRows
 * **********************************************************/
function tableFactory(monsters, bp) {
	//print("tableFactory", "monsters", monsters);
	const tableRows = [];
	tableRows.push(buildTableTitles(monsters));
	tableRows.push(...buildTableRows(monsters, bp));
	
	//print("tableFactory", "tableRows", tableRows);
	return tableRows;
}

/**************************************************************
 * fetches monsters and their data
 * amount of monsters are controlled by constants in top
 * ***********************************************************/
async function catchMonsters() {
	//print("fetchMonsters", "monsterCatalog", monsterCatalog); 

	const monsterTrackers = await getJson(dndApi.monsters());
	//print("fetchMonsters", "monsterTrackers", monsterTrackers); 

	let choosenTrackers = monsterTrackers.results.slice(monsterStart, monsterEnd)

	//Promise runs independent awaits concurrently, but overloaded api
	const wildMonsters = await Promise.all( choosenTrackers.map(async (mi) => {
		//print("catchMonsters", "mi", mi);

			const newMonster = await getJson(dndApi.url + mi.url);
			//print("catchMonsters", "newMosnter",newMonster);
			return newMonster;
	}));


	//print("catchMonsters", "wildMonsters", wildMonsters);
	return wildMonsters;
}

function storeLocal() {
	if(useLocalStorage) {
		const cacheArray = Array.from(cache, ([key, value]) => ({
			id: key,
			...value
		}));
		localStorage.setItem("cacheArray", JSON.stringify(cacheArray));
		console.log("saved", cacheArray);
	}
}

function loadLocal() {
	if(useLocalStorage) {
		const json = localStorage.getItem("cacheArray");
		if (json) {
			let cacheArray = JSON.parse(json);
			cache = new Map(cacheArray.map(c => [c.id, c]));
			console.log("loaded", cacheArray);
		}
	} else {
		localStorage.clear();
	}
}

/***********************************************************
 * extracts wanted monster values into a flat object array
 * ********************************************************/
function monsterWasher(dirtyMonsters) {
	//print("monsterWasher", "dirtyMonsters", dirtyMonsters);	
	//print("monsterWasher", "dirtyMonsters.length", dirtyMonsters.length);	

	const cleanMonsters = dirtyMonsters.map(dirty => {
		//print("monsterWasher", "dirty", dirty);	
		const clean = {};
		clean.name = washdroid(dirty.index);
		clean.size = washdroid(dirty.size);
		clean.type = washdroid(dirty.type);
		clean.armor = washdroid(dirty.armor_class[0].value);
		clean.health = washdroid(dirty.hit_points);
		return clean;
	});

	//print("monsterWasher","cleanMonsters", cleanMonsters);
	return cleanMonsters;
}

/*******************************************************
 * checks if @target got a value, else give it one
 * *****************************************************/
function washdroid(target) {
	if (target) return target
	else return 0;
}

/**********************************************************
 * takes a table DOM element as argument
 *  1.fetch monsters
 *  2.clean data
 *  3.creates DOM rows from monster data
 *  4.table appends an array of rows
 *
 *  @bp blueprint
 * ********************************************************/
function buildMonsterTable(bp) {
	catchMonsters()
		.then(wildMonsters => monsterWasher(wildMonsters))
		.then(cleanMonsters => tableFactory(cleanMonsters, bp))
		.then(monsterRows => bp.table.replaceChildren(...monsterRows)); 
}
/**
 * builds a monster based on blueprint
 * which also contain dom-element references
 * @bp bluePrint
 */
function buildMonster(pb) {
	const monsterImg = document.createElement('img')
	//const imgpath = dndApi.url + "/images/monsters/" + 
	const imgPath = `${dndApi.url}/api/images/monsters/${pb.index}.png`; 
	monsterImg.src = imgPath;
	pb.monsterContainer.replaceChildren(monsterImg);
}

function renderPage() {
	buildMonster(alpha);
	buildMonsterTable(alpha);
	buildMonster(beta);
	buildMonsterTable(beta);
	storeLocal();
}
loadLocal();
renderPage();
