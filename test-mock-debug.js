// Debug script to test mock behavior
const { Chess } = require('chess.js');

// Mock chess.js
jest.mock('chess.js');

// Test 1: Basic mock setup
console.log('Test 1: Basic mock setup');
const mockChess = {
  load: jest.fn(),
  move: jest.fn(),
};

(Chess as any).mockImplementation(() => mockChess);

const chess1 = new Chess();
console.log('chess1 === mockChess:', chess1 === mockChess);
console.log('chess1.move:', chess1.move);

// Test 2: With return value
console.log('\nTest 2: With return value');
const mockMove = { from: 'e2', to: 'e4' };
mockChess.move.mockReturnValue(mockMove);

const result = chess1.move('e2e4');
console.log('result:', result);
console.log('result === mockMove:', result === mockMove);

// Test 3: After clearAllMocks
console.log('\nTest 3: After clearAllMocks');
jest.clearAllMocks();
const result2 = chess1.move('e2e4');
console.log('result2:', result2);
console.log('mockChess.move.mock.calls:', mockChess.move.mock.calls);