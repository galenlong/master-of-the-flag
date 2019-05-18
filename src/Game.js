
const React = require("react");
const Data = require("./data.js");
const io = require("socket.io-client");
const cloneDeep = require("lodash/cloneDeep");
import Board from "./Board.js";
import Message from "./Message.js";

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

		let setupState = (this.props.finishedSetup) ?
			Data.SetupState.CONFIRMED : 
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
// exports
//

module.exports = {
	Game: Game,
	getUpdatedGameData: getUpdatedGameData,
}
