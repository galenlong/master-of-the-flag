let io = require('socket.io-client');
var socket = io();

function createLinkMessage(url) {
	var message = document.createElement("p");

	var link = document.createElement("a");
	link.href = url;
	link.textContent = url;
	
	var br = document.createElement("br");
	var text1 = document.createTextNode("This is your game link. Visit it to start playing:");
	var text2 = document.createTextNode("Send this link to your second player. The first person (other than you) to visit this link will become Player 2! This cannot be undone, so make sure you send the link to the right person (if you mess up, you can just create a new game).");
	
	message.appendChild(text1);
	message.appendChild(document.createElement("br"));
	message.appendChild(link);
	message.appendChild(document.createElement("br"));
	message.appendChild(text2);

	return message;
}

var button = document.getElementById("create");
button.addEventListener("click", function (ev) {
	socket.emit("create");
});

socket.on("created", function (dataJSON) {
	var data = JSON.parse(dataJSON);
	// TODO change to store player ID
	document.cookie = data.gameId + "=" + data.playerId;
	console.log('document.cookie = "' + data.gameId + '=2"');

	var feedback = document.getElementById("feedback");
	var message = createLinkMessage(data.url);
	feedback.removeChild(button);
	feedback.removeChild(document.getElementById("instructions"));
	feedback.appendChild(message);
});
