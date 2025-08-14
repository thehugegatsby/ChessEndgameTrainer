/**
 * @file Global Test Setup for Component Tests
 * @description Configures Jest environment for E2E component testing
 */

// Global test setup
// @testing-library/jest-dom removed - using Vitest native matchers

// Mock timers for debounce/throttle testing
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// Mock window objects for test bridge
global.window = Object.create(window);

// Define E2E Test Bridge on window
Object.defineProperty(window, "__E2E_TEST_BRIDGE__", {
  value: undefined,
  writable: true,
  configurable: true,
});

// Define E2E test mode flag
Object.defineProperty(window, "__E2E_TEST_MODE__", {
  value: false,
  writable: true,
  configurable: true,
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Restore console for test failures
afterEach(() => {
  if (
    expect.getState().currentTestName &&
    expect.getState().assertionCalls > 0 &&
    expect.getState().numPassingAsserts < expect.getState().assertionCalls
  ) {
    // Test failed, restore console to see error details
    global.console = originalConsole;
  }
});

// Helper to create test bridge mock
/**
 * Creates a mock test bridge for E2E testing
 */
interface TestBridgeMock {
  waitForReady: ReturnType<typeof vi.fn>;
  enableDebugLogging: ReturnType<typeof vi.fn>;
  disableDebugLogging: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  addCustomResponse: ReturnType<typeof vi.fn>;
  getResponseTime: ReturnType<typeof vi.fn>;
  diagnostic: {
    getCurrentFen: ReturnType<typeof vi.fn>;
    getStatus: ReturnType<typeof vi.fn>;
  };
  tablebase: {
    setPosition: ReturnType<typeof vi.fn>;
    getEvaluation: ReturnType<typeof vi.fn>;
  };
}

export const createTestBridgeMock = (): TestBridgeMock => ({
  waitForReady: vi.fn().mockResolvedValue(true),
  enableDebugLogging: vi.fn(),
  disableDebugLogging: vi.fn(),
  reset: vi.fn().mockResolvedValue(undefined),
  addCustomResponse: vi.fn().mockResolvedValue(undefined),
  getResponseTime: vi.fn().mockReturnValue(100),
  diagnostic: {
    getCurrentFen: vi.fn()
      .fn()
      .mockReturnValue(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
    getStatus: vi.fn().mockReturnValue({ ready: true, initialized: true }),
  },
  tablebase: {
    setPosition: vi.fn(),
    getEvaluation: vi.fn().mockResolvedValue({ evaluation: 0.15, depth: 10 }),
  },
});

// Default timeout for async operations in tests
export /**
 *
 */
const TEST_TIMEOUT = 5000;
