const monsterContainer = document.getElementById("monster-container");

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

function buildTableTitles(monsterObjArr) {
	//print("buildTableTitles", "monsterObjArr", monsterObjArr);
	const tableHeader = document.createElement('tr');
	
	const monsterKeys = Object.keys(monsterObjArr[0]);
	print("buildTableTitles", "monsterKeys", monsterKeys);

	monsterKeys.forEach(key => {
		const title = document.createElement('th');
		title.textContent = key;
		tableHeader.append(title);
	});
	return tableHeader
}

function tableFactory(monsters) {
	const tableRows = [];
	tableRows.push(buildTableTitles(monsters));
	return tableRows;
}

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

function monsterWasher(dirtyMonsters) {
	//some monster are missing values, others are nested, have to be handled seperatly
	
	const cleanMonsters = dirtyMonsters.map(dirty => {
		const clean = {};
		clean.name = washdroid(dirty.name);
		clean.size = washdroid(dirty.size);
		clean.type = washdroid(dirty.type);
		clean.armor = washdroid(dirty.armor_class[1]);
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

function buildMonsterTable(table) {
	catchMonsters()
		.then(wildMonsters => monsterWasher(wildMonsters))
		.then(cleanMonsters => tableFactory(cleanMonsters))
		.then(monsterRows => table.append(monsterRows)); 
}

function renderPage() {
	//buildMonsters();
	buildMonsterTable();
}

renderPage();
