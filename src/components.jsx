// 
// components.jsx
// react components
// 

var React = require("react");
var Data = require("./data.js");
var io = require('socket.io-client');

//
// components
//

class Piece extends React.Component {

	getClassName(player, underline) {
		var playerClass = (player === Data.Player.ONE) ? "p1" : "p2";
		var underlineClass = (underline) ? "revealed" : "";
		var classNames = ["piece", playerClass, underlineClass];
		return classNames.join(" ");
	}

	render() {
		var className = this.getClassName(
			this.props.player, 
			this.props.underline,
		);
		return (
			<div className={className}>
				{this.props.text}
			</div>
		);
	}
}


class Square extends React.Component {

	getClassName(enterable, hoverCode, selected) {
		var hoverClass;
		switch (hoverCode) {
			case "battle":
				hoverClass = "hovered-battle";
				break;
			case "move":
				hoverClass = "hovered-move";
				break;
			default:
				hoverClass = "";
				break;
		}
		var enterableClass = (enterable) ? "" : "unenterable";
		var selectedClass = (selected) ? "selected" : "";

		var classNames = ["cell", enterableClass, hoverClass, selectedClass];
		return classNames.join(" ");
	}

	render() {
		var className = this.getClassName(this.props.enterable,
			this.props.hoverCode, this.props.selected);

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


// TODO use this.props.lastMove to show arrow; in square or b/w boundaries?
class Board extends React.Component {
	constructor(props) {
		super(props);
		this.nbsp = String.fromCharCode(160);
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
	}

	getPiece(square, player, defaultText) {
		if (!square.piece) {
			return defaultText;
		}

		var samePlayer = player === square.piece.player;
		var revealed = square.piece.revealed;
		var moved = square.piece.moved;

		var underline = revealed && samePlayer;

		// hide rank if other player's view and not revealed yet
		var text = defaultText;
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

		return (<Piece 
			player={square.piece.player}
			underline={underline} 
			text={text}
		/>);
	}

	isSelected(row, col, position) {
		return (position && position.row === row && position.col === col);
	}

	getHoverCode(row, col, position, squareEmpty, previousSelectionMade) {
		if (this.isSelected(row, col, position)) {
			if (previousSelectionMade && !squareEmpty) {
				return "battle";
			} else {
				return "move";
			}
		}
		return "";
	}

	render() {
		var self = this;
		var selectedPos = this.props.lastClickedPos;
		var hoveredPos = this.props.lastHoveredPos;

		return (
			<table id="board">
			<tbody>
			{this.props.board.map(function (row, i) {
				return (
					<tr key={i}>{
						row.map(function (square, j) {
							var key = i;
							key += ",";
							key += j;

							var piece = self.getPiece(square, 
								self.props.player, self.nsbp);
							
							var selected = self.isSelected(i, j, selectedPos);
							var hoverCode = self.getHoverCode(i, j, hoveredPos, 
								Data.Board.isSquareEmpty(square),
								(selectedPos) ? true : false);

							return (
								<Square key={key}
									enterable={square.enterable}
									selected={selected}
									hoverCode={hoverCode}
									onClick={self.wrapper(self.handleClick, i, j)}
									onMouseEnter={self.wrapper(
										self.handleMouseEnter, i, j)}
									onMouseLeave={self.wrapper(
										self.handleMouseLeave, i, j)}>
									{piece}
								</Square>
							);
						})
					}</tr>
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

// TODO fade background color on new message?
// TODO add surrender button
// TODO display message on piece capture w/ colored text
// TODO display message depending on win reason
class Message extends React.Component {
	render() {
		var message = "Invalid move: cycle found.";
		if (!this.props.isCycleMessage) {
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
		}
		
		return (
			<div id="message">{message}</div>
		);
	}
}

//
// game logic
//

// TODO reveal scout rank on sprint
// TODO store reason for win so Message can display it
class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			socket: null,
			turn: Data.Player.ONE, 
			board: Data.getBoard(),
			lastClickedPos: null,
			lastHoveredPos: null,
			gameWonBy: null,
			lastSixMoves: [],
			battleResult: null,
			isCycleMessage: false,
		};
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.updateFromSentMove = this.updateFromSentMove.bind(this);
		this.updateFromSentWin = this.updateFromSentWin.bind(this);
	}

	render() {
		var lastMove = this.state.lastSixMoves.slice(-1);
		return (
			<div id="game">
				<Message player={this.props.player}
					turn={this.state.turn} 
					gameWonBy={this.state.gameWonBy}
					isCycleMessage={this.state.isCycleMessage} />
				<Board board={this.state.board}
					player={this.props.player}
					lastMove={lastMove}
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
		socket.on("other-move", this.updateFromSentMove);
		socket.on("other-win", this.updateFromSentWin);
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
			var moveCode = Data.Board.isValidMove(board, 
				previousPos, selectedPos);
			if (Data.MoveCode.isValid(moveCode)) {
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
		var lastSixMoves = this.state.lastSixMoves;

		// complete move
		if (previousPos) {	
			var moveCode = Data.Board.isValidMove(board, 
				previousPos, selectedPos);
			var playerMoves = Data.Board.getPlayerMoves(lastSixMoves, player);
			var move = {start: previousPos, end: selectedPos};
			var isCycle = Data.Board.isCycle(playerMoves, move);

			if (Data.MoveCode.isValid(moveCode)) {
				// separate if for cycle so we can print message
				if (isCycle) {
					this.setState({
						lastClickedPos: previousPos,
						lastHoveredPos: null,
						isCycleMessage: true,
					});
				} else {
					this.updateStateWithValidMove(previousPos, selectedPos, 
						moveCode);
					this.state.socket.emit("move", JSON.stringify({
						start: previousPos,
						end: selectedPos,
						code: moveCode,
					}));
				}
			} else {
				this.setState({
					lastClickedPos: null,
					lastHoveredPos: null,
					isCycleMessage: false,
				});
			}
		} 
		// first selection
		else {
			if (Data.Board.isValidFirstSelection(board, 
				selectedPos, player)) {
				this.setState({
					lastClickedPos: selectedPos,
					lastHoveredPos: null,
					isCycleMessage: false,
					battleResult: null,
				});
			}
		}
	}

	updateFromSentWin(winJSON) {
		var win = JSON.parse(winJSON);
		console.log("received win", winJSON);
		this.setState({
			gameWonBy: win,
			lastClickedPos: null,
			lastHoveredPos: null,
		});
	}

	updateFromSentMove(moveJSON) {
		var move = JSON.parse(moveJSON);
		console.log("received move", moveJSON);
		this.updateStateWithValidMove(move.start, move.end, move.code);
	}

	updateStateWithValidMove(previousPos, selectedPos, moveCode) {
		var move = {start: previousPos, end: selectedPos}
		var battleResult = null;
		var newBoard = this.state.board.slice();
		var square = Data.Board.getSquare(newBoard, selectedPos);

		// move
		if (Data.Board.isSquareEmpty(square)) {
			Data.Board.setMove(newBoard, previousPos, selectedPos, moveCode);
		} 
		// battle
		else {
			var battleResult = Data.Board.setBattle(newBoard, 
				previousPos, selectedPos);
		}

		this.setState(function (prevState, props) {
			// only need last six moves to detect cycles for both players
			var lastSixMoves = prevState.lastSixMoves.slice();
			if (lastSixMoves.length >= 6) {
				lastSixMoves = lastSixMoves.slice(1);
			}
			lastSixMoves.push({
				start: previousPos,
				end: selectedPos,
				player: prevState.turn,
			});

			var gameWonBy = Data.Board.whoWonGame(newBoard, 
				lastSixMoves);

			var turn = (prevState.turn === Data.Player.ONE) ? 
				Data.Player.TWO : Data.Player.ONE;

			return {
				board: newBoard,
				turn: turn,
				gameWonBy: gameWonBy,
				lastClickedPos: null,
				lastHoveredPos: null,
				lastSixMoves: lastSixMoves,
				battleResult: battleResult,
				isCycleMessage: false,
			}
		});
	}

	areMovesAllowed() {
		return (!this.state.gameWonBy && 
			this.state.turn === this.props.player);
	}
}

//
// exports
//

module.exports = {
	Game: Game,
}
