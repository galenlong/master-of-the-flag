//
// model objects
//

//
// enums
//

// TODO make event name enum

import assert from "assert";

const Player = {
  ONE: "Player 1",
  TWO: "Player 2",
  BOTH: "both", // for game won ties
  getPlayers() {
    return [Player.ONE, Player.TWO];
  },
  opposite(player) {
    if (player === Player.ONE) {
      return Player.TWO;
    }
    if (player === Player.TWO) {
      return Player.ONE;
    }
    return Player.BOTH;
  }
};

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
  FLAG: "F"
};

// TODO remove Piece.movable
// TODO wrap this export in an object? include in separate module?
function isRankMovable(rank) {
  return rank !== Rank.BOMB && rank !== Rank.FLAG;
}

const StartingRankAmounts = {
  [Rank.SPY]: 1,
  [Rank.TWO]: 8,
  [Rank.THREE]: 5,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 4,
  [Rank.SIX]: 4,
  [Rank.SEVEN]: 3,
  [Rank.EIGHT]: 2,
  [Rank.NINE]: 1,
  [Rank.TEN]: 1,
  [Rank.BOMB]: 6,
  [Rank.FLAG]: 1
};

const Battle = {
  WIN: "win",
  TIE: "tie",
  LOSE: "lose",
  battle(attackerRank, defenderRank) {
    assert(isRankMovable(attackerRank), "attackerRank must be movable");

    if (attackerRank === defenderRank) {
      return Battle.TIE;
    }

    // non-numeric battle results for spy, flag, bomb
    // attacker will never be flag or bomb
    if (defenderRank === Rank.FLAG) {
      return Battle.WIN;
    }
    if (defenderRank === Rank.BOMB) {
      // only 3s beat bombs
      return attackerRank === Rank.THREE ? Battle.WIN : Battle.LOSE;
    }
    if (defenderRank === Rank.SPY) {
      // ties already accounted for, attacker always beats spies
      return Battle.WIN;
    }
    if (attackerRank === Rank.SPY) {
      // ties already accounted for, spies only beat 10s on attack
      return defenderRank == Rank.TEN ? Battle.WIN : Battle.LOSE;
    }

    // numeric battle results
    if (parseInt(attackerRank, 10) > parseInt(defenderRank, 10)) {
      return Battle.WIN;
    }
    // less than, ties already accounted for
    return Battle.LOSE;
  }
};

const MoveCode = {
  NORMAL: 0,
  SPRINT: 1,
  INVALID: 2,
  isValid(code) {
    return code === MoveCode.NORMAL || code === MoveCode.SPRINT;
  }
};

const WinReason = {
  FLAG_CAPTURED: "flag captured",
  NO_MOVABLE_PIECES: "no movable pieces",
  NO_VALID_MOVES: "no valid moves"
};

const Direction = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
  NONE: "none",
  getDirections() {
    return [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  }
};

const Mode = {
  SETUP: "setup",
  PLAY: "play"
};

const SetupState = {
  SETTING_UP: "setting up",
  CONFIRMING: "confirming",
  CONFIRMED: "confirmed"
};

//
// constructors
//

function Piece(rank, player) {
  this.rank = rank;
  this.player = player;
  this.revealed = false;
  this.moved = false;
  this.movable = rank !== Rank.FLAG && rank !== Rank.BOMB;
}

function Square(enterable, piece = null) {
  this.enterable = enterable;
  this.piece = piece;
}

//
// static board utility functions
// static b/c we don't want react setState to manipulate an
// entire Board object every time we change a cell;
// the React component merely stores a 2D board array
// and passes that array to these static functions
//

class Board {
  //
  // accessors
  //

  static getSquare(board, position) {
    if (!position) {
      // b/c I forget these methods are static...
      throw "you forgot to pass the board again";
    }

    const numRows = board.length;
    const numCols = board[0].length; // board is square

    if (
      position.row >= 0 &&
      position.row < numRows &&
      position.col >= 0 &&
      position.col < numCols
    ) {
      return board[position.row][position.col];
    }
    // return null if out of bounds
    return null;
  }

  static getPiece(board, position) {
    if (!position) {
      // b/c I forget these methods are static...
      throw "you forgot to pass the board again";
    }
    const square = Board.getSquare(board, position);
    return square.piece;
  }

  // instead of returning a list of positions like getPositionsBetween
  // returns an object for O(1) existence checking
  // e.g. [[0, 'a'], [0, 'b'], [1, 'a'], [2, 'c']] ->
  // {0: {'a': true, 'b': true}, 1: {'a': true}, 2: {'c': true}}
  static getLookupPositionsBetween(lastMove, includeStart, includeEnd) {
    const { start } = lastMove;
    const { end } = lastMove;

    // can't use Set built-in because it uses reference equality
    const set = {};
    const positions = Board.getPositionsBetween(
      start,
      end,
      includeStart,
      includeEnd
    );

    for (const position of positions) {
      const { row } = position;
      const { col } = position;
      if (!set.hasOwnProperty(row)) {
        set[row] = {};
      }
      set[row][col] = true;
    }
    return set;
  }

  static isPairInLookup(lookup, pair) {
    const row = pair[0];
    const col = pair[1];
    // !! so we return false instead of undefined if not in lookup
    return !!(lookup[row] && lookup[row][col]);
  }

  static getPositionsBetween(start, end, includeStart, includeEnd) {
    if (!start || !end) {
      return [];
    }

    const direction = Board.getDirection(start, end);
    const startOffset = includeStart ? 0 : 1;
    const endOffset = includeEnd ? 0 : 1;
    let startIdx;
    let endIdx;
    let fixed;
    let differentRows;
    switch (direction) {
      case Direction.UP:
        startIdx = end.row + endOffset;
        endIdx = start.row - startOffset;
        fixed = start.col;
        differentRows = true;
        break;
      case Direction.DOWN:
        startIdx = start.row + startOffset;
        endIdx = end.row - endOffset;
        fixed = start.col;
        differentRows = true;
        break;
      case Direction.LEFT:
        startIdx = end.col + endOffset;
        endIdx = start.col - startOffset;
        fixed = start.row;
        differentRows = false;
        break;
      case Direction.RIGHT:
        startIdx = start.col + startOffset;
        endIdx = end.col - endOffset;
        fixed = start.row;
        differentRows = false;
        break;
      default:
        break;
    }

    const positions = [];
    for (let unfixed = startIdx; unfixed <= endIdx; unfixed++) {
      if (differentRows) {
        positions.push({ row: unfixed, col: fixed });
      } else {
        positions.push({ row: fixed, col: unfixed });
      }
    }

    return positions;
  }

  static getDirection(start, end) {
    // TODO will return up when positions are same
    if (start.row === end.row) {
      if (start.col < end.col) {
        return Direction.RIGHT;
      }
      return Direction.LEFT;
    } else if (start.row < end.row) {
      return Direction.DOWN;
    } else {
      return Direction.UP;
    }
  }

  static getAdjacentPositions(board, pos) {
    return {
      above: { row: pos.row - 1, col: pos.col },
      below: { row: pos.row + 1, col: pos.col },
      left: { row: pos.row, col: pos.col - 1 },
      right: { row: pos.row, col: pos.col + 1 }
    };
  }

  static getPlayerMoves(lastSixMoves, player) {
    return lastSixMoves.filter(function(d) {
      return d.player === player;
    });
  }

  //
  // set board state
  // all set functions modify board argument, so to preserve
  // immutability, pass them a copy
  // they don't make copies themselves b/c then several copies
  // may be made if one set func calls other set funcs
  //

  static setPiece(board, position, piece) {
    board[position.row][position.col].piece = piece;
  }

  static setPieceMoved(board, position) {
    board[position.row][position.col].piece.moved = true;
  }

  static setPieceVisible(board, position) {
    board[position.row][position.col].piece.revealed = true;
  }

  static setClearPiece(board, position) {
    board[position.row][position.col].piece = null;
  }

  static setSwapPieces(board, previousPos, selectedPos) {
    const previousPiece = Board.getPiece(board, previousPos);
    const selectedPiece = Board.getPiece(board, selectedPos);
    Board.setPiece(board, previousPos, selectedPiece);
    Board.setPiece(board, selectedPos, previousPiece);
  }

  static setMove(board, previousPos, selectedPos, moveCode) {
    // auto reveal scouts on sprint
    if (moveCode === MoveCode.SPRINT) {
      Board.setPieceVisible(board, previousPos);
    }
    Board.setPieceMoved(board, previousPos);
    Board.setSwapPieces(board, previousPos, selectedPos);
  }

  static setBattle(board, previousPos, selectedPos) {
    const attacker = Board.getPiece(board, previousPos);
    const defender = Board.getPiece(board, selectedPos);
    const result = Battle.battle(attacker.rank, defender.rank);

    switch (result) {
      case Battle.WIN: // selected dies, previous moved/revealed
        Board.setPieceMoved(board, previousPos);
        Board.setPieceVisible(board, previousPos);
        Board.setClearPiece(board, selectedPos);
        Board.setSwapPieces(board, previousPos, selectedPos);
        break;
      case Battle.TIE: // both die
        Board.setClearPiece(board, previousPos);
        Board.setClearPiece(board, selectedPos);
        break;
      case Battle.LOSE: // previous dies, selected revealed
        Board.setClearPiece(board, previousPos);
        Board.setPieceVisible(board, selectedPos);
        break;
    }

    return {
      attacker,
      defender,
      result
    };
  }

  //
  // validity checks
  //

  static isSquareEmpty(square) {
    if (square.piece) {
      return false;
    }
    return true;
  }

  static areMovesEqual(m1, m2) {
    return (
      m1.start.row === m2.start.row &&
      m1.start.col === m2.start.col &&
      m1.end.row === m2.end.row &&
      m1.end.col === m2.end.col
    );
  }

  static isValidSetupSelection(position, player) {
    if (player === Player.ONE) {
      return position.row >= 6;
    }
    return position.row <= 3;
  }

  // TODO move to separate click event handling section
  static isValidFirstSelection(board, position, player) {
    const piece = Board.getPiece(board, position);
    if (piece && isRankMovable(piece.rank) && piece.player === player) {
      return true;
    }
    return false;
  }

  static isValidMove(board, previousPos, selectedPos) {
    const [p, s] = [previousPos, selectedPos];
    const square = Board.getSquare(board, s);
    const piece = Board.getPiece(board, p);

    assert(piece !== null, "must have piece at previousPos");

    // can't move to same space
    if (p.row === s.row && p.col === s.col) {
      return MoveCode.INVALID;
    }

    if (Board.canPieceEnterSquare(piece, square)) {
      if (Board.isEdgeAdjacent(p, s)) {
        return MoveCode.NORMAL;
      }
      if (Board.isValidSprint(board, p, s, piece.rank)) {
        return MoveCode.SPRINT;
      }
    }
    return MoveCode.INVALID;
  }

  static isValidSprint(board, previousPos, selectedPos, rank) {
    const p = previousPos;
    const s = selectedPos;

    if (rank !== Rank.TWO) {
      return false;
    }
    // must be straight line
    if (p.row !== s.row && p.col !== s.col) {
      return false;
    }

    // all squares in-b/w must be empty/enterable
    // don't need to check if we can enter last square b/c this func
    // is only called from isValidMove which does that for us
    const positions = Board.getPositionsBetween(p, s, false, false);
    for (const position of positions) {
      const square = Board.getSquare(board, position);
      if (!square.enterable || square.piece) {
        return false;
      }
    }

    return true;
  }

  static isCycle(lastThreeMoves, move) {
    return (
      lastThreeMoves.length >= 3 &&
      Board.areMovesEqual(lastThreeMoves[0], lastThreeMoves[2]) &&
      Board.areMovesEqual(lastThreeMoves[1], move)
    );
  }

  static isEdgeAdjacent(m1, m2) {
    const adjacent =
      m1.row >= m2.row - 1 &&
      m1.row <= m2.row + 1 &&
      (m1.col >= m2.col - 1 && m1.col <= m2.col + 1);
    const diagonal = m1.row !== m2.row && m1.col !== m2.col;
    return adjacent && !diagonal;
  }

  static canPieceEnterSquare(
    piece,
    square,
    lastSixMoves = undefined,
    move = undefined
  ) {
    // if optional args lastSixMoves/move, does cycle detection
    let isCycle = false;
    if (lastSixMoves && move) {
      const playerMoves = Board.getPlayerMoves(lastSixMoves, piece.player);
      isCycle = Board.isCycle(playerMoves, move);
    }

    if (
      !isCycle &&
      square &&
      square.enterable &&
      piece.movable &&
      (Board.isSquareEmpty(square) || square.piece.player !== piece.player)
    ) {
      return true;
    }
    return false;
  }

  static movablePieceHasMove(board, position, lastSixMoves) {
    const piece = Board.getPiece(board, position);
    const directions = ["above", "below", "left", "right"];
    const adjPositions = Board.getAdjacentPositions(board, position);

    for (const d of directions) {
      const adjPosition = adjPositions[d];
      const adjSquare = Board.getSquare(board, adjPosition);
      const move = { start: position, end: adjPosition };
      // found valid acyclic move
      if (Board.canPieceEnterSquare(piece, adjSquare, lastSixMoves, move)) {
        return true;
      }
    }
    return false;
  }

  //
  // check if game won
  //

  // this function does multiple things at once b/c it's faster
  static getWinStats(board, lastSixMoves) {
    const numRows = board.length;
    const numCols = board[0].length; // board is square

    let p1HasFlag = false;
    let p2HasFlag = false;
    let p1HasMovablePiece = false;
    let p2HasMovablePiece = false;
    let p1HasValidMove = false;
    let p2HasValidMove = false;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (
          p1HasMovablePiece &&
          p2HasMovablePiece &&
          p1HasValidMove &&
          p2HasValidMove &&
          p1HasFlag &&
          p2HasFlag
        ) {
          break; // no more checks needed
        }

        const position = { row, col };
        const piece = Board.getPiece(board, position);

        if (!piece) {
          continue;
        }

        // found flag
        if (piece.rank === Rank.FLAG) {
          if (piece.player === Player.ONE) {
            p1HasFlag = true;
          } else {
            p2HasFlag = true;
          }
        }
        // found movable piece
        else if (piece.movable) {
          const hasMove = Board.movablePieceHasMove(
            board,
            position,
            lastSixMoves
          );
          if (piece.player === Player.ONE) {
            p1HasMovablePiece = true;
            if (hasMove) {
              p1HasValidMove = true;
            }
          } else {
            p2HasMovablePiece = true;
            if (hasMove) {
              p2HasValidMove = true;
            }
          }
        }
      }
    }

    if (!p1HasFlag && !p2HasFlag) {
      throw "impossible: neither player has flag";
    }

    return {
      p1HasFlag,
      p2HasFlag,
      p1HasMovablePiece,
      p2HasMovablePiece,
      p1HasValidMove,
      p2HasValidMove
    };
  }

  static whoWonGameWhy(board, lastSixMoves, turn) {
    const result = Board.getWinStats(board, lastSixMoves);

    if (!result.p1HasFlag) {
      return { who: Player.TWO, why: WinReason.FLAG_CAPTURED };
    }
    if (!result.p2HasFlag) {
      return { who: Player.ONE, why: WinReason.FLAG_CAPTURED };
    }

    // must check for has movable piece before has valid move
    // b/c if both are false, there aren't valid moves
    // *b/c* there are no valid pieces, so this is the real reason
    if (!result.p1HasMovablePiece && !result.p2HasMovablePiece) {
      return { who: Player.BOTH, why: WinReason.NO_MOVABLE_PIECES };
    }
    if (!result.p1HasMovablePiece) {
      return { who: Player.TWO, why: WinReason.NO_MOVABLE_PIECES };
    }
    if (!result.p2HasMovablePiece) {
      return { who: Player.ONE, why: WinReason.NO_MOVABLE_PIECES };
    }

    // player can only lose from no valid moves during their turn
    // b/c otherwise we'd prematurely end game in this situation:
    // 5 B (3)
    // B   4 (4)
    // p1's 4 takes p2's 4
    // if we didn't check turns, we'd say p1 lost b/c no moves left
    // but if p2 captured bomb w/ 3, then p1 would have a valid move
    // by the start of their next turn
    if (!result.p1HasValidMove && !result.p2HasValidMove) {
      return { who: Player.BOTH, why: WinReason.NO_VALID_MOVES };
    }
    if (!result.p1HasValidMove && turn === Player.ONE) {
      return { who: Player.TWO, why: WinReason.NO_VALID_MOVES };
    }
    if (!result.p2HasValidMove && turn === Player.TWO) {
      return { who: Player.ONE, why: WinReason.NO_VALID_MOVES };
    }

    // null if game not won yet
    return null;
  }

  //
  // initial setup
  //

  static createBoard(numRows = 10, numCols = 10) {
    const board = [];

    for (let i = numRows; i--; ) {
      const row = [];
      for (let j = numCols; j--; ) {
        const square = new Square(true);
        row.push(square);
      }
      board.push(row);
    }

    return board;
  }

  static getEmptyBoard() {
    const board = Board.createBoard();

    // two central lakes are unenterable
    const unenterable = [
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 6 },
      { row: 4, col: 7 },
      { row: 5, col: 2 },
      { row: 5, col: 3 },
      { row: 5, col: 6 },
      { row: 5, col: 7 }
    ];
    for (let i = unenterable.length; i--; ) {
      const position = unenterable[i];
      board[position.row][position.col].enterable = false;
    }

    return board;
  }

  static getAllStartingRanks() {
    const ranks = [];
    for (const rank in Rank) {
      for (let i = 0; i < StartingRankAmounts[Rank[rank]]; i++) {
        ranks.push(Rank[rank]);
      }
    }
    return ranks;
  }

  static getRandomPieceOrder(allRanks, player) {
    const indicies = Array(allRanks.length)
      .fill(0)
      .map((_, index) => index);
    const randomOrder = () => Math.random() * 2 - 1;
    const pieceOrder = indicies.slice().sort(randomOrder);

    const pieces = [];
    for (const index of pieceOrder) {
      const rank = allRanks[index];
      pieces.push(new Piece(rank, player));
    }
    return pieces;
  }

  static getInitialSetup() {
    const allRanks = Board.getAllStartingRanks();
    const p1Pieces = Board.getRandomPieceOrder(allRanks, Player.ONE);
    const p2Pieces = Board.getRandomPieceOrder(allRanks, Player.TWO);
    const board = Board.getEmptyBoard();

    // populate top with player 2 pieces in random order
    let index = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < board[0].length; j++) {
        board[i][j].piece = p2Pieces[index];
        index++;
      }
    }

    // populate bottom with player 1 pieces in random order
    index = 0;
    for (let i = 6; i < 10; i++) {
      for (let j = 0; j < board[0].length; j++) {
        board[i][j].piece = p1Pieces[index];
        index++;
      }
    }

    return board;
  }

  //
  // debugging
  //

  static pprintRaw(board) {
    const numRows = board.length;
    const numCols = board[0].length; // board is square

    let rowCount = 0;
    let colCount = 0;

    let str = "\n   ";
    for (let i = 0; i < numRows; i++) {
      str += `   ${i}   `;
    }
    str += "\n";

    for (const row of board) {
      str += `${rowCount} [`;
      for (const square of row) {
        const { piece } = square;
        let text = "      ";
        if (!square.enterable) {
          text = "xxxxxx";
        } else if (piece) {
          text = piece.rank;

          let isPlayerOne = " ";
          if (piece.player === Player.ONE) {
            isPlayerOne = "/";
          }
          let didMove = " ";
          if (piece.moved) {
            didMove = ".";
          }
          let isVisible = " ";
          if (piece.visible) {
            isVisible = "*";
          }
          text += isPlayerOne + didMove + isVisible;

          if (piece.rank.length > 1) {
            text = ` ${text}`;
          } else {
            text = ` ${text} `;
          }
        }
        str += text;

        if (colCount < numCols - 1) {
          str += ",";
        }
        colCount++;
      }
      str += "]\n";
      colCount = 0;
      rowCount++;
    }

    return str;
  }

  static pprint(board) {
    console.log(Board.pprintRaw(board));
  }
}

function createTestBoard(pieces) {
  // 10 x 10 stratego board
  const board = [];
  const n = 10;
  for (let i = n; i--; ) {
    const row = [];
    for (let j = n; j--; ) {
      const square = new Square(true, null);
      row.push(square);
    }
    board.push(row);
  }

  // two central lakes are unenterable
  const unenterable = [
    { row: 4, col: 2 },
    { row: 4, col: 3 },
    { row: 4, col: 6 },
    { row: 4, col: 7 },
    { row: 5, col: 2 },
    { row: 5, col: 3 },
    { row: 5, col: 6 },
    { row: 5, col: 7 }
  ];
  for (let i = unenterable.length; i--; ) {
    const position = unenterable[i];
    board[position.row][position.col].enterable = false;
  }

  // place test pieces
  for (const data of pieces) {
    const piece = new Piece(data.rank, data.player);
    board[data.row][data.col].piece = piece;
  }

  return board;
}

function somePieces() {
  // return [
  // 	{row: 0, col: 0, rank: Rank.SPY,	player: Player.ONE},
  // 	{row: 0, col: 1, rank: Rank.FIVE,	player: Player.ONE},
  // 	{row: 0, col: 2, rank: Rank.FLAG,	player: Player.TWO},
  // 	{row: 0, col: 3, rank: Rank.THREE,	player: Player.ONE},
  // 	{row: 0, col: 4, rank: Rank.TWO,	player: Player.ONE},
  // 	{row: 0, col: 6, rank: Rank.TEN,	player: Player.TWO},
  // 	{row: 0, col: 7, rank: Rank.FLAG,	player: Player.ONE},
  // 	{row: 1, col: 0, rank: Rank.FOUR,	player: Player.ONE},
  // 	{row: 1, col: 2, rank: Rank.SEVEN,	player: Player.ONE},
  // 	{row: 1, col: 3, rank: Rank.BOMB,	player: Player.TWO},
  // 	{row: 1, col: 4, rank: Rank.EIGHT,	player: Player.TWO},
  // 	{row: 1, col: 6, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 1, col: 7, rank: Rank.FIVE,	player: Player.TWO},
  // 	{row: 2, col: 3, rank: Rank.THREE,	player: Player.TWO},
  // 	{row: 5, col: 8, rank: Rank.TWO,	player: Player.ONE},
  // 	{row: 6, col: 2, rank: Rank.TWO,	player: Player.TWO},
  // 	{row: 6, col: 7, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 7, col: 0, rank: Rank.THREE,	player: Player.ONE},
  // 	{row: 8, col: 0, rank: Rank.BOMB,	player: Player.TWO},
  // 	{row: 9, col: 0, rank: Rank.FIVE,	player: Player.TWO},
  // 	{row: 9, col: 1, rank: Rank.BOMB,	player: Player.TWO},
  // 	{row: 9, col: 9, rank: Rank.TWO,	player: Player.ONE},
  // ];

  // // test no moves in beginning of game
  // return [
  // 	{row: 0, col: 0, rank: Rank.SPY,	player: Player.ONE},
  // 	{row: 0, col: 1, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 0, col: 2, rank: Rank.FLAG,	player: Player.TWO},
  // 	{row: 0, col: 6, rank: Rank.TEN,	player: Player.TWO},
  // 	{row: 0, col: 7, rank: Rank.FLAG,	player: Player.ONE},
  // 	{row: 1, col: 0, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 1, col: 3, rank: Rank.BOMB,	player: Player.TWO},
  // 	{row: 1, col: 4, rank: Rank.EIGHT,	player: Player.TWO},
  // 	{row: 1, col: 6, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 1, col: 7, rank: Rank.FIVE,	player: Player.TWO},
  // 	{row: 2, col: 3, rank: Rank.THREE,	player: Player.TWO},
  // 	{row: 6, col: 2, rank: Rank.TWO,	player: Player.TWO},
  // 	{row: 6, col: 7, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 8, col: 0, rank: Rank.BOMB,	player: Player.TWO},
  // 	{row: 9, col: 0, rank: Rank.FIVE,	player: Player.TWO},
  // 	{row: 9, col: 1, rank: Rank.BOMB,	player: Player.TWO},
  // ];

  // // test game win states
  // return [
  // 	// change to bomb to test no movable pieces
  // 	{row: 0, col: 0, rank: Rank.SPY,	player: Player.ONE},
  // 	{row: 0, col: 1, rank: Rank.BOMB,	player: Player.ONE},
  // 	{row: 1, col: 0, rank: Rank.BOMB,	player: Player.ONE},

  // 	{row: 0, col: 2, rank: Rank.FLAG,	player: Player.TWO},
  // 	{row: 0, col: 3, rank: Rank.FOUR,	player: Player.ONE},
  // 	{row: 0, col: 4, rank: Rank.BOMB,	player: Player.TWO},

  // 	// change this to three/four/five to test win/tie/lose
  // 	{row: 1, col: 3, rank: Rank.FOUR,	player: Player.TWO},
  // 	{row: 1, col: 4, rank: Rank.FLAG,	player: Player.ONE},
  // 	{row: 2, col: 3, rank: Rank.BOMB,	player: Player.ONE},

  // 	// change to bomb to test no movable pieces
  // 	{row: 8, col: 0, rank: Rank.BOMB,	player: Player.TWO},
  // 	{row: 9, col: 0, rank: Rank.FIVE,	player: Player.TWO},
  // 	{row: 9, col: 1, rank: Rank.BOMB,	player: Player.TWO},
  // ];

  // test game loss on no moves left because cycle
  return [
    { row: 0, col: 0, rank: Rank.SPY, player: Player.ONE },
    { row: 0, col: 2, rank: Rank.BOMB, player: Player.ONE },
    { row: 0, col: 6, rank: Rank.TEN, player: Player.TWO },
    { row: 0, col: 7, rank: Rank.FLAG, player: Player.ONE },
    { row: 1, col: 0, rank: Rank.BOMB, player: Player.ONE },
    { row: 1, col: 1, rank: Rank.BOMB, player: Player.ONE },
    { row: 1, col: 3, rank: Rank.BOMB, player: Player.TWO },
    { row: 1, col: 4, rank: Rank.EIGHT, player: Player.TWO },
    { row: 1, col: 7, rank: Rank.FIVE, player: Player.TWO },
    { row: 2, col: 1, rank: Rank.THREE, player: Player.TWO },
    { row: 6, col: 2, rank: Rank.BOMB, player: Player.TWO },
    { row: 6, col: 7, rank: Rank.BOMB, player: Player.ONE },
    { row: 9, col: 0, rank: Rank.TWO, player: Player.TWO },
    { row: 9, col: 9, rank: Rank.FLAG, player: Player.TWO }
  ];
}

function getBoard() {
  return createTestBoard(somePieces());
}

//
// exports
//

const nbsp = String.fromCharCode(160);

export {
  nbsp,
  Battle,
  MoveCode,
  WinReason,
  Mode,
  SetupState,
  Player,
  Rank,
  Square,
  Piece,
  Board,
  Direction,
  getBoard
};

// module.exports = {
// 	nbsp: String.fromCharCode(160),
// 	Battle: Battle,
// 	MoveCode: MoveCode,
// 	WinReason: WinReason,
// 	Mode: Mode,
// 	SetupState: SetupState,
// 	Player: Player,
// 	Rank: Rank,
// 	Square: Square,
// 	Piece: Piece,
// 	Board: Board,
// 	Direction: Direction,
// 	getBoard: getBoard,
// }
