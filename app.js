const monsterContainer = document.getElementById("monster-container");

//Todo Connect API
const dndApi = {
	url: "https://www.dnd5eapi.co/",
	api2014: function() {return `${this.url}api/2014/`},
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
	print("getJson", "response", response) 
	
	if (response.ok) {
		const json = await response.json()
		print("getJson", "json", json);

		return json;
	}
}

async function monsterFactory(monsterJson) {
	print("monsterFactory", "monsterJson", monsterJson);
	const newMonsters = [];
	monsterJson.results.forEach(monster => {
		const monsterImg = document.createElement('img');
		monsterImg.src = monster.image;
		newMonsters.push(monsterImg);
 	});
	return newMonsters;
}

function buildMonsters() {
	getJson(dndApi.monsters())
		.then(json => monsterFactory(json))
		.then(monsters => monsterContainer.append(monsters));

}

function renderPage() {
	buildMonsters();
}

renderPage();
