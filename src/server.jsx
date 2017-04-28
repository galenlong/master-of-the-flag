// 
// server.jsx
// start server, run games
// 

const React = require("react");
const ReactDOMServer = require("react-dom/server");

// node/express packages
const pug = require("pug");
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
const Data = require("./data.js");

// global games list
let games = {};
let socketIdsToGameIds = {};
const baseURL = "http://127.0.0.1:8080";

//
// utils
//

// TODO add date/time game created to title to differentiate games?
// TODO remove all references to trademarked Stratego -> Master of the Flag
// TODO move necessary functions into utils.js
// TODO replace GameSockets with socket.io namespaces/rooms?
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
		let player;
		if (this[Data.Player.ONE][socketId]) {
			player = Data.Player.ONE;
		} else {
			player = Data.Player.TWO
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
	if (games[gameId][Data.Player.ONE] === playerId) {
		return Data.Player.ONE;
	} else if (games[gameId][Data.Player.TWO] === playerId) {
		return Data.Player.TWO;
	}
	return null;
}

//
// http handlers
//

function gameCreate(req, res) {
	res.render("create");
}

function gameFetch(req, res) {
	// invalid game ID
	let gameId = getValidGameId(req.url);
	if (!gameId) {
		return res.render("error"); // TODO
	}

	let player = getPlayerId(req.cookies, gameId);
	if (!player) {
		// unregistered visitor
		if (games[gameId][Data.Player.TWO]) {
			return res.render("error") // TODO
		} else { // no player 2 registered yet, so this must be player 2 
			const player2Id = getUniqueRandomHexId(20);
			games[gameId][Data.Player.TWO] = player2Id;
			return res.render("register", {
				gameId: gameId, 
				player2Id: player2Id,
			});
		}
	}

	console.log("fetching game", gameId, "for player", player);

	// fetch game state and render server-side
	let moves = games[gameId].moves;
	let board = games[gameId].board;
	let raw = (<Components.Game 
		player={player} 
		moves={moves} 
		board={JSON.parse(JSON.stringify(board))}
		gameId={gameId} />);
	let rendered = ReactDOMServer.renderToString(raw);

	res.render("game", {
		component: rendered, 
		player: player, 
		gameId: gameId, 
		moves: JSON.stringify(moves),
		board: JSON.stringify(JSON.parse(JSON.stringify(board))),
	});
}

//
// socket handlers
//

function connectionMiddleware(socket, next) {
	let query = socket.handshake.query;
	let gameId = query.gameId;
	let player = query.player;
	if (!gameId || !games[gameId] || !player) {
		return next();
	}
	
	games[gameId].sockets.addSocketToPlayer(player, socket);
	socketIdsToGameIds[socket.id] = gameId;

	console.log(`socket ${socket.id} joined ${player} for game ${gameId}`);
	// games[gameId].sockets.print();
	
	next();
}

function disconnectHandler(socket) {
	return () => {
		let gameId = socketIdsToGameIds[socket.id];
		if (!gameId || !games[gameId]) {
			return;
		}

		let player = games[gameId].sockets.deleteSocket(socket.id);
		delete socketIdsToGameIds[socket.id];

		console.log(`${player} w/ socket ${socket.id} disconnected from game ${gameId}`);
		// games[gameId].sockets.print();
	}
}

function createHandler(socket) {
	return () => {
		const gameId = getUniqueRandomHexId(20, games);
		const playerId = getUniqueRandomHexId(20);

		games[gameId] = {
			[Data.Player.ONE]: playerId,
			[Data.Player.TWO]: null, // set when P2 first visits game URL
			moves: [],
			board: Data.getBoard(), // TODO switch to empty board
			sockets: new GameSockets(),
		}

		socket.emit("created", JSON.stringify({
			gameId: gameId, 
			playerId: playerId,
			url: url.resolve(baseURL, `/games?id=${gameId}`),
		}));

		console.log("Player 1 created game", gameId);
	}
}

function moveHandler(socket) {
	return (jsonData) => {
		let data = JSON.parse(jsonData);
		let gameId = data.gameId;
		let move = data.move;
		let player = games[gameId].sockets.getSocketPlayer(socket.id);
		
		games[gameId].moves.push(move);

		games[gameId].sockets.print();
		let otherSockets = games[gameId].sockets.getAllSocketsExcept(socket.id);
		for (let otherSocket of otherSockets) {
			console.log("sending move to", otherSocket.id);
			otherSocket.emit("other-move", JSON.stringify(move));
		}

		console.log(player, "sent move", move.start, "to", move.end);
	}
}

//
// http response
//

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", gameCreate);
app.get("/games/", gameFetch);

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
