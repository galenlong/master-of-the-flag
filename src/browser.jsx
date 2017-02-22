var React = require("react");
var ReactDOM = require("react-dom");
var Components = require("./components.jsx"); // src version for browserify

ReactDOM.render(
	<Components.Game />,
	document.getElementById("root")
);
