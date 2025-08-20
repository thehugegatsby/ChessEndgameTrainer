const { Chess } = require('chess.js');

// Test the exact sequence from the logs
console.log('=== Testing Chess Move Sequence ===');

// Start position
const chess = new Chess('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
console.log('Initial position:', chess.fen());
console.log('Initial ASCII:\n' + chess.ascii());

// Move 1: Kd6 (e6->d6)
console.log('\n1. Making move: Kd6 (e6->d6)');
try {
  const move1 = chess.move({ from: 'e6', to: 'd6' });
  console.log('Move 1 result:', move1);
  console.log('FEN after Kd6:', chess.fen());
  console.log('ASCII after Kd6:\n' + chess.ascii());
} catch (e) {
  console.error('Move 1 failed:', e.message);
}

// Move 2: Kf7 (e8->f7)  
console.log('\n2. Making move: Kf7 (e8->f7)');
try {
  const move2 = chess.move({ from: 'e8', to: 'f7' });
  console.log('Move 2 result:', move2);
  console.log('FEN after Kf7:', chess.fen());
  console.log('ASCII after Kf7:\n' + chess.ascii());
} catch (e) {
  console.error('Move 2 failed:', e.message);
}

// Move 3: Kd7 (d6->d7) - THIS IS THE PROBLEMATIC MOVE
console.log('\n3. Making move: Kd7 (d6->d7)');
try {
  const move3 = chess.move({ from: 'd6', to: 'd7' });
  console.log('Move 3 result:', move3);
  console.log('FEN after Kd7:', chess.fen());
  console.log('ASCII after Kd7:\n' + chess.ascii());
} catch (e) {
  console.error('Move 3 failed:', e.message);
}

console.log('\n=== Analysis ===');
console.log('Legal moves after Kf7:', chess.moves());