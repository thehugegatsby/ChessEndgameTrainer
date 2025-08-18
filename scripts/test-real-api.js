#!/usr/bin/env node

/**
 * Script to run real API integration tests
 *
 * This runs the integration tests that make actual calls to the Lichess Tablebase API.
 * These tests are skipped in CI to avoid rate limiting and external dependencies.
 *
 * Usage: npm run test:real-api
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Running real API integration tests...');
console.log('⚠️  These tests require internet connection and may be rate limited.');
console.log('');

// Run vitest with the real API test file
const testFile = path.join(
  __dirname,
  '..',
  'src/tests/integration',
  'tablebase-real-api.integration.spec.ts'
);

const vitest = spawn(
  'pnpm',
  ['vitest', 'run', testFile, '--config=config/testing/vitest.integration.config.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false', // Ensure CI env var is not set
    },
  }
);

vitest.on('close', code => {
  if (code === 0) {
    console.log('\n✅ Real API integration tests passed!');
  } else {
    console.log('\n❌ Real API integration tests failed.');
    process.exit(code);
  }
});
