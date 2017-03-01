// 
// tests.js
// test suite for chosen Board model static methods
// 

const Data = require("./data.js");
const assert = require("assert");

//
// utility funcs
//

function createTestBoard(pieces) {
	// 10 x 10 stratego board
	var board = [];
	var n = 10;
	for (var i = n; i--;) {
		var row = [];
		for (var j = n; j--;) {
			var square = new Data.Square(true, null);
			row.push(square);
		}
		board.push(row);
	}

	// two central lakes are unenterable
	var unenterable = [
		{row: 4, col: 2}, {row: 4, col: 3}, 
		{row: 4, col: 6}, {row: 4, col: 7}, 
		{row: 5, col: 2}, {row: 5, col: 3},
		{row: 5, col: 6}, {row: 5, col: 7},
	];
	for (var i = unenterable.length; i--;) {
		var move = unenterable[i];
		board[move.row][move.col].enterable = false;
	}

	// place test pieces
	for (var data of pieces) {
		var piece = new Data.Piece(data.rank, data.player)
		board[data.row][data.col].piece = piece;
	}

	return board;
}

// function testMessage(expected, actual, message) {
// 	var pretty = function(x) {
// 		if (typeof x === "object") {
// 			return JSON.stringify(x, null, 2);
// 		}
// 		return x;
// 	}
// 	var expectedJSON = pretty(expected);
// 	var actualJSON = pretty(actual);
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
	var ranks = [
		Data.Rank.SPY, Data.Rank.TWO, Data.Rank.THREE, 
		Data.Rank.FOUR, Data.Rank.FIVE, Data.Rank.SIX, 
		Data.Rank.SEVEN, Data.Rank.EIGHT, Data.Rank.NINE, 
		Data.Rank.TEN, Data.Rank.BOMB, Data.Rank.FLAG,
	];

	// spot-checked
	var expecteds = [
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

	var battle_func = Data.Battle.battle;

	var i = 0;
	for (var attacker of ranks) {
		for (var defender of ranks) {
			// immovable pieces will never attack
			if (attacker !== Data.Rank.FLAG && attacker !== Data.Rank.BOMB) {
				var actual = battle_func(attacker, defender);
				var expected = expecteds[i];
				assert.equal(actual, expected);
				i++;
			}
		}
	}
}

function testIsValidFirstSelection() {
	var board = createTestBoard([
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
	tests = [
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
		
	for (var i = 0; i < tests.length; i++) {
		var test = tests[i];
		var expected = test.expected;
		var actual = Data.Board.isValidFirstSelection(board,
			test.position, test.player
		);
		assert.equal(actual, expected);
	}
}

function testIsValidMove() {
	var board = createTestBoard([
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
	tests = [
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
		
	for (var i = 0; i < tests.length; i++) {
		var test = tests[i];
		var expected = test.expected;
		var actual = Data.Board.validMove(board, test.prev, test.selc);
		assert.equal(actual, expected);
	}
}

function testGetAdjacent() {
	var board = createTestBoard([
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

	var moves = [
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
	var expecteds = [
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

	for (var i = 0; i < moves.length; i++) {
		var actual = Data.Board.getAdjacentSquares(board, moves[i]);

		var expected = {}
		for (var direction of ["above", "below", "left", "right"]) {
			var move = expecteds[i][direction];
			expected[direction] = Data.Board.getSquare(board, move);
		}
		
		assert.deepEqual(expected, actual);
	}
}
	
function testCountMovablePiecesAndFlagsPerPlayer() {
	// groups of pieces surrounded by bombs
	var board = createTestBoard([
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
	var func = Data.Board.countMovablePiecesAndFlagsPerPlayer;

	var actual = func(board, Data.Player.ONE);
	// spot-checked
	var p1Expected = 7;
	var p2Expected = 7;

	assert.equal(actual.p1Count, p1Expected);
	assert.equal(actual.p2Count, p2Expected);
	assert.equal(actual.p1HasFlag, true);
	assert.equal(actual.p2HasFlag, true);
}

function testWhoWonGame() {
	var tests = [
		// empty except flags, tie
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.BOTH},
		// p1 flag captured, p2 has movable
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FIVE, player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 6, col: 6, rank: Data.Rank.THREE, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.TWO},
		// p2 flag captured, p1 has movable
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 1, col: 3, rank: Data.Rank.FIVE, player: Data.Player.ONE},
			{row: 6, col: 6, rank: Data.Rank.THREE, player: Data.Player.TWO},
			{row: 6, col: 7, rank: Data.Rank.FOUR, player: Data.Player.TWO},
			{row: 6, col: 8, rank: Data.Rank.BOMB, player: Data.Player.TWO},
		], expected: Data.Player.ONE},
		// neither player has movable pieces, tie
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO, player: Data.Player.ONE},
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
			{row: 1, col: 2, rank: Data.Rank.TWO, player: Data.Player.ONE},
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
			{row: 1, col: 2, rank: Data.Rank.TWO, player: Data.Player.ONE},
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
			{row: 1, col: 2, rank: Data.Rank.TWO, player: Data.Player.ONE},
			{row: 2, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 9, col: 9, rank: Data.Rank.FLAG, player: Data.Player.TWO},
		], expected: Data.Player.ONE},
		// only player 2 has movable/any pieces
		{pieces: [
			{row: 0, col: 0, rank: Data.Rank.FLAG, player: Data.Player.ONE},
			{row: 0, col: 2, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 0, col: 3, rank: Data.Rank.FIVE, player: Data.Player.TWO},
			{row: 1, col: 1, rank: Data.Rank.BOMB, player: Data.Player.ONE},
			{row: 1, col: 2, rank: Data.Rank.TWO, player: Data.Player.ONE},
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

	for (var test of tests) {
		var board = createTestBoard(test.pieces);
		// Data.Board.pprint(board);
		var actual = Data.Board.whoWonGame(board);
		var expected = test.expected;
		assert.equal(actual, expected);
	}

}

//
// run tests
//

testBattleResults();

testIsValidFirstSelection();
testIsValidMove();

testGetAdjacent();
testCountMovablePiecesAndFlagsPerPlayer();
testWhoWonGame();
