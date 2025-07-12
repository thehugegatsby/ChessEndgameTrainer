// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Mock für Web Worker
const mockWorker = {
  postMessage: jest.fn(),
  addEventListener: jest.fn((event, callback) => {
    if (event === 'message') {
      mockWorker.onmessage = callback;
    } else if (event === 'error') {
      mockWorker.onerror = callback;
    }
  }),
  removeEventListener: jest.fn(),
  terminate: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn()
};

// Reset mock before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockWorker.onmessage = jest.fn();
  mockWorker.onerror = jest.fn();
});

global.Worker = jest.fn(() => mockWorker);

// Export mockWorker for use in tests
global.mockWorker = mockWorker;

// Mock für fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true
  })
);

// Mock für ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock für window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock Next.js router (useRouter)
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'test-scenario' },
    push: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    route: '/',
    asPath: '/',
  }),
}));

// Stub window.alert for tests
global.alert = jest.fn(); 

/**
 * @deprecated GLOBAL LOGGER MOCK - SCHEDULED FOR REMOVAL
 * 
 * ⚠️  WARNING: This global logger mock is being phased out!
 * 
 * With resetMocks: true enabled, this mock is effectively INERT.
 * All mock implementations are reset before each test runs.
 * 
 * MIGRATION REQUIRED:
 * Please use the new centralized pattern in your test files:
 * 
 * jest.mock('@shared/services/logging', () => ({
 *   getLogger: () => require('../../shared/logger-utils').createTestLogger()
 * }));
 * 
 * See: tests/shared/logger-utils.ts for available utilities
 * See: docs/testing/TEST_UTILITIES.md for migration guide
 * 
 * This global mock will be REMOVED after all tests are migrated.
 * Track progress: Phase 2 Logger-Mock-Migration
 */

// Mock the logger service to prevent setContext errors
jest.mock('@shared/services/logging', () => {
  // Deprecation warning to encourage migration
  console.warn(`
    ******************************************************************
    DEPRECATION WARNING: Global logger mock is active in jest.setup.js
    This mock is deprecated and will be removed soon.
    Please migrate your test to use the centralized logger utility.
    See docs/testing/TEST_UTILITIES.md for migration instructions.
    ******************************************************************
  `);
  
  return {
    getLogger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
      setContext: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        fatal: jest.fn(),
        setContext: jest.fn(),
        clearContext: jest.fn(),
      })),
      clearContext: jest.fn(),
    })),
    createLogger: jest.fn(),
    resetLogger: jest.fn(),
  };
});