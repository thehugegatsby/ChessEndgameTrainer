/**
 * Base Jest Setup
 * Common setup for all Jest tests (unit, integration, etc.)
 */

import '@testing-library/jest-dom';
import { enableMapSet } from 'immer';
import fetchMock from 'jest-fetch-mock';

// ============================================
// Logger Mock - Silence debug/info/warn in tests
// ============================================
jest.mock('@shared/services/logging/Logger', () => ({
  getLogger: () => ({
    setContext: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: console.error, // Keep errors visible
      log: jest.fn(),
    })),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Keep errors visible
    log: jest.fn(),
  }),
  DefaultLogger: jest.fn(),
  ConsoleTransport: jest.fn(),
}));

// Enable Immer MapSet plugin for Zustand
enableMapSet();

// Enable jest-fetch-mock
fetchMock.enableMocks();

// ============================================
// Global Mocks
// ============================================

// Mock fetch API (can be overridden in specific tests)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response)
);

// Mock Worker API
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onmessage: null,
  onerror: null,
  dispatchEvent: jest.fn(),
  onmessageerror: null,
})) as any;

// Mock AbortController for older Node versions
if (!global.AbortController) {
  global.AbortController = class AbortController {
    signal: AbortSignal;
    
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onabort: null,
        reason: undefined,
        throwIfAborted: jest.fn(),
      } as any;
    }

    abort(): void {
      (this.signal as any).aborted = true;
    }
  };
}

// ============================================
// DOM Environment Mocks (only in jsdom environment)
// ============================================

if (typeof window !== 'undefined') {
  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: jest.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.alert
  global.alert = jest.fn();
}

// ============================================
// Console Suppression
// ============================================

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress specific console errors that are expected in tests
  jest.spyOn(console, 'error').mockImplementation((message) => {
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is deprecated') ||
       message.includes('Warning: render is deprecated') ||
       message.includes('Not implemented: navigation'))
    ) {
      return;
    }
    originalConsoleError(message);
  });

  // Suppress specific console warnings
  jest.spyOn(console, 'warn').mockImplementation((message) => {
    if (
      typeof message === 'string' &&
      message.includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

// ============================================
// Global Test Utilities
// ============================================

(global as any).testUtils = {
  /**
   * Create a mock FEN string for testing
   */
  createMockFen: (options = {}) => {
    const {
      pieces = '2K5/2P2k2/8/8/4R3/8/1r6/8',
      activeColor = 'w',
      castling = '-',
      enPassant = '-',
      halfmove = '0',
      fullmove = '1',
    } = options as any;

    return `${pieces} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
  },

  /**
   * Create mock tablebase data
   */
  createMockTablebaseData: (wdl = 2, dtm = null, dtz = null) => ({
    wdl,
    dtm,
    dtz,
    category: (() => {
      if (wdl > 0) return 'win';
      if (wdl < 0) return 'loss';
      return 'draw';
    })(),
    precise: true,
  }),

  /**
   * Create mock engine data
   */
  createMockEngineData: (score = 150, mate = null) => ({
    score,
    mate,
    evaluation: `+${(score / 100).toFixed(2)}`,
    depth: 20,
    nodes: 1000000,
    time: 2000,
  }),
};