// 
// start server, run games
// 

const React = require("react");
const ReactDOMServer = require("react-dom/server");

// node/express packages
const pug = require("pug");
const cookieParser = require("cookie-parser");
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
const baseURL = "http://127.0.0.1:8080/";//"http://galenlong.com/master-of-the-flag:3000";

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
	console.log(rawUrl)
	var query = querystring.parse(url.parse(rawUrl).query);
	console.log(query, query.id)
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

function scrubSetup(oldBoard, player) {
	let board = cloneDeep(oldBoard);
	let startRow = (player === Data.Player.ONE) ? 0 : 6;
	let endRow = (player === Data.Player.ONE) ? 3 : 9;
	// clear other player's pieces
	for (let i = startRow; i <= endRow; i++) {
		for (let j = 0; j < board[0].length; j++) {
			board[i][j].piece = null;
		}
	}
	return board;
}

function scrubPlay(oldBoard, player) {
	let board = cloneDeep(oldBoard);
	// clear ranks of unrevealed other player's pieces
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
	let scrub = (mode === Data.Mode.SETUP) ? scrubSetup : scrubPlay;
	let finishedSetup = (player === Data.Player.ONE) ? games[gameId].p1FinishedSetup : 
		games[gameId].p2FinishedSetup;
	let board = scrub(games[gameId].board, player);
	let gameWon = games[gameId].gameWon;
	let lastSixMoves = games[gameId].lastSixMoves;
	let battleResult = games[gameId].battleResult;

	let raw = (<Components.Game 
		player={player} 
		gameId={gameId}
		mode={mode}
		finishedSetup={finishedSetup}
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
		finishedSetup: finishedSetup,
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
			mode: Data.Mode.SETUP,
			turn: Data.Player.ONE,
			board: Data.Board.getInitialSetup(),//Data.getBoard(),
			gameWon: null,
			lastSixMoves: [],
			battleResult: null,
			sockets: new GameSockets(),
			p1FinishedSetup: false,
			p2FinishedSetup: false,
		}

		socket.emit("created", JSON.stringify({
			gameId: gameId, 
			playerId: playerId,
			url: url.resolve(baseURL, `/master-of-the-flag/games?id=${gameId}`),
		}));

		console.log("Player 1 created game", gameId);
	}
}

function moveHandler(socket) {
	return (moveJSON) => {
		let data = JSON.parse(moveJSON);
		let gameId = data.gameId;
		let move = data.move;
		let player = games[gameId].sockets.getSocketPlayer(socket.id);
		console.log(player, "sent move", move.start, "to", move.end);

		// get ranks of start/end pieces so client can update own game state
		let board = games[gameId].board;
		let startSquare = board[move.start.row][move.start.col];
		let endSquare = board[move.end.row][move.end.col];
		let startRank = null;
		let endRank = null;
		// if sprint or battle, send ranks
		if (data.move.code === Data.MoveCode.SPRINT || endSquare.piece) {
			startRank = startSquare.piece.rank;
			endRank = (endSquare.piece) ? endSquare.piece.rank : null;
		}

		// update server game data
		let gameData = Components.getUpdatedGameData(move, player, 
			cloneDeep(games[gameId].board), 
			games[gameId].lastSixMoves.slice());
		let gameWon = Data.Board.whoWonGameWhy(gameData.board, 
			gameData.lastSixMoves, gameData.turn);
		games[gameId].turn = gameData.turn;
		games[gameId].board = gameData.board;
		games[gameId].gameWon = gameWon;
		games[gameId].lastSixMoves = gameData.lastSixMoves;
		games[gameId].battleResult = gameData.battleResult;

		// send start/end piece ranks (if any) to all sockets
		// games[gameId].sockets.print();
		for (let player of [Data.Player.ONE, Data.Player.TWO]) {
			let otherSockets = games[gameId].sockets.getPlayerSockets(player);
			for (let otherSocket of otherSockets) {
				otherSocket.emit("moved", JSON.stringify({
					move: move,
					startRank: startRank,
					endRank: endRank,
					gameWon: gameWon, // need whole board to compute
				}));
			}
		}
	}
}

function swapHandler(socket) {
	return (swapJSON) => {
		let data = JSON.parse(swapJSON);
		let gameId = data.gameId;
		let player = games[gameId].sockets.getSocketPlayer(socket.id);
		console.log(`received ${player} swap ${data.swap.start} to ${data.swap.end}`);

		Data.Board.setSwapPieces(games[gameId].board, data.swap.start, data.swap.end);

		// send swap to all other player sockets
		// games[gameId].sockets.print();
		let otherSockets = games[gameId].sockets.getPlayerSockets(player);
		for (let otherSocket of otherSockets) {
			if (otherSocket.id !== socket.id) {
				console.log(`sending swap to ${otherSocket.id}`);
				otherSocket.emit("swapped", JSON.stringify({
					swap: data.swap,
				}));
			}
		}		
	}
}

function setupHandler(socket) {
	return (setupJSON) => {
		let data = JSON.parse(setupJSON);
		let gameId = data.gameId;
		let player = games[gameId].sockets.getSocketPlayer(socket.id);
		console.log(`received ${player} setup`);

		if (player === Data.Player.ONE) {
			games[gameId].p1FinishedSetup = true;
		} else {
			games[gameId].p2FinishedSetup = true;
		}

		// if both players are ready to play, send completed board
		if (games[gameId].p1FinishedSetup &&
			games[gameId].p2FinishedSetup) {
			let board = games[gameId].board;
			let gameWon = Data.Board.whoWonGameWhy(board, 
				games[gameId].lastSixMoves, games[gameId].turn);
			// update game state
			games[gameId].gameWon = gameWon;
			games[gameId].mode = Data.Mode.PLAY;
			// send setup to all sockets
			for (let player of [Data.Player.ONE, Data.Player.TWO]) {
				let otherSockets = games[gameId].sockets.getPlayerSockets(player);
				for (let otherSocket of otherSockets) {
					otherSocket.emit("ready", JSON.stringify({
						board: scrubPlay(cloneDeep(board), player),
						gameWon: gameWon,
					}));
				}
			}
		}	
	}
}

//
// http response
//

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/master-of-the-flag/", gameCreate);
app.get("/master-of-the-flag/games/", gameFetch);

//
// client-server communication
//

io.use(connectionMiddleware);
io.on("connection", function (socket) {
	socket.on("create", createHandler(socket));
	socket.on("setup", setupHandler(socket));
	socket.on("swap", swapHandler(socket));
	socket.on("move", moveHandler(socket));
	socket.once("disconnect", disconnectHandler(socket));
});

//
// start server
//

server.listen(8080, function () {
	console.log("server listening...");
});
