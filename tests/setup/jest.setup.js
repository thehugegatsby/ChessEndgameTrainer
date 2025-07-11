/**
 * Jest setup file - global test configuration
 */

// Import jest-dom for additional matchers
import '@testing-library/jest-dom';

// Global test timeout
jest.setTimeout(30000);

// Mock Worker global for tests
if (typeof Worker === 'undefined') {
  global.Worker = class Worker {
    constructor(scriptURL) {
      this.scriptURL = scriptURL;
      this.onmessage = null;
      this.onerror = null;
      this.onmessageerror = null;
    }
    
    postMessage(message) {
      // This will be replaced by mock implementations
    }
    
    terminate() {
      // This will be replaced by mock implementations
    }
  };
}

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Mock console.error to suppress expected errors in tests
  console.error = jest.fn((message) => {
    if (typeof message === 'string' && message.includes('Warning: ReactDOM.render is deprecated')) {
      return;
    }
    if (typeof message === 'string' && message.includes('Warning: render is deprecated')) {
      return;
    }
    originalConsoleError(message);
  });

  // Mock console.warn to suppress warnings
  console.warn = jest.fn((message) => {
    if (typeof message === 'string' && message.includes('componentWillReceiveProps')) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockFen: (options = {}) => {
    const {
      pieces = '2K5/2P2k2/8/8/4R3/8/1r6/8',
      activeColor = 'w',
      castling = '-',
      enPassant = '-',
      halfmove = '0',
      fullmove = '1'
    } = options;
    
    return `${pieces} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
  },
  
  createMockTablebaseData: (wdl = 2, dtm = null, dtz = null) => ({
    wdl,
    dtm,
    dtz,
    category: wdl > 0 ? 'win' : wdl < 0 ? 'loss' : 'draw',
    precise: true
  }),
  
  createMockEngineData: (score = 150, mate = null) => ({
    score,
    mate,
    evaluation: `+${(score / 100).toFixed(2)}`,
    depth: 20,
    nodes: 1000000,
    time: 2000
  })
};// Test trigger 2025-07-06_23:52:44
