var React = require("react");
var ReactDOM = require("react-dom");
var Components = require("./components.jsx"); // src version for browserify

// get server-injected player and moves from global window variable
ReactDOM.render(
	<Components.Game player={window.player} moves={window.moves} />,
	document.getElementById("root")
);
