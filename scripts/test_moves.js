const { Chess } = require('chess.js');

// Test the exact position from the E2E test
const chess = new Chess('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');

console.log('=== Position Analysis ===');
console.log('FEN:', chess.fen());
console.log('Current turn:', chess.turn() === 'w' ? 'White' : 'Black');
console.log('White King on e6, Black King on e8');

console.log('\n=== All Legal Moves for White ===');
const allMoves = chess.moves({ verbose: true });
console.log('Total legal moves:', allMoves.length);
allMoves.forEach(move => {
  console.log(`${move.san} (${move.from}->${move.to})`);
});

console.log('\n=== Testing Specific King Moves from e6 ===');
const testMoves = [
  { to: 'd5', name: 'Kd5' },
  { to: 'f5', name: 'Kf5' },
  { to: 'd6', name: 'Kd6' },
  { to: 'f6', name: 'Kf6' },
  { to: 'd7', name: 'Kd7' },
  { to: 'e7', name: 'Ke7' },
  { to: 'f7', name: 'Kf7' }
];

testMoves.forEach(({ to, name }) => {
  const moveResult = chess.move({ from: 'e6', to: to });
  console.log(`${name} (e6->${to}): ${moveResult !== null ? 'LEGAL' : 'ILLEGAL'}`);
  if (moveResult) chess.undo();
});

console.log('\n=== Distance Check ===');
console.log('Distance from e6 to e8 (kings):', Math.max(Math.abs(4-4), Math.abs(5-7)), 'squares');
console.log('Distance from d5 to e8 (if White king moves):', Math.max(Math.abs(3-4), Math.abs(4-7)), 'squares');
console.log('Distance from f5 to e8 (if White king moves):', Math.max(Math.abs(5-4), Math.abs(4-7)), 'squares');