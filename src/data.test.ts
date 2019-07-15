import { Battle, Rank, Board, Player, Piece, MoveCode } from "./data";

//
// utility funcs
//

// function createTestBoard(pieces) {
// 	// 10 x 10 stratego board
// 	let board = [];
// 	let n = 10;
// 	for (let i = n; i--;) {
// 		let row = [];
// 		for (let j = n; j--;) {
// 			let square = new Data.Square(true, null);
// 			row.push(square);
// 		}
// 		board.push(row);
// 	}

// 	// two central lakes are unenterable
// 	let unenterable = [
// 		{row: 4, col: 2}, {row: 4, col: 3},
// 		{row: 4, col: 6}, {row: 4, col: 7},
// 		{row: 5, col: 2}, {row: 5, col: 3},
// 		{row: 5, col: 6}, {row: 5, col: 7},
// 	];
// 	for (let i = unenterable.length; i--;) {
// 		let move = unenterable[i];
// 		board[move.row][move.col].enterable = false;
// 	}

// 	// place test pieces
// 	for (let data of pieces) {
// 		let piece = new Data.Piece(data.rank, data.player)
// 		board[data.row][data.col].piece = piece;
// 	}

// 	return board;
// }

// // function testMessage(expected, actual, message) {
// // 	let pretty = function(x) {
// // 		if (typeof x === "object") {
// // 			return JSON.stringify(x, null, 2);
// // 		}
// // 		return x;
// // 	}
// // 	let expectedJSON = pretty(expected);
// // 	let actualJSON = pretty(actual);
// // 	str = `expected: ${expectedJSON}\ngot: ${actualJSON}`

// // 	// optional array/string message
// // 	if (message) {
// // 		if (Array.isArray(message)) {
// // 			str += "\n";
// // 			str += message.map(pretty).join("\n");
// // 		} else {
// // 			str += "\n" + pretty(message);
// // 		}
// // 	}

// // 	return str;
// // }

// //
// // tests
// //

// function testIsValidMove() {
// 	let board = createTestBoard([
// 		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
// 		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
// 		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
// 		{row: 0, col: 2, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
// 		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
// 		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
// 		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
// 		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
// 		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
// 		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
// 		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
// 		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
// 		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
// 		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
// 		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
// 		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 	]);
// 	// Data.Board.pprint(board);

// 	// spot-checked
// 	// assumes previous square has piece
// 	let tests = [
// 		// same space
// 		{prev: {row: 0, col: 0}, selc: {row: 0, col: 0}, expected: false},
// 		// same player
// 		{prev: {row: 0, col: 0}, selc: {row: 0, col: 1}, expected: false},
// 		// diagonal
// 		{prev: {row: 0, col: 0}, selc: {row: 1, col: 1}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 3, col: 5}, expected: false},
// 		// immovable
// 		{prev: {row: 0, col: 2}, selc: {row: 1, col: 2}, expected: false},
// 		{prev: {row: 0, col: 7}, selc: {row: 0, col: 8}, expected: false},
// 		{prev: {row: 6, col: 2}, selc: {row: 6, col: 1}, expected: false},
// 		// unenterable
// 		{prev: {row: 3, col: 6}, selc: {row: 4, col: 6}, expected: false},
// 		// valid non-sprints
// 		{prev: {row: 0, col: 1}, selc: {row: 1, col: 1}, expected: true},
// 		{prev: {row: 0, col: 3}, selc: {row: 1, col: 3}, expected: true},
// 		{prev: {row: 0, col: 6}, selc: {row: 0, col: 7}, expected: true},
// 		{prev: {row: 1, col: 4}, selc: {row: 0, col: 4}, expected: true},
// 		{prev: {row: 1, col: 7}, selc: {row: 0, col: 7}, expected: true},
// 		// sprints
// 		// non-2s can't sprint
// 		{prev: {row: 0, col: 6}, selc: {row: 3, col: 6}, expected: false},
// 		// column line (through enemy/same player pieces)
// 		{prev: {row: 4, col: 4}, selc: {row: 0, col: 4}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 1, col: 4}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 2, col: 4}, expected: true},
// 		{prev: {row: 4, col: 4}, selc: {row: 3, col: 4}, expected: true},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 4}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 8, col: 4}, expected: true},
// 		{prev: {row: 4, col: 4}, selc: {row: 9, col: 4}, expected: false},
// 		// row line (through unenterable squares)
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 0}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 1}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 2}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 3}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 5}, expected: true},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 6}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 7}, expected: false},
// 		{prev: {row: 4, col: 4}, selc: {row: 4, col: 8}, expected: false},
// 		// go long
// 		{prev: {row: 9, col: 9}, selc: {row: 0, col: 9}, expected: true},
// 		{prev: {row: 9, col: 9}, selc: {row: 9, col: 0}, expected: true},

// 	]

// 	for (let i = 0; i < tests.length; i++) {
// 		let test = tests[i];
// 		let expected = test.expected;
// 		// TODO validMove no longer a function
// 		// let actual = Data.Board.validMove(board, test.prev, test.selc);
// 		// assert.equal(actual, expected);
// 	}
// }

// function testGetAdjacent() {
// 	let board = createTestBoard([
// 		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
// 		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
// 		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
// 		{row: 0, col: 2, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
// 		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
// 		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
// 		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
// 		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
// 		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
// 		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
// 		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
// 		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
// 		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
// 		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
// 		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
// 		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 	]);
// 	// Data.Board.pprint(board);

// 	let moves = [
// 		// corners
// 		{row: 0, col: 0},
// 		{row: 0, col: 9},
// 		{row: 9, col: 0},
// 		{row: 9, col: 9},
// 		// central
// 		{row: 1, col: 2},
// 		{row: 1, col: 3},
// 		{row: 0, col: 6},
// 		{row: 0, col: 7},
// 	];

// 	// spot-checked
// 	let expecteds = [
// 		// corners
// 		{above: {row: -1, col: 0}, below: {row: 1, col: 0},
// 			left: {row: 0, col: -1}, right: {row: 0, col: 1}},
// 		{above: {row: -1, col: 9}, below: {row: 1, col: 9},
// 			left: {row: 0, col: 8}, right: {row: 0, col: 10}},
// 		{above: {row: 8, col: 0}, below: {row: 10, col: 0},
// 			left: {row: 9, col: -1}, right: {row: 9, col: 1}},
// 		{above: {row: 8, col: 9}, below: {row: 10, col: 9},
// 			left: {row: 9, col: 8}, right: {row: 9, col: 10}},
// 		// central
// 		{above: {row: 0, col: 2}, below: {row: 2, col: 2},
// 			left: {row: 1, col: 1}, right: {row: 1, col: 3}},
// 		{above: {row: 0, col: 3}, below: {row: 2, col: 3},
// 			left: {row: 1, col: 2}, right: {row: 1, col: 4}},
// 		{above: {row: -1, col: 6}, below: {row: 1, col: 6},
// 			left: {row: 0, col: 5}, right: {row: 0, col: 7}},
// 		{above: {row: -1, col: 7}, below: {row: 1, col: 7},
// 			left: {row: 0, col: 6}, right: {row: 0, col: 8}},
// 	];

// 	for (let i = 0; i < moves.length; i++) {
// 		// TODO getAdjacentSquares no longer a function
// 		// let actual = Data.Board.getAdjacentSquares(board, moves[i]);

// 		// let expected = {}
// 		// for (let direction of ["above", "below", "left", "right"]) {
// 		// 	let move = expecteds[i][direction];
// 		// 	expected[direction] = Data.Board.getSquare(board, move);
// 		// }

// 		// assert.deepEqual(expected, actual);
// 	}
// }

// function testCountMovablePiecesAndFlagsPerPlayer() {
// 	// groups of pieces surrounded by bombs
// 	let board = createTestBoard([
// 		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
// 		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
// 		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
// 		{row: 0, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
// 		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
// 		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
// 		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
// 		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
// 		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
// 		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
// 		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
// 		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
// 		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
// 		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 6, col: 0, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
// 		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 6, col: 4, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 7, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 7, col: 4, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
// 		{row: 7, col: 5, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 8, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 8, col: 3, rank: Data.Rank.NINE,	player: Data.Player.ONE},
// 		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
// 		{row: 8, col: 5, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 8, col: 9, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
// 		{row: 9, col: 2, rank: Data.Rank.SIX,	player: Data.Player.TWO},
// 		{row: 9, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 9, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 		{row: 9, col: 5, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 9, col: 8, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
// 		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
// 	]);
// 	// Data.Board.pprint(board);
// 	// TODO countMovablePiecesAndFlagsPerPlayer no longer a function
// 	// let func = Data.Board.countMovablePiecesAndFlagsPerPlayer;

// 	// let actual = func(board, Data.Player.ONE);
// 	// // spot-checked
// 	// let p1Expected = 7;
// 	// let p2Expected = 7;

// 	// assert.equal(actual.p1Count, p1Expected);
// 	// assert.equal(actual.p2Count, p2Expected);
// 	// assert.equal(actual.p1HasFlag, true);
// 	// assert.equal(actual.p2HasFlag, true);
// }

// // TODO decompose into testing function and several separate case funcs
// // TODO interpret strings? instead of JSON test cases
// function testWhoWonGame() {

// 	let tests = [
// 		// empty except flags, tie
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.BOTH},
// 		// p1 flag captured, p2 has movable
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FIVE,  player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB,  player: Data.Player.TWO},
// 			{row: 6, col: 6, rank: Data.Rank.THREE, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR,  player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB,  player: Data.Player.TWO},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG,  player: Data.Player.TWO},
// 		], expected: Data.Player.TWO},
// 		// p2 flag captured, p1 has movable
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG,  player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.FIVE,  player: Data.Player.ONE},
// 			{row: 6, col: 6, rank: Data.Rank.THREE, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR,  player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB,  player: Data.Player.TWO},
// 		], expected: Data.Player.ONE},
// 		// neither player has movable pieces, tie
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.BOTH},
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.BOTH},
// 		// both players have movable pieces, no win yet
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: null},
// 		// only player 1 has movable/any pieces
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.ONE},
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
// 			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.ONE},
// 		// only player 2 has movable/any pieces
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 0, col: 3, rank: Data.Rank.FIVE, player: Data.Player.TWO},
// 			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
// 			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.TWO},
// 		{pieces: [
// 			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
// 			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
// 			{row: 6, col: 8, rank: Data.Rank.NINE, player: Data.Player.TWO},
// 			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
// 			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
// 		], expected: Data.Player.TWO},
// 	]

// 	for (let test of tests) {
// 		let board = createTestBoard(test.pieces);
// 		// Data.Board.pprint(board);
// 		// TODO whoWonGame no longer a function
// 		// let actual = Data.Board.whoWonGame(board);
// 		// let expected = test.expected;
// 		// assert.equal(actual, expected);
// 	}

// }

//
// run tests
//

// testBattleResults();

// testIsValidMove();

// testGetAdjacent();
// testCountMovablePiecesAndFlagsPerPlayer();
// testWhoWonGame();

// TEMPLATE
// describe("unit under test", () => {
//   describe("sub-unit (if necessary)", () => {
//     it("when scenario X occurs, then Y occurs/is true/etc", () => {});
//   });
// });

describe("when player makes move", () => {
  let board: Board;
  beforeEach(() => {
    board = Board.createBoard(5, 5);
  });

  it("starting position must have piece", () => {
    const [start, end] = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    expect(() => Board.isValidMove(board, start, end)).toThrow();
  });

  it("positions must be different", () => {
    const start = { row: 0, col: 0 };
    const { row, col } = start;
    const end = Object.assign(start, {});
    board[row][col].piece = new Piece(Rank.SPY, Player.ONE);
    expect(Board.isValidMove(board, start, end)).toBe(MoveCode.INVALID);
  });

  // TODO tests for all other logic!
});

describe("when player makes first selection", () => {
  let board: Board;
  beforeEach(() => {
    board = Board.createBoard(5, 5);
  });

  it("position without a piece is invalid", () => {
    const position = { row: 0, col: 0 };
    expect(Board.isValidFirstSelection(board, position, Player.ONE)).toBe(
      false
    );
  });

  it("position with an immovable piece is invalid", () => {
    const position = { row: 0, col: 0 };
    const { row, col } = position;
    board[row][col].piece = new Piece(Rank.BOMB, Player.ONE);
    expect(Board.isValidFirstSelection(board, position, Player.ONE)).toBe(
      false
    );
  });

  it("position with a different player's piece is invalid", () => {
    const position = { row: 0, col: 0 };
    const { row, col } = position;
    board[row][col].piece = new Piece(Rank.SPY, Player.TWO);
    expect(Board.isValidFirstSelection(board, position, Player.ONE)).toBe(
      false
    );
  });

  it("position with one of their pieces is valid", () => {
    const position = { row: 0, col: 0 };
    const { row, col } = position;
    board[row][col].piece = new Piece(Rank.SPY, Player.ONE);
    expect(Board.isValidFirstSelection(board, position, Player.ONE)).toBe(true);
  });
});

describe("battle results", () => {
  const allRanks = Object.values(Rank);
  const moveableRanks = allRanks.filter(
    rank => rank !== Rank.FLAG && rank !== Rank.BOMB
  );
  const numericRanks = moveableRanks.filter(rank => rank !== Rank.SPY);

  describe("higher numeric rank should beat lower numeric rank", () => {
    numericRanks.forEach(higherRank => {
      const higherRankNum = parseInt(higherRank, 10);
      const lowestRankNum = 2;
      for (
        let lowerRankNum = lowestRankNum;
        lowerRankNum < higherRankNum;
        lowerRankNum += 1
      ) {
        const lowerRank = lowerRankNum.toString();
        it(`${higherRank} beats ${lowerRank}`, () => {
          expect(Battle.battle(higherRank, lowerRank)).toBe(Battle.WIN);
        });
      }
    });
  });

  describe("lower numeric rank should be beaten by higher numeric rank", () => {
    numericRanks.forEach(lowerRank => {
      const lowerRankNum = parseInt(lowerRank, 10);
      const highestRankNum = 10;
      for (
        let higherRankNum = highestRankNum;
        higherRankNum > lowerRankNum;
        higherRankNum -= 1
      ) {
        const higherRank = higherRankNum.toString();
        it(`${lowerRank} is beaten by ${higherRank}`, () => {
          expect(Battle.battle(lowerRank, higherRank)).toBe(Battle.LOSE);
        });
      }
    });
  });

  describe("movable rank should tie same rank", () => {
    moveableRanks.forEach(rank => {
      test(`${rank} ties ${rank}`, () => {
        expect(Battle.battle(rank, rank)).toBe(Battle.TIE);
      });
    });
  });

  describe("when movable rank attacks F", () => {
    moveableRanks.forEach(rank => {
      test(`${rank} beats F`, () => {
        expect(Battle.battle(rank, Rank.FLAG)).toBe(Battle.WIN);
      });
    });
  });

  describe("when movable rank attacks B", () => {
    const shouldLoseToB = moveableRanks.filter(rank => rank !== Rank.THREE);
    shouldLoseToB.forEach(rank => {
      test(`${rank} is beaten by B`, () => {
        expect(Battle.battle(rank, Rank.BOMB)).toBe(Battle.LOSE);
      });
    });
    test("3 beats B", () => {
      expect(Battle.battle(Rank.THREE, Rank.BOMB)).toBe(Battle.WIN);
    });
  });

  describe("when S attacks movable rank", () => {
    const shouldLoseTo = moveableRanks.filter(
      rank => rank !== Rank.SPY && rank !== Rank.TEN
    );
    shouldLoseTo.forEach(rank => {
      test(`S is beaten by ${rank}`, () => {
        expect(Battle.battle(Rank.SPY, rank)).toBe(Battle.LOSE);
      });
    });
    test("S beats 10", () => {
      expect(Battle.battle(Rank.SPY, Rank.TEN)).toBe(Battle.WIN);
    });
  });

  describe("movable ranks should beat S", () => {
    const shouldBeat = moveableRanks.filter(rank => rank !== Rank.SPY);
    shouldBeat.forEach(rank => {
      it(`${rank} beats S`, () => {
        expect(Battle.battle(rank, Rank.SPY)).toBe(Battle.WIN);
      });
    });
  });

  describe("immovable pieces shouldn't be able to attack", () => {
    it("F throws error", () => {
      expect(() => Battle.battle(Rank.FLAG, Rank.TWO)).toThrow();
    });
    it("B throws error", () => {
      expect(() => Battle.battle(Rank.BOMB, Rank.TWO)).toThrow();
    });
  });
});
