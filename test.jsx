// https://www.npmjs.com/package/react-server-example
// http://reactjs.cn/react/tips/if-else-in-JSX.html
// http://reactjs.cn/react/tips/communicate-between-components.html
// https://www.w3.org/WAI/intro/aria

const Player = {
	ONE: "p1",
	TWO: "p2",
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
	this.movable = rank !== Rank.FLAG && rank !== Rank.BOMB;
}

function Square(enterable, piece) {
	this.enterable = enterable;
	this.piece = piece;
}

function getBoard() {
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
	board[0][0].piece = new Piece(Rank.SPY, Player.ONE);
	board[0][2].piece = new Piece(Rank.FLAG, Player.TWO);
	board[0][3].piece = new Piece(Rank.THREE, Player.ONE);
	board[0][4].piece = new Piece(Rank.TWO, Player.TWO);
	board[0][6].piece = new Piece(Rank.TEN, Player.TWO);
	board[0][7].piece = new Piece(Rank.FLAG, Player.ONE);
	board[1][3].piece = new Piece(Rank.BOMB, Player.TWO);
	board[1][7].piece = new Piece(Rank.FIVE, Player.TWO);
	board[2][3].piece = new Piece(Rank.THREE, Player.TWO);
	board[6][2].piece = new Piece(Rank.BOMB, Player.TWO);

	return board;
}



class PieceComponent extends React.Component {
	render() {
		var playerClass = (this.props.player === Player.ONE) ? "p1" : "p2";
		var className = ["piece", playerClass].join(" ");
		return (
			<span className={className}>
				{this.props.rank}
			</span>
		);
	}
}

class SquareComponent extends React.Component {
	render() {
		var enterableClass = (this.props.enterable) ? "" : "unenterable";
		var hoveredClass = (this.props.hovered) ? "hovered" : "";
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

	render() {
		var self = this; // causing performance issues?
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
							piece = <PieceComponent rank={square.piece.rank} 
								player={square.piece.player} />
						}

						var selected = false;
						if (self.props.lastClickedPosition && 
							self.props.lastClickedPosition.row === i && 
							self.props.lastClickedPosition.col === j) {
							selected = true;
						}

						var hovered = false;
						if (self.props.lastHoveredPiece && 
							self.props.lastHoveredPiece.row === i && 
							self.props.lastHoveredPiece.col === j) {
							hovered = true;
						}

						return (
							<SquareComponent key={key}
								enterable={square.enterable}
								selected={selected}
								hovered={hovered}
								onClick={(ev) => {
									self.handleClick({row: i, col: j});
								}}
								onMouseEnter={(ev) => {
									self.handleMouseEnter({row: i, col: j});
								}}
								onMouseLeave={(ev) => {
									self.handleMouseLeave({row: i, col: j});
								}}>
								{piece}
							</SquareComponent>
						);
					})}
					</tr>
				);
			})}
			</tbody>
			</table>
		);
	}
}

class Message extends React.Component {
	render() {
		var message;
		if (this.props.gameWonBy) {
			if (this.props.gameWonBy === Player.ONE) {
				message = "Player 1, you win!";
			} else {
				message = "Player 2, you win!";
			}
		} else {
			if (this.props.turn === Player.ONE) {
				message = "Player 1, it's your turn.";
			} else {
				message = "Player 2, it's your move.";
			}
		}

		// display last move?
		return (
			<div id="message">{message}</div>
		);
	}
}

class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			turn: Player.ONE, 
			board: getBoard(), 
			lastClickedPosition: null,
			lastHoveredPiece: null,
			gameWonBy: null,
			history: [],
		};
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	if (this.state.board != nextState.board ||
	// 		this.state.lastClickedPosition != nextState.lastClickedPosition ||
	// 		this.state.lastHoveredPiece != nextState.lastHoveredPiece) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	battleResult(attackerRank, defenderRank) {
		if (attackerRank === defenderRank) {
			return Battle.TIE;
		}

		// non-numeric battle results
		// attacker will never be flag or bomb
		if (defenderRank === Rank.FLAG) {
			return Battle.GAME_WIN;
		} else if (defenderRank === Rank.BOMB) {
			// only 3s beat bombs
			return (attackerRank === Rank.THREE) ? Battle.WIN : Battle.LOSE;
		} else if (defenderRank === Rank.SPY) {
			// ties already accounted for, attacker always beats spies
			return Battle.WIN;
		} else if (attackerRank === Rank.SPY) { // else-if b/c other ifs return
			// ties already accounted for, spies only beat 10s
			return (defenderRank == Rank.TEN) ? Battle.WIN : Battle.LOSE; 
		} 

		// numeric battle results
		if (parseInt(attackerRank, 10) > parseInt(defenderRank, 10)) {
			return Battle.WIN;
		} else { // less than, ties already accounted for
			return Battle.LOSE;
		}
	}

	edgeAdjacent(p1, p2) {
		var adjacent = (
			(p1.row >= p2.row - 1 && p1.row <= p2.row + 1) && 
			(p1.col >= p2.col - 1 && p1.col <= p2.col + 1));
		var diagonal = (p1.row !== p2.row && p1.col !== p2.col);
		return (adjacent && !diagonal);
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

	swapPieces(board, previousPosition, selectedPosition) {
		var p = previousPosition, s = selectedPosition;
		var temp = board[p.row][p.col].piece;
		board[p.row][p.col].piece = board[s.row][s.col].piece;
		board[s.row][s.col].piece = temp;
		return board;
	}

	handleMouseEnter(selectedPosition) {
		var s = selectedPosition, p = this.state.lastClickedPosition;
		// only show hover if selection is valid
		if (p) {
			if (this.validMove(p, s)) {
				this.setState({lastHoveredPiece: s});
			}
		} else if (this.validFirstSelection(s)) {
			this.setState({lastHoveredPiece: s});
		}
	}

	handleMouseLeave(selectedPosition) {
		if (this.state.lastHoveredPiece) {
			this.setState({lastHoveredPiece: null});
		}
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
		var board = this.state.board;
		var ssq = board[s.row][s.col];
		var psq = board[p.row][p.col];

		if (ssq.enterable && 
			(this.edgeAdjacent(p, s) || 
				(psq.piece.rank === Rank.TWO && 
					this.validSprint(s, p)))) {
			return true;
		}
		return false;
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
			case Battle.WIN: // selected dies
				board[s.row][s.col].piece = null;
				board = this.swapPieces(board, p, s);
				break;
			case Battle.TIE: // both die
				board[p.row][p.col].piece = null;
				board[s.row][s.col].piece = null;
				break;
			case Battle.LOSE: // previous dies
				board[p.row][p.col].piece = null;
				break;
			case Battle.GAME_WIN: // game over
				board[s.row][s.col].piece = null;
				board = this.swapPieces(board, p, s);
				gameWonBy = this.state.turn;
				break;
			default:
				break;
		}

		return {gameWonBy: gameWonBy, board: board};
	}

	handleClick(selectedPosition) {
		if (this.state.gameWonBy) {
			return;
		}

		var board = this.state.board;
		var turn = this.state.turn;

		var s = selectedPosition, p = this.state.lastClickedPosition;
		var previousSelectionMade = p !== null;
		var ssq = board[s.row][s.col];
		var psq = (p) ? board[p.row][p.col] : null;

		// if a piece was previously clicked, check if currently 
		// selected square is valid move/battle and compute results
		if (previousSelectionMade) {	
			if (this.validMove(p, s)) {
				var gameWonBy = null;
				var newBoard = board.slice();
				
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

				this.setState({
					board: newBoard,
					turn: (turn === Player.ONE) ? Player.TWO : Player.ONE,
					gameWonBy: gameWonBy,
				});
			}
			this.setState({lastClickedPosition: null});
		} 
		// else save selected position
		else { 
			if (ssq.piece && 
				ssq.piece.player === turn && ssq.piece.movable) {
				this.setState({lastClickedPosition: s});
			}
		}
	}

	render() {
		// // pass last move to message as prop
		// var lastPosition = null;
		// if (history.length > 0) {
		// 	lastPosition = history.slice(-1);
		// }

		return (
			<div id="game">
				<Board board={this.state.board}
					lastClickedPosition={this.state.lastClickedPosition}
					lastHoveredPiece={this.state.lastHoveredPiece}
					onClick={this.handleClick}
					onMouseEnter={this.handleMouseEnter}
					onMouseLeave={this.handleMouseLeave} />
				<Message turn={this.state.turn} 
					gameWonBy={this.state.gameWonBy} />
			</div>
		);
	}
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

ReactDOM.render(
	<Game />,
	document.getElementById("root")
);


// function testBattle() {
// 	var ranks = [Rank.SPY, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.BOMB, Rank.FLAG];
// 	// pre-computed and spot-checked battle results
// 	var results = [Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.WIN, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.WIN, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.LOSE, Battle.GAME_WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.WIN, Battle.TIE, Battle.LOSE, Battle.GAME_WIN];
// 	var game = new Game();
// 	var battle = game.battleResult.bind(game); // shouldn't matter, but just in case

// 	var i = 0;
// 	for (var attacker of ranks) {
// 		for (var defender of ranks) {
// 			// immovable pieces will never attack
// 			if (attacker !== Rank.FLAG && attacker !== Rank.BOMB) {
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


// // debugging for handleClick

// var s_piece = ssq.piece;
// var s_empty = s_piece === null;
// var p_piece = (p) ? psq.piece : null;
// var s_enterable = ssq.enterable;
// var s_samePlayer = (s_piece) ? (s_piece.player === turn) : false;		
// var p_enterable = (p) ? psq.enterable : null;
// var p_empty = (p) ? (p_piece === null) : false; // false if null
// var p_samePlayer = (p_piece) ? (p_piece.player === turn) : false;
// var adjacent = (p) ? this.edgeAdjacent(s, p) : false;
// var sprintValid = (p) ? this.validSprint(s, p) : false;
// var p_isScout = (p_piece) ? p_piece.rank === Rank.TWO : false;

// console.log(
// 	"POSITION", p, "->", s, '\n',
// 	"SQUARE", psq, "|", ssq, '\n',
// 	"PIECE", psq.piece, "|", ssq.piece, '\n',
// 	"INVARIANTS\n",
// 		"\tenterable", p_enterable, "|", s_enterable, '\n',
// 		"\tempty", p_empty, "|", s_empty, '\n',
// 		"\tsamePlayer", p_samePlayer, "|", s_samePlayer, '\n',
// 		"\tadjacent", adjacent, '\n',
// 		"\tscout", p_isScout, "sprint", sprintValid, '\n',
// 	'\n'
// );
