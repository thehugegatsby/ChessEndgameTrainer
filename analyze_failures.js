#!/usr/bin/env node

// Analysis based on the test output from the earlier run
const testResults = {
  failing: {
    'ChessService.cache.test.ts': 1,
    'gameSlice.test.ts': 1, 
    'ErrorService.test.ts': 4,
    'DueCardsCacheService.test.ts': 4,
    'ChessService.germanPromotion.test.ts': 2,
    'ChessService.unit.test.ts': 8,
    'ChessService.validateMove.test.ts': 2,
    'TestApiService.test.ts': 1,
    'MoveValidator.test.ts': 1,
    'MoveDialogManager.test.ts': 2,
    'OpponentTurnManager.test.ts': 2,
    'MoveQualityEvaluator.test.ts': 6,
    'PawnPromotionHandler.test.ts': 8,
    'handlePlayerMove.promotion.test.ts': 5,
    'useProgressSync.test.ts': 2,
    'useMoveValidation.test.ts': 1,
    'TablebaseDefenseTest.test.ts': 3,
    'MoveQualityEvaluatorWdlPerspective.test.ts': 67,
  },
  totalFailures: 112,
  totalSkipped: 45,
  totalPassed: 1138,
  totalTests: 1295,
  totalSuites: 72,
  failingSuites: 16,
  skippedSuites: 3,
  passingSuites: 53
};

console.log('=== TEST FAILURE ANALYSIS ===\n');

console.log('📊 OVERALL SUMMARY:');
console.log(`• Total Test Suites: ${testResults.totalSuites}`);
console.log(`• ❌ Failing Suites: ${testResults.failingSuites} (${((testResults.failingSuites/testResults.totalSuites)*100).toFixed(1)}%)`);
console.log(`• ⏭️  Skipped Suites: ${testResults.skippedSuites} (${((testResults.skippedSuites/testResults.totalSuites)*100).toFixed(1)}%)`);
console.log(`• ✅ Passing Suites: ${testResults.passingSuites} (${((testResults.passingSuites/testResults.totalSuites)*100).toFixed(1)}%)`);
console.log();

console.log(`• Total Individual Tests: ${testResults.totalTests}`);
console.log(`• ❌ Failing Tests: ${testResults.totalFailures} (${((testResults.totalFailures/testResults.totalTests)*100).toFixed(1)}%)`);
console.log(`• ⏭️  Skipped Tests: ${testResults.totalSkipped} (${((testResults.totalSkipped/testResults.totalTests)*100).toFixed(1)}%)`);
console.log(`• ✅ Passing Tests: ${testResults.totalPassed} (${((testResults.totalPassed/testResults.totalTests)*100).toFixed(1)}%)`);
console.log();

console.log('🚨 FAILING MODULES BY CATEGORY:');
console.log();

// Group by module category
const categories = {
  'Services': [
    'ChessService.cache.test.ts',
    'ChessService.germanPromotion.test.ts', 
    'ChessService.unit.test.ts',
    'ChessService.validateMove.test.ts',
    'ErrorService.test.ts',
    'DueCardsCacheService.test.ts',
    'TestApiService.test.ts'
  ],
  'Store/State Management': [
    'gameSlice.test.ts'
  ],
  'Orchestrators': [
    'MoveValidator.test.ts',
    'MoveDialogManager.test.ts',
    'OpponentTurnManager.test.ts',
    'MoveQualityEvaluator.test.ts',
    'PawnPromotionHandler.test.ts',
    'handlePlayerMove.promotion.test.ts',
    'MoveQualityEvaluatorWdlPerspective.test.ts'
  ],
  'Hooks': [
    'useProgressSync.test.ts',
    'useMoveValidation.test.ts'
  ],
  'Integration Tests': [
    'TablebaseDefenseTest.test.ts'
  ]
};

Object.entries(categories).forEach(([category, files]) => {
  const categoryFailures = files.reduce((sum, file) => sum + (testResults.failing[file] || 0), 0);
  const categoryFiles = files.filter(file => testResults.failing[file]).length;
  
  if (categoryFailures > 0) {
    console.log(`📂 ${category}: ${categoryFailures} failing tests in ${categoryFiles} files`);
    files.forEach(file => {
      if (testResults.failing[file]) {
        console.log(`   • ${file}: ${testResults.failing[file]} failures`);
      }
    });
    console.log();
  }
});

console.log('🔥 TOP PROBLEM MODULES:');
const sortedFailures = Object.entries(testResults.failing)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

sortedFailures.forEach(([file, count], index) => {
  console.log(`${index + 1}. ${file}: ${count} failing tests`);
});

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Focus on MoveQualityEvaluatorWdlPerspective.test.ts (67 failures) - likely WDL conversion logic issues');
console.log('2. Fix ChessService modules (13 total failures) - core chess logic problems');  
console.log('3. Address PawnPromotionHandler.test.ts (8 failures) - promotion detection logic');
console.log('4. Review orchestrator tests - likely mock/integration issues');
console.log('5. Check ErrorService.test.ts - logging infrastructure problems');