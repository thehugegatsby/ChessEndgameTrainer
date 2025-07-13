// Debug Chess.js load failure behavior

const { Chess } = require('chess.js');

console.log('=== TESTING CHESS.JS LOAD FAILURE BEHAVIOR ===');

const testCases = [
  {
    name: 'Valid K+P vs K',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    shouldWork: true
  },
  {
    name: 'Invalid FEN',
    fen: 'invalid-fen-string',
    shouldWork: false
  },
  {
    name: 'Missing king FEN',
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    shouldWork: false
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test Case ${index + 1}: ${testCase.name} ---`);
  console.log('Input FEN:', testCase.fen);
  
  try {
    const chess = new Chess();
    console.log('Before load FEN:', chess.fen());
    
    const loadResult = chess.load(testCase.fen);
    console.log('Load result:', loadResult);
    console.log('After load FEN:', chess.fen());
    
    // Check if load actually succeeded
    if (loadResult === false) {
      console.log('*** LOAD FAILED - Chess.js kept original position! ***');
    }
    
  } catch (error) {
    console.log('ERROR during load:', error.message);
  }
});

console.log('\n=== TESTING DIRECT CONSTRUCTOR ===');
try {
  console.log('Trying to create Chess with invalid FEN...');
  const chess = new Chess('invalid-fen');
  console.log('Constructor succeeded with FEN:', chess.fen());
} catch (error) {
  console.log('Constructor failed:', error.message);
}