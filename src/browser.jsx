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

// TODO use standalone mode instead?
// need to export to window to make function publicly available
// outside of browserify
window.loadReact = loadReact;