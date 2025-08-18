/**
 * Playwright Configuration - E2E Tests
 * Centralized in /config/testing for better organization
 */

import { defineConfig, devices } from '@playwright/test';
import { PORTS } from '../ports';
import { e2eTestsDir, e2eFirebaseDir, testResultsDir } from '../paths';

// Simple configuration constants using centralized ports
const DEV_URL = `http://127.0.0.1:${PORTS.E2E}`; // Use E2E port from config
const CI = process.env.CI === 'true';

const config = {
  // Test directory
  testDir: e2eTestsDir,

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
    // Base URL for navigation - using development server
    baseURL: DEV_URL,

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: { mode: 'only-on-failure' },

    // Video on first retry
    video: 'on-first-retry',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Run tests in headless mode
    headless: true,

    // Set E2E test mode header
    extraHTTPHeaders: {
      'x-e2e-test-mode': 'true',
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
  // Chromium-only for CI stability (webkit has dependency issues in CI)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firebase tests run on all branches
    {
      name: 'firebase',
      testDir: e2eFirebaseDir,
      use: {
        ...devices['Desktop Chrome'],
        // Firebase tests get more time due to emulator
        actionTimeout: 15000,
        navigationTimeout: 45000,
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: testResultsDir,

  // E2E development server with mock environment
  webServer: {
    command: 'npm run dev:e2e',
    url: DEV_URL,
    timeout: 60000,
    reuseExistingServer: true, // Allow reusing existing dev server
    // Übergabe der E2E-Umgebungsvariable direkt an den Next.js-Prozess
    env: {
      NEXT_PUBLIC_IS_E2E_TEST: 'true',
    },
  },
};

export default defineConfig(config);
