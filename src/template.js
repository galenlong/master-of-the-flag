// TODO pass through HTTP request instead?
function template(renderedReact, player, moves) {
	// inject moves so far/player into global window object
	// so client-side rendering can pass them as component props
	// and client state will match server state
	let playerStr = JSON.stringify(player);
	let movesStr = JSON.stringify(moves);

	return gameTemplate(playerStr, movesStr, renderedReact);
}

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

function gameTemplate(playerStr, movesStr, renderedReact) {
	let pageHeader = header();
	let pageTitle = title();
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
	</script>
	<!-- initial rendering done server-side for speed -->
	<div id="root">${renderedReact}</div>
	<!-- client-side rendering for interactivity -->
	<script src="/public/browser.js"></script>
</body>
</html>`);
}

module.exports = template;
