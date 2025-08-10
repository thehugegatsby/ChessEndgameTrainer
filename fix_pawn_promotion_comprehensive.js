const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/PawnPromotionHandler.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// Fix the beforeEach function - remove the reference to getEvaluationSpy
content = content.replace(
  /getEvaluationSpy\.mockReset\(\);/,
  '// tablebaseService spy will be created in individual tests'
);

// Find all test cases that use getEvaluationSpy and add the spy declaration
const testRegex = /it\("([^"]+)", async \(\) => \{/g;
let match;
while ((match = testRegex.exec(content)) !== null) {
  const testName = match[1];
  const testStart = content.indexOf(`it("${testName}", async () => {`);
  
  // Find the test body to check if it uses getEvaluationSpy
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
  
  // Check if this test uses getEvaluationSpy without declaring it
  if (testBody.includes('getEvaluationSpy') && !testBody.includes('const getEvaluationSpy')) {
    console.log(`Adding spy declaration to test: ${testName}`);
    
    const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const testStartPattern = new RegExp(`(it\\("${escapedTestName}", async \\(\\) => \\{)`, 'g');
    content = content.replace(testStartPattern, (match) => {
      return `${match}
      // Use jest.spyOn to mock the tablebase service methods
      const getEvaluationSpy = jest.spyOn(tablebaseService, 'getEvaluation');
`;
    });
  }
}

console.log('Updated file has', content.length, 'characters');

// Write the updated content
fs.writeFileSync(filePath, content);
console.log('Fixed PawnPromotionHandler.test.ts comprehensively');