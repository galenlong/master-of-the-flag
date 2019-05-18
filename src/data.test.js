
const Data = require("./data.js");
const assert = require("assert");

//
// utility funcs
//

function createTestBoard(pieces) {
	// 10 x 10 stratego board
	let board = [];
	let n = 10;
	for (let i = n; i--;) {
		let row = [];
		for (let j = n; j--;) {
			let square = new Data.Square(true, null);
			row.push(square);
		}
		board.push(row);
	}

	// two central lakes are unenterable
	let unenterable = [
		{row: 4, col: 2}, {row: 4, col: 3}, 
		{row: 4, col: 6}, {row: 4, col: 7}, 
		{row: 5, col: 2}, {row: 5, col: 3},
		{row: 5, col: 6}, {row: 5, col: 7},
	];
	for (let i = unenterable.length; i--;) {
		let move = unenterable[i];
		board[move.row][move.col].enterable = false;
	}

	// place test pieces
	for (let data of pieces) {
		let piece = new Data.Piece(data.rank, data.player)
		board[data.row][data.col].piece = piece;
	}

	return board;
}

// function testMessage(expected, actual, message) {
// 	let pretty = function(x) {
// 		if (typeof x === "object") {
// 			return JSON.stringify(x, null, 2);
// 		}
// 		return x;
// 	}
// 	let expectedJSON = pretty(expected);
// 	let actualJSON = pretty(actual);
// 	str = `expected: ${expectedJSON}\ngot: ${actualJSON}`

// 	// optional array/string message
// 	if (message) {
// 		if (Array.isArray(message)) {
// 			str += "\n";
// 			str += message.map(pretty).join("\n");
// 		} else {
// 			str += "\n" + pretty(message);
// 		}
// 	}

// 	return str;
// }

//
// tests
//

function testBattleResults() {
	let ranks = [
		Data.Rank.SPY, Data.Rank.TWO, Data.Rank.THREE, 
		Data.Rank.FOUR, Data.Rank.FIVE, Data.Rank.SIX, 
		Data.Rank.SEVEN, Data.Rank.EIGHT, Data.Rank.NINE, 
		Data.Rank.TEN, Data.Rank.BOMB, Data.Rank.FLAG,
	];

	// spot-checked
	// TODO indentation to clarify what tests correspond to 
	// TODO decompose
	let expecteds = [
		Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.WIN, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, 
		Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, 
		Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.WIN,
	];

	let battle_func = Data.Battle.battle;

	let i = 0;
	for (let attacker of ranks) {
		for (let defender of ranks) {
			// immovable pieces will never attack
			if (attacker !== Data.Rank.FLAG && attacker !== Data.Rank.BOMB) {
				let actual = battle_func(attacker, defender);
				let expected = expecteds[i];
				assert.equal(actual, expected);
				i++;
			}
		}
	}
}

function testIsValidFirstSelection() {
	let board = createTestBoard([
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
		{row: 0, col: 2, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
	]);
	// Data.Board.pprint(board);

	// spot-checked
	let tests = [
		{position: {row: 0, col: 0}, player: Data.Player.ONE, expected: true},
		{position: {row: 0, col: 0}, player: Data.Player.TWO, expected: false},
		{position: {row: 0, col: 7}, player: Data.Player.ONE, expected: false},
		{position: {row: 0, col: 7}, player: Data.Player.TWO, expected: false},
		{position: {row: 6, col: 7}, player: Data.Player.ONE, expected: false},
		{position: {row: 6, col: 7}, player: Data.Player.TWO, expected: false},
		{position: {row: 9, col: 0}, player: Data.Player.ONE, expected: false},
		{position: {row: 9, col: 0}, player: Data.Player.TWO, expected: false},
		{position: {row: 1, col: 4}, player: Data.Player.ONE, expected: false},
		{position: {row: 1, col: 4}, player: Data.Player.TWO, expected: true},
		{position: {row: 9, col: 9}, player: Data.Player.ONE, expected: true},
	]
		
	for (let i = 0; i < tests.length; i++) {
		let test = tests[i];
		let expected = test.expected;
		let actual = Data.Board.isValidFirstSelection(board,
			test.position, test.player
		);
		assert.equal(actual, expected);
	}
}

function testIsValidMove() {
	let board = createTestBoard([
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
		{row: 0, col: 2, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
	]);
	// Data.Board.pprint(board);

	// spot-checked
	// assumes previous square has piece
	let tests = [
		// same space
		{prev: {row: 0, col: 0}, selc: {row: 0, col: 0}, expected: false},
		// same player
		{prev: {row: 0, col: 0}, selc: {row: 0, col: 1}, expected: false},
		// diagonal
		{prev: {row: 0, col: 0}, selc: {row: 1, col: 1}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 3, col: 5}, expected: false},
		// immovable
		{prev: {row: 0, col: 2}, selc: {row: 1, col: 2}, expected: false},
		{prev: {row: 0, col: 7}, selc: {row: 0, col: 8}, expected: false},
		{prev: {row: 6, col: 2}, selc: {row: 6, col: 1}, expected: false},
		// unenterable
		{prev: {row: 3, col: 6}, selc: {row: 4, col: 6}, expected: false},
		// valid non-sprints
		{prev: {row: 0, col: 1}, selc: {row: 1, col: 1}, expected: true},
		{prev: {row: 0, col: 3}, selc: {row: 1, col: 3}, expected: true},
		{prev: {row: 0, col: 6}, selc: {row: 0, col: 7}, expected: true},
		{prev: {row: 1, col: 4}, selc: {row: 0, col: 4}, expected: true},
		{prev: {row: 1, col: 7}, selc: {row: 0, col: 7}, expected: true},
		// sprints
		// non-2s can't sprint
		{prev: {row: 0, col: 6}, selc: {row: 3, col: 6}, expected: false},
		// column line (through enemy/same player pieces)
		{prev: {row: 4, col: 4}, selc: {row: 0, col: 4}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 1, col: 4}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 2, col: 4}, expected: true},
		{prev: {row: 4, col: 4}, selc: {row: 3, col: 4}, expected: true},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 4}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 8, col: 4}, expected: true},
		{prev: {row: 4, col: 4}, selc: {row: 9, col: 4}, expected: false},
		// row line (through unenterable squares)
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 0}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 1}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 2}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 3}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 5}, expected: true},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 6}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 7}, expected: false},
		{prev: {row: 4, col: 4}, selc: {row: 4, col: 8}, expected: false},
		// go long
		{prev: {row: 9, col: 9}, selc: {row: 0, col: 9}, expected: true},
		{prev: {row: 9, col: 9}, selc: {row: 9, col: 0}, expected: true},

	]
		
	for (let i = 0; i < tests.length; i++) {
		let test = tests[i];
		let expected = test.expected;
		// TODO validMove no longer a function
		// let actual = Data.Board.validMove(board, test.prev, test.selc);
		// assert.equal(actual, expected);
	}
}

function testGetAdjacent() {
	let board = createTestBoard([
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
		{row: 0, col: 2, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
	]);
	// Data.Board.pprint(board);

	let moves = [
		// corners
		{row: 0, col: 0},
		{row: 0, col: 9},
		{row: 9, col: 0},
		{row: 9, col: 9},
		// central
		{row: 1, col: 2},
		{row: 1, col: 3},
		{row: 0, col: 6},
		{row: 0, col: 7},
	];

	// spot-checked
	let expecteds = [
		// corners
		{above: {row: -1, col: 0}, below: {row: 1, col: 0}, 
			left: {row: 0, col: -1}, right: {row: 0, col: 1}},
		{above: {row: -1, col: 9}, below: {row: 1, col: 9}, 
			left: {row: 0, col: 8}, right: {row: 0, col: 10}},
		{above: {row: 8, col: 0}, below: {row: 10, col: 0}, 
			left: {row: 9, col: -1}, right: {row: 9, col: 1}},
		{above: {row: 8, col: 9}, below: {row: 10, col: 9}, 
			left: {row: 9, col: 8}, right: {row: 9, col: 10}},
		// central
		{above: {row: 0, col: 2}, below: {row: 2, col: 2}, 
			left: {row: 1, col: 1}, right: {row: 1, col: 3}},
		{above: {row: 0, col: 3}, below: {row: 2, col: 3}, 
			left: {row: 1, col: 2}, right: {row: 1, col: 4}},
		{above: {row: -1, col: 6}, below: {row: 1, col: 6}, 
			left: {row: 0, col: 5}, right: {row: 0, col: 7}},
		{above: {row: -1, col: 7}, below: {row: 1, col: 7}, 
			left: {row: 0, col: 6}, right: {row: 0, col: 8}},
	];

	for (let i = 0; i < moves.length; i++) {
		// TODO getAdjacentSquares no longer a function
		// let actual = Data.Board.getAdjacentSquares(board, moves[i]);

		// let expected = {}
		// for (let direction of ["above", "below", "left", "right"]) {
		// 	let move = expecteds[i][direction];
		// 	expected[direction] = Data.Board.getSquare(board, move);
		// }
		
		// assert.deepEqual(expected, actual);
	}
}
	
function testCountMovablePiecesAndFlagsPerPlayer() {
	// groups of pieces surrounded by bombs
	let board = createTestBoard([
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 0, rank: Data.Rank.SPY,	player: Data.Player.ONE},
		{row: 0, col: 1, rank: Data.Rank.FIVE,	player: Data.Player.ONE},
		{row: 0, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 0, col: 3, rank: Data.Rank.THREE,	player: Data.Player.ONE},
		{row: 0, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 0, col: 6, rank: Data.Rank.TEN,	player: Data.Player.TWO},
		{row: 0, col: 7, rank: Data.Rank.FLAG,	player: Data.Player.ONE},
		{row: 1, col: 0, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
		{row: 1, col: 2, rank: Data.Rank.SEVEN,	player: Data.Player.ONE},
		{row: 1, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 1, col: 4, rank: Data.Rank.EIGHT,	player: Data.Player.TWO},
		{row: 1, col: 7, rank: Data.Rank.FIVE,	player: Data.Player.TWO},
		{row: 2, col: 3, rank: Data.Rank.THREE,	player: Data.Player.TWO},
		{row: 3, col: 6, rank: Data.Rank.FOUR,	player: Data.Player.TWO},
		{row: 4, col: 4, rank: Data.Rank.TWO,	player: Data.Player.TWO},
		{row: 5, col: 8, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 6, col: 0, rank: Data.Rank.FLAG,	player: Data.Player.TWO},
		{row: 6, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 6, col: 4, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 6, col: 7, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 7, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 7, col: 4, rank: Data.Rank.FOUR,	player: Data.Player.ONE},
		{row: 7, col: 5, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 8, col: 2, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 8, col: 3, rank: Data.Rank.NINE,	player: Data.Player.ONE},
		{row: 8, col: 4, rank: Data.Rank.SIX,	player: Data.Player.ONE},
		{row: 8, col: 5, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 8, col: 9, rank: Data.Rank.BOMB,	player: Data.Player.TWO},
		{row: 9, col: 2, rank: Data.Rank.SIX,	player: Data.Player.TWO},
		{row: 9, col: 3, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 9, col: 4, rank: Data.Rank.TWO,	player: Data.Player.ONE},
		{row: 9, col: 5, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 9, col: 8, rank: Data.Rank.BOMB,	player: Data.Player.ONE},
		{row: 9, col: 9, rank: Data.Rank.TWO,	player: Data.Player.ONE},
	]);
	// Data.Board.pprint(board);
	// TODO countMovablePiecesAndFlagsPerPlayer no longer a function
	// let func = Data.Board.countMovablePiecesAndFlagsPerPlayer;

	// let actual = func(board, Data.Player.ONE);
	// // spot-checked
	// let p1Expected = 7;
	// let p2Expected = 7;

	// assert.equal(actual.p1Count, p1Expected);
	// assert.equal(actual.p2Count, p2Expected);
	// assert.equal(actual.p1HasFlag, true);
	// assert.equal(actual.p2HasFlag, true);
}

// TODO decompose into testing function and several separate case funcs
// TODO interpret strings? instead of JSON test cases
function testWhoWonGame() {

	let tests = [
		// empty except flags, tie
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.BOTH},
		// p1 flag captured, p2 has movable
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FIVE,  player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB,  player: Data.Player.TWO},
			{row: 6, col: 6, rank: Data.Rank.THREE, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR,  player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB,  player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG,  player: Data.Player.TWO},
		], expected: Data.Player.TWO},
		// p2 flag captured, p1 has movable
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG,  player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.FIVE,  player: Data.Player.ONE},
			{row: 6, col: 6, rank: Data.Rank.THREE, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR,  player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB,  player: Data.Player.TWO},
		], expected: Data.Player.ONE},
		// neither player has movable pieces, tie
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.BOTH},
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.BOTH},
		// both players have movable pieces, no win yet
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: null},
		// only player 1 has movable/any pieces
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.ONE},
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.ONE},
		// only player 2 has movable/any pieces
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 0, col: 3, rank: Data.Rank.FIVE, player: Data.Player.TWO},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO,  player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.TWO},
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 6, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.NINE, player: Data.Player.TWO},
			{row: 7, col: 7, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.TWO},
	]

	for (let test of tests) {
		let board = createTestBoard(test.pieces);
		// Data.Board.pprint(board);
		// TODO whoWonGame no longer a function
		// let actual = Data.Board.whoWonGame(board);
		// let expected = test.expected;
		// assert.equal(actual, expected);
	}

}

//
// run tests
//

// testBattleResults();

// testIsValidFirstSelection();
// testIsValidMove();

// testGetAdjacent();
// testCountMovablePiecesAndFlagsPerPlayer();
// testWhoWonGame();

describe("battle results", () => {
	test("3 beats bomb", () => {
		const result = Data.Battle.battle(Data.Rank.THREE, Data.Rank.BOMB);
		expect(result).toBe(Data.Battle.WIN);
	});
});
