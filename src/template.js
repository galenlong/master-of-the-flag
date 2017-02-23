
function template(renderedReact, player, moves) {
	// inject moves so far/player into global window object
	// so client-side rendering can pass them as component props
	// and client state will match server state
	var playerStr = JSON.stringify(player);
	var movesStr = JSON.stringify(moves);

	return (
`<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<link rel="stylesheet" type="text/css" href="public/style.css"/>
	<title>capture the flag</title>
</head>
<body>
	<h1>stratego</h1>
	<script>
		// game state injected server-side
		window.player = JSON.parse('${playerStr}');
		window.moves = JSON.parse('${movesStr}');
	</script>
	<!-- initial rendering done server-side for speed -->
	<div id="root">${renderedReact}</div>
	<!-- client-side rendering for interactivity -->
	<script src="public/browser.js"></script>
</body>
</html>`);
}

module.exports = template;
