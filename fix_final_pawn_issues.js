const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/PawnPromotionHandler.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// Remove the duplicate chessService import
content = content.replace(
  /import { chessService } from "@shared\/services\/ChessService";\nimport { chessService } from "@shared\/services\/ChessService";/,
  'import { chessService } from "@shared/services/ChessService";'
);

// Fix the beforeEach function - remove references to undefined spies
content = content.replace(
  /isGameOverSpy\.mockReset\(\);\s*isCheckmateSpy\.mockReset\(\);/,
  '// chess service spies will be created in individual tests'
);

// Also need to add spies to tests that reference them without declaration
const testsNeedingChessSpies = [
  "should not consider winning positions without auto-win category",
  "should handle draw positions", 
  "should handle losing positions",
  "should handle tablebase unavailable",
  "should handle evaluation without result field",
  "should handle evaluation with null result",
  "should handle evaluation with invalid WDL",
  "should handle unexpected errors"
];

testsNeedingChessSpies.forEach(testName => {
  const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const testStartPattern = new RegExp(`(it\\("${escapedTestName}", async \\(\\) => \\{)`, 'g');
  content = content.replace(testStartPattern, (match) => {
    return `${match}
      // Use jest.spyOn to mock the chess service methods
      const isGameOverSpy = jest.spyOn(chessService, 'isGameOver');
      const isCheckmateSpy = jest.spyOn(chessService, 'isCheckmate');
`;
  });
});

// Now fix the main issue: we need to add proper state for the handleAutoWin test
// The error shows that state.training is undefined, but the mock state has training
// Let's check if the issue is in how handleTrainingCompletion uses getState()

// The real issue is that handleTrainingCompletion is calling getState() but getting undefined training
// We need to fix the mockState to have the proper structure that move.completion.ts expects

content = content.replace(
  /mockState = \{[^}]*training: \{[^}]*\},[^}]*\};/s,
  `mockState = {
      game: {
        isGameFinished: false,
        currentFen: "8/4P3/4K3/8/8/8/8/4k3 w - - 0 1",
        moveHistory: []  // Add moveHistory array
      },
      training: {
        moveSuccessDialog: null,
        currentPosition: { fen: "8/4P3/4K3/8/8/8/8/4k3 w - - 0 1" }, // Add currentPosition
        sessionStartTime: Date.now() // Add sessionStartTime
      },
      ui: {
        toasts: [],
      },
    };`
);

console.log('Updated file has', content.length, 'characters');

fs.writeFileSync(filePath, content);
console.log('Fixed all remaining issues in PawnPromotionHandler.test.ts');