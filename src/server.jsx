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
const cloneDeep = require("lodash/cloneDeep");

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

// TODO make a game object constructor + manipulator methods
// TODO add date/time game created to title to differentiate games?
// TODO remove all references to trademarked Stratego -> Master of the Flag
// TODO move necessary functions into utils.js
// TODO replace GameSockets with socket.io namespaces/rooms?
// TODO what should happen if root games folder is requested? game vs games?

function GameSockets() {
	this[Data.Player.ONE] = {};
	this[Data.Player.TWO] = {};

	this.addSocketToPlayer = function (player, socket) {
		this[player][socket.id] = socket;
	}

	this.getSocketPlayer = function (socketId) {
		if (this[Data.Player.ONE][socketId]) {
			return Data.Player.ONE;
		}
		return Data.Player.TWO;
	}

	this.getPlayerSockets = function (player) {
		let sockets = [];
		for (let socketId in this[player]) {
			sockets.push(this[player][socketId]);
		}
		return sockets;
	}

	this.deleteSocket = function (socketId) {
		let player;
		if (this[Data.Player.ONE][socketId]) {
			player = Data.Player.ONE;
		} else {
			player = Data.Player.TWO
		}
		delete this[player][socketId];
		return player;
	}

	this.print = function () {
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
		if (games[gameId][Data.Player.TWO]) { // unregistered visitor
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
	
	let mode = games[gameId].mode;
	let turn = games[gameId].turn;
	let board = scrub(games[gameId].board, player);
	let gameWon = games[gameId].gameWon;
	let lastSixMoves = games[gameId].lastSixMoves;
	let battleResult = games[gameId].battleResult;

	let raw = (<Components.Game 
		player={player} 
		gameId={gameId}
		mode={mode}
		turn={turn}
		board={board}
		gameWon={gameWon}
		lastSixMoves={lastSixMoves}
		battleResult={battleResult}
	/>);
	let rendered = ReactDOMServer.renderToString(raw);

	res.render("game", {
		component: rendered, 
		player: player, 
		gameId: gameId, 
		mode: mode,
		turn: JSON.stringify(turn),
		board: JSON.stringify(board),
		gameWon: JSON.stringify(gameWon),
		lastSixMoves: JSON.stringify(lastSixMoves),
		battleResult: JSON.stringify(battleResult),
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
			mode: Data.Mode.PLAY, // TODO
			turn: Data.Player.ONE,
			board: Data.Board.getInitialSetup(),
			gameWon: null,
			lastSixMoves: [],
			battleResult: null,
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

function getUpdatedGameData(move, player, oldBoard, lastSixMoves) {
	let board = cloneDeep(oldBoard);
	let battleResult = null;
	let square = Data.Board.getSquare(board, move.end);
	if (Data.Board.isSquareEmpty(square)) { // move
		Data.Board.setMove(board, move.start, move.end, move.code);
	} else { // battle
		battleResult = Data.Board.setBattle(board, 
			move.start, move.end);
	}

	if (lastSixMoves.length >= 6) {
		lastSixMoves = lastSixMoves.slice(1);
	}
	lastSixMoves.push({
		start: move.start,
		end: move.end,
		player: player,
	});

	let turn = Data.Player.opposite(player);
	let gameWon = Data.Board.whoWonGameWhy(board, 
		lastSixMoves, turn);
	
	return {
		turn: turn,
		board: board,
		gameWon: gameWon,
		lastSixMoves: lastSixMoves,
		battleResult: battleResult,
	};
}

function scrub(oldBoard, player) {
	let board = cloneDeep(oldBoard);
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[0].length; j++) {
			let piece = board[i][j].piece;
			if (piece && piece.player != player && !piece.revealed) {
				board[i][j].piece.rank = Data.nbsp;
			}
		}
	}
	return board;
}

function moveHandler(socket) {
	return (moveJSON) => {
		let data = JSON.parse(moveJSON);
		let gameId = data.gameId;
		let move = data.move;
		let player = games[gameId].sockets.getSocketPlayer(socket.id);

		console.log(player, "sent move", move.start, "to", move.end);

		let gameData = getUpdatedGameData(move, player, 
			games[gameId].board, 
			games[gameId].lastSixMoves.slice());
		games[gameId].turn = gameData.turn;
		games[gameId].board = gameData.board;
		games[gameId].gameWon = gameData.gameWon;
		games[gameId].lastSixMoves = gameData.lastSixMoves;
		games[gameId].battleResult = gameData.battleResult;

		// games[gameId].sockets.print();
		for (let player of [Data.Player.ONE, Data.Player.TWO]) {
			let otherSockets = games[gameId].sockets.getPlayerSockets(player);
			for (let otherSocket of otherSockets) {
				console.log("sending game data to", otherSocket.id);
				otherSocket.emit("update", JSON.stringify({
					turn: gameData.turn,
					board: scrub(gameData.board, player),
					gameWon: gameData.gameWon,
					lastSixMoves: gameData.lastSixMoves,
					battleResult: gameData.battleResult,
				}));
			}
		}
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
