// Debug script to test Chess.js behavior with our FEN

const { Chess } = require('chess.js');

console.log('=== TESTING CHESS.JS FEN LOADING ===');

const testCases = [
  {
    name: 'Expected FEN (with pawn)',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'
  },
  {
    name: 'Actual FEN (without pawn)',
    fen: '4k3/8/4K3/8/8/8/8/8 w - - 0 1'
  },
  {
    name: 'Starting position',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test Case ${index + 1}: ${testCase.name} ---`);
  console.log('Input FEN:', testCase.fen);
  
  try {
    // Test 1: Create new Chess() then load
    const chess1 = new Chess();
    const loadResult = chess1.load(testCase.fen);
    console.log('Load result:', loadResult);
    console.log('Output FEN:', chess1.fen());
    
    // Test 2: Create Chess with FEN directly
    const chess2 = new Chess(testCase.fen);
    console.log('Direct FEN:', chess2.fen());
    
    // Check if they match
    if (testCase.fen !== chess1.fen()) {
      console.log('*** CHESS.JS CHANGED FEN! ***');
      console.log('Expected:', testCase.fen);
      console.log('Got:     ', chess1.fen());
    }
    
    // Check if Chess.js considers this position valid
    console.log('Is valid position:', chess1.isGameOver() === false);
    
  } catch (error) {
    console.log('ERROR:', error.message);
  }
});

console.log('\n=== TESTING EMPTY CHESS INSTANCE ===');
const emptyChess = new Chess();
console.log('Empty Chess.js FEN:', emptyChess.fen());
console.log('Empty Chess.js default is starting position:', emptyChess.fen() === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');