
function template(reactBody) {
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
	<div id="root">${reactBody}</div>
	<script src="public/browser.js"></script>
</body>
</html>`);
}


module.exports = template;
