const Player = {
	ONE: "p1",
	TWO: "p2",
}

var Battle = {
	WIN: "win",
	TIE: "tie",
	LOSE: "lose",
	GAME_WIN: "game",
}

const Rank = {
	SPY: "S",
	TWO: "2",
	THREE: "3",
	FOUR: "4",
	FIVE: "5",
	SIX: "6",
	SEVEN: "7",
	EIGHT: "8",
	NINE: "9",
	TEN: "10",
	BOMB: "B",
	FLAG: "F",
}

function Piece(rank, player) {
	this.rank = rank;
	this.player = player;
	this.movable = rank !== Rank.FLAG && rank !== Rank.BOMB;
}

function Square(enterable, piece) {
	this.enterable = enterable;
	this.piece = piece;
}

module.exports = {
	Player: Player,
	Battle: Battle,
	Rank: Rank,
	Piece: Piece,
	Square: Square,
}
