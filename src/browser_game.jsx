let React = require("react");
let ReactDOM = require("react-dom");
let Components = require("./components.jsx"); // src version for browserify

// get server-injected player and moves from global window variable
ReactDOM.render(
	<Components.Game 
		player={window.player} 
		moves={window.moves} 
		gameId={window.gameId} 
	/>,
	document.getElementById("root")
);
