// https://facebook.github.io/react/docs/thinking-in-react.html#step-3-identify-the-minimal-but-complete-representation-of-ui-state
// https://www.npmjs.com/package/react-server-example
// http://reactjs.cn/react/tips/if-else-in-JSX.html
// http://reactjs.cn/react/tips/communicate-between-components.html
// https://www.w3.org/WAI/intro/aria

const Player = {
	ONE: "p1",
	TWO: "p2",
}

var Rank = {
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

function getBoard() {
	return [
		[null, new Piece(Rank.THREE, Player.ONE), null, null, null, null, null, null, null, null], 
		[null, null, null, null, null, null, null, new Piece(Rank.FIVE, Player.TWO), null, null],
		[null, null, null, null, null, null, null, null, null, null],
		[new Piece(Rank.TWO, Player.TWO), null, null, null, null, null, null, null, null, null], 
		[null, null, null, null, null, null, null, null, null, null],
		[null, null, new Piece(Rank.BOMB, Player.TWO), null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null, null, null],
	];
}



class PieceComponent extends React.Component {
	render() {
		return (
			<span className={this.props.player + " piece"}>
				{this.props.rank}
			</span>
		);
	}
}

class Square extends React.Component {
	render() {
		return (
			<td>{this.props.children}</td>
		);
	}
}

class Board extends React.Component {
	constructor(props) {
		super(props);
		this.nbsp = String.fromCharCode(160);
	}

	render() {
		return (
			<table id="board">
			<tbody>
			{this.props.board.map((row, i) => 
				<tr key={i}>
				{row.map((piece, j) =>
					(piece) ? 
						<Square key={i + "," + j}>
							<PieceComponent rank={piece.rank} 
								player={piece.player} />
						</Square> : 
						<Square key={i + "," + j}>{this.nbsp}</Square>
				)}
				</tr>
			)}
			</tbody>
			</table>
		);
	}
}

class Message extends React.Component {
	render() {
		return (
			<div id="message">{this.props.text}</div>
		);
	}
}

class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.board = getBoard();
	}

	render() {
		return (
			<div id="game">
				<Board board={this.board} />
				<Message text="hi" />
			</div>
		);
	}
}

ReactDOM.render(
	<Game />,
	document.getElementById("root")
);
