let React = require("react");
let ReactDOM = require("react-dom");
let Components = require("./components.jsx"); // src version for browserify

function loadReact(player, gameId, moves) {
	ReactDOM.render(
		<Components.Game 
			player={player} 
			moves={moves} 
			gameId={gameId} 
		/>,
		document.getElementById("root")
	);
}

module.exports = {loadReact: loadReact};
