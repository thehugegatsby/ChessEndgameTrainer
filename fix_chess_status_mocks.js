// Script to fix ChessService status test mocks
const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'src/tests/unit/services/ChessService.status.test.ts');

// Read the file
let content = fs.readFileSync(testFile, 'utf8');

// Fix 1: After chessService.initialize(), we need to replace the internal chess instance
const fixInitialize = `
  beforeEach(() => {
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance
    mockChessInstance = {
      move: jest.fn(),
      fen: jest.fn().mockReturnValue(statusTestFens.normal),
      pgn: jest.fn().mockReturnValue(""),
      history: jest.fn().mockReturnValue([]),
      load: jest.fn(),
      isGameOver: jest.fn().mockReturnValue(false),
      turn: jest.fn().mockReturnValue("w"),
      moves: jest.fn().mockReturnValue(["e4", "e3", "Nf3"]),
      // Add the status methods we're testing
      isCheck: jest.fn().mockReturnValue(false),
      isCheckmate: jest.fn().mockReturnValue(false),
      isStalemate: jest.fn().mockReturnValue(false),
      isDraw: jest.fn().mockReturnValue(false),
      isThreefoldRepetition: jest.fn().mockReturnValue(false),
      isInsufficientMaterial: jest.fn().mockReturnValue(false),
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    chessService = new ChessService();
    
    // IMPORTANT: Replace the internal chess instance with our mock
    (chessService as any).chess = mockChessInstance;
  });`;

// Find and replace the beforeEach block
const beforeEachRegex = /beforeEach\(\(\) => \{[\s\S]*?\n  \}\);/;
const match = content.match(beforeEachRegex);

if (match) {
  // Check if we already have the fix
  if (!content.includes('(chessService as any).chess = mockChessInstance;')) {
    // Replace the beforeEach
    content = content.replace(beforeEachRegex, fixInitialize);
    
    // Also need to set the mock after each initialize call
    // Find all chessService.initialize calls and add the mock replacement after them
    content = content.replace(
      /chessService\.initialize\([^)]+\);/g,
      (match) => `${match}\n      (chessService as any).chess = mockChessInstance;`
    );
    
    // Write back
    fs.writeFileSync(testFile, content, 'utf8');
    console.log('Fixed ChessService.status.test.ts mock setup');
  } else {
    console.log('Fix already applied');
  }
} else {
  console.log('Could not find beforeEach block to fix');
}