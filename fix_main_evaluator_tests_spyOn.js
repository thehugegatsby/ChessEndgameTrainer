const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/MoveQualityEvaluator.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// List of failing test cases that need jest.spyOn added
const failingTests = [
  "should handle optimal moves correctly",
  "should detect suboptimal moves with outcome change", 
  "should handle draw to loss correctly",
  "should not show error dialog for suboptimal move without outcome change",
  "should use training baseline when provided",
  "should handle null training baseline",
  "should handle perspective conversion correctly"
];

// Replace each failing test's mock setup
failingTests.forEach(testName => {
  // Find the test and add jest.spyOn setup after the opening it() call
  const testRegex = new RegExp(`(it\\("${testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}", async \\(\\) => \\{)`, 'g');
  
  content = content.replace(testRegex, (match) => {
    return `${match}
      // Use jest.spyOn to mock the service methods
      const getEvaluationSpy = jest.spyOn(tablebaseService, 'getEvaluation');
      const getTopMovesSpy = jest.spyOn(tablebaseService, 'getTopMoves');

      // Mock evaluations`;
  });
});

// Now replace all (tablebaseService.getEvaluation as jest.Mock) with getEvaluationSpy
content = content.replace(/\(tablebaseService\.getEvaluation as jest\.Mock\)/g, 'getEvaluationSpy');

// Replace all (tablebaseService.getTopMoves as jest.Mock) with getTopMovesSpy  
content = content.replace(/\(tablebaseService\.getTopMoves as jest\.Mock\)/g, 'getTopMovesSpy');

console.log('Updated file has', content.length, 'characters');

// Write the updated content
fs.writeFileSync(filePath, content);
console.log('Updated MoveQualityEvaluator.test.ts with jest.spyOn for all failing tests');