const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/PawnPromotionHandler.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// Find the import section and add tablebaseService import
content = content.replace(
  /(import { createTestValidatedMove } from "@tests\/helpers\/validatedMoveFactory";)/,
  '$1\nimport { tablebaseService } from "@shared/services/TablebaseService";'
);

// List of test cases that need to be fixed (the ones that mock orchestratorTablebase)
const testsThatNeedFix = [
  "should detect winning positions for white with tablebase",
  "should detect winning positions for black with tablebase",
  "should return false for drawing positions",
  "should return false when tablebase is unavailable",
  "should handle tablebase errors gracefully"
];

// For each test, add jest.spyOn setup and replace orchestratorTablebase mock with tablebaseService spy
testsThatNeedFix.forEach(testName => {
  const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Add jest.spyOn setup after the test start
  const testStartPattern = new RegExp(`(it\\("${escapedTestName}", async \\(\\) => \\{)`, 'g');
  content = content.replace(testStartPattern, (match) => {
    return `${match}
      // Use jest.spyOn to mock the tablebase service methods
      const getEvaluationSpy = jest.spyOn(tablebaseService, 'getEvaluation');`;
  });
});

// Replace all orchestratorTablebase.getEvaluation mock calls with tablebaseService spy calls
content = content.replace(/\(orchestratorTablebase\.getEvaluation as jest\.Mock\)/g, 'getEvaluationSpy');

console.log('Updated file has', content.length, 'characters');

// Write the updated content
fs.writeFileSync(filePath, content);
console.log('Updated PawnPromotionHandler.test.ts with jest.spyOn for tablebase tests');