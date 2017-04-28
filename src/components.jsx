// 
// components.jsx
// react components
// 

let React = require("react");
let Data = require("./data.js");
let io = require("socket.io-client");
let cloneDeep = require("lodash/cloneDeep");

//
// components
//

// TODO only shallow cloning board, but deep cloning with JSON caused weird bug
// TODO add separate rules box below board, can select rules on game creation
// TODO add button to show current standing
// TODO check game won at beginning to prevent front row of bombs

class Piece extends React.Component {

	getClassName(player, underline, onBoard) {
		let playerClass = (player === Data.Player.ONE) ? "p1-piece" : "p2-piece";
		let underlineClass = (underline) ? "revealed" : "";
		let sizeClass = (onBoard) ? "piece-board" : "piece-capture-message";
		let classNames = ["piece", sizeClass, playerClass, underlineClass];
		return classNames.join(" ");
	}

	render() {
		let className = this.getClassName(
			this.props.player, 
			this.props.underline,
			this.props.onBoard,
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
		let hoverClass;
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
		let enterableClass = (enterable) ? "" : "unenterable";
		let selectedClass = (selected) ? "selected" : "";

		let classNames = ["cell", enterableClass, hoverClass, selectedClass];
		return classNames.join(" ");
	}

	render() {
		let className = this.getClassName(
			this.props.enterable,
			this.props.hoverCode, 
			this.props.selected
		);
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
		this.arrows = this.getSVGArrows();
	}

	render() {
		let selectedPos = this.props.lastClickedPos;
		let hoveredPos = this.props.lastHoveredPos;
		let lastMove = this.props.lastMove;
		
		let lookup = null, direction = null, previousPlayer = null;
		if (lastMove) {
			lookup = Data.Board.getLookupPositionsBetween(lastMove, true, false);
			direction = Data.Board.getDirection(lastMove.start, lastMove.end);
			previousPlayer = Data.Player.opposite(this.props.turn);
		}

		return (
			<table id="board">
			<tbody>
			{this.props.board.map((row, i) => {
				return (
					<tr key={i}>{
						row.map((square, j) => {
							let key = i;
							key += ",";
							key += j;

							let piece = this.getPiece(square, 
								this.props.player, this.nsbp);
							let arrow = this.getArrow(i, j, lookup, direction, 
								previousPlayer);

							let selected = this.isSelected(i, j, selectedPos);
							let hoverCode = this.getHoverCode(i, j, hoveredPos, 
								Data.Board.isSquareEmpty(square),
								!!(selectedPos));

							return (<Square key={key}
								enterable={square.enterable}
								selected={selected}
								hoverCode={hoverCode}
								onClick={this.wrapper(this.handleClick, i, j)}
								onMouseEnter={this.wrapper(
									this.handleMouseEnter, i, j)}
								onMouseLeave={this.wrapper(
									this.handleMouseLeave, i, j)}>
								{piece}
								{arrow}
							</Square>);
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

	getPiece(square, player, defaultText) {
		if (!square.piece) {
			return defaultText;
		}

		let samePlayer = player === square.piece.player;
		let revealed = square.piece.revealed;
		let moved = square.piece.moved;

		let underline = revealed && samePlayer;

		// hide rank / show if moved
		let text = defaultText;
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
			onBoard={true}
		/>);
	}

	getArrow(row, col, lookup, direction, previousPlayer) {
		if (!direction || !lookup || !previousPlayer) {
			return null;
		}

		if (Data.Board.isPairInLookup(lookup, [row, col])) {
			return this.arrows[previousPlayer][direction];
		}
		return null;
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

	// TODO uniform opacity on line overlaps?
	// TODO fix truncated right/down arrows
	getSVGArrows() {
		let viewportWidth = 34;
		let viewportHeight = 34;
		let width = "5";
		let opacity = "0.5";

		let horizontalCoords = {start: {x: 0, y: 20}, end: {x: 40, y: 20}};
		let verticalCoords = {start: {x: 20, y: 0}, end: {x: 20, y: 40}};
		let upCoords = [
			verticalCoords, 
			{start: {x: 10, y: 15}, end: {x: 20, y: 1}}, 
			{start: {x: 20, y: 1},  end: {x: 30, y: 15}},
		];
		let downCoords = [
			verticalCoords, 
			{start: {x: 10, y: 25}, end: {x: 20, y: 39}}, 
			{start: {x: 20, y: 39}, end: {x: 30, y: 25}},
		];
		let leftCords = [
			horizontalCoords, 
			{start: {x: 15, y: 10}, end: {x: 1, y: 20}}, 
			{start: {x: 15, y: 30}, end: {x: 1, y: 20}},
		];
		let rightCoords = [
			horizontalCoords, 
			{start: {x: 25, y: 10}, end: {x: 39, y: 20}}, 
			{start: {x: 25, y: 30}, end: {x: 39, y: 20}},
		];
		let directionLines = {
			[Data.Direction.UP]: upCoords,
			[Data.Direction.DOWN]: downCoords,
			[Data.Direction.LEFT]: leftCords,
			[Data.Direction.RIGHT]: rightCoords,
		};

		let arrows = {
			[Data.Player.ONE]: {},
			[Data.Player.TWO]: {},
		};
		let directions = Data.Direction.getDirections();

		for (let direction of directions) {
			// convert coords to svg lines
			let coords = directionLines[direction];
			let svgLines = [];
			let count = 0;
			for (let coord of coords) {
				svgLines.push(<line key={count}
					x1={coord.start.x} y1={coord.start.y}
					x2={coord.end.x} y2={coord.end.y}
					strokeWidth={width} strokeOpacity={opacity}
				/>);
				count++;
			}

			// store lines in svgs
			// different colored arrows for each player
			arrows[Data.Player.ONE][direction] = (
				<svg width={viewportWidth} 
					height={viewportHeight} 
					className="p1-arrow">
					{svgLines}
				</svg>
			);
			arrows[Data.Player.TWO][direction] = (
				<svg width={viewportWidth} 
					height={viewportHeight} 
					className="p2-arrow">
					{svgLines}
				</svg>
			);
		}

		return arrows;
	}

	wrapper(func, row, col) {
		return ((ev) => func({row: row, col: col}));
	}
}

//
// game logic
//

// TODO click/drag phase to create board
// TODO load positions from text file
// TODO button to flip positions horizontally in case file loaded backwards

class Game extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			turn: Data.Player.ONE, 
			board: this.props.board,
			lastClickedPos: null,
			lastHoveredPos: null,
			gameWon: null,
			lastSixMoves: [],
			battleResult: null,
			cycleSelected: false,
		};
		this.socket = null;

		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.updateFromSentMove = this.updateFromSentMove.bind(this);
	}

	render() {
		let lastSixMoves = this.state.lastSixMoves;
		let lastMove = lastSixMoves[lastSixMoves.length - 1];
		return (
			<div id="game">
				<Message 
					player={this.props.player}
					turn={this.state.turn} 
					gameWon={this.state.gameWon}
					cycleSelected={this.state.cycleSelected} 
					battleResult={this.state.battleResult}
				/>
				<Board 
					board={this.state.board}
					player={this.props.player}
					turn={this.state.turn}
					lastMove={lastMove}
					lastClickedPos={this.state.lastClickedPos}
					lastHoveredPos={this.state.lastHoveredPos}
					onClick={this.handleClick}
					onMouseEnter={this.handleMouseEnter}
					onMouseLeave={this.handleMouseLeave} 
				/>
			</div>
		);
	}

	componentWillMount() {
		// must advance game state in componentWillMount instead of 
		// componentDidMount so it's also done server side
		this.advanceGameState(this.props.moves);
	}

	componentDidMount() {
		// create socket only when component mounts so
		// we don't create one when rendering server-side
		let args = [
			`player=${this.props.player}`,
			`gameId=${this.props.gameId}`
		];
		let socket = io(
			'http://localhost:8080',
			{query: args.join("&")}
		);
		socket.on("other-move", this.updateFromSentMove);
		this.socket = socket;

		// TODO move this until after we're done setting up board
		// check if P1 has any viable moves at start of game
		// in case they filled their front row w/ immovable pieces
		let gameWon = Data.Board.whoWonGameWhy(this.state.board, 
				this.state.lastSixMoves, this.state.turn);
		this.setState({gameWon: gameWon});
	}

	advanceGameState(previousMoves) {
		for (let move of previousMoves) {
			this.updateStateWithValidMove(move.start, move.end, move.code);
		}
	}

	// TODO fix performance issues
	// 1) put validity checking in Board so no calls to setState OR
	// 2) create set of valid moves after first selection so O(1) access
	handleMouseEnter(selectedPos) {
		if (!this.areMovesAllowed()) {
			return;
		}

		// only show highlight if selection is valid
		let previousPos = this.state.lastClickedPos;
		let board = this.state.board;
		let player = this.state.turn;
		if (previousPos) {
			// don't check for cycles here b/c if we wait for click
			// we can display persistent message on why it's disallowed
			let moveCode = Data.Board.isValidMove(board, 
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

		let board = this.state.board;
		let player = this.state.turn;
		let previousPos = this.state.lastClickedPos;
		let lastSixMoves = this.state.lastSixMoves;

		if (previousPos) { // complete move
			let moveCode = Data.Board.isValidMove(board, 
				previousPos, selectedPos);
			let playerMoves = Data.Board.getPlayerMoves(lastSixMoves, player);
			let move = {start: previousPos, end: selectedPos};

			if (Data.MoveCode.isValid(moveCode)) {
				// separate if for cycle so we can print message
				if (Data.Board.isCycle(playerMoves, move)) {
					this.setState({
						lastHoveredPos: null,
						cycleSelected: true,
					});
				} else {
					this.updateStateWithValidMove(previousPos, selectedPos, 
						moveCode);
					// send move to server
					this.socket.emit("move", JSON.stringify({
						move: {
							start: previousPos,
							end: selectedPos,
							code: moveCode
						},
						gameId: this.props.gameId,
					}));
				}
			} else {
				this.setState({
					lastClickedPos: null,
					lastHoveredPos: null,
					cycleSelected: false,
				});
			}
		} else { // first selection
			if (Data.Board.isValidFirstSelection(board, 
				selectedPos, player)) {
				this.setState({
					lastClickedPos: selectedPos,
					lastHoveredPos: null,
					cycleSelected: false,
				});
			}
		}
	}

	updateFromSentMove(moveJSON) {
		let move = JSON.parse(moveJSON);
		console.log("received move", moveJSON);
		this.updateStateWithValidMove(move.start, move.end, move.code);
	}

	updateStateWithValidMove(previousPos, selectedPos, moveCode) {
		this.setState(function (prevState, props) {
			let move = {start: previousPos, end: selectedPos}
			let battleResult = null;
			let newBoard = cloneDeep(prevState.board);
			let square = Data.Board.getSquare(newBoard, selectedPos);
			
			if (Data.Board.isSquareEmpty(square)) { // move
				Data.Board.setMove(newBoard, previousPos, selectedPos, moveCode);
			} else { // battle
				battleResult = Data.Board.setBattle(newBoard, 
					previousPos, selectedPos);
			}

			// only need last six moves to detect cycles for both players
			let lastSixMoves = prevState.lastSixMoves.slice();
			if (lastSixMoves.length >= 6) {
				lastSixMoves = lastSixMoves.slice(1);
			}
			lastSixMoves.push({
				start: previousPos,
				end: selectedPos,
				player: prevState.turn,
			});

			let turn = (prevState.turn === Data.Player.ONE) ? 
				Data.Player.TWO : Data.Player.ONE;
			let gameWon = Data.Board.whoWonGameWhy(newBoard, 
				lastSixMoves, turn);

			return {
				board: newBoard,
				turn: turn,
				gameWon: gameWon,
				lastClickedPos: null,
				lastHoveredPos: null,
				lastSixMoves: lastSixMoves,
				battleResult: battleResult,
				cycleSelected: false,
			}
		});
	}

	areMovesAllowed() {
		return (!this.state.gameWon && 
			this.state.turn === this.props.player);
	}
}

//
// message
//

// TODO fade background color on new message?
// TODO add surrender button
class Message extends React.Component {

	constructor(props) {
		super(props);
		
		this.rightArrow = "\u2192";
		this.captureX = (
			<svg width="20" height="20" className="capture-x">
			<line x1="0" x2="20" y1="0" y2="20" 
				stroke="black" strokeOpacity="1" strokeWidth="1"/>
			<line x1="20" x2="0" y1="0" y2="20" 
				stroke="black" strokeOpacity="1" strokeWidth="1"/>
			</svg>
		);
	}

	// insert message text into tables so we can vertically center
	// each row is a separate table so columns don't align widths
	// e.g. [[1, 2, 3], "abc", ["x", "y"]] ->
	// <div>
	// 	<table>1 | 2 | 3</table>
	// 	<table>abc</table>
	// 	<table>x | y</table>
	// </div>
	tableify(rawRows) {
		let rows = []
		let rowCount = 0;
		let cells, colCount, key;

		for (let row of rawRows) {
			colCount = 0;
			cells = [];

			if (Array.isArray(row)) {
				for (let col of row) {
					key = rowCount;
					key += ",";
					key += colCount;

					cells.push(<td key={key}>{col}</td>);
					colCount++;
				}
			} else {
				key = rowCount + "," + colCount;
				cells.push(<td key={key}>{row}</td>);
			}

			rows.push(
				<table key={rowCount}><tbody><tr>
					{cells}
				</tr></tbody></table>
			);
			rowCount++;
		}

		return (
			<div>{rows}</div>
		);
	}

	getRawWinMessage(thisPlayer, winner, why) {
		let loser = Data.Player.opposite(winner);
		let message = [];

		if (why === Data.WinReason.FLAG_CAPTURED) {
			if (winner === Data.Player.BOTH) { // tie
				throw "flags can't be captured simultaneously";
			} else if (winner === thisPlayer) { // you win
				if (loser === Data.Player.ONE) {
					message.push("You captured Player 1's flag.");
				} else {
					message.push("You captured Player 2's flag.");
				}
			} else { // you lose
				if (winner === Data.Player.ONE) {
					message.push("Player 1 captured your flag.");
				} else {
					message.push("Player 2 captured your flag.");
				}
			}
		} else if (why === Data.WinReason.NO_MOVABLE_PIECES) {
			if (winner === Data.Player.BOTH) { // tie
				message.push("Neither player has any movable pieces remaining.");
			} else if (winner === thisPlayer) { // you win
				if (loser === Data.Player.ONE) {
					message.push("You captured Player 1's last movable piece.");
				} else {
					message.push("You captured Player 2's last movable piece.");
				}
			} else { // you lose
				if (winner === Data.Player.ONE) {
					message.push("Player 1 captured your last movable piece.");
				} else {
					message.push("Player 2 captured your last movable piece.");
				}
			}
		} else if (why === Data.WinReason.NO_VALID_MOVES) {
			if (winner === Data.Player.BOTH) { // tie
				message.push("Neither player has a valid move.");
			} else if (winner === thisPlayer) { // you win
				if (loser === Data.Player.ONE) {
					message.push("Player 1 has no valid moves.");
				} else {
					message.push("Player 2 has no valid moves.");
				}
			} else { // you lose
				message.push("You have no valid moves.");
			}
		} else {
			throw `win condition ${why} is invalid`;
		}

		if (winner === Data.Player.BOTH) {
			message.push("Game over: tie.");
		} else if (winner === thisPlayer) {
			message.push("You win!");
		} else {
			message.push(`${winner} wins.`);
		}

		return message.join(" ");
	}

	getRawTurnMessage(thisPlayer, turn) {
		if (thisPlayer === turn) {
			return `It's your turn, ${thisPlayer}.`;
		}
		let otherPlayer = Data.Player.opposite(thisPlayer);
		return `Waiting for ${otherPlayer}'s move...`;
	}

	getRawCycleMessage() {
		return "Invalid move: cycle found.";
	}

	getCapturePiece(piece, wasCaptured) {
		if (wasCaptured) {
			return (
				<div className="capture-container">
					{piece}
					{this.captureX}
				</div>
			);
		}
		return (<div className="capture-container">{piece}</div>);
	}

	getRawBattleMessage(thisPlayer, attacker, defender, result) {
		let attackerPiece = (<Piece 
			player={attacker.player}
			underline={false} 
			text={attacker.rank}
			onBoard={false}
		/>);
		let defenderPiece = (<Piece 
			player={defender.player}
			underline={false} 
			text={defender.rank}
			onBoard={false}
		/>);

		switch (result) {
			case Data.Battle.WIN:
				attackerPiece = this.getCapturePiece(attackerPiece, false);
				defenderPiece = this.getCapturePiece(defenderPiece, true);
				break;
			case Data.Battle.TIE:
				attackerPiece = this.getCapturePiece(attackerPiece, true);
				defenderPiece = this.getCapturePiece(defenderPiece, true);
				break;
			case Data.Battle.LOSE:
				attackerPiece = this.getCapturePiece(attackerPiece, true);
				defenderPiece = this.getCapturePiece(defenderPiece, false);
				break;
			default:
				throw `unrecognized battle result ${result}`;
		}

		// array b/c pieces components have to be in separate table cell 
		// or piece block styling renders each on separate line
		return ["Last battle:", attackerPiece, this.rightArrow, defenderPiece];
	}

	getMessage(cycleSelected, gameWon, battleResult, thisPlayer, turn) {
		let messages = [];

		if (battleResult) {
			messages.push(this.getRawBattleMessage(
				thisPlayer, 
				battleResult.attacker, 
				battleResult.defender, 
				battleResult.result
			));
		}

		if (gameWon) {
			messages.push(this.getRawWinMessage(
				thisPlayer, 
				gameWon.who, 
				gameWon.why,
			));
		} else if (cycleSelected) {
			messages.push(this.getRawCycleMessage());
		} else {
			messages.push(this.getRawTurnMessage(thisPlayer, turn));
		}

		return this.tableify(messages);
	}

	render() {
		let message = this.getMessage(
			this.props.cycleSelected, 
			this.props.gameWon, 
			this.props.battleResult,
			this.props.player,
			this.props.turn,
		);
		
		return (
			<div id="message">{message}</div>
		);
	}
}

//
// exports
//

module.exports = {
	Game: Game,
}
