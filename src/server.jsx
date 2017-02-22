var React = require("react");
var ReactDOMServer = require("react-dom/server");

var path = require("path");
var express = require("express");
var app = express();

var Components = require("./components.js");
var template = require("./template.js");

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
	var rendered = ReactDOMServer.renderToString(
		<Components.Game />
	);
	var html = template(rendered);
	res.send(html);
});

app.listen(8080);
