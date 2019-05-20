
const React = require("react");
const Data = require("./data.ts");
import PieceComponent from "./PieceComponent.js";
import SquareComponent from "./SquareComponent.js";

class BoardComponent extends React.Component {

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

							return (<SquareComponent key={key}
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
							</SquareComponent>);
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

		return (<PieceComponent
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

export default BoardComponent;
