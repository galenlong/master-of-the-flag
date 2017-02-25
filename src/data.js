const Player = {
	ONE: "p1",
	TWO: "p2",
	BOTH: "both", // for game won ties
}

var Battle = {
	WIN: "win",
	TIE: "tie",
	LOSE: "lose",
	GAME_WIN: "game",
}

const Rank = {
	SPY: "S",
	TWO: "2",
	THREE: "3",
	FOUR: "4",
	FIVE: "5",
	SIX: "6",
	SEVEN: "7",
	EIGHT: "8",
	NINE: "9",
	TEN: "10",
	BOMB: "B",
	FLAG: "F",
}

function Piece(rank, player) {
	this.rank = rank;
	this.player = player;
	this.revealed = false;
	this.moved = false;
	this.movable = rank !== Rank.FLAG && rank !== Rank.BOMB;
}

function Square(enterable, piece) {
	this.enterable = enterable;
	this.piece = piece;
}







// // BOARD MODEL
// // implements iterable protocol
// // create generator for map (and forEach?)
// // throws compilation error?

// function Board() {
// 	this.board = [
// 		[1, 2, 3, 4],
// 		[5, 6, 7, 8],
// 		[9, 10, 11, 12],
// 	];
// 	this.numRows = this.board.length;
// 	// assumes each row has equal number of columns
// 	this.numCols = this.board[0].length; 

// 	// can implement using generator
// 	// http://stackoverflow.com/a/28718967/6157047
// 	this.map = function* (iterable) {

// 	}

// 	// implements iterable protocol
// 	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
// 	this[Symbol.iterator] = function () {
// 		var row = 0;
// 		var self = this;

// 		function generateColIterator(currentRow) {
// 			var col = 0;
// 			var colIterator = {};
// 			colIterator[Symbol.iterator] = function () {
// 				return {next: function () {
// 					window.self = self;
// 					window.this = this;
// 					if (col < self.numCols) {
// 						return {
// 							value: self.board[currentRow][col++],
// 							done: false
// 						}
// 					}
// 					return {done: true};
// 				}};
// 			};
// 			return colIterator;
// 		}
		
// 		return {next: function () {
// 			if (row < self.numRows) {
// 				return {
// 					value: generateColIterator(row++),
// 					done: false
// 				};
// 			} 
// 			return {done: true};
// 		}};
// 	}
// }

// var b = new Board();

// // list of iterators, each of which can be spread
// var rows = [...b];
// console.log([...rows[0]]);
// console.log([...rows[1]]);
// console.log([...rows[2]]);

// // apply spread operator to each iterable
// console.log([...b].map(function(iterator) { 
// 	return [...iterator];
// }));

// // "of" automatically calls Symbol.iterator function
// for (var row of b) {
// 	for (var col of row) {
// 		console.log(col);
// 	}
// }















function stringifyMove(start, end) {
	var s = start, e = end;
	return `${s.row},${s.col}|${e.row},${e.col}`;
}

function parseMove(moveStr) {
	var move = moveStr.split("|");
	var first = move[0].split(",").map(parseFloat);
	var second = move[1].split(",").map(parseFloat);
	return {
		start: {row: first[0], col: first[1]}, 
		end: {row: second[0], col: second[1]}
	};
}

module.exports = {
	Player: Player,
	Battle: Battle,
	Rank: Rank,
	Piece: Piece,
	Square: Square,
	stringifyMove: stringifyMove,
	parseMove: parseMove,
}


