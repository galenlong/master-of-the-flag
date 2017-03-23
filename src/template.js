function header() {
	return (
`<head>
	<meta charset="utf-8"/>
	<link rel="stylesheet" type="text/css" href="/public/style.css"/>
	<title>Play Master of the Flag</title>
</head>`);
}

function title() {
	return (`<h1>Master of the Flag</h1>`);
}

function createHTML() {
	return (
`<!DOCTYPE html>
<html>
${header()}
<body>
	${title()}

	<div id="feedback">
		<p id="instructions">Click here to create a new game:</p>
		<button id="create">Create a new game</button>
	</div>

	<p><em>Cookie policy:</em> You need to have cookies enabled to play. <strong>If you clear your cookies, you won't ever be able to access your game again</strong>. Additionally, once you create a game, you'll only be able to play it on this device with the internet browser (Firefox, Chrome, Safari, Internet Explorer, etc.) that you're currently using. Sorry for the inconvenience!</p>

	<script src="/public/browser_create.js"></script>
</body>
</html>`);
}

function gameHTML(player, moves, gameId, renderedReact) {
	// TODO pass through HTTP request instead?

	// inject moves so far/player into global window object
	// so client-side rendering can pass them as component props
	// and client state will match server state
	let playerStr = JSON.stringify(player);
	let movesStr = JSON.stringify(moves);
	let gameIdStr = JSON.stringify(gameId);

	return (
`<!DOCTYPE html>
<html>
${header()}
<body>
	${title()}
	<script>
		// game state injected server-side
		window.player = JSON.parse('${playerStr}');
		window.moves = JSON.parse('${movesStr}');
		window.gameId = JSON.parse('${gameIdStr}');
	</script>
	<!-- initial rendering done server-side for speed -->
	<div id="root">${renderedReact}</div>
	<!-- client-side rendering for interactivity -->
	<script src="/public/browser_game.js"></script>
</body>
</html>`);
}

function registerPlayer2HTML(gameId, player2Id) {
	let gameIdStr = JSON.stringify(gameId);
	let player2IdStr = JSON.stringify(player2Id);

	return (
`<!DOCTYPE html>
<html>
${header()}
<body>
	${title()}

	<p>Welcome Player 2! We're setting your cookies now...one moment!</p>

	<script>
		window.gameId = JSON.parse('${gameIdStr}');
		window.player2Id = JSON.parse('${player2IdStr}');
		document.cookie = window.gameId + "=" + window.player2Id;
		window.location.reload(true);
	</script>

</body>
</html>`);
}

module.exports = {
	gameHTML: gameHTML,
	createHTML: createHTML,
	registerPlayer2HTML: registerPlayer2HTML,
};
