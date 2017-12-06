// 
// components.jsx
// react components
// 

let React = require("react");
let Data = require("./data.js");
let io = require("socket.io-client");
const cloneDeep = require("lodash/cloneDeep");

//
// components
//

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

		let classNames = ["square", enterableClass, hoverClass, selectedClass];
		return classNames.join(" ");
	}

	render() {
		let className = this.getClassName(
			this.props.enterable,
			this.props.hoverCode, 
			this.props.selected
		);
		return (
			<div className={className}
				onClick={this.props.onClick}
				onMouseEnter={this.props.onMouseEnter}
				onMouseLeave={this.props.onMouseLeave}>
				{this.props.children}
			</div>
		);
	}
}


class Board extends React.Component {

	constructor(props) {
		super(props);

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
			<div id="board">
			{this.props.board.map((row, i) => {
				return (
					<div className="row" key={i}>{
						row.map((square, j) => {
							let key = i;
							key += ",";
							key += j;

							let piece = this.getPiece(square, 
								this.props.player);

							let arrow = this.getArrow(i, j, lookup, direction, 
								previousPlayer);

							let selected = this.isSelected(i, j, selectedPos);
							let hoverCode = this.getHoverCode(i, j, hoveredPos, 
								Data.Board.isSquareEmpty(square),
								!!(selectedPos),
								this.props.mode);

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
					}</div>
				);
			})}
			</div>
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

	getPiece(square, player) {
		if (!square.piece) {
			// return Data.nbsp;
			return null;
		}

		let samePlayer = player === square.piece.player;
		let revealed = square.piece.revealed;
		let moved = square.piece.moved;

		let underline = revealed && samePlayer;

		// show if piece moved
		let text = square.piece.rank;
		if (!revealed && moved) { 
			if (text === Data.nbsp) {
				text = ".";
			} else {
				text += ".";
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

	getHoverCode(row, col, position, squareEmpty, previousSelectionMade, mode) {
		if (this.isSelected(row, col, position)) {
			if (previousSelectionMade && !squareEmpty && mode === Data.Mode.PLAY) {
				return "battle";
			} else {
				return "move";
			}
		}
		return "";
	}

	getSVGArrows() {
		let minX = 0;
		let maxX = 40;
		let minY = minX;
		let maxY = maxX;

		let width = maxX - minX;
		let height = maxY - minY;

		let strokeWidth = 5;
		let strokeOpacity = 2/3;

		let upArrow = [
			{_1: {x: 1/2 * width, y: 1/8 * height}, 
			_2: {x: 1/2 * width, y: 7/8 * height}},
			{_1: {x: 1/4 * width, y: 1/3 * height}, 
			_2: {x: 1/2 * width + 1, y: 1/8 * height - 1}},
			{_1: {x: 3/4 * width, y: 1/3 * height}, 
			_2: {x: 1/2 * width - 1, y: 1/8 * height - 1}},
		];

		let downArrow = [
			{_1: {x: 1/2 * width, y: 1/8 * height}, 
			_2: {x: 1/2 * width, y: 7/8 * height}},
			{_1: {x: 1/4 * width, y: 2/3 * height}, 
			_2: {x: 1/2 * width + 1, y: 7/8 * height + 1}},
			{_1: {x: 3/4 * width, y: 2/3 * height}, 
			_2: {x: 1/2 * width - 1, y: 7/8 * height + 1}},
		];

		let leftArrow = [
			{_1: {x: 1/8 * width, y: 1/2 * height}, 
			_2: {x: 7/8 * width, y: 1/2 * height}},
			{_1: {x: 1/3 * width, y: 1/4 * height}, 
			_2: {x: 1/8 * width - 1, y: 1/2 * height + 1}},
			{_1: {x: 1/3 * width, y: 3/4 * height}, 
			_2: {x: 1/8 * width - 1, y: 1/2 * height - 1}},
		];

		let rightArrow = [
			{_1: {x: 1/8 * width, y: 1/2 * height}, 
			_2: {x: 7/8 * width, y: 1/2 * height}},
			{_1: {x: 2/3 * width, y: 1/4 * height}, 
			_2: {x: 7/8 * width + 1, y: 1/2 * height + 1}},
			{_1: {x: 2/3 * width, y: 3/4 * height}, 
			_2: {x: 7/8 * width + 1, y: 1/2 * height - 1}},
		];

		let arrowsByDirection = {
			[Data.Direction.UP]: upArrow,
			[Data.Direction.DOWN]: downArrow,
			[Data.Direction.LEFT]: leftArrow,
			[Data.Direction.RIGHT]: rightArrow,
		};

		let arrowClassesByPlayer = {
			[Data.Player.ONE]: "p1-arrow",
			[Data.Player.TWO]: "p2-arrow",
		}

		let arrowSVGs = {
			[Data.Player.ONE]: {},
			[Data.Player.TWO]: {},
		};

		let directions = Data.Direction.getDirections();

		for (let direction of directions) {
			// convert coords to svg lines
			let arrow = arrowsByDirection[direction];
			let svgLines = [];
			let count = 0;
			for (let line of arrow) {
				svgLines.push(<line key={count}
					x1={line._1.x} y1={line._1.y}
					x2={line._2.x} y2={line._2.y}
					strokeWidth={strokeWidth} strokeOpacity={strokeOpacity}
				/>);
				count++;
			}

			// store lines in svgs
			for (let player of Data.Player.getPlayers()) {
				let arrowClass = arrowClassesByPlayer[player];
				arrowSVGs[player][direction] = (
					<div className="arrow">
						<svg width={width} 
							height={height} 
							className={arrowClass}>
							{svgLines}
						</svg>
					</div>
				);
			}
		}

		return arrowSVGs;
	}

	wrapper(func, row, col) {
		return ((ev) => func({row: row, col: col}));
	}
}

//
// game logic
//

// compute new game state except for gameWon
// which must be computed on server since only server has all ranks
function getUpdatedGameData(move, player, oldBoard, lastSixMoves) {
	let board = cloneDeep(oldBoard);
	let battleResult = null;
	let square = Data.Board.getSquare(board, move.end);
	if (Data.Board.isSquareEmpty(square)) { // move
		Data.Board.setMove(board, move.start, move.end, move.code);
	} else { // battle
		battleResult = Data.Board.setBattle(board, 
			move.start, move.end);
	}

	if (lastSixMoves.length >= 6) {
		lastSixMoves = lastSixMoves.slice(1);
	}
	lastSixMoves.push({
		start: move.start,
		end: move.end,
		player: player,
	});

	let turn = Data.Player.opposite(player);
	
	return {
		turn: turn,
		board: board,
		lastSixMoves: lastSixMoves,
		battleResult: battleResult,
	};
}

class Game extends React.Component {

	constructor(props) {
		super(props);

		let setupState = (this.props.finishedSetup) ? Data.SetupState.CONFIRMED : 
			Data.SetupState.SETTING_UP;

		this.state = {
			mode: this.props.mode,
			turn: this.props.turn, 
			board: this.props.board,
			gameWon: this.props.gameWon,
			lastSixMoves: this.props.lastSixMoves,
			battleResult: this.props.battleResult,
			lastClickedPos: null,
			lastHoveredPos: null,
			cycleSelected: false,
			setupState: setupState,
		};
		this.socket = null;

		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.handleClickSetupButton = this.handleClickSetupButton.bind(this);
		this.handleClickSetupCancelButton = this.handleClickSetupCancelButton.bind(this);
		this.handleClickSetupConfirmedButton = this.handleClickSetupConfirmedButton.bind(this);
		this.updateFromServerMove = this.updateFromServerMove.bind(this);
		this.updateFromServerSwap = this.updateFromServerSwap.bind(this);
		this.readyToPlay = this.readyToPlay.bind(this);
	}

	render() {
		let lastSixMoves = this.state.lastSixMoves;
		let lastMove = lastSixMoves[lastSixMoves.length - 1];
		return (
			<div id="game">
				<Message 
					player={this.props.player}
					turn={this.state.turn} 
					mode={this.state.mode}
					handleClickSetupButton={this.handleClickSetupButton}
					handleClickSetupCancelButton={this.handleClickSetupCancelButton}
					handleClickSetupConfirmedButton={this.handleClickSetupConfirmedButton}
					setupState={this.state.setupState}
					gameWon={this.state.gameWon}
					cycleSelected={this.state.cycleSelected} 
					battleResult={this.state.battleResult}
				/>
				<Board 
					board={this.state.board}
					player={this.props.player}
					turn={this.state.turn}
					mode={this.state.mode}
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
		socket.on("moved", this.updateFromServerMove);
		socket.on("swapped", this.updateFromServerSwap);
		socket.on("ready", this.readyToPlay);
		this.socket = socket;
	}

	areMovesAllowed() {
		return (!this.state.gameWon && 
			this.state.turn === this.props.player);
	}

	areSelectionsAllowed() {
		return (this.state.setupState === Data.SetupState.SETTING_UP);
	}

	updateSwap(start, end) {
		let board = cloneDeep(this.state.board);
		Data.Board.setSwapPieces(board, start, end);
		this.setState({
			board: board,
			lastClickedPos: null,
			lastHoveredPos: null,
		});
	}

	//
	// board event handlers
	//

	handleMouseEnter(selectedPos) {
		if (this.state.mode === Data.Mode.SETUP) {
			this.handleMouseEnterSetup(selectedPos);
		} else if (this.state.mode === Data.Mode.PLAY) {
			this.handleMouseEnterPlay(selectedPos);
		} else {
			throw `unrecognized mode ${this.state.mode}`;
		}
	}

	handleClick(selectedPos) {
		if (this.state.mode === Data.Mode.SETUP) {
			this.handleClickSetup(selectedPos);
		} else if (this.state.mode === Data.Mode.PLAY) {
			this.handleClickPlay(selectedPos);
		} else {
			throw `unrecognized mode ${this.state.mode}`;
		}
	}

	handleMouseLeave(selectedPos) {
		// don't check for selections/moves allowed b/c 
		// we want to clear selection after confirming/game is over
		if (this.state.lastHoveredPos) {
			this.setState({lastHoveredPos: null});
		}
	}

	handleMouseEnterSetup(selectedPos) {
		if (!this.areSelectionsAllowed()) {
			return;
		}

		if (Data.Board.isValidSetupSelection(selectedPos, this.props.player)) {
			this.setState({lastHoveredPos: selectedPos});
		}
	}

	handleClickSetup(selectedPos) {
		if (!this.areSelectionsAllowed()) {
			return;
		}

		let previousPos = this.state.lastClickedPos;
		let isValid = Data.Board.isValidSetupSelection(selectedPos, this.props.player);

		if (previousPos) { // complete selection
			if (isValid) {
				this.updateSwap(previousPos, selectedPos);
				// send swap to server
				this.socket.emit("swap", JSON.stringify({
					swap: {
						start: previousPos,
						end: selectedPos,
					},
					gameId: this.props.gameId,
				}));
			} else {
				// clear selection
				this.setState({
					lastClickedPos: null,
					lastHoveredPos: null,
				});
			}
		} else { // first selection
			if (isValid) {
				this.setState({
					lastClickedPos: selectedPos,
					lastHoveredPos: null,
				});
			}
		}
	}

	handleMouseEnterPlay(selectedPos) {
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

	handleClickPlay(selectedPos) {
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
				// clear selection
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

	//
	// setup button event handlers
	//

	handleClickSetupButton() {
		this.setState({
			setupState: Data.SetupState.CONFIRMING,
		});
	}

	handleClickSetupCancelButton() {
		this.setState({
			setupState: Data.SetupState.SETTING_UP,
		});
	}

	handleClickSetupConfirmedButton() {
		this.setState({
			setupState: Data.SetupState.CONFIRMED,
		});

		let startRow = (this.props.player === Data.Player.ONE) ? 6 : 0;
		let endRow = (this.props.player === Data.Player.ONE) ? 9 : 3;
		let rows = [];
		for (let i = startRow; i <= endRow; i++) {
			rows.push(this.state.board[i]);
		}

		this.socket.emit("setup", JSON.stringify({
			gameId: this.props.gameId,
		}));
	}

	//
	// socket event handlers
	//

	updateFromServerMove(dataJSON) {
		let data = JSON.parse(dataJSON);

		// update ranks in board
		let start = data.move.start;
		let end = data.move.end;
		let board = cloneDeep(this.state.board);
		if (data.startRank) {
			board[start.row][start.col].piece.rank = data.startRank;
		}
		if (data.endRank) {
			board[end.row][end.col].piece.rank = data.endRank;
		}

		// update game state
		let gameState = getUpdatedGameData(data.move, this.state.turn, 
			board, this.state.lastSixMoves);
		console.log("updating from server", data);
		this.setState({
			turn: gameState.turn,
			board: gameState.board,
			gameWon: data.gameWon,
			lastSixMoves: gameState.lastSixMoves,
			battleResult: gameState.battleResult,
			lastClickedPos: null,
			lastHoveredPos: null,
			cycleSelected: false,
		});
	}

	updateFromServerSwap(dataJSON) {
		let data = JSON.parse(dataJSON);
		this.updateSwap(data.swap.start, data.swap.end);
	}

	readyToPlay(dataJSON) {
		let data = JSON.parse(dataJSON);
		this.setState({
			board: data.board,
			gameWon: data.gameWon,
			mode: Data.Mode.PLAY,
		});
	}
}

//
// message
//

class Message extends React.Component {

	constructor(props) {
		super(props);
		
		this.rightArrow = "\u2192";
		this.captureX = (
			<svg width="20" height="20" className="capture-x">
			<line x1="0" x2="20" y1="0" y2="20"/>
			<line x1="20" x2="0" y1="0" y2="20"/>
			</svg>
		);
	}

	render() {
		let message = this.getMessage(
			this.props.cycleSelected, 
			this.props.gameWon, 
			this.props.battleResult,
			this.props.player,
			this.props.turn,
			this.props.setupState,
		);
		
		return (
			<div id="message">{message}</div>
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

	//
	// message helpers
	//

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

	getSetupButton(setupState) {
		let buttons = [];
		switch (setupState) {
			case Data.SetupState.SETTING_UP:
				buttons.push(<button
					onClick={this.props.handleClickSetupButton}>
					Ready to play
				</button>);
				break;
			case Data.SetupState.CONFIRMING:
				buttons.push(<button
					onClick={this.props.handleClickSetupCancelButton}>
					No, I want to rearrange my pieces
				</button>);
				buttons.push(<button
					onClick={this.props.handleClickSetupConfirmedButton}>
					Yes, I'm ready to play
				</button>);
				break;
			case Data.SetupState.CONFIRMED:
				break;
			default:
				throw `unrecognized setup state ${setupState}`;
				break;
		}
		return buttons;
	}

	//
	// get message
	//

	getMessage(cycleSelected, gameWon, battleResult, thisPlayer, turn, setupState) {
		if (this.props.mode === Data.Mode.SETUP) {
			return this.getSetupMessage(thisPlayer, setupState);
		} else if (this.props.mode === Data.Mode.PLAY) {
			return this.getPlayMessage(cycleSelected, gameWon, 
				battleResult, thisPlayer, turn);
		} else {
			throw `unrecognized mode ${this.state.mode}`;
		}
	}

	getSetupMessage(thisPlayer, setupState) {
		let messages = [];

		switch (setupState) {
			case Data.SetupState.SETTING_UP:
				messages.push("Arrange your board by clicking pieces to swap them.");
				messages.push("Click this button when you're done setting up:");
				break;
			case Data.SetupState.CONFIRMING:
				messages.push("Are you sure you're done setting up?");
				messages.push("This is your last chance to change your setup!");
				break;
			case Data.SetupState.CONFIRMED:
				let otherPlayer = Data.Player.opposite(thisPlayer);
				messages.push(`Waiting for ${otherPlayer} to finish setting up...`);
				break;
			default:
				throw `unrecognized setup state ${setupState}`;
				break;
		}

		messages.push(this.getSetupButton(setupState));
		return this.tableify(messages);
	}

	getPlayMessage(cycleSelected, gameWon, battleResult, thisPlayer, turn) {
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
}

//
// exports
//

module.exports = {
	Game: Game,
	getUpdatedGameData: getUpdatedGameData,
}
