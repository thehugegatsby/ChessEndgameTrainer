/**
 * Integration Test Setup
 *
 * Global setup for integration tests with MSW server configuration.
 * This file runs before all integration tests to initialize the mock API server.
 *
 * Uses jest-fixed-jsdom environment which provides both DOM and Node.js Fetch APIs.
 */

import {
  startTablebaseMSW,
  stopTablebaseMSW,
} from "./fixtures/tablebase-msw-server";

// Global MSW setup for all integration tests
beforeAll(() => {
  // Start MSW server to intercept HTTP requests
  startTablebaseMSW();
});

afterAll(async () => {
  // Clean up MSW server
  await stopTablebaseMSW();
});

// Log when setup is loaded
console.log(
  "🔧 Integration test setup loaded - MSW v2 ready with jest-fixed-jsdom",
);
