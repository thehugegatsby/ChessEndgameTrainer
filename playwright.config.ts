import { defineConfig, devices } from '@playwright/test';
import { APP_CONFIG } from './config/constants';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI 
    ? [['junit', { outputFile: 'results.xml' }], ['html', { open: 'never' }]]
    : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: APP_CONFIG.DEV_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Record video only on failure */
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    /* Run tests in headless mode to prevent browser window spawning */
    headless: true,
    
    /* Set E2E test mode header to enable Test Bridge and MockEngineService */
    extraHTTPHeaders: {
      'x-e2e-test-mode': 'true'
    },
    
    /* Increased timeouts for Two-Phase Ready Detection system */
    actionTimeout: 10000, // 10s for individual actions (clicks, etc.)
    navigationTimeout: 30000, // 30s for page navigation and ready detection
    
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx cross-env NEXT_PUBLIC_IS_E2E_TEST=true NEXT_PUBLIC_E2E_SIGNALS=true npm run dev',
    url: APP_CONFIG.DEV_URL,
    reuseExistingServer: false, // Always start fresh server for consistent testing
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_IS_E2E_TEST: 'true',
      NEXT_PUBLIC_E2E_SIGNALS: 'true',
    },
  },
});