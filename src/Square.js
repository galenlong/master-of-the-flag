
const React = require("react");

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

export default Square;
