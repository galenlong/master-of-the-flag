var React = require("react");
var ReactDOMServer = require("react-dom/server");

// node and express packages
var cookieParser = require("cookie-parser");
var favicon = require("serve-favicon");
var path = require("path");
var http = require("http");

// set up express router and server
var express = require("express");
var app = express();
var server = http.Server(app);
var io = require("socket.io")(server);

// application imports
var Components = require("./components.js");
var template = require("./template.js");
var Data = require("./data.js");



var moves = []; // will be stored/updated as game progresses

function GameSockets() {
	this[Data.Player.ONE] = {};
	this[Data.Player.TWO] = {};

	this.addSocketToPlayer = function(player, socket) {
		this[player][socket.id] = socket;
	}

	this.getSocketPlayer = function(socketId) {
		if (this[Data.Player.ONE][socketId]) {
			return Data.Player.ONE;
		}
		return Data.Player.TWO;
	}

	this.getPlayerSockets = function(player) {
		var sockets = [];
		for (var socketId in this[player]) {
			sockets.push(this[player][socketId]);
		}
		return sockets;
	}

	this.deleteSocket = function(socketId) {
		var player = Data.Player.ONE;
		if (this[Data.Player.TWO][socketId]) {
			var player = Data.Player.TWO;
		}
		delete this[player][socketId];
		return player;
	}

	this.getAllSocketsExcept = function(sourceSocketId) {
		var sockets = [];
		for (var player of [Data.Player.ONE, Data.Player.TWO]) {
			for (var socketId in this[player]) {
				if (socketId !== sourceSocketId) {
					sockets.push(this[player][socketId]);
					// sockets.push(socketId);
				}
			}
		}
		return sockets;
	}

	this.print = function() {
		var p1Sockets = [];
		var p2Sockets = [];
		for (var socketId in this[Data.Player.ONE]) {
			p1Sockets.push(socketId);
		}
		for (var socketId in this[Data.Player.TWO]) {
			p2Sockets.push(socketId);
		}
		console.log({p1: p1Sockets, p2: p2Sockets});
	}
}
var gameSockets = new GameSockets();

function getGameId(url) {
	return "ABC";
}

function getPlayerId(cookies, gameId) {
	var playerId = cookies[gameId];
	if (playerId === "1") {
		return Data.Player.ONE;
	} else if (playerId === "2") {
		return Data.Player.TWO;
	}
	
	// no player ID found, must assign player
	return Data.Player.ONE;
}



app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());


app.get("/", function(req, res) {
	var gameId = getGameId(req.url);
	var player = getPlayerId(req.cookies, gameId);

	var component = <Components.Game player={player} />;
	var rendered = ReactDOMServer.renderToString(component);
	var html = template(rendered, player, moves);

	res.send(html);
});


// on connection, store socket under corresponding player
io.use(function (socket, next) {
	var player = socket.handshake.query.player;
	console.log(socket.id, "joined", player);
	gameSockets.addSocketToPlayer(player, socket);
	gameSockets.print();
	next();
});

io.on("connection", function (socket) {
	socket.on("move", function (moveStr) {
		var player = gameSockets.getSocketPlayer(socket.id);
		var move = Data.parseMove(moveStr);
		console.log(player, socket.id, "move", move.start, "to", move.end);

		// update server game state
		moves.push(move);

		// send move to all other client sockets
		var otherSockets = gameSockets.getAllSocketsExcept(socket.id);
		for (var otherSocket of otherSockets) {
			console.log("sending move to", otherSocket.id);
			otherSocket.emit("other-move", moveStr);
		}
	});

	// on disconnection, remove socket from socket store
	socket.once("disconnect", function () {
		var player = gameSockets.deleteSocket(socket.id);
		gameSockets.print();
		console.log(player, socket.id, "disconnected");
	})
});


server.listen(8080, function () {
	console.log("server listening...");
});










