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

function renderPage() {
	buildMonsters();
}

renderPage();
