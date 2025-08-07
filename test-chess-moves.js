const { Chess } = require('chess.js');

// Position with pawn on e7 - King NOT blocking e8!
const chess = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");

console.log("Current FEN:", chess.fen());
console.log("Board:");
console.log(chess.ascii());

// Get all legal moves
const moves = chess.moves({ verbose: true });
console.log("\nAll legal moves:");
moves.forEach(m => {
  console.log(`  ${m.san}: from ${m.from} to ${m.to}${m.promotion ? ' promotion=' + m.promotion : ''}`);
});

// Try different ways to make the promotion move
console.log("\n--- Testing different move formats ---");

// Test 1: SAN notation
try {
  const chess1 = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");
  const move1 = chess1.move("e8=Q");
  console.log("✓ SAN 'e8=Q' worked:", move1);
} catch (e) {
  console.log("✗ SAN 'e8=Q' failed:", e.message);
}

// Test 2: Simple SAN
try {
  const chess2 = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");
  const move2 = chess2.move("e8Q");
  console.log("✓ SAN 'e8Q' worked:", move2);
} catch (e) {
  console.log("✗ SAN 'e8Q' failed:", e.message);
}

// Test 3: Object notation
try {
  const chess3 = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");
  const move3 = chess3.move({ from: "e7", to: "e8", promotion: "q" });
  console.log("✓ Object notation worked:", move3);
} catch (e) {
  console.log("✗ Object notation failed:", e.message);
}

// Test 4: Without promotion field (should auto-promote to queen)
try {
  const chess4 = new Chess("3k4/4P3/4K3/8/8/8/8/8 w - - 0 1");
  const move4 = chess4.move({ from: "e7", to: "e8" });
  console.log("✓ Object without promotion worked:", move4);
} catch (e) {
  console.log("✗ Object without promotion failed:", e.message);
}