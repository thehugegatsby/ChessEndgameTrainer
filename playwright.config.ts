/**
 * Playwright Configuration
 * Clean architecture setup with test API and Firebase emulator
 */

import { defineConfig, devices } from '@playwright/test';
import { APP_CONFIG } from './config/constants';
import * as path from 'path';

const CI = process.env.CI === 'true';
const TEST_API_PORT = 3003;

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Test execution
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 4 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { open: !CI }],
    ['json', { outputFile: 'test-results/results.json' }],
    CI ? ['github'] : ['list'],
  ],
  
  // Shared settings
  use: {
    // Base URL for navigation
    baseURL: APP_CONFIG.DEV_URL,
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on first retry
    video: 'on-first-retry',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Run tests in headless mode
    headless: true,
    
    // Set E2E test mode header
    extraHTTPHeaders: {
      'x-e2e-test-mode': 'true'
    },
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Global timeout
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  
  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'firebase',
      testDir: './tests/e2e/firebase',
      use: { 
        ...devices['Desktop Chrome'],
        // Firebase tests get more time due to emulator
        actionTimeout: 15000,
        navigationTimeout: 45000,
      },
    },
  ],
  
  // Output folder for test artifacts
  outputDir: 'test-results/',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  
  // Web servers to run
  webServer: [
    {
      // Next.js dev server
      command: CI ? 'npm run build && npm run start' : 'npm run dev',
      url: APP_CONFIG.DEV_URL,
      port: APP_CONFIG.DEV_PORT,
      timeout: 120000,
      reuseExistingServer: !CI,
      env: {
        NEXT_PUBLIC_IS_E2E_TEST: 'true',
        NEXT_PUBLIC_E2E_SIGNALS: 'true',
        FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      },
    },
    {
      // Test API server
      command: 'npx tsx tests/utils/start-test-api-server.ts',
      port: TEST_API_PORT,
      timeout: 30000,
      reuseExistingServer: !CI,
      env: {
        NODE_ENV: 'test',
        FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      },
    },
    // Firebase emulator is started in global setup
  ],
});

// Environment variables for tests
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';