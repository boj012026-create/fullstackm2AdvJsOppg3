
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
const monsterStart = 9; //what index to start picking from
const amountMonsters = 25; //how many monsters to fetch
const monsterEnd = monsterStart + amountMonsters; //for Arr.slice() 

let monsterCatalog = new Map();

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

async function getJson(apiUrl) {
	const response = await fetch(apiUrl);
	//print("getJson", "response", response)
	
	if (response.ok) {
		const json = await response.json()
		//print("getJson", "json", json);

		return json;
	}
}

/**************************************************************
 * returns one table header with objArr's key  titles
 * ************************************************************/
function buildTableTitles(monsterObjArr) {
	print("buildTableTitles", "monsterObjArr", monsterObjArr);
	const tableHeader = document.createElement('tr');
	
	const monsterKeys = Object.keys(monsterObjArr[0]);
	print("buildTableTitles", "monsterKeys", monsterKeys);

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
function buildTableRows(monsterObjArr) {
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
			alpha.index = m.name;
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
function tableFactory(monsters) {
	print("tableFactory", "monsters", monsters);
	const tableRows = [];
	tableRows.push(buildTableTitles(monsters));
	tableRows.push(...buildTableRows(monsters));
	
	//print("tableFactory", "tableRows", tableRows);
	return tableRows;
}

/**************************************************************
 * fetches monsters and their data
 * amount of monsters are controlled by constants in top
 * ***********************************************************/
async function catchMonsters() {
	print("fetchMonsters", "monsterCatalog", monsterCatalog); 

	const monsterTrackers = await getJson(dndApi.monsters());
	//print("fetchMonsters", "monsterTrackers", monsterTrackers); 

	let choosenTrackers = monsterTrackers.results.slice(monsterStart, monsterEnd)

	if(useLocalStorage) {
		loadLocalMonsters();
		//choosenTrackers = monsterTrackers.results;//gets all monsters
	}

	//Promise runs independent awaits concurrently, but overloaded api
	const wildMonsters = await Promise.all( choosenTrackers.map(async (mi) => {
		//print("catchMonsters", "mi", mi);

		if(monsterStored(mi)) {
			const oldMonster = monsterCatalog.get(mi.index)
			//print("catchMonsters", "oldMonster",oldMonster);

			return monsterCatalog.get(mi.index);
		} else {
			const newMonster = await getJson(dndApi.url + mi.url);
			//print("catchMonsters", "newMosnter",newMonster);

			//saves new monster
			storeMonster(newMonster);
			return newMonster;
		}
	}));


	print("catchMonsters", "wildMonsters", wildMonsters);
	return wildMonsters;
}

function monsterStored(monster) {
	print("monsterStored", "monster", monster);
	print("monsterStored", "monsterCatalog", monsterCatalog);
	return  monsterCatalog.has(monster.index);	
}

function loadLocalMonsters() {
	if(useLocalStorage) {
		const json = localStorage.getItem("monsterCatalog");
		if (json) {
			monsterCatalog = JSON.parse(json);
		}
	} else {
		localStorage.clear();
	}
}

function storeMonster(monster) {
	monsterCatalog.set(monster.index, monster);
	if(useLocalStorage) {
	localStorage.setItem("monsterCatalog",JSON.stringify(monsterCatalog)); 
	}
}

/***********************************************************
 * extracts wanted monster values into a flat object array
 * ********************************************************/
function monsterWasher(dirtyMonsters) {
	print("monsterWasher", "dirtyMonsters", dirtyMonsters);	
	print("monsterWasher", "dirtyMonsters.length", dirtyMonsters.length);	

	const cleanMonsters = dirtyMonsters.map(dirty => {
		print("monsterWasher", "dirty", dirty);	
		const clean = {};
		clean.name = washdroid(dirty.index);
		clean.size = washdroid(dirty.size);
		clean.type = washdroid(dirty.type);
		clean.armor = washdroid(dirty.armor_class[0].value);
		clean.health = washdroid(dirty.hit_points);
		return clean;
	});

	print("monsterWasher","cleanMonsters", cleanMonsters);
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
		.then(cleanMonsters => tableFactory(cleanMonsters))
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
}

renderPage();
