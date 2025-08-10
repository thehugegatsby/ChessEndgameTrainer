const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/PawnPromotionHandler.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// Add chessService import
content = content.replace(
  /(import { tablebaseService } from "@shared\/services\/TablebaseService";)/,
  '$1\nimport { chessService } from "@shared/services/ChessService";'
);

// List of tests that use chessService mocks
const chessMockTests = [
  "should detect checkmate as auto-win",
  "should not consider stalemate as auto-win"
];

chessMockTests.forEach(testName => {
  const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Add jest.spyOn setup after test start  
  const testStartPattern = new RegExp(`(it\\("${escapedTestName}", async \\(\\) => \\{)`, 'g');
  content = content.replace(testStartPattern, (match) => {
    return `${match}
      // Use jest.spyOn to mock the chess service methods
      const isGameOverSpy = jest.spyOn(chessService, 'isGameOver');
      const isCheckmateSpy = jest.spyOn(chessService, 'isCheckmate');
`;
  });
});

// Replace chessService mock calls
content = content.replace(/\(chessService\.isGameOver as jest\.Mock\)/g, 'isGameOverSpy');
content = content.replace(/\(chessService\.isCheckmate as jest\.Mock\)/g, 'isCheckmateSpy');

// Remove the mock resets from beforeEach since they're now handled per test
content = content.replace(
  /(chessService\.isGameOver as jest\.Mock)\.mockReset\(\);/,
  '// chess service spies will be created in individual tests'
);
content = content.replace(
  /(chessService\.isCheckmate as jest\.Mock)\.mockReset\(\);/,
  ''
);

console.log('Updated file has', content.length, 'characters');

fs.writeFileSync(filePath, content);
console.log('Fixed chessService mocking in PawnPromotionHandler.test.ts');