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

// --- Global Mock Objects (All Environments) ---
// Mock IntersectionObserver for components that use it (including Next.js)
const IntersectionObserverMock = vi.fn().mockImplementation((_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin ?? '0px';
  const t = options?.threshold;
  const thresholds = t === null || t === undefined ? [0] : Array.isArray(t) ? t : [t];
  
  return {
    root,
    rootMargin,
    thresholds,
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  };
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: IntersectionObserverMock,
  writable: true,
  configurable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', {
    value: IntersectionObserverMock,
    writable: true,
    configurable: true,
  });
}

// Mock ResizeObserver for components that use it (including react-chessboard)
const ResizeObserverMock = vi.fn().mockImplementation((_callback: ResizeObserverCallback) => {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  };
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true,
  configurable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ResizeObserver', {
    value: ResizeObserverMock,
    writable: true,
    configurable: true,
  });
}

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