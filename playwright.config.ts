/**
 * Playwright Configuration - DISABLED
 * E2E tests deleted during clean architecture migration
 * See ISSUE_E2E_REWRITE.md for rewrite plan
 */

import { defineConfig, devices } from '@playwright/test';
import { APP_CONFIG } from './config/constants';
import * as path from 'path';


// Force evaluation of getter and ensure correct types
const url = String(APP_CONFIG?.DEV_URL || 'http://127.0.0.1:3002');
const port = Number(APP_CONFIG?.DEV_PORT || 3002);

const CI = process.env.CI === 'true';
const TEST_API_PORT = 3003;

const config = {
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
    CI ? ['github'] : ['list']
  ] as any,
  
  // Shared settings
  use: {
    // Base URL for navigation
    baseURL: APP_CONFIG.DEV_URL,
    
    // Collect trace on first retry
    trace: 'on-first-retry' as const,
    
    // Screenshot on failure
    screenshot: { mode: 'only-on-failure' as const },
    
    // Video on first retry
    video: 'on-first-retry' as const,
    
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
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  
  // Web server configuration - simplified to just Next.js dev server
  // IMPORTANT: Playwright expects EITHER 'port' OR 'url', not both!
  webServer: {
    // Use dev server for E2E tests (production build requires Firebase during static generation)
    command: 'npm run dev',
    url: url,  // Using URL only, not port
    timeout: 120000,
    reuseExistingServer: !CI,
    env: {
      NEXT_PUBLIC_IS_E2E_TEST: 'true',
      NEXT_PUBLIC_E2E_SIGNALS: 'true',
      IS_E2E_TEST: 'true',  // Server-side E2E detection
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      NODE_ENV: 'test',
    },
  },
};

export default defineConfig(config);

// Environment variables for tests
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';