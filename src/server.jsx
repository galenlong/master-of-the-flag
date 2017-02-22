var React = require("react");
var ReactDOMServer = require("react-dom/server");

var favicon = require("serve-favicon");
var path = require("path");
var express = require("express");
var app = express();

var Components = require("./components.js");
var template = require("./template.js");

// if favicon not showing, quit browser - refresh isn't enough
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
	var rendered = ReactDOMServer.renderToString(
		<Components.Game />
	);
	var html = template(rendered);
	res.send(html);
});

app.listen(8080);
