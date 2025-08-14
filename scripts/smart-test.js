#!/usr/bin/env node
const { execSync } = require('child_process');
const args = process.argv.slice(2);

// Erkennt ob Argument wie Testdatei aussieht
const hasTestFile = args.some(arg => 
  arg.includes('.test.') || arg.includes('/__tests__/')
);

if (hasTestFile) {
  console.log('🔄 Auto-redirect: pnpm test [file] → pnpm run test:vitest:file [file]');
  try {
    execSync(`pnpm run test:vitest:file ${args.join(' ')}`, {stdio: 'inherit'});
  } catch (error) {
    console.error('❌ Test execution failed');
    process.exit(error.status || 1);
  }
} else {
  console.log('🔄 Auto-redirect: pnpm test → running all tests');  
  try {
    execSync('pnpm run test:original', {stdio: 'inherit'});
  } catch (error) {
    console.error('❌ Test execution failed');
    process.exit(error.status || 1);
  }
}