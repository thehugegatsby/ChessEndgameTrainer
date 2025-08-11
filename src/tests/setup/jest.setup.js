/**
 * Jest setup file - global test configuration
 */

// Import jest-dom for additional matchers
import "@testing-library/jest-dom";

// Enable Immer MapSet plugin for Zustand
import { enableMapSet } from "immer";
enableMapSet();

// Global test timeout
jest.setTimeout(30000);

// Mock Worker global for tests
if (typeof Worker === "undefined") {
  global.Worker = class Worker {
    constructor(scriptURL) {
      this.scriptURL = scriptURL;
      this.onmessage = null;
      this.onerror = null;
      this.onmessageerror = null;
    }

    /**
     * Mock postMessage implementation
     * @param message - Message to post
     */
    postMessage(message): void {
      // This will be replaced by mock implementations
    }

    /**
     * Mock terminate implementation
     */
    terminate(): void {
      // This will be replaced by mock implementations
    }
  };
}

// Store original console methods to restore later
// eslint-disable-next-line no-console
const originalConsoleError = console.error;
// eslint-disable-next-line no-console
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress specific console errors that are expected in tests
  jest.spyOn(console, 'error').mockImplementation((message) => {
    if (
      typeof message === "string" &&
      (message.includes("Warning: ReactDOM.render is deprecated") ||
       message.includes("Warning: render is deprecated"))
    ) {
      return;
    }
    // Silently ignore without calling original
  });

  // Suppress specific console warnings that are expected in tests
  jest.spyOn(console, 'warn').mockImplementation((message) => {
    if (
      typeof message === "string" &&
      message.includes("componentWillReceiveProps")
    ) {
      return;
    }
    // Silently ignore without calling original
  });
});

afterEach(() => {
  // Restore original console methods
  jest.restoreAllMocks();
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
/**
 * Global test utilities for creating mock data
 */
global.testUtils = {
  /**
   * Create a mock FEN string for testing
   * @param options - FEN components
   * @returns Valid FEN string
   */
  createMockFen: (options = {}) => {
    const {
      pieces = "2K5/2P2k2/8/8/4R3/8/1r6/8",
      activeColor = "w",
      castling = "-",
      enPassant = "-",
      halfmove = "0",
      fullmove = "1",
    } = options;

    return `${pieces} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
  },

  /**
   * Create mock tablebase data
   * @param wdl - Win/Draw/Loss value
   * @param dtm - Distance to mate
   * @param dtz - Distance to zeroing
   * @returns Mock tablebase data
   */
  createMockTablebaseData: (wdl = 2, dtm = null, dtz = null) => ({
    wdl,
    dtm,
    dtz,
    category: (() => {
      if (wdl > 0) return "win";
      if (wdl < 0) return "loss";
      return "draw";
    })(),
    precise: true,
  }),

  /**
   * Create mock engine data
   * @param score - Engine score
   * @param mate - Mate in X moves
   * @returns Mock engine data
   */
  createMockEngineData: (score = 150, mate = null) => ({
    score,
    mate,
    evaluation: `+${(score / 100).toFixed(2)}`,
    depth: 20,
    nodes: 1000000,
    time: 2000,
  }),
}; // Test trigger 2025-07-06_23:52:44
