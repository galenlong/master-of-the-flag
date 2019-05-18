let React = require("react");
let ReactDOM = require("react-dom");
let Components = require("./components.js");

function loadReact(player, gameId, mode, finishedSetup, 
	turn, board, gameWon, lastSixMoves, battleResult) {
	ReactDOM.render(
		<Components.Game 
			player={player} 
			gameId={gameId}
			mode={mode}
			finishedSetup={finishedSetup}
			turn={turn}
			board={board}
			gameWon={gameWon}
			lastSixMoves={lastSixMoves}
			battleResult={battleResult}
		/>,
		document.getElementById("root")
	);
}

module.exports = {loadReact: loadReact};
