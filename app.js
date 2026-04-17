const monsterContainer = document.getElementById("monster-container");
const monsterContainerAlpha = document.getElementById("monster-container-alpha");
const monsterTableAlpha = document.getElementById("monster-table-alpha");

//Monster Imigration policies
const monsterStart = 99; //what index to start picking from
const amountMonsters = 10; //how many monsters to fetch
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

async function getJson(apiUrl) {
	const response = await fetch(apiUrl);
	//print("getJson", "response", response)
	
	if (response.ok) {
		const json = await response.json()
		//print("getJson", "json", json);

		return json;
	}
}

function clearPage() {
monsterContainer.replaceChildren();
monsterContainerAlpha.replaceChildren();
monsterTableAlpha.replaceChildren();
	
}

function monsterFactory(monsterJson) {
	//print("monsterFactory", "monsterJson", monsterJson);
	
	const monsterOrder = monsterJson.results.slice(monsterStart, amountMonsters);
	
		monsterOrder.forEach(async monster => {
			const monsterData = await getJson(dndApi.url + monster.url)
			//print("monsterFactory", "monsterData", monsterData);

			const monsterTitle = document.createElement('h2');
			monsterTitle.textContent = monster.name;

			const monsterImg = document.createElement('img');
			const imgPath = dndApi.url + monsterData.image;
			//print("monsterFactory", "imgPath", imgPath);
			monsterImg.src = imgPath; 

			monsterContainer.append(monsterTitle, monsterImg);
		});
}

function buildMonsters() {
	getJson(dndApi.monsters())
		.then(json => monsterFactory(json))
		.then(monsters => monsterContainer.append(monsters));

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

		//print("buildTablerows", "dataRow", dataRow);
		return dataRow;
	});
}

/************************************************************
 * returns an array of tableRows
 * **********************************************************/
function tableFactory(monsters) {
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
	const monsterTrackers = await getJson(dndApi.monsters());
	//print("fetchMonsters", "monsterTrackers", monsterTrackers); 
	
	const choosenTrackers = monsterTrackers.results.slice(monsterStart, monsterEnd)
	
	//Promise runs independent awaits concurrently
	const wildMonsters = await Promise.all( choosenTrackers.map((mi) => {
		//print("catchMonsters", "mi", mi);

		//returns one of many monsters to an array
		return getJson(dndApi.url + mi.url);
	})
	);

	//print("catchMonsters", "wildMonsters", wildMonsters);
	return wildMonsters;
}

/***********************************************************
 * extracts wanted monster values into a flat object array
 * ********************************************************/
function monsterWasher(dirtyMonsters) {
	
	const cleanMonsters = dirtyMonsters.map(dirty => {
		const clean = {};
		clean.name = washdroid(dirty.name);
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
	//if 
	if (target) return target
	else return 0;
}

/**********************************************************
 * takes a table DOM element as argument
 *  1.fetch monsters
 *  2.clean data
 *  3.creates DOM rows from monster data
 *  4.table appends an array of rows
 * ********************************************************/
function buildMonsterTable(table) {
	catchMonsters()
		.then(wildMonsters => monsterWasher(wildMonsters))
		.then(cleanMonsters => tableFactory(cleanMonsters))
		.then(monsterRows => table.append(...monsterRows)); 
}

function renderPage() {
	clearPage();
	//buildMonsters();
	buildMonsterTable(monsterTableAlpha);
}

renderPage();
renderPage();
