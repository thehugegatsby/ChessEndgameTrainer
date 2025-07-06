#!/usr/bin/env node
/**
 * Cleanup script for test migration
 * Removes old test structure after verifying new tests pass
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'blue');
  log(message, 'bold');
  log('='.repeat(60), 'blue');
}

async function runTests() {
  logHeader('🧪 Running test suite to verify migration...');
  
  try {
    // Run all test categories
    const testCommands = [
      'npm run test:unit',
      'npm run test:integration', 
      'npm run test:performance',
      'npm run test:regression'
    ];
    
    for (const command of testCommands) {
      log(`Running: ${command}`, 'blue');
      execSync(command, { stdio: 'inherit' });
      log(`✅ ${command} passed`, 'green');
    }
    
    return true;
  } catch (error) {
    log('❌ Tests failed! Cleanup aborted.', 'red');
    log('Fix failing tests before running cleanup.', 'yellow');
    return false;
  }
}

function removeOldTestStructure() {
  logHeader('🧹 Cleaning up old test structure...');
  
  const pathsToRemove = [
    // Old __tests__ directories in shared folder
    'shared/components/layout/__tests__',
    'shared/components/navigation/__tests__',
    'shared/components/training/__tests__',
    'shared/components/training/DualEvaluationPanel/__tests__',
    'shared/components/training/TrainingBoard/__tests__',
    'shared/components/training/TrainingBoard/components/__tests__',
    'shared/components/training/TrainingBoard/hooks/__tests__',
    'shared/components/ui/__tests__',
    'shared/contexts/__tests__',
    'shared/data/endgames/__tests__',
    'shared/hooks/__tests__',
    'shared/lib/__tests__',
    'shared/lib/cache/__tests__',
    'shared/lib/chess/__tests__',
    'shared/lib/chess/ScenarioEngine/__tests__',
    'shared/lib/chess/engine/__tests__',
    'shared/lib/chess/evaluation/__tests__',
    'shared/lib/training/__tests__',
    'shared/services/__tests__',
    'shared/services/chess/__tests__',
    'shared/services/logging/__tests__',
    'shared/services/mistakeAnalysis/__tests__',
    'shared/services/platform/__tests__',
    'shared/services/platform/web/__tests__',
    'shared/store/__tests__',
    'shared/tests/__tests__',
    'shared/types/__tests__',
    'shared/utils/__tests__',
    'shared/utils/chess/__tests__',
    
    // Old shared/__tests__ structure
    'shared/__tests__/bugs',
    'shared/__tests__/e2e',
    'shared/__tests__/integration',
    'shared/__tests__/performance',
    'shared/__tests__/debug-evaluation-types.test.tsx',
    'shared/__tests__/real-browser-test.tsx',
    'shared/__tests__/tablebase-data-flow.test.tsx',
    'shared/__tests__/tablebase-kd7-real-api.test.ts',
    'shared/__tests__/tablebase-move-quality.test.ts',
    'shared/__tests__/tablebase-wdl-debug.test.ts',
    
    // Old tests directory in shared
    'shared/tests/unit',
    'shared/tests/__tests__',
    'shared/tests/mocks',
    
    // Duplicate individual test files
    'shared/components/ui/DarkModeToggle.test.tsx',
    'shared/components/ui/button.test.tsx',
    'shared/components/ui/ProgressCard.comprehensive.test.tsx',
    'shared/components/layout/Header.test.tsx'
  ];
  
  let removedCount = 0;
  let skippedCount = 0;
  
  pathsToRemove.forEach(relativePath => {
    const fullPath = path.join(process.cwd(), relativePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          log(`📁 Removed directory: ${relativePath}`, 'yellow');
        } else {
          fs.unlinkSync(fullPath);
          log(`📄 Removed file: ${relativePath}`, 'yellow');
        }
        
        removedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      log(`⚠️  Failed to remove ${relativePath}: ${error.message}`, 'red');
    }
  });
  
  log(`\n✅ Cleanup complete!`, 'green');
  log(`   Removed: ${removedCount} items`, 'green');
  log(`   Skipped: ${skippedCount} items (already removed)`, 'yellow');
}

function mergeComprehensiveTests() {
  logHeader('🔀 Merging .comprehensive.test.ts files...');
  
  // Note: This is a placeholder. In practice, comprehensive tests should be
  // manually reviewed and merged into main test files where appropriate
  log('📋 Manual merge required for .comprehensive.test.ts files:', 'yellow');
  log('   - Review each comprehensive test file', 'yellow');
  log('   - Merge valuable test cases into main test files', 'yellow');
  log('   - Remove comprehensive files after merge', 'yellow');
  log('   - This step requires manual review for quality', 'yellow');
}

function updateJestConfig() {
  logHeader('⚙️  Updating Jest configuration...');
  
  const jestConfigPath = path.join(process.cwd(), 'tests/jest.config.js');
  
  if (fs.existsSync(jestConfigPath)) {
    let config = fs.readFileSync(jestConfigPath, 'utf8');
    
    // Remove ignore patterns for old test structure
    config = config.replace(/\s*'<rootDir>\/shared\/__tests__\/',?\s*/g, '');
    config = config.replace(/\s*'<rootDir>\/shared\/tests\/'.*$/gm, '');
    
    // Add comment indicating cleanup is complete
    const cleanupComment = `
  // ✅ Test migration complete - old structure cleaned up
  `;
    
    config = config.replace(
      'testPathIgnorePatterns: [',
      `testPathIgnorePatterns: [${cleanupComment}`
    );
    
    fs.writeFileSync(jestConfigPath, config);
    log('✅ Jest configuration updated', 'green');
  }
}

function generateSummaryReport() {
  logHeader('📊 Migration Summary Report');
  
  const stats = {
    unit: getTestFileCount('tests/unit'),
    integration: getTestFileCount('tests/integration'),
    performance: getTestFileCount('tests/performance'),
    regression: getTestFileCount('tests/regression'),
    e2e: getTestFileCount('tests/e2e')
  };
  
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  
  log(`\n📈 Test Migration Complete!`, 'green');
  log(`   Unit Tests: ${stats.unit} files`, 'blue');
  log(`   Integration Tests: ${stats.integration} files`, 'blue');
  log(`   Performance Tests: ${stats.performance} files`, 'blue');
  log(`   Regression Tests: ${stats.regression} files`, 'blue');
  log(`   E2E Tests: ${stats.e2e} files`, 'blue');
  log(`   Total: ${total} test files`, 'bold');
  
  log(`\n🎯 Next Steps:`, 'yellow');
  log(`   1. Run: npm run test:all`, 'yellow');
  log(`   2. Run: npm run test:e2e`, 'yellow');
  log(`   3. Check coverage: npm run test:coverage`, 'yellow');
  log(`   4. Update CI/CD pipelines`, 'yellow');
}

function getTestFileCount(directory) {
  try {
    const files = execSync(`find ${directory} -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l`, 
                          { encoding: 'utf8' });
    return parseInt(files.trim()) || 0;
  } catch {
    return 0;
  }
}

async function main() {
  log('🚀 Starting test structure cleanup...', 'bold');
  
  // Check if new test structure exists
  if (!fs.existsSync('tests/jest.config.js')) {
    log('❌ New test structure not found! Run migration first.', 'red');
    process.exit(1);
  }
  
  // Verify all tests pass before cleanup
  const testsPass = await runTests();
  
  if (!testsPass) {
    log('❌ Tests must pass before cleanup. Fix failing tests first.', 'red');
    process.exit(1);
  }
  
  // Perform cleanup
  mergeComprehensiveTests();
  removeOldTestStructure();
  updateJestConfig();
  generateSummaryReport();
  
  log('\n🎉 Test migration and cleanup complete!', 'green');
  log('   All tests are now in the new structure.', 'green');
  log('   Old test directories have been removed.', 'green');
  log('   Run "npm run test:all" to verify everything works.', 'blue');
}

// Run cleanup if called directly
if (require.main === module) {
  main().catch(error => {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main };