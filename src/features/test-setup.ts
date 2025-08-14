/**
 * Vitest Test Setup
 * 
 * This file configures the test environment for all Vitest tests
 * in the features/ directory. It handles both Node.js and DOM environments.
 */

// @testing-library/jest-dom removed - using Vitest native matchers
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// --- Global Setup (Environment-Agnostic) ---
// This runs in ALL environments (node and jsdom)

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// --- Browser-Only Setup (jsdom/happy-dom) ---
// Guard all browser-specific mocks and setup here
if (typeof window !== 'undefined' && typeof globalThis.window !== 'undefined') {
  // Mock localStorage
  const createLocalStorageMock = (): Storage => {
    let store: { [key: string]: string } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn(),
    };
  };

  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
    configurable: true,
  });

  // Mock addEventListener/removeEventListener/dispatchEvent on window
  window.addEventListener = vi.fn();
  window.removeEventListener = vi.fn();
  window.dispatchEvent = vi.fn();

  // Mock window.matchMedia for components that use media queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Observer API mocks are now handled by tests/setup/observer-polyfill.ts
// which provides proper ES6 class implementations that pass instanceof checks

// --- Console Management ---
// Suppress console errors in tests unless explicitly testing error cases
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: navigation'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});