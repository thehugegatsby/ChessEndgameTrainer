/**
 * Jest Setup - Hybrid Fetch Solution
 * 
 * This setup provides:
 * - cross-fetch polyfill for Node.js environment (enables real API calls)
 * - jest-fetch-mock for unit tests (fast, deterministic mocks)
 * - Environment-based control for integration vs unit tests
 */

// 1. First, provide fetch polyfill for Node.js environment
// This enables real API calls in integration tests
import 'cross-fetch/polyfill';

// 2. Then enable jest-fetch-mock for unit tests
// This will override the polyfill for most tests, providing fast mocks
require('jest-fetch-mock').enableMocks();

// 3. Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 4. Setup for JSDOM environment (React component tests)
if (typeof window !== 'undefined') {
  // Mock IntersectionObserver for React components
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock ResizeObserver for React components
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// 5. Environment detection utilities
global.isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === 'true';
global.isUnitTest = !global.isIntegrationTest;

console.log(`🧪 Jest Setup: ${global.isIntegrationTest ? 'Integration' : 'Unit'} test mode`);