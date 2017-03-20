// 
// server.jsx
// start server, run games
// 

let React = require("react");
let ReactDOMServer = require("react-dom/server");

// node/express packages
let cookieParser = require("cookie-parser");
let favicon = require("serve-favicon");
let path = require("path");
let http = require("http");

// set up socket.io/express
let express = require("express");
let app = express();
let server = http.Server(app);
let io = require("socket.io")(server);

// application imports
let Components = require("./components.js");
let template = require("./template.js");
let Data = require("./data.js");

//
// etc
//

// TODO move necessary functions into utils.js


let moves = []; // will be stored/updated as game progresses


// TODO replace with namespaces/rooms?
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
					// sockets.push(socketId);
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
let gameSockets = new GameSockets();

// TODO store/run multiple games at once
function getGameId(url) {
	return "ABC";
}

function getPlayerId(cookies, gameId) {
	let playerId = cookies[gameId];
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
// TODO root request leads to game generation page
// TODO don't inject player/move list into code, send through HTTP req?
app.get("/", function(req, res) {
	let gameId = getGameId(req.url);
	let player = getPlayerId(req.cookies, gameId);

	let component = <Components.Game player={player} moves={moves} />;
	let rendered = ReactDOMServer.renderToString(component);
	let html = template(rendered, player, moves);

	res.send(html);
});


// on connection, store socket under corresponding player
io.use(function (socket, next) {
	let player = socket.handshake.query.player;
	console.log(socket.id, "joined", player);
	gameSockets.addSocketToPlayer(player, socket);
	gameSockets.print();
	next();
});

io.on("connection", function (socket) {
	socket.on("move", function (moveJSON) {
		let player = gameSockets.getSocketPlayer(socket.id);
		let move = JSON.parse(moveJSON);
		console.log(player, socket.id, "move", move.start, "to", move.end);

		// update server game state
		moves.push(move);

		// send move to all other client sockets
		let otherSockets = gameSockets.getAllSocketsExcept(socket.id);
		for (let otherSocket of otherSockets) {
			console.log("sending move to", otherSocket.id);
			otherSocket.emit("other-move", moveJSON);
		}
	});

	// on disconnection, remove socket from socket store
	socket.once("disconnect", function () {
		let player = gameSockets.deleteSocket(socket.id);
		gameSockets.print();
		console.log(player, socket.id, "disconnected");
	})
});


server.listen(8080, function () {
	console.log("server listening...");
});
