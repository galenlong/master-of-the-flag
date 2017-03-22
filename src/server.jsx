// 
// server.jsx
// start server, run games
// 

const React = require("react");
const ReactDOMServer = require("react-dom/server");

// node/express packages
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const url = require("url");
const querystring = require("querystring");

// set up socket.io/express
const express = require("express");
const app = express();
const server = http.Server(app);
const io = require("socket.io")(server);

// application imports
const Components = require("./components.js");
const Template = require("./template.js");
const Data = require("./data.js");

// global games list
let games = {};
let socketIdsToGameIds = {};
// let moves = [];
// let gameSockets = new GameSockets();

//
// utils
//

// TODO remove all references to trademarked Stratego -> Master of the Flag
// TODO move necessary functions into utils.js
// TODO replace GameSockets with socket.io namespaces/rooms?
// TODO don't inject player/move list into code, send through HTTP req?
// TODO what should happen if root games folder is requested? game vs games?

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
		let sockets = [];
		for (let socketId in this[player]) {
			sockets.push(this[player][socketId]);
		}
		return sockets;
	}

	this.deleteSocket = function(socketId) {
		let player = Data.Player.ONE;
		if (this[Data.Player.TWO][socketId]) {
			let player = Data.Player.TWO;
		}
		delete this[player][socketId];
		return player;
	}

	this.getAllSocketsExcept = function(sourceSocketId) {
		let sockets = [];
		for (let player of [Data.Player.ONE, Data.Player.TWO]) {
			for (let socketId in this[player]) {
				if (socketId !== sourceSocketId) {
					sockets.push(this[player][socketId]);
				}
			}
		}
		return sockets;
	}

	this.print = function() {
		let p1Sockets = [];
		let p2Sockets = [];
		for (let socketId in this[Data.Player.ONE]) {
			p1Sockets.push(socketId);
		}
		for (let socketId in this[Data.Player.TWO]) {
			p2Sockets.push(socketId);
		}
		console.log({p1: p1Sockets, p2: p2Sockets});
	}
}

function getUniqueRandomHexId(numBytes, lookup) { // lookup is optional
	let _id;
	do {
		_id = crypto.randomBytes(numBytes).toString('hex');
	} while (lookup && lookup[_id]);
	return _id;
}

function getValidGameId(rawUrl) {
	var query = querystring.parse(url.parse(rawUrl).query);
	if (query.id && games[query.id]) {
		return query.id;
	}
	return null;
}

function getPlayerId(cookies, gameId) {
	let playerId = cookies[gameId];
	console.log("the player", playerId);

	// TODO fetch unique player id from games obj
	if (playerId === "1") {
		return Data.Player.ONE;
	} else if (playerId === "2") {
		return Data.Player.TWO;
	}
	
	// TODO no player ID found, must assign player id ≠ to p1
	return Data.Player.ONE;
}

//
// http handlers
//

function gameCreation(req, res) {
	console.log("HTTP game creation");
	let html = Template.createHTML();
	res.send(html);
}

function gameFetch(req, res) {
	console.log("HTTP game fetch");

	let gameId = getValidGameId(req.url);
	if (!gameId) {
		console.log("INVALID GAME ID");
		return res.send("<html></html>");
	}

	let player = getPlayerId(req.cookies, gameId);
	// TODO player ID validity checking

	let moves = games[gameId].moves;
	let component = (<Components.Game 
		player={player} 
		moves={moves} 
		gameId={gameId} />);
	let rendered = ReactDOMServer.renderToString(component);

	let html = Template.gameHTML(player, moves, gameId, rendered);
	res.send(html);

	console.log("fetching game", gameId, "for player", player);
}

//
// http response
//

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", gameCreation);
app.get("/games/", gameFetch);

//
// response handlers
//

function connectionMiddleware(socket, next) {
	let query = socket.handshake.query;
	// TODO check for valid players too
	if (!query.player || !query.gameId || !games[query.gameId]) {
		return next();
	}

	let player = query.player;
	let gameId = query.gameId;
	
	games[gameId].sockets.addSocketToPlayer(player, socket);
	socketIdsToGameIds[socket.id] = gameId;

	console.log("socket", socket.id, "joined", player, "for game", gameId);
	console.log("socket to games", socketIdsToGameIds);
	games[gameId].sockets.print();
	
	next();
}

function disconnectHandler(socket) {
	return () => {
		let gameId = socketIdsToGameIds[socket.id];
		if (!gameId) {
			return;
		}

		// TODO check for valid player ID too?
		let player = games[gameId].sockets.deleteSocket(socket.id);
		games[gameId].sockets.print();
		delete socketIdsToGameIds[socket.id];

		console.log(player, "with socket", socket.id, 
			"disconnected from game", gameId);
		console.log("socket to games", socketIdsToGameIds);
	}
}

function createHandler(socket) {
	return () => {
		const gameId = getUniqueRandomHexId(20, games);
		const playerId = getUniqueRandomHexId(20);

		games[gameId] = {
			[Data.Player.ONE]: playerId,
			[Data.Player.TWO]: null,
			moves: [],
			sockets: new GameSockets(),
		}

		socket.emit("created", JSON.stringify({
			gameId: gameId, playerId: playerId,
			url: url.resolve("http://127.0.0.1:8080", `/games?id=${gameId}`),
		}));

		console.log("created game", games[gameId]);
	}
}

function moveHandler(socket) {
	return (jsonData) => {
		let data = JSON.parse(jsonData);
		let gameId = data.gameId;
		let move = data.move;
		let player = games[gameId].sockets.getSocketPlayer(socket.id);
		
		games[gameId].moves.push(move);

		let otherSockets = games[gameId].sockets.getAllSocketsExcept(socket.id);
		for (let otherSocket of otherSockets) {
			console.log("sending move to", otherSocket.id);
			otherSocket.emit("other-move", JSON.stringify(move));
		}

		console.log(player, socket.id, gameId, "move", move.start, "to", move.end);
	}
}

//
// client-server communication
//

io.use(connectionMiddleware);
io.on("connection", function (socket) {
	socket.on("create", createHandler(socket));
	socket.on("move", moveHandler(socket));
	socket.once("disconnect", disconnectHandler(socket));
});

//
// start server
//

server.listen(8080, function () {
	console.log("server listening...");
});
