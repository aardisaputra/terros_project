type Game = {
  board: string[][];
  currentPlayer: "white" | "black";
  isGameOver: boolean;
};

const handleMove = (
  game: Game,
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean => {
  const { board, currentPlayer } = game;
  const piece = board[from.row][from.col];

  // Check if it's the current player's turn
  if (
    (currentPlayer === "white" && piece.toUpperCase() !== piece) ||
    (currentPlayer === "black" && piece.toLowerCase() !== piece)
  ) {
    return false; // Not the player's turn
  }

  // Apply the move
  const targetPiece = board[to.row][to.col];
  board[to.row][to.col] = board[from.row][from.col];
  board[from.row][from.col] = "";

  // Check if the move results in capturing the opposing king
  if (targetPiece.toLowerCase() === "k") {
    console.log(`${currentPlayer} wins!`);
    game.isGameOver = true;
    return true;
  }

  // Switch turn
  game.currentPlayer = currentPlayer === "white" ? "black" : "white";

  return true;
};

describe("Chess Game Tests", () => {
  let game: Game;

  beforeEach(() => {
    // Set up a new game state before each test
    game = {
      board: [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"],
      ],
      currentPlayer: "white",
      isGameOver: false,
    };
  });

  test("valid move: white pawn moves forward", () => {
    const moveResult = handleMove(
      game,
      { row: 6, col: 4 }, // e2
      { row: 5, col: 4 } // e3
    );
    expect(moveResult).toBe(true);
    expect(game.board[5][4]).toBe("P");
    expect(game.board[6][4]).toBe("");
    expect(game.currentPlayer).toBe("black");
  });

  test("invalid move: black tries to move during white turn", () => {
    const moveResult = handleMove(
      game,
      { row: 1, col: 4 }, // e7
      { row: 2, col: 4 } // e6
    );
    expect(moveResult).toBe(false);
    expect(game.board[1][4]).toBe("p");
    expect(game.currentPlayer).toBe("white");
  });

  test("game over: white captures black king", () => {
    game.board[0][4] = "k"; // Black king in position
    const moveResult = handleMove(
      game,
      { row: 6, col: 4 }, // e2
      { row: 0, col: 4 } // e8 (capture black king)
    );
    expect(moveResult).toBe(true);
    expect(game.board[0][4]).toBe("P");
    expect(game.isGameOver).toBe(true);
  });

  test("invalid move: piece tries to move out of bounds", () => {
    const moveResult = handleMove(
      game,
      { row: 0, col: 0 }, // a8
      { row: -1, col: 0 } // Invalid position
    );
    expect(moveResult).toBe(false);
  });
});
