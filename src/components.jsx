// 
// components.jsx
// react components
// 

var React = require("react");
var Data = require("./data.js");
var io = require('socket.io-client');


class Piece extends React.Component {
	render() {
		// TODO pull out className logic into separate function

		var playerClass = "p1";
		if (this.props.player === Data.Player.TWO) {
			playerClass = "p2";
		}

		var underlineClass = "";
		if (this.props.underline) {
			underlineClass = "revealed";
		}

		var className = ["piece", 
			playerClass, underlineClass].join(" ");

		return (
			<div className={className}>
				{this.props.text}
			</div>
		);
	}
}


class Square extends React.Component {

	render() {

		// TODO pull out className logic into separate function

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


// TODO show arrow over previous pointing towards selected
class Board extends React.Component {
	constructor(props) {
		super(props);
		this.nbsp = String.fromCharCode(160);
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);

	}

	render() {
		var self = this;
		var selectedPos = this.props.lastClickedPos;
		var hoveredPos = this.props.lastHoveredPos;
		// TODO fix spacing once functions are pulled out
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

			// TODO only pass relevant booleans as props
			// let sub components handle className logic

			// get piece if square has one
			// TODO replace with board static functions
			var piece = self.nbsp;
			if (square.piece) {

				var samePlayer = self.props.player === square.piece.player;
				var revealed = square.piece.revealed;
				var moved = square.piece.moved;

				// underline if other player knows piece's rank
				var underline = false;
				if (revealed && samePlayer) {
					underline = true;
				}

				// only show rank if same player or piece was
				// previously revealed; add "." if piece has moved
				var text = self.nbsp;
				if (revealed || samePlayer) {
					text = square.piece.rank;
					if (!revealed && moved) {
						text += ".";
					}
				} else {
					if (moved) {
						text = ".";
					}
				}

				piece = <Piece rank={square.piece.rank} 
					player={square.piece.player}
					text={text}
					underline={underline} />
			}

			// color square with previous piece selection
			var selected = false;
			if (selectedPos && 
				selectedPos.row === i && selectedPos.col === j) {
				selected = true;
			}

			// color hovered square differently if enemy present
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


// TODO display message on piece capture
// so you know the revealed rank even if it's immediately destroyed
// would be cute to have little squares like in the master of the flag...
class Message extends React.Component {
	render() {
		var message;

		var player = "Player 1";
		var otherPlayer = "Player 2";
		if (this.props.player === Data.Player.TWO) {
			player = "Player 2";
			otherPlayer = "Player 1";
		}

		if (this.props.gameWonBy) {
			if (this.props.gameWonBy === this.props.player) {
				message = "You win!";
			} else if (this.props.gameWonBy === Data.Player.BOTH) {
				message = "Game over: you tied.";
			} else {
				message = `${otherPlayer} wins.`;
			}
		} else {
			if (this.props.player === this.props.turn) {
				message = `It's your turn, ${player}.`;
			} else {
				message = `Waiting for ${otherPlayer}'s move...`;
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
			lastClickedPos: null,
			lastHoveredPos: null,
			gameWonBy: null,
			socket: null,
			lastSevenMoves: [],
			captureMessage: "", // ?
		};
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.updateFromSentMove = this.updateFromSentMove.bind(this);
	}

	render() {
		return (
			<div id="game">
				<Message player={this.props.player}
					turn={this.state.turn} 
					gameWonBy={this.state.gameWonBy} />
				<Board board={this.state.board}
					player={this.props.player}
					lastClickedPos={this.state.lastClickedPos}
					lastHoveredPos={this.state.lastHoveredPos}
					onClick={this.handleClick}
					onMouseEnter={this.handleMouseEnter}
					onMouseLeave={this.handleMouseLeave} />
			</div>
		);
	}

	componentDidMount() {
		// create socket only when component mounts so
		// we don't create one when rendering server-side
		var socket = io(
			'http://localhost:8080',
			// send player ID on connection
			{query: `player=${this.props.player}`}
		);
		socket.on("other-move", this.updateFromSentMove)
		this.setState({socket: socket});
	}

	handleMouseEnter(selectedPos) {
		if (!this.areMovesAllowed()) {
			return;
		}

		// only show highlight if selection is valid
		var previousPos = this.state.lastClickedPos;
		var board = this.state.board;
		var player = this.state.turn;
		if (previousPos) {
			// don't check for cycles here b/c if we wait for click
			// we can display persistent message on why it's disallowed
			if (Data.Board.isValidMove(board, 
				previousPos, selectedPos)) {
				this.setState({lastHoveredPos: selectedPos});
			}
		} else if (Data.Board.isValidFirstSelection(board, 
			selectedPos, player)) {
			this.setState({lastHoveredPos: selectedPos});
		}
	}

	handleMouseLeave(selectedPos) {
		// don't check for moves allowed b/c 
		// we want to clear selection after game is over
		if (this.state.lastHoveredPos) {
			this.setState({lastHoveredPos: null});
		}
	}

	handleClick(selectedPos) {
		if (!this.areMovesAllowed()) {
			return;
		}

		var board = this.state.board;
		var player = this.state.turn;
		var previousPos = this.state.lastClickedPos;
		var lastSevenMoves = this.state.lastSevenMoves;
		var currentPlayer = this.state.turn;

		// complete move
		if (previousPos) {	
			var isValid = Data.Board.isValidMove(board, 
				previousPos, selectedPos);
			var isCycle = Data.Board.isCycle(lastSevenMoves, currentPlayer);

			if (isValid && !isCycle) {
				this.updateStateWithValidMove(previousPos, selectedPos);

				// send move to server
				var move = JSON.stringify({
					start: previousPos, end: selectedPos,
				});
				this.state.socket.emit("move", move);
			}
		} 
		// first selection
		else {
			if (Data.Board.isValidFirstSelection(board, 
				selectedPos, player)) {
				this.setState({
					lastClickedPos: selectedPos,
					lastHoveredPos: null,
				});
			}
		}
	}

	updateFromSentMove(moveJSON) {
		var move = JSON.parse(moveJSON);
		console.log("received", moveJSON);
		this.updateStateWithValidMove(move.start, move.end);
	}

	updateStateWithValidMove(previousPos, selectedPos) {
		var captureMessage = "";
		var newBoard = this.state.board.slice();
		var square = Data.Board.getSquare(newBoard, selectedPos);

		// move
		if (Data.Board.isSquareEmpty(square)) {
			Data.Board.setMove(newBoard, previousPos, selectedPos);
		} 
		// battle
		else { 
			var result = Data.Board.setBattle(newBoard, 
				previousPos, selectedPos);
			var captureMessage = this.getCaptureMessage(
				result, previousPos, selectedPos);
		}

		var gameWonBy = Data.Board.whoWonGame(newBoard);

		this.setState(function (prevState, props) {
			// TODO fix, array holds > 7 moves
			var lastSevenMoves = prevState.lastSevenMoves.slice();
			if (lastSevenMoves.length > 7) {
				lastSevenMoves.slice(1); // remove oldest move
			}
			lastSevenMoves.push({
				start: previousPos,
				end: selectedPos,
				player: prevState.turn
			});

			var turn = (prevState.turn === Data.Player.ONE) ? 
				Data.Player.TWO : Data.Player.ONE;

			return {
				board: newBoard,
				turn: turn,
				gameWonBy: gameWonBy,
				lastClickedPos: null,
				lastHoveredPos: null,
				lastSevenMoves: lastSevenMoves,
				captureMessage: captureMessage,
			}
		});
	}

	// TODO implement
	getCaptureMessage(result, previousPos, selectedPos) {
		return "";
	}


	areMovesAllowed() {
		return (!this.state.gameWonBy && 
			this.state.turn === this.props.player);
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

