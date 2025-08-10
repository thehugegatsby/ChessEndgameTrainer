const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/PawnPromotionHandler.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// 1. Fix the mockState to include the required properties
const mockStateReplace = `mockState = {
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
    };`;

content = content.replace(
  /mockState = \{[^}]*game: \{[^}]*\},[^}]*training: \{[^}]*\},[^}]*ui: \{[^}]*\},[^}]*\};/s,
  mockStateReplace
);

// 2. Find tests that need chess service spies added
const testsNeedingChessSpies = [
  "should detect winning positions for white with tablebase",
  "should detect winning positions for black with tablebase", 
  "should handle tablebase errors gracefully"
];

testsNeedingChessSpies.forEach(testName => {
  const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const testStartPattern = new RegExp(`(it\\("${escapedTestName}", async \\(\\) => \\{[^\\n]*\\n[^\\n]*const getEvaluationSpy = jest\\.spyOn\\(tablebaseService, 'getEvaluation'\\);)`, 'g');
  content = content.replace(testStartPattern, (match) => {
    return `${match}
      const isGameOverSpy = jest.spyOn(chessService, 'isGameOver');
      const isCheckmateSpy = jest.spyOn(chessService, 'isCheckmate');`;
  });
});

console.log('Updated file has', content.length, 'characters');

fs.writeFileSync(filePath, content);
console.log('Applied final comprehensive fixes to PawnPromotionHandler.test.ts');