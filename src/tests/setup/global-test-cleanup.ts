/**
 * Global Test Cleanup Configuration
 * 
 * Automatically registers cleanup handlers for all tests.
 * This file is loaded via setupFilesAfterEnv in Jest config.
 * 
 * CRITICAL: We CANNOT import MockManager here as it would cause modules 
 * to be cached before jest.mock() can hoist in test files.
 * Instead, we provide minimal cleanup without MockManager.
 */

// Polyfill TextEncoder/TextDecoder for Node.js tests (required by MSW)
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

// Register global cleanup after each test
afterEach(() => {
  // Clear mock call history but NOT mock implementations
  // This is safe and doesn't interfere with jest.mock() hoisting
  jest.clearAllMocks();
  
  // Clear any fake timers
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers();
  }
});

// Additional cleanup after all tests in a file
afterAll(() => {
  // Clear all intervals and timeouts
  jest.clearAllTimers();
  
  // Note: Do NOT use jest.restoreAllMocks() as it interferes with module mocks
});

// Handle unhandled promise rejections in tests
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection in test:', reason);
  });
}

// Note: MockManager must be imported directly in test files that need it,
// NOT here in the global setup to avoid interfering with jest.mock() hoisting