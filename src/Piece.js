
const React = require("react");
const Data = require("./data.js");

class Piece extends React.Component {
	getClassName(player, underline, onBoard) {
		let playerClass = (player === Data.Player.ONE) ? 
			"p1-piece" : "p2-piece";
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

export default Piece;
