const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/MoveQualityEvaluator.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// Find all test cases that use getEvaluationSpy or getTopMovesSpy
const testRegex = /it\("([^"]+)", async \(\) => \{/g;
const tests = [];
let match;
while ((match = testRegex.exec(content)) !== null) {
  tests.push(match[1]);
}

console.log('Found tests:', tests.length);

// For each test, check if it uses getEvaluationSpy or getTopMovesSpy
tests.forEach(testName => {
  // Escape special regex characters in test name
  const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find the test body
  const testStart = content.indexOf(`it("${testName}", async () => {`);
  if (testStart === -1) return;
  
  // Find the closing brace for this test
  let braceCount = 0;
  let testEnd = testStart + `it("${testName}", async () => {`.length;
  for (let i = testEnd; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      if (braceCount === 0) {
        testEnd = i;
        break;
      }
      braceCount--;
    }
  }
  
  const testBody = content.substring(testStart, testEnd + 1);
  
  // Check if this test uses getEvaluationSpy or getTopMovesSpy without declaring them
  if ((testBody.includes('getEvaluationSpy') || testBody.includes('getTopMovesSpy')) && 
      !testBody.includes('const getEvaluationSpy') && 
      !testBody.includes('const getTopMovesSpy')) {
    
    console.log(`Adding spies to test: ${testName}`);
    
    // Add jest.spyOn setup after the test start
    const testStartPattern = new RegExp(`(it\\("${escapedTestName}", async \\(\\) => \\{)`, 'g');
    content = content.replace(testStartPattern, (match) => {
      return `${match}
      // Use jest.spyOn to mock the service methods
      const getEvaluationSpy = jest.spyOn(tablebaseService, 'getEvaluation');
      const getTopMovesSpy = jest.spyOn(tablebaseService, 'getTopMoves');
`;
    });
  }
});

console.log('Updated file has', content.length, 'characters');

// Write the updated content
fs.writeFileSync(filePath, content);
console.log('Updated MoveQualityEvaluator.test.ts with jest.spyOn for ALL tests that need it');