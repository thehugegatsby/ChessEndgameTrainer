/**
 * Global Test Cleanup Configuration
 * 
 * Automatically registers cleanup handlers for all tests.
 * This file is loaded via setupFilesAfterEnv in Jest config.
 */

import { mockManager } from '../mocks/MockManager';

// Register global cleanup after each test
afterEach(() => {
  // Clean up all mock factories
  mockManager.cleanupAfterEach();
  
  // Verify cleanup in development/debug mode
  if (process.env.DEBUG_MOCKS === 'true') {
    mockManager.verifyCleanup();
  }
});

// Additional cleanup after all tests in a file
afterAll(() => {
  // More thorough cleanup
  mockManager.resetAll();
  
  // Clear all intervals and timeouts
  jest.clearAllTimers();
  
  // Restore all mocks
  jest.restoreAllMocks();
});

// Handle unhandled promise rejections in tests
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection in test:', reason);
  });
}

// Export for explicit use in test files if needed
export { mockManager };