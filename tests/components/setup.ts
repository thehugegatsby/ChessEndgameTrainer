/**
 * @fileoverview Global Test Setup for Component Tests
 * @description Configures Jest environment for E2E component testing
 */

// Global test setup
import '@testing-library/jest-dom';

// Mock timers for debounce/throttle testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

// Mock window objects for test bridge
global.window = Object.create(window);

// Define E2E Test Bridge on window
Object.defineProperty(window, '__E2E_TEST_BRIDGE__', {
  value: undefined,
  writable: true,
  configurable: true
});

// Define E2E test mode flag
Object.defineProperty(window, '__E2E_TEST_MODE__', {
  value: false,
  writable: true,
  configurable: true
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console for test failures
afterEach(() => {
  if (expect.getState().currentTestName && 
      expect.getState().assertionCalls > 0 && 
      expect.getState().numPassingAsserts < expect.getState().assertionCalls) {
    // Test failed, restore console to see error details
    global.console = originalConsole;
  }
});

// Helper to create test bridge mock
export const createTestBridgeMock = () => ({
  waitForReady: jest.fn().mockResolvedValue(true),
  enableDebugLogging: jest.fn(),
  disableDebugLogging: jest.fn(),
  reset: jest.fn().mockResolvedValue(undefined),
  addCustomResponse: jest.fn().mockResolvedValue(undefined),
  getResponseTime: jest.fn().mockReturnValue(100),
  diagnostic: {
    getCurrentFen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    getStatus: jest.fn().mockReturnValue({ ready: true, initialized: true })
  },
  engine: {
    setPosition: jest.fn(),
    getEvaluation: jest.fn().mockResolvedValue({ evaluation: 0.15, depth: 10 })
  }
});

// Default timeout for async operations in tests
export const TEST_TIMEOUT = 5000;