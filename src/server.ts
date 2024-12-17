import { WebSocketServer, WebSocket } from "ws";

type Player = {
  socket: WebSocket;
  color: "white" | "black";
};

type Game = {
  white: WebSocket;
  black: WebSocket;
  board: string[][];
  currentPlayer: "white" | "black";
};

const PORT = 8080;
const server = new WebSocketServer({ port: PORT });
console.log(`WebSocket server is running on ws://localhost:${PORT}`);

let numPlayersConnected = 0;
let whitePlayer: Player | null = null;
let blackPlayer: Player | null = null;

// helper functions
const createInitialBoard = (): string[][] => {
  return [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];
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
    return true;
  }

  // Switch turn
  game.currentPlayer = currentPlayer === "white" ? "black" : "white";

  return true;
};

const calculatePossibleMoves = (
  board: string[][],
  fromRow: number,
  fromCol: number
): { row: number; col: number }[] => {
  const piece = board[fromRow][fromCol];
  const moves: { row: number; col: number }[] = [];
  const isWhite = piece === piece.toUpperCase(); // Capital letters for white pieces
  const directions = {
    rook: [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ],
    bishop: [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ],
    knight: [
      { row: -2, col: -1 },
      { row: -2, col: 1 },
      { row: -1, col: -2 },
      { row: -1, col: 2 },
      { row: 1, col: -2 },
      { row: 1, col: 2 },
      { row: 2, col: -1 },
      { row: 2, col: 1 },
    ],
    king: [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ],
  };

  const isValidMove = (row: number, col: number): boolean =>
    row >= 0 &&
    row < 8 &&
    col >= 0 &&
    col < 8 &&
    (board[row][col] === "" ||
      isWhite !== (board[row][col] === board[row][col].toUpperCase()));

  if (piece.toLowerCase() === "p") {
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    if (board[fromRow + direction][fromCol] === "") {
      moves.push({ row: fromRow + direction, col: fromCol });

      // Double move on the pawn's first move
      if (
        fromRow === startRow &&
        board[fromRow + 2 * direction][fromCol] === ""
      ) {
        moves.push({ row: fromRow + 2 * direction, col: fromCol });
      }
    }

    // Capturing diagonally
    if (
      isValidMove(fromRow + direction, fromCol - 1) &&
      board[fromRow + direction][fromCol - 1] !== ""
    ) {
      moves.push({ row: fromRow + direction, col: fromCol - 1 });
    }
    if (
      isValidMove(fromRow + direction, fromCol + 1) &&
      board[fromRow + direction][fromCol + 1] !== ""
    ) {
      moves.push({ row: fromRow + direction, col: fromCol + 1 });
    }
  }

  // Rook movement logic
  if (piece.toLowerCase() === "r") {
    for (const direction of directions.rook) {
      let row = fromRow + direction.row;
      let col = fromCol + direction.col;

      while (isValidMove(row, col)) {
        moves.push({ row, col });
        if (board[row][col] !== "") break;
        row += direction.row;
        col += direction.col;
      }
    }
  }

  // Bishop movement logic
  if (piece.toLowerCase() === "b") {
    for (const direction of directions.bishop) {
      let row = fromRow + direction.row;
      let col = fromCol + direction.col;

      while (isValidMove(row, col)) {
        moves.push({ row, col });
        if (board[row][col] !== "") break;
        row += direction.row;
        col += direction.col;
      }
    }
  }

  // Queen movement
  if (piece.toLowerCase() === "q") {
    for (const direction of [...directions.rook, ...directions.bishop]) {
      let row = fromRow + direction.row;
      let col = fromCol + direction.col;

      while (isValidMove(row, col)) {
        moves.push({ row, col });
        if (board[row][col] !== "") break;
        row += direction.row;
        col += direction.col;
      }
    }
  }

  // Knight movement logic
  if (piece.toLowerCase() === "n") {
    for (const direction of directions.knight) {
      const row = fromRow + direction.row;
      const col = fromCol + direction.col;

      if (isValidMove(row, col)) {
        moves.push({ row, col });
      }
    }
  }

  // King movement logic
  if (piece.toLowerCase() === "k") {
    for (const direction of directions.king) {
      const row = fromRow + direction.row;
      const col = fromCol + direction.col;

      if (isValidMove(row, col)) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
};

const sendTurnNotification = (game: Game) => {
  const currentPlayerSocket =
    game.currentPlayer === "white" ? game.white : game.black;

  currentPlayerSocket.send(
    JSON.stringify({
      type: "your_turn",
      message: "It's your turn!",
      board: game.board,
    })
  );
};

// player connection handler
server.on("connection", (socket: WebSocket) => {
  if (numPlayersConnected == 0) {
    console.log("Player 1 (White) connected!");
    whitePlayer = { socket, color: "white" };

    socket.send(
      JSON.stringify({ type: "info", message: "Waiting for an opponent..." })
    );
    numPlayersConnected++;
  } else if (numPlayersConnected == 1) {
    if (!whitePlayer) {
      socket.close(1011, "Server error: White player is missing.");
      return;
    }

    console.log("Player 2 (Black) connected!");
    blackPlayer = { socket, color: "black" };

    const newGame: Game = {
      white: whitePlayer.socket,
      black: blackPlayer.socket,
      board: createInitialBoard(),
      currentPlayer: "white",
    };

    whitePlayer.socket.send(
      JSON.stringify({
        type: "game_start",
        message: "Game started! You are white.",
        color: "white",
        board: newGame.board,
      })
    );

    blackPlayer.socket.send(
      JSON.stringify({
        type: "game_start",
        message: "Game started! You are black.",
        color: "black",
        board: newGame.board,
      })
    );

    // Player message handler
    const handlePlayerMessage = (playerSocket: WebSocket) => {
      playerSocket.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "select_piece") {
          const { row, col } = message;
          const possibleMoves = calculatePossibleMoves(newGame.board, row, col);

          playerSocket.send(
            JSON.stringify({ type: "possible_moves", moves: possibleMoves })
          );
        } else if (message.type === "move") {
          const { from, to } = message;

          if (
            (newGame.currentPlayer === "white" &&
              playerSocket === newGame.white) ||
            (newGame.currentPlayer === "black" &&
              playerSocket === newGame.black)
          ) {
            if (handleMove(newGame, from, to)) {
              sendTurnNotification(newGame);
            } else {
              playerSocket.send(
                JSON.stringify({
                  type: "error",
                  message: "Invalid move.",
                })
              );
            }
          } else {
            playerSocket.send(
              JSON.stringify({
                type: "error",
                message: "It's not your turn.",
              })
            );
          }
        }
      });
    };

    handlePlayerMessage(newGame.white);
    handlePlayerMessage(newGame.black);

    whitePlayer.socket.send(
      JSON.stringify({
        type: "your_turn",
        message: "It's your turn",
        board: newGame.board,
      })
    );

    numPlayersConnected++;
  } else {
    socket.send(
      JSON.stringify({
        type: "error",
        message: "The game is currently full. Please try again later.",
      })
    );

    socket.close(1008, "Game is full");
  }

  socket.on("close", () => {
    console.log("Player disconnected!");
    if (socket === whitePlayer?.socket) {
      whitePlayer = null;
    } else if (socket === blackPlayer?.socket) {
      blackPlayer = null;
    }
    numPlayersConnected--;
  });
});
