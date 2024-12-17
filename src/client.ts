import WebSocket from "ws";
import readline from "readline";

const serverUrl = "ws://localhost:8080";
const socket = new WebSocket(serverUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let board: string[][] = [];
let myColor: "white" | "black" | null = null;
let isMyTurn = false;
let fromRow: number;
let fromCol: number;

const askQuestion = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

const printBoard = (board: string[][]) => {
  console.log("\nCurrent Board:");
  board.forEach((row, rowIndex) => {
    console.log(
      `${8 - rowIndex} ${row
        .map((cell) => (cell === "" ? "." : cell))
        .join(" ")}`
    );
  });
  console.log("  a b c d e f g h\n");
};

socket.on("message", async (data) => {
  const message = JSON.parse(data.toString());

  switch (message.type) {
    case "game_start":
      myColor = message.color;
      board = message.board;
      console.log(message.message);
      printBoard(message.board);
      break;

    case "your_turn":
      console.log(message.message);
      isMyTurn = true;
      board = message.board;
      printBoard(message.board);

      console.log("Select a piece to move (e.g., e2): ");

      rl.on("line", (from) => {
        if (!from || from.length !== 2) {
          console.log("Invalid input. Try again.");
          isMyTurn = false;
          return;
        }

        fromRow = 8 - parseInt(from[1]);
        fromCol = from.charCodeAt(0) - "a".charCodeAt(0);

        socket.send(
          JSON.stringify({
            type: "select_piece",
            row: fromRow,
            col: fromCol,
          })
        );
      });

      break;

    case "possible_moves":
      if (message.moves.length === 0) {
        console.log("No valid moves for this piece. Try another piece.");
        isMyTurn = true;
        return;
      }

      console.log("Possible moves:");
      message.moves.forEach(
        (move: { row: number; col: number }, index: number) =>
          console.log(
            `${index + 1}: ${String.fromCharCode(move.col + 97)}${8 - move.row}`
          )
      );

      const moveIndex = await askQuestion(
        "Select a move by entering its number: "
      ).catch(console.error);

      if (moveIndex == null) {
        console.log("Move index is empty");
        return;
      }

      const move = message.moves[parseInt(moveIndex) - 1];
      if (!move) {
        console.log("Invalid move selection.");
        isMyTurn = true;
        return;
      }

      // Send the move to the server
      socket.send(
        JSON.stringify({
          type: "move",
          from: { row: fromRow, col: fromCol },
          to: { row: move.row, col: move.col },
        })
      );

      isMyTurn = false;
      break;

    case "board_update":
      console.log("Board updated:");
      board = message.board;
      console.table(message.board);
      break;

    case "error":
      console.log("Error:", message.message);
      if (isMyTurn) {
        console.log("Please try again.");
      }
      break;

    case "opponent_move":
      console.log(
        `Opponent moved from ${String.fromCharCode(message.from.col + 97)}${
          8 - message.from.row
        } to ${String.fromCharCode(message.to.col + 97)}${8 - message.to.row}`
      );
      break;

    default:
      console.log("Unknown message from server:", message);
  }
});

socket.on("close", () => {
  console.log("Connection closed by server.");
  rl.close();
});
