/**
 * Playwright Configuration for Firebase Tests
 * Separate config to run Firebase tests independently
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  // Test directory
  testDir: '../../tests/e2e/firebase',
  
  // Test execution
  fullyParallel: false, // Firebase tests should run sequentially
  forbidOnly: false,
  retries: 0,
  workers: 1,
  
  // Reporter configuration
  reporter: [
    ['html', { open: true }],
    ['list'],
  ],
  
  // Shared settings
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3002',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Run tests in headless mode
    headless: true,
    
    // Set E2E test mode header
    extraHTTPHeaders: {
      'x-e2e-test-mode': 'true'
    },
    
    // Timeouts for Firebase operations
    actionTimeout: 15000,
    navigationTimeout: 45000,
  },
  
  // Global timeout
  timeout: 90000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
  },
  
  // Single project for Firebase tests
  projects: [
    {
      name: 'firebase-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Output folder for test artifacts
  outputDir: 'test-results/',
  
  // Global setup for Firebase emulator
  globalSetup: require.resolve('../../tests/e2e/firebase/_setup/global.setup.ts'),
  
  // Web servers to run
  webServer: [
    {
      // Next.js dev server
      command: 'npm run dev',
      port: 3002,
      timeout: 120000,
      reuseExistingServer: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_IS_E2E_TEST: 'true',
        FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      },
    },
    {
      // Test API server
      command: 'npx tsx tests/utils/start-test-api-server.ts',
      port: 3003,
      timeout: 30000,
      reuseExistingServer: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      },
    },
  ],
});