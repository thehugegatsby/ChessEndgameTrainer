#!/usr/bin/env node

/**
 * CI Compatibility Test Script
 * 
 * Verifies that the global test cleanup system works correctly in CI environments
 */

const { spawn } = require('child_process');
const path = require('path');

// Set CI environment variables like GitHub Actions does
process.env.CI = 'true';
process.env.GITHUB_ACTIONS = 'true';
process.env.NODE_ENV = 'test';

console.log('🔍 Testing CI Compatibility for Global Test Cleanup System...\n');
console.log('Environment:');
console.log(`  CI: ${process.env.CI}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  Platform: ${process.platform}`);
console.log(`  Node Version: ${process.version}\n`);

// Run a subset of tests to verify cleanup works
const testCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const testArgs = [
  'jest',
  '--config=src/config/jest/jest.config.projects.js',
  '--testNamePattern=ChessService',
  '--no-coverage',
  '--verbose'
];

console.log(`Running: ${testCommand} ${testArgs.join(' ')}\n`);

const testProcess = spawn(testCommand, testArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    CI: 'true',
    NODE_OPTIONS: '--max-old-space-size=2048'
  }
});

testProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ CI Compatibility Test PASSED');
    console.log('The global test cleanup system is compatible with CI environments.');
  } else {
    console.error('\n❌ CI Compatibility Test FAILED');
    console.error('There may be issues with the cleanup system in CI.');
    process.exit(1);
  }
});

testProcess.on('error', (error) => {
  console.error('Failed to run tests:', error);
  process.exit(1);
});