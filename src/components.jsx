var React = require("react");
var Data = require("./data.js");
var io = require('socket.io-client');

class Piece extends React.Component {
	render() {
		var playerClass = (this.props.player === Data.Player.ONE) ? "p1" : "p2";
		var className = ["piece", playerClass].join(" ");
		return (
			<div className={className}>
				{this.props.rank}
			</div>
		);
	}
}

class Square extends React.Component {
	render() {
		var enterableClass = (this.props.enterable) ? "" : "unenterable";
		var hoveredClass = this.props.hoveredClass;
		var selectedClass = (this.props.selected) ? "selected" : "";
		var className = ["cell", 
			enterableClass, hoveredClass, selectedClass].join(" ");
		return (
			<td className={className}
				onClick={this.props.onClick}
				onMouseEnter={this.props.onMouseEnter}
				onMouseLeave={this.props.onMouseLeave}>
				{this.props.children}
			</td>
		);
	}
}

class Board extends React.Component {
	constructor(props) {
		super(props);
		this.nbsp = String.fromCharCode(160);
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);

	}

	render() {
		// creating new functions every render?
		var self = this; // causing performance issues?
		var selectedPos = this.props.lastClickedPosition;
		var hoveredPos = this.props.lastHoveredPosition;
		return (
			<table id="board">
			<tbody>
			{this.props.board.map(function (row, i) {
				return (
					<tr key={i}>
					{row.map(function (square, j) {
						var key = i;
						key += ",";
						key += j;

						var piece = self.nbsp;
						if (square.piece) {
							piece = <Piece rank={square.piece.rank} 
								player={square.piece.player} />
						}

						var selected = false;
						if (selectedPos && 
							selectedPos.row === i && selectedPos.col === j) {
							selected = true;
						}

						var hoveredClass = "";
						if (hoveredPos && 
							hoveredPos.row === i && hoveredPos.col === j) {
							if (square.piece && selectedPos) {
								hoveredClass = "hovered-battle";
							} else {
								hoveredClass = "hovered-move";
							}
						}

						return (
							<Square key={key}
								enterable={square.enterable}
								selected={selected}
								hoveredClass={hoveredClass}
								onClick={self.wrapper(self.handleClick, i, j)}
								onMouseEnter={self.wrapper(
									self.handleMouseEnter, i, j)}
								onMouseLeave={self.wrapper(
									self.handleMouseLeave, i, j)}>
								{piece}
							</Square>
						);
					})}
					</tr>
				);
			})}
			</tbody>
			</table>
		);
	}

	handleClick(i, j) {
		this.props.onClick(i, j);
	}

	handleMouseEnter(i, j) {
		this.props.onMouseEnter(i, j);
	}

	handleMouseLeave(i, j) {
		this.props.onMouseLeave(i, j);
	}

	wrapper(func, row, col) {
		return ((ev) => func({row: row, col: col}));
	}
}

class Message extends React.Component {
	render() {
		var message;

		var player = "Player 1";
		var otherPlayer = "Player 2";
		if (this.props.turn === Data.Player.TWO) {
			player = "Player 2";
			otherPlayer = "Player 1";
		}

		if (this.props.gameWonBy) {
			if (this.props.gameWonBy === this.props.player) {
				message = "You win!";
			} else {
				message = `${otherPlayer} wins.`;
			}
		} else {
			if (this.props.player === this.props.turn) {
				message = `It's your turn, ${player}.`;
			} else {
				message = `Waiting for ${player}'s move...`;
			}
		}
		
		return (
			<div id="message">{message}</div>
		);
	}
}

class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			turn: Data.Player.ONE, 
			board: getBoard(), 
			lastClickedPosition: null,
			lastHoveredPosition: null,
			gameWonBy: null,
			socket: null,
		};
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.updateFromSentMove = this.updateFromSentMove.bind(this);
	}

	componentDidMount() {
		// create socket only when component mounts so
		// we don't create extra when we're rendering server-side

		// send player ID on connection
		var socket = io(
			'http://localhost:8080',
			{query: `player=${this.props.player}`}
		);
		socket.on("other-move", this.updateFromSentMove)
		this.setState({
			socket: socket,
		});
	}

	updateFromSentMove(moveStr) {
		var move = Data.parseMove(moveStr);
		console.log("move received", move);
		this.updateBoardWithValidMove(move.start, move.end);
	}

	render() {
		return (
			<div id="game">
				<Message player={this.props.player}
					turn={this.state.turn} 
					gameWonBy={this.state.gameWonBy} />
				<Board board={this.state.board}
					lastClickedPosition={this.state.lastClickedPosition}
					lastHoveredPosition={this.state.lastHoveredPosition}
					onClick={this.handleClick}
					onMouseEnter={this.handleMouseEnter}
					onMouseLeave={this.handleMouseLeave} />
			</div>
		);
	}

	handleMouseEnter(selectedPosition) {
		if (this.state.gameWonBy || this.state.turn !== this.props.player) {
			return;
		}

		var s = selectedPosition, p = this.state.lastClickedPosition;
		// only show hover if selection is valid
		if (p) {
			if (this.validMove(p, s)) {
				this.setState({lastHoveredPosition: s});
			}
		} else if (this.validFirstSelection(s)) {
			this.setState({lastHoveredPosition: s});
		}
	}

	handleMouseLeave(selectedPosition) {
		if (this.state.lastHoveredPosition) {
			this.setState({lastHoveredPosition: null});
		}
	}

	handleClick(selectedPosition) {
		if (this.state.gameWonBy || this.state.turn !== this.props.player) {
			return;
		}

		var s = selectedPosition, p = this.state.lastClickedPosition;
		var board = this.state.board;
		var turn = this.state.turn;

		var previousSelectionMade = p !== null;
		var ssq = board[s.row][s.col];
		var psq = (p) ? board[p.row][p.col] : null;

		// if previous selected position and current selection
		// together make a valid move, compute results, update,
		// and send move to server so other boards can update
		if (previousSelectionMade) {	
			if (this.validMove(p, s)) {
				this.updateBoardWithValidMove(p, s);
				// send move to server
				var move = Data.stringifyMove(p, s);
				this.state.socket.emit("move", move);

			} else {
				this.setState({
					lastClickedPosition: null,
					lastHoveredPosition: null,
				});
			}		
		} 
		// else, save selected position
		else { 
			if (ssq.piece && 
				ssq.piece.player === turn && ssq.piece.movable) {
				this.setState({
					lastClickedPosition: s,
					lastHoveredPosition: null,
				});
			}
		}
	}

	updateBoardWithValidMove(previousPosition, selectedPosition) {
		var p = previousPosition, s = selectedPosition;
		var board = this.state.board;
		var ssq = board[s.row][s.col];
		var psq = board[p.row][p.col];

		var gameWonBy = null;
		var newBoard = this.state.board.slice();
		
		// move
		if (ssq.piece === null) { 
			newBoard = this.swapPieces(newBoard, p, s);
		} 
		// battle 
		else if (psq.piece.player !== ssq.piece.player) { 
			var result = this.battle(newBoard, p, s);
			newBoard = result.board;
			gameWonBy = result.gameWonBy;
		}

		this.setState(function (prevState, props) {
			return {
				board: newBoard,
				turn: (prevState.turn === Data.Player.ONE) ? 
					Data.Player.TWO : Data.Player.ONE,
				gameWonBy: gameWonBy,
				lastClickedPosition: null,
				lastHoveredPosition: null,
			}
		});
	}

	battleResult(attackerRank, defenderRank) {
		if (attackerRank === defenderRank) {
			return Data.Battle.TIE;
		}

		// non-numeric battle results for spy, flag, bomb
		// attacker will never be flag or bomb
		if (defenderRank === Data.Rank.FLAG) {
			return Data.Battle.GAME_WIN;
		} else if (defenderRank === Data.Rank.BOMB) {
			// only 3s beat bombs
			return (attackerRank === Data.Rank.THREE) ? 
				Data.Battle.WIN : Data.Battle.LOSE;
		} else if (defenderRank === Data.Rank.SPY) {
			// ties already accounted for, attacker always beats spies
			return Data.Battle.WIN;
		} else if (attackerRank === Data.Rank.SPY) { // elif b/c others return
			// ties already accounted for, spies only beat 10s
			return (defenderRank == Data.Rank.TEN) ? 
				Data.Battle.WIN : Data.Battle.LOSE; 
		} 

		// numeric battle results
		if (parseInt(attackerRank, 10) > parseInt(defenderRank, 10)) {
			return Data.Battle.WIN;
		} else { // less than, ties already accounted for
			return Data.Battle.LOSE;
		}
	}

	battle(board, previousPosition, selectedPosition) {
		var p = previousPosition, s = selectedPosition;
		var board = this.state.board;
		var ssq = board[s.row][s.col];
		var psq = board[p.row][p.col];

		var gameWonBy = null;
		var battleResult = this.battleResult(
			psq.piece.rank, ssq.piece.rank);
		switch (battleResult) {
			case Data.Battle.WIN: // selected dies
				board[s.row][s.col].piece = null;
				board = this.swapPieces(board, p, s);
				break;
			case Data.Battle.TIE: // both die
				board[p.row][p.col].piece = null;
				board[s.row][s.col].piece = null;
				break;
			case Data.Battle.LOSE: // previous dies
				board[p.row][p.col].piece = null;
				break;
			case Data.Battle.GAME_WIN: // game over
				board[s.row][s.col].piece = null;
				board = this.swapPieces(board, p, s);
				gameWonBy = this.state.turn;
				break;
			default:
				break;
		}

		return {gameWonBy: gameWonBy, board: board};
	}

	validFirstSelection(position) {
		var board = this.state.board;
		var square = board[position.row][position.col];
		var piece = square.piece;
		if (piece && 
			piece.movable && piece.player === this.state.turn) {
			return true;
		}
		return false;
	}

	validMove(previousPosition, selectedPosition) {
		var p = previousPosition, s = selectedPosition;

		if (p.row === s.row && p.col === s.col) {
			return false;
		}

		var board = this.state.board;
		var psq = board[p.row][p.col];
		var ssq = board[s.row][s.col];

		var samePlayer = ssq.piece && 
			ssq.piece.player === psq.piece.player;

		if (ssq.enterable && !samePlayer &&
			(this.edgeAdjacent(p, s) || 
				(psq.piece.rank === Data.Rank.TWO && 
					this.validSprint(s, p)))) {
			return true;
		}
		return false;
	}

	validSprint(previousPosition, selectedPosition) {
		var p = previousPosition, s = selectedPosition;

		// must be straight line
		if (p.row !== s.row && p.col !== s.col) {
			return false;
		}

		// all squares in-b/w must be empty and enterable

		// loop through columns if row is same, else rows
		var rowLine = p.row === s.row;
		var start = (rowLine) ? Math.min(p.col, s.col) + 1 :
			Math.min(p.row, s.row) + 1;
		var end = (rowLine) ? Math.max(p.col, s.col) :
			Math.max(p.row, s.row);
		var fixed = (rowLine) ? p.row : p.col;

		for (var unfixed = start; unfixed < end; unfixed++) {
			var cell = (rowLine) ? this.state.board[fixed][unfixed] :
				this.state.board[unfixed][fixed];
			if (!cell.enterable || cell.piece) {
				return false;
			}
		}

		return true;
	}

	edgeAdjacent(p1, p2) {
		var adjacent = (
			(p1.row >= p2.row - 1 && p1.row <= p2.row + 1) && 
			(p1.col >= p2.col - 1 && p1.col <= p2.col + 1));
		var diagonal = (p1.row !== p2.row && p1.col !== p2.col);
		return (adjacent && !diagonal);
	}

	swapPieces(board, previousPosition, selectedPosition) {
		var p = previousPosition, s = selectedPosition;
		var temp = board[p.row][p.col].piece;
		board[p.row][p.col].piece = board[s.row][s.col].piece;
		board[s.row][s.col].piece = temp;
		return board;
	}
}

function getBoard() {
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

	// test pieces
	board[0][0].piece = new Data.Piece(Data.Rank.SPY, Data.Player.ONE);
	board[0][2].piece = new Data.Piece(Data.Rank.FLAG, Data.Player.TWO);
	board[0][3].piece = new Data.Piece(Data.Rank.THREE, Data.Player.ONE);
	board[0][4].piece = new Data.Piece(Data.Rank.TWO, Data.Player.TWO);
	board[0][6].piece = new Data.Piece(Data.Rank.TEN, Data.Player.TWO);
	board[0][7].piece = new Data.Piece(Data.Rank.FLAG, Data.Player.ONE);
	board[1][3].piece = new Data.Piece(Data.Rank.BOMB, Data.Player.TWO);
	board[1][7].piece = new Data.Piece(Data.Rank.FIVE, Data.Player.TWO);
	board[2][3].piece = new Data.Piece(Data.Rank.THREE, Data.Player.TWO);
	board[6][2].piece = new Data.Piece(Data.Rank.BOMB, Data.Player.TWO);

	return board;
}

module.exports = {
	Game: Game,
}

// // can't use b/c can't attach synthetic event handler to document
// // clear non-board clicks
// document.addEventListener("click", function (ev) { 
//     var boardClicked = ev.defaultPrevented;
//     if (!boardClicked) {
//         console.log("cleared");
//         this.previousSelectedCell = null;
//     }
// });

// function testBattle() {
// 	var ranks = [Data.Rank.SPY, Data.Rank.TWO, Data.Rank.THREE, Data.Rank.FOUR, Data.Rank.FIVE, Data.Rank.SIX, Data.Rank.SEVEN, Data.Rank.EIGHT, Data.Rank.NINE, Data.Rank.TEN, Data.Rank.BOMB, Data.Rank.FLAG];
// 	// pre-computed and spot-checked battle results
// 	var results = [Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.WIN, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.LOSE, Data.Battle.GAME_WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.WIN, Data.Battle.TIE, Data.Battle.LOSE, Data.Battle.GAME_WIN];
// 	var game = new Game();
// 	var battle = game.battleResult.bind(game); // shouldn't matter, but just in case

// 	var i = 0;
// 	for (var attacker of ranks) {
// 		for (var defender of ranks) {
// 			// immovable pieces will never attack
// 			if (attacker !== Data.Rank.FLAG && attacker !== Data.Rank.BOMB) {
// 				// console.log(attacker, defender, 
// 				// 	battle(attacker, defender), results[i],
// 				// 	battle(attacker, defender) === results[i]);
// 				if (battle(attacker, defender) !== results[i]) {
// 					return false;
// 				}
// 				i++;
// 			}
// 		}
// 	}
// 	return true;
// }
