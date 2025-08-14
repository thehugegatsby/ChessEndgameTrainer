/**
 * Playwright Configuration for Firebase Tests
 * Separate config to run Firebase tests independently
 */

import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Playwright configuration constants
const PLAYWRIGHT_CONFIG = {
  PORTS: {
    APP: 3002,
    TEST_API: 3003,
    FIRESTORE_EMULATOR: 8080,
  },
  TIMEOUTS: {
    EXPECT: 10000,      // 10 seconds
    ACTION: 15000,      // 15 seconds  
    WEB_SERVER: 30000,  // 30 seconds
    NAVIGATION: 45000,  // 45 seconds
    GLOBAL: 90000,      // 90 seconds
    DEV_SERVER: 120000, // 2 minutes
  },
  VIEWPORT: {
    WIDTH: 1280,
    HEIGHT: 720,
  },
} as const;

export default defineConfig({
  // Test directory
  testDir: "../../tests/e2e/firebase",

  // Test execution
  fullyParallel: false, // Firebase tests should run sequentially
  forbidOnly: false,
  retries: 0,
  workers: 1,

  // Reporter configuration
  reporter: [["html", { open: true }], ["list"]],

  // Shared settings
  use: {
    // Base URL for navigation
    baseURL: `http://localhost:${PLAYWRIGHT_CONFIG.PORTS.APP}`,

    // Collect trace on failure
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Viewport
    viewport: { width: PLAYWRIGHT_CONFIG.VIEWPORT.WIDTH, height: PLAYWRIGHT_CONFIG.VIEWPORT.HEIGHT },

    // Run tests in headless mode
    headless: true,

    // Set E2E test mode header
    extraHTTPHeaders: {
      "x-e2e-test-mode": "true",
    },

    // Timeouts for Firebase operations
    actionTimeout: PLAYWRIGHT_CONFIG.TIMEOUTS.ACTION,
    navigationTimeout: PLAYWRIGHT_CONFIG.TIMEOUTS.NAVIGATION,
  },

  // Global timeout
  timeout: PLAYWRIGHT_CONFIG.TIMEOUTS.GLOBAL,

  // Expect timeout
  expect: {
    timeout: PLAYWRIGHT_CONFIG.TIMEOUTS.EXPECT,
  },

  // Single project for Firebase tests
  projects: [
    {
      name: "firebase-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Output folder for test artifacts
  outputDir: "test-results/",

  // Global setup for Firebase emulator
  globalSetup: require.resolve(
    "../../tests/e2e/firebase/_setup/global.setup.ts",
  ),

  // Web servers to run
  webServer: [
    {
      // Next.js dev server
      command: "npm run dev",
      port: PLAYWRIGHT_CONFIG.PORTS.APP,
      timeout: PLAYWRIGHT_CONFIG.TIMEOUTS.DEV_SERVER,
      reuseExistingServer: true,
      env: {
        ...process.env,
        NODE_ENV: "test",
        NEXT_PUBLIC_IS_E2E_TEST: "true",
        FIRESTORE_EMULATOR_HOST: `localhost:${PLAYWRIGHT_CONFIG.PORTS.FIRESTORE_EMULATOR}`,
      },
    },
    {
      // Test API server
      command: "npx tsx tests/utils/start-test-api-server.ts",
      port: PLAYWRIGHT_CONFIG.PORTS.TEST_API,
      timeout: PLAYWRIGHT_CONFIG.TIMEOUTS.WEB_SERVER,
      reuseExistingServer: true,
      env: {
        ...process.env,
        NODE_ENV: "test",
        FIRESTORE_EMULATOR_HOST: `localhost:${PLAYWRIGHT_CONFIG.PORTS.FIRESTORE_EMULATOR}`,
      },
    },
  ],
});
