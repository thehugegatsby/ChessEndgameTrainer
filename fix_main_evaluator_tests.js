const fs = require('fs');

const filePath = 'src/tests/unit/orchestrators/MoveQualityEvaluator.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file has', content.length, 'characters');

// Remove the old jest.mock for TablebaseService
content = content.replace(
  /\/\/ Mock dependencies\s*\n\s*jest\.mock\("@shared\/services\/TablebaseService",[^}]*}\)\);/,
  '// Mock dependencies will be handled with jest.spyOn in individual tests'
);

// Replace the dynamic MoveQualityEvaluator import pattern with direct import
content = content.replace(
  /\/\/ Declare variable to hold the module under test\s*\n\s*let MoveQualityEvaluator: any;\s*\n/,
  ''
);

content = content.replace(
  /\/\/ Load the module under test after mocks are set up\s*\n\s*beforeAll\(\(\) => \{\s*\n\s*const evaluatorModule = require\("@shared\/store\/orchestrators\/handlePlayerMove\/MoveQualityEvaluator"\);\s*\n\s*MoveQualityEvaluator = evaluatorModule\.MoveQualityEvaluator;\s*\n\s*\}\);/,
  ''
);

// Add the direct import after the existing imports
content = content.replace(
  /(import { createTestValidatedMove } from "@tests\/helpers\/validatedMoveFactory";)/,
  '$1\nimport { MoveQualityEvaluator } from "@shared/store/orchestrators/handlePlayerMove/MoveQualityEvaluator";'
);

// Replace mockTablebaseService references with jest.spyOn pattern
content = content.replace(
  /const mockTablebaseService = tablebaseService as jest\.Mocked<\s*typeof tablebaseService\s*>;/,
  ''
);

// Replace evaluator instantiation to use proper type
content = content.replace(/let evaluator: any;/g, 'let evaluator: MoveQualityEvaluator;');

// Add afterEach cleanup
content = content.replace(
  /(beforeEach\(\(\) => \{[^}]*\}\);)/,
  '$1\n\n  afterEach(() => {\n    jest.restoreAllMocks();\n  });'
);

// Replace mockTablebaseService usage with jest.spyOn pattern
// This is complex, so I'll do a simpler approach - add the spyOn setup at the beginning of each failing test

console.log('Updated file has', content.length, 'characters');

// Write the updated content
fs.writeFileSync(filePath, content);
console.log('Updated MoveQualityEvaluator.test.ts with jest.spyOn preparation');

// Now we need to manually add jest.spyOn to the failing tests
console.log('Note: You still need to add jest.spyOn setup to individual test cases');