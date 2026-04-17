const monsterContainer = document.getElementById("monster-container");

const monsterStart = 99;
const amountMonsters = monsterStart + 10;

//Todo Connect API
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
			print("monsterFactory", "monsterData", monsterData);

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
	const tableHead = document.createElement('tr');
	Object.keys(monsterObjArr[0]).forEach(key => {
		const titleRow = document.createElement('th');
		titleRow.textContent = key;
	});
}

function tableFactory(monsters) {
	const tableRows = [];
	tableRows.push(buildTableTitles(monsters));
	return tableRows;
}

async function fetchMonsters() {
	const monsterIndex = await getJson(dndApi.monsters());
	//print("fetchMonsters", "monsterIndex", monsterIndex); 
	
	const monsterFacts = await monsterIndex.results.map(async (mi) => {
		//print("fetchMonsters", "mi", mi);

		const dirtyMonster = await getJson(dndApi.url + mi.url);
		const cleanMonster = {};

		cleanMonster.name = await dirtyMonster.name;
		cleanMonster.size = await dirtyMonster.size;
		cleanMonster.type = await dirtyMonster.type;
		cleanMonster.armor = await dirtyMonster.armor_class[1];
		cleanMonster.health = await dirtyMonster.hit_points;

		return cleanMonster;
	});
	return monsterFacts;
}

function buildMonsterTable(table) {
	fetchMonsters()
		.then(monsters => tableFactory(monsters))
		.then(monsterRows => table.append(monsterRows)); 
}

function renderPage() {
	//buildMonsters();
	buildMonsterTable();
}

renderPage();
