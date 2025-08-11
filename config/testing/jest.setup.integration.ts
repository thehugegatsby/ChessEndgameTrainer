/**
 * Integration Test Setup
 * Additional setup specifically for integration tests
 */

import 'cross-fetch/polyfill'; // Enable real API calls for integration tests

// ============================================
// Integration Test Environment
// ============================================

// Set integration test flag
global.isIntegrationTest = true;
global.isUnitTest = false;

// ============================================
// Extended Timeouts
// ============================================

// Some integration tests may need longer timeouts
jest.setTimeout(30000);

// ============================================
// Firebase Emulator Setup (if needed)
// ============================================

if (process.env.USE_FIREBASE_EMULATOR === 'true') {
  // Configure Firebase to use emulator
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  
  console.log('🔥 Using Firebase Emulator for integration tests');
}

// ============================================
// Database/API Cleanup
// ============================================

beforeAll(async () => {
  // Setup code that runs once before all integration tests
  // e.g., seed test database, start test server, etc.
});

afterAll(async () => {
  // Cleanup code that runs once after all integration tests
  // e.g., clear test database, close connections, etc.
});

beforeEach(() => {
  // Reset any shared state between integration tests
});

afterEach(() => {
  // Clean up after each integration test
});