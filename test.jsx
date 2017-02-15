// https://facebook.github.io/react/docs/thinking-in-react.html#step-3-identify-the-minimal-but-complete-representation-of-ui-state
// https://www.npmjs.com/package/react-server-example
// http://reactjs.cn/react/tips/if-else-in-JSX.html
// http://reactjs.cn/react/tips/communicate-between-components.html
// https://www.w3.org/WAI/intro/aria

const Player = {
	ONE: "p1",
	TWO: "p2",
}

// function Move(r1, c1, r2, c2, turn) {
// 	this.from = {row: r1, col: c1};
// 	this.to = {row: r2, col: c2};
// 	this.turn = turn; // if turn is even it's player one...
// }

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
}

function Square(enterable, piece) {
	this.enterable = enterable;
	this.piece = piece;
}

function getBoard() {
	// doesn't create new objects, all have same reference
	// var board = Array(10).fill(Array(10).fill(new Square(false, null)));
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
	board[0][1].piece = new Piece(Rank.THREE, Player.ONE);
	board[1][7].piece = new Piece(Rank.FIVE, Player.TWO);
	board[3][0].piece = new Piece(Rank.TWO, Player.TWO);
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
		var selectedClass = (this.props.selected) ? "selected" : "";
		var className = ["cell", enterableClass, selectedClass].join(" ");
		return (
			<td className={className}>{this.props.children}</td>
		);
	}
}

class Board extends React.Component {
	constructor(props) {
		super(props);
		this.nbsp = String.fromCharCode(160);
	}

	render() {
		var self = this;
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
						if (self.props.lastClickedPiece && 
							self.props.lastClickedPiece.row === i && 
							self.props.lastClickedPiece.col === j) {
							selected = true;
						}

						return (
							<SquareComponent key={key}
								enterable={square.enterable}
								selected={selected}>
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
		if (this.props.turn === Player.ONE) {
			message = "Player 1, it's your turn.";
		} else {
			message = "Player 2, it's your move.";
		}

		// display last move

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
			lastClickedPiece: null,
			// lastClickedPiece: {row: 0, col: 1},
			history: [],
		};
	}

	render() {
		// // pass last move to message
		// var lastMove = null;
		// if (history.length > 0) {
		// 	lastMove = history.slice(-1);
		// }
		// // also pass as prop

		return (
			<div id="game">
				<Board board={this.state.board}
					lastClickedPiece={this.state.lastClickedPiece} />
				<Message turn={this.state.turn} />
			</div>
		);
	}
}

ReactDOM.render(
	<Game />,
	document.getElementById("root")
);
