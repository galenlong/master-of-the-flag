
const React = require("react");
import * as Data from "./data";
import PieceComponent from "./PieceComponent.js";

class MessageComponent extends React.Component {

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
		let attackerPiece = (<PieceComponent
			player={attacker.player}
			underline={false} 
			text={attacker.rank}
			onBoard={false}
		/>);
		let defenderPiece = (<PieceComponent 
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

export default MessageComponent;

