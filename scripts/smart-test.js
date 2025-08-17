#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);

// WSL2 Detection and Auto-Configuration
const isWSL2 = process.env.WSL_DISTRO_NAME !== undefined;
if (isWSL2) {
  // Set WSL2-optimized environment variables
  process.env.VITEST_POOL = 'forks';
  process.env.VITEST_MAX_THREADS = '2';
  process.env.VITEST_MAX_FORKS = '2';
  console.log('🐧 WSL2 detected: Optimized test settings applied');
}

// Helper: Count test files that will be executed
function countTestFiles(pattern) {
  try {
    const result = execSync(
      `find src -type f \\( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \\) 2>/dev/null | wc -l`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    return parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
}

// Helper: Detect feature from file path
function detectFeature(filePath) {
  if (filePath.includes('chess-core')) return 'chess-core';
  if (filePath.includes('tablebase')) return 'tablebase';
  if (filePath.includes('training')) return 'training';
  if (filePath.includes('move-quality')) return 'move-quality';
  if (filePath.includes('shared')) return 'shared';
  if (filePath.includes('integration')) return 'integration';
  return null;
}

// Helper: Prompt for confirmation
async function confirmLargeTestRun(testCount) {
  if (process.env.CI || process.env.CONFIRM_ALL || process.env.FORCE_TEST) {
    return true; // Auto-confirm in CI or with env flags
  }

  console.log(`\n⚠️  WARNING: About to run ${testCount} test files`);
  console.log('This may take several minutes. Continue? (y/n/s)');
  console.log('  y = Yes, run all tests');
  console.log('  n = No, cancel');
  console.log('  s = Skip to specific feature tests');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('Your choice: ', answer => {
      rl.close();
      if (answer.toLowerCase() === 'y') {
        resolve(true);
      } else if (answer.toLowerCase() === 's') {
        console.log('\n📦 Available features:');
        console.log('  - chess-core');
        console.log('  - tablebase');
        console.log('  - training');
        console.log('  - move-quality');
        console.log('  - shared');
        console.log('\nRun with: pnpm test:feature <name>');
        resolve(false);
      } else {
        resolve(false);
      }
    });
  });
}

// Helper: Get test suite overview
function getTestSuiteOverview() {
  const features = ['chess-core', 'tablebase', 'training', 'shared'];
  const overview = {
    unit: 0,
    integration: 0,
    total: 0
  };

  features.forEach(feature => {
    try {
      const featureCount = execSync(
        `find src/features/${feature} -name "*.test.*" -o -name "*.spec.*" | wc -l`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      overview.unit += parseInt(featureCount.trim(), 10);
    } catch {
      // Feature might not exist
    }
  });

  try {
    const integrationCount = execSync(
      `find src/tests/integration src/features -path "*/integration/*" \\( -name "*.test.*" -o -name "*.spec.*" \\) | wc -l`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    overview.integration = parseInt(integrationCount.trim(), 10);
  } catch {
    overview.integration = 0;
  }

  overview.total = overview.unit + overview.integration;
  return overview;
}

// Main execution logic
async function main() {
  // Check if a specific test file is provided
  const hasTestFile = args.some(
    arg => arg.includes('.test.') || arg.includes('.spec.') || arg.includes('/__tests__/')
  );

  if (hasTestFile) {
    // Auto-routing for specific test files
    const testFile = args.find(arg => arg.includes('.test.') || arg.includes('.spec.'));
    const feature = detectFeature(testFile);

    if (feature) {
      console.log(`🎯 Auto-routing to feature: ${feature}`);
      console.log(`🔄 Running: pnpm test:${feature} ${testFile}`);
      try {
        execSync(`pnpm test:${feature} ${testFile}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Test execution failed');
        process.exit(error.status || 1);
      }
    } else {
      console.log('🔄 Running specific test file');
      try {
        execSync(`vitest run ${testFile}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Test execution failed');
        process.exit(error.status || 1);
      }
    }
  } else if (args.includes('--project') || args.includes('-p')) {
    // Project-based testing (use workspace config)
    const projectName = args[args.indexOf('--project') + 1] || args[args.indexOf('-p') + 1];
    console.log(`🚀 Running ${projectName} project tests`);
    try {
      execSync(`vitest run --project ${projectName}`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('❌ Test execution failed');
      process.exit(error.status || 1);
    }
  } else {
    // Full test suite - show overview and check count
    const overview = getTestSuiteOverview();
    
    console.log('\n📊 Test Suite Overview:');
    console.log(`   Unit Tests: ${overview.unit} files`);
    console.log(`   Integration: ${overview.integration} files`);
    console.log(`   Total: ${overview.total} files\n`);

    if (overview.total > 100) {
      const shouldContinue = await confirmLargeTestRun(overview.total);
      if (!shouldContinue) {
        console.log('✋ Test run cancelled');
        process.exit(0);
      }
    }

    console.log(`🔄 Running all tests (${overview.total} files)`);
    console.log('📦 Test execution order: chess-core → tablebase → training → integration\n');
    
    try {
      execSync('pnpm run test:all', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Test execution failed');
      process.exit(error.status || 1);
    }
  }
}

// Add helper commands
if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
📚 Smart Test Runner - Optimized for WSL2 and Feature-Based Testing

Usage:
  pnpm test                         Run all tests (with confirmation if >100)
  pnpm test <file>                  Run specific test file
  pnpm test --project <name>        Run feature tests (chess-core, tablebase, etc.)
  pnpm test:feature <name>          Shortcut for --project

Features:
  - WSL2 auto-detection and optimization
  - Performance guard (warns if >100 tests)
  - Auto-routing to feature projects
  - Smart coverage exclusions

Environment Variables:
  CONFIRM_ALL=1                     Auto-confirm large test runs
  FORCE_TEST=1                      Skip all confirmations
  VITEST_POOL=forks                 Override pool type (auto-set on WSL2)
  `);
  process.exit(0);
}

// Execute main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
