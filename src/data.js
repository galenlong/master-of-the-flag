// 
// data.js
// model objects
// 

//
// enums
// 

const Player = {
	ONE: "Player 1",
	TWO: "Player 2",
	BOTH: "both", // for game won ties
	opposite: function(player) {
		if (player === Player.ONE) {
			return Player.TWO;
		} else if (player === Player.TWO) {
			return Player.ONE;
		}
		return Player.BOTH;
	},
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

const Battle = {
	WIN: "win",
	TIE: "tie",
	LOSE: "lose",
	battle: function(attackerRank, defenderRank) {
		if (attackerRank === defenderRank) {
			return Battle.TIE;
		}

		// non-numeric battle results for spy, flag, bomb
		// attacker will never be flag or bomb
		if (defenderRank === Rank.FLAG) {
			return Battle.WIN;
		} else if (defenderRank === Rank.BOMB) {
			// only 3s beat bombs
			return (attackerRank === Rank.THREE) ? 
				Battle.WIN : Battle.LOSE;
		} else if (defenderRank === Rank.SPY) {
			// ties already accounted for, attacker always beats spies
			return Battle.WIN;
		} else if (attackerRank === Rank.SPY) { // elif b/c others return
			// ties already accounted for, spies only beat 10s on attack
			return (defenderRank == Rank.TEN) ? 
				Battle.WIN : Battle.LOSE; 
		} 

		// numeric battle results
		if (parseInt(attackerRank, 10) > parseInt(defenderRank, 10)) {
			return Battle.WIN;
		} else { // less than, ties already accounted for
			return Battle.LOSE;
		}
	},
}

const MoveCode = {
	NORMAL: 0,
	SPRINT: 1,
	INVALID: 2,
	isValid: function(code) {
		return code === MoveCode.NORMAL || code === MoveCode.SPRINT;
	},
}

const WinReason = {
	FLAG_CAPTURED: "flag captured",
	NO_MOVABLE_PIECES: "no movable pieces",
	NO_VALID_MOVES: "no valid moves",
}

//
// constructors
//

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

//
// static board model
//

class Board {

	//
	// accessors
	//

	static getSquare(board, position) {
		if (!position) { // b/c I keep forgetting these methods are static...
			throw "you forgot to pass the board again"; 
		}

		var numRows = board.length;
		var numCols = board[0].length; // board is square

		if (position.row >= 0 && position.row < numRows &&
			position.col >= 0 && position.col < numCols) {
			return board[position.row][position.col];
		}
		// return null if out of bounds
		return null;
	}

	static getPiece(board, position) {
		if (!position) { // b/c I keep forgetting these methods are static...
			throw "you forgot to pass the board again"; 
		}
		var square = Board.getSquare(board, position);
		return square.piece;
	}

	//
	// all set functions modify board argument,
	// so to preserve immutability, pass them a copy
	//

	static setPiece(board, position, piece) {
		board[position.row][position.col].piece = piece;
	}
	static setPieceMoved(board, position) {
		board[position.row][position.col].piece.moved = true;
	}
	static setPieceVisible(board, position) {
		board[position.row][position.col].piece.revealed = true;
	}
	static setClearPiece(board, position) {
		board[position.row][position.col].piece = null;
	}
	static setSwapPieces(board, previousPos, selectedPos) {
		var previousPiece = Board.getPiece(board, previousPos);
		var selectedPiece = Board.getPiece(board, selectedPos);
		Board.setPiece(board, previousPos, selectedPiece);
		Board.setPiece(board, selectedPos, previousPiece);
	}

	static setMove(board, previousPos, selectedPos, moveCode) {
		// auto reveal scouts on sprint
		if (moveCode === MoveCode.SPRINT) {
			Board.setPieceVisible(board, previousPos);
		}
		Board.setPieceMoved(board, previousPos);
		Board.setSwapPieces(board, previousPos, selectedPos);
	}

	static setBattle(board, previousPos, selectedPos) {
		var attacker = Board.getPiece(board, previousPos);
		var defender = Board.getPiece(board, selectedPos);
		var result = Battle.battle(attacker.rank, defender.rank);

		switch (result) {
			case Battle.WIN: // selected dies, previous moved/revealed
				Board.setPieceMoved(board, previousPos);
				Board.setPieceVisible(board, previousPos);
				Board.setClearPiece(board, selectedPos);
				Board.setSwapPieces(board, previousPos, selectedPos);
				break;
			case Battle.TIE: // both die
				Board.setClearPiece(board, previousPos);
				Board.setClearPiece(board, selectedPos);
				break;
			case Battle.LOSE: // previous dies, selected revealed
				Board.setClearPiece(board, previousPos);
				Board.setPieceVisible(board, selectedPos);
				break;
		}

		return {
			attacker: attacker,
			defender: defender,
			result: result,
		};
	}

	//
	// validity checks
	//

	static isValidFirstSelection(board, position, player) {
		var piece = Board.getPiece(board, position);
		if (piece && piece.movable && piece.player === player) {
			return true;
		}
		return false;
	}

	static isValidMove(board, previousPos, selectedPos) {
		var p = previousPos, s = selectedPos;
		var square = Board.getSquare(board, s);
		var piece = Board.getPiece(board, p);
		if (!piece) { throw "previous move must have piece" }

		// can't move to same space
		if (p.row === s.row && p.col === s.col) {
			return MoveCode.INVALID;
		}

		if (Board.canPieceEnterSquare(piece, square)) {
			if (Board.isEdgeAdjacent(p, s)) {
				return MoveCode.NORMAL;
			} else if (Board.isValidSprint(board, p, s, piece.rank)) {
				return MoveCode.SPRINT;
			}
		}
		return MoveCode.INVALID;
	}

	static isValidSprint(board, previousPos, selectedPos, rank) {
		var p = previousPos, s = selectedPos;

		if (rank !== Rank.TWO) {
			return false;
		}
		// must be straight line
		if (p.row !== s.row && p.col !== s.col) {
			return false;
		}

		// loop through columns if row is same, else rows
		var rowLine = p.row === s.row;
		var start = (rowLine) ? Math.min(p.col, s.col) + 1 :
			Math.min(p.row, s.row) + 1;
		var end = (rowLine) ? Math.max(p.col, s.col) :
			Math.max(p.row, s.row);
		var fixed = (rowLine) ? p.row : p.col;

		// all squares in-b/w must be empty and enterable
		for (var unfixed = start; unfixed < end; unfixed++) {
			var pos = {row: unfixed, col: fixed};
			if (rowLine) {
				pos = {row: fixed, col: unfixed};
			}
			var square = Board.getSquare(board, pos);

			if (!square.enterable || square.piece) {
				return false;
			}
		}

		return true;
	}

	static areMovesEqual(m1, m2) {
		return (
			m1.start.row === m2.start.row && 
			m1.start.col === m2.start.col &&
			m1.end.row   === m2.end.row &&
			m1.end.col   === m2.end.col)
		;
	}

	static isCycle(lastThreeMoves, move) {
		return (
			lastThreeMoves.length >= 3 &&
			Board.areMovesEqual(lastThreeMoves[0], lastThreeMoves[2]) &&
			Board.areMovesEqual(lastThreeMoves[1], move)
		);
	}

	static isSquareEmpty(square) {
		if (square.piece) {
			return false;
		}
		return true;
	}

	static getPlayerMoves(lastSixMoves, player) {
		return lastSixMoves.filter(function(d) {
			return d.player === player;
		});
	}

	static canPieceEnterSquare(piece, square, lastSixMoves, move) {
		// if optional args lastSixMoves/move, does cycle detection 
		var isCycle = false;
		if (lastSixMoves && move) {
			var playerMoves = Board.getPlayerMoves(lastSixMoves, piece.player);
			isCycle = Board.isCycle(playerMoves, move);
		}

		if (!isCycle && square && square.enterable && piece.movable && 
			(Board.isSquareEmpty(square) || 
				square.piece.player !== piece.player)
			) {
			return true;
		}
		return false;
	}

	static isEdgeAdjacent(m1, m2) {
		var adjacent = (
			(m1.row >= m2.row - 1 && m1.row <= m2.row + 1) && 
			(m1.col >= m2.col - 1 && m1.col <= m2.col + 1)
		);
		var diagonal = (m1.row !== m2.row && m1.col !== m2.col);
		return (adjacent && !diagonal);
	}

	//
	// check if game won
	//

	static getAdjacentPositions(board, pos) {
		return {
			above: {row: pos.row - 1, col: pos.col},
			below: {row: pos.row + 1, col: pos.col},
			left: {row: pos.row, col: pos.col - 1},
			right: {row: pos.row, col: pos.col + 1},
		};
	}

	static movablePieceHasMove(board, position, lastSixMoves) {
		var piece = Board.getPiece(board, position);
		var directions = ["above", "below", "left", "right"];
		var adjPositions = Board.getAdjacentPositions(board, position);

		for (var d of directions) {
			var adjPosition = adjPositions[d];
			var adjSquare = Board.getSquare(board, adjPosition);
			var move = {start: position, end: adjPosition}
			// found valid acyclic move
			if (Board.canPieceEnterSquare(piece, adjSquare, 
				lastSixMoves, move)) {
				return true;
			}
		}
		return false;
	}

	// this function does multiple things at once b/c it's faster
	static getWinStats(board, lastSixMoves) {
		var numRows = board.length;
		var numCols = board[0].length; // board is square

		var p1HasFlag = false;
		var p2HasFlag = false;
		var p1HasMovablePiece = false;
		var p2HasMovablePiece = false;
		var p1HasValidMove = false;
		var p2HasValidMove = false;

		for (var row = 0; row < numRows; row++) {
			for (var col = 0; col < numCols; col++) {
				if (p1HasMovablePiece && p2HasMovablePiece && 
					p1HasValidMove && p2HasValidMove && 
					p1HasFlag && p2HasFlag) {
					break; // no more checks needed
				}

				var position = {row: row, col: col};
				var piece = Board.getPiece(board, position);

				if (!piece) {
					continue;
				}

				// found flag
				if (piece.rank === Rank.FLAG) {
					if (piece.player === Player.ONE) {
						p1HasFlag = true;
					} else {
						p2HasFlag = true;
					}
				} 
				// found movable piece
				else if (piece.movable) {
					var hasMove = Board.movablePieceHasMove(board, 
						position, lastSixMoves);
					if (piece.player === Player.ONE) {
						p1HasMovablePiece = true;
						if (hasMove) {
							p1HasValidMove = true;
						}
					} else {
						p2HasMovablePiece = true;
						if (hasMove) {
							p2HasValidMove = true;
						}
					}
				}
			}
		}

		if (!p1HasFlag && !p2HasFlag) {
			throw "impossible: neither player has flag";
		}

		return {
			p1HasFlag: p1HasFlag, p2HasFlag: p2HasFlag,
			p1HasMovablePiece: p1HasMovablePiece,
			p2HasMovablePiece: p2HasMovablePiece,
			p1HasValidMove: p1HasValidMove,
			p2HasValidMove: p2HasValidMove,
		};
	}

	static whoWonGameWhy(board, lastSixMoves, turn) {
		var result = Board.getWinStats(board, lastSixMoves);

		if (!result.p1HasFlag) {
			return {who: Player.TWO, why: WinReason.FLAG_CAPTURED};
		} else if (!result.p2HasFlag) {
			return {who: Player.ONE, why: WinReason.FLAG_CAPTURED};
		}

		// must check for has movable piece before has valid move
		// b/c if both are false, there aren't valid moves
		// *because* there are no valid pieces, so this is the real reason
		if (!result.p1HasMovablePiece && !result.p2HasMovablePiece) {
			return {who: Player.BOTH, why: WinReason.NO_MOVABLE_PIECES};
		} else if (!result.p1HasMovablePiece) {
			return {who: Player.TWO, why: WinReason.NO_MOVABLE_PIECES};
		} else if (!result.p2HasMovablePiece) {
			return {who: Player.ONE, why: WinReason.NO_MOVABLE_PIECES};
		}

		// player can only lose from no valid moves during their turn
		// b/c otherwise we'd prematurely end game in this situation:
		// 5 B (3)
		// B   4 (4)
		// p1's 4 takes p2's 4
		// if we didn't check turns, we'd say p1 lost b/c no moves left
		// but if p2 captured bomb w/ 3, then p1 would have a valid move
		// by the start of their next turn
		if (!result.p1HasValidMove && !result.p2HasValidMove) {
			return {who: Player.BOTH, why: WinReason.NO_VALID_MOVES};
		} else if (!result.p1HasValidMove && turn === Player.ONE) {
			return {who: Player.TWO, why: WinReason.NO_VALID_MOVES};
		} else if (!result.p2HasValidMove && turn === Player.TWO) {
			return {who: Player.ONE, why: WinReason.NO_VALID_MOVES};
		}

		// null if game not won yet
		return null;
	}

	//
	// debugging
	//

	static pprint_raw(board) {
		var numRows = board.length;
		var numCols = board[0].length; // board is square

		var rowCount = 0;
		var colCount = 0;

		var str = "\n   ";
		for (var i = 0; i < numRows; i++) {
			str += "   " + i + "   ";
		}
		str += '\n';

		for (var row of board) {
			str += rowCount + " [";
			for (var square of row) {
				var piece = square.piece;
				var text = "      ";
				if (!square.enterable) {
					text = "xxxxxx";
				}
				else if (piece) {
					text = piece.rank;

					var isPlayerOne = " ";
					if (piece.player === Player.ONE) {
						isPlayerOne = "/";
					}
					var didMove = " ";
					if (piece.moved) {
						didMove = ".";
					}
					var isVisible = " ";
					if (piece.visible) {
						isVisible = "*";
					}
					text += isPlayerOne + didMove + isVisible;

					if (piece.rank.length > 1) {
						text = " " + text;
					} else {
						text = " " + text + " ";
					}
				}
				str += text;

				if (colCount < numCols - 1) {
					str += ",";
				}
				colCount++;
			}
			str += "]\n";
			colCount = 0;
			rowCount++;
		}

		return str;
	}

	static pprint(board) {
		console.log(Board.pprint_raw(board));
	}
}

function createTestBoard(pieces) {
	// 10 x 10 stratego board
	var board = [];
	var n = 10;
	for (var i = n; i--;) {
		var row = [];
		for (var j = n; j--;) {
			var square = new Square(true, null);
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
		var position = unenterable[i];
		board[position.row][position.col].enterable = false;
	}

	// place test pieces
	for (var data of pieces) {
		var piece = new Piece(data.rank, data.player)
		board[data.row][data.col].piece = piece;
	}

	return board;
}

function somePieces() {
	return [
		{row: 0, col: 0, rank: Rank.SPY,	player: Player.ONE},
		{row: 0, col: 1, rank: Rank.FIVE,	player: Player.ONE},
		{row: 0, col: 2, rank: Rank.FLAG,	player: Player.TWO},
		{row: 0, col: 3, rank: Rank.THREE,	player: Player.ONE},
		{row: 0, col: 4, rank: Rank.TWO,	player: Player.ONE},
		{row: 0, col: 6, rank: Rank.TEN,	player: Player.TWO},
		{row: 0, col: 7, rank: Rank.FLAG,	player: Player.ONE},
		{row: 1, col: 0, rank: Rank.FOUR,	player: Player.ONE},
		{row: 1, col: 2, rank: Rank.SEVEN,	player: Player.ONE},
		{row: 1, col: 3, rank: Rank.BOMB,	player: Player.TWO},
		{row: 1, col: 4, rank: Rank.EIGHT,	player: Player.TWO},
		{row: 1, col: 6, rank: Rank.BOMB,	player: Player.ONE},
		{row: 1, col: 7, rank: Rank.FIVE,	player: Player.TWO},
		{row: 2, col: 3, rank: Rank.THREE,	player: Player.TWO},
		{row: 5, col: 8, rank: Rank.TWO,	player: Player.ONE},
		{row: 6, col: 2, rank: Rank.TWO,	player: Player.TWO},
		{row: 6, col: 7, rank: Rank.BOMB,	player: Player.ONE},
		{row: 7, col: 0, rank: Rank.THREE,	player: Player.ONE},
		{row: 8, col: 0, rank: Rank.BOMB,	player: Player.TWO},
		{row: 9, col: 0, rank: Rank.FIVE,	player: Player.TWO},
		{row: 9, col: 1, rank: Rank.BOMB,	player: Player.TWO},
		{row: 9, col: 9, rank: Rank.TWO,	player: Player.ONE},
	];

	// // test game win states
	// return [
	// 	// change to bomb to test no movable pieces
	// 	{row: 0, col: 0, rank: Rank.SPY,	player: Player.ONE},
	// 	{row: 0, col: 1, rank: Rank.BOMB,	player: Player.ONE},
	// 	{row: 1, col: 0, rank: Rank.BOMB,	player: Player.ONE},

	// 	{row: 0, col: 2, rank: Rank.FLAG,	player: Player.TWO},
	// 	{row: 0, col: 3, rank: Rank.FOUR,	player: Player.ONE},
	// 	{row: 0, col: 4, rank: Rank.BOMB,	player: Player.TWO},

	// 	// change this to three/four/five to test win/tie/lose
	// 	{row: 1, col: 3, rank: Rank.FOUR,	player: Player.TWO},
	// 	{row: 1, col: 4, rank: Rank.FLAG,	player: Player.ONE},
	// 	{row: 2, col: 3, rank: Rank.BOMB,	player: Player.ONE},
		
	// 	// change to bomb to test no movable pieces
	// 	{row: 8, col: 0, rank: Rank.BOMB,	player: Player.TWO},
	// 	{row: 9, col: 0, rank: Rank.FIVE,	player: Player.TWO},
	// 	{row: 9, col: 1, rank: Rank.BOMB,	player: Player.TWO},
	// ];

	// // test game loss on no moves left because cycle
	// return [
	// 	{row: 0, col: 0, rank: Rank.SPY,	player: Player.ONE},
	// 	{row: 0, col: 2, rank: Rank.BOMB,	player: Player.ONE},
	// 	{row: 0, col: 6, rank: Rank.TEN,	player: Player.TWO},
	// 	{row: 0, col: 7, rank: Rank.FLAG,	player: Player.ONE},
	// 	{row: 1, col: 0, rank: Rank.BOMB,	player: Player.ONE},
	// 	{row: 1, col: 1, rank: Rank.BOMB,	player: Player.ONE},
	// 	{row: 1, col: 3, rank: Rank.BOMB,	player: Player.TWO},
	// 	{row: 1, col: 4, rank: Rank.EIGHT,	player: Player.TWO},
	// 	{row: 1, col: 7, rank: Rank.FIVE,	player: Player.TWO},
	// 	{row: 2, col: 1, rank: Rank.THREE,	player: Player.TWO},
	// 	{row: 6, col: 2, rank: Rank.BOMB,	player: Player.TWO},
	// 	{row: 6, col: 7, rank: Rank.BOMB,	player: Player.ONE},
	// 	{row: 9, col: 0, rank: Rank.TWO,	player: Player.TWO},
	// 	{row: 9, col: 9, rank: Rank.FLAG,	player: Player.TWO},
	// ];
}

function getBoard() {
	return createTestBoard(somePieces());
}

//
// exports
//


module.exports = {
	Battle: Battle,
	MoveCode: MoveCode,
	WinReason: WinReason,
	Player: Player,
	Rank: Rank,
	Square: Square,
	Piece: Piece,
	Board: Board,
	getBoard: getBoard,
}
