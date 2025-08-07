const { Chess } = require('chess.js');

console.log("Testing the actual game sequence from train/1:\n");

// Starting position from train/1
const chess = new Chess("4k3/8/4K3/4P3/8/8/8/8 w - - 0 1");
console.log("Starting position:");
console.log(chess.ascii());

const moves = [
  { white: "Kd6", black: "Kf7" },
  { white: "Kd7", black: "Kf8" },
  { white: "e6", black: "Kg8" },
  { white: "e7", black: "Kf7" },
  { white: "e8=Q+", black: null }
];

let moveNum = 1;
for (const movePair of moves) {
  console.log(`\n${moveNum}. ${movePair.white} ${movePair.black || ''}`);
  
  // White move
  try {
    const whiteMove = chess.move(movePair.white);
    console.log(`  White plays ${whiteMove.san}`);
    if (whiteMove.promotion) {
      console.log(`  *** PROMOTION DETECTED: ${whiteMove.promotion} ***`);
    }
  } catch (e) {
    console.log(`  ERROR: White cannot play ${movePair.white} - ${e.message}`);
    console.log("  Current position:");
    console.log(chess.ascii());
    console.log("  Legal moves:", chess.moves());
    break;
  }
  
  // Black move
  if (movePair.black) {
    try {
      const blackMove = chess.move(movePair.black);
      console.log(`  Black plays ${blackMove.san}`);
    } catch (e) {
      console.log(`  ERROR: Black cannot play ${movePair.black} - ${e.message}`);
      console.log("  Current position:");
      console.log(chess.ascii());
      console.log("  Legal moves:", chess.moves());
      break;
    }
  }
  
  moveNum++;
}

console.log("\nFinal position:");
console.log(chess.ascii());
console.log("FEN:", chess.fen());