/**
 * Playwright Global Setup
 * Proper E2E infrastructure with meaningful setup logic
 */

import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(config: FullConfig) {
  console.log('🔧 E2E Global Setup: Initializing test environment...');
  
  // Set environment variables for test mode
  process.env.NEXT_PUBLIC_IS_E2E_TEST = 'true';
  process.env.NEXT_PUBLIC_E2E_SIGNALS = 'true';
  process.env.NODE_ENV = 'test';
  
  // Verify Next.js build is available for production tests
  const isCI = process.env.CI === 'true';
  if (isCI) {
    try {
      // Check if .next directory exists
      execSync('test -d .next', { stdio: 'ignore' });
      console.log('✅ Next.js build verified');
    } catch (error) {
      console.warn('⚠️ No Next.js build found - will use dev server');
    }
  }
  
  // Verify test constants are available
  try {
    const testConstants = require('./config/constants');
    if (testConstants.SELECTORS && testConstants.TIMEOUTS) {
      console.log('✅ E2E test constants loaded');
    } else {
      throw new Error('Invalid test constants structure');
    }
  } catch (error) {
    console.error('❌ Failed to load E2E test constants:', error);
    throw error;
  }
  
  // Set up test-specific configurations
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  
  console.log('🚀 E2E Global Setup: Environment ready');
  
  return Promise.resolve();
}

export default globalSetup;