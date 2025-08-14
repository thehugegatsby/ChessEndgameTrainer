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
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? '0px';
    const t = options?.threshold;
    this.thresholds = t === null || t === undefined ? [0] : Array.isArray(t) ? t : [t];
  }

  // Define as prototype methods (some libs check IntersectionObserver.prototype.*)
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

// Attach spies to the prototype so methods are real functions and spy-able
MockIntersectionObserver.prototype.observe = vi.fn();
MockIntersectionObserver.prototype.unobserve = vi.fn();
MockIntersectionObserver.prototype.disconnect = vi.fn();
MockIntersectionObserver.prototype.takeRecords = vi.fn(() => []);

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
  configurable: true,
});

// Also set it on window to satisfy libraries that read from window directly
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    writable: true,
    configurable: true,
  });
}

// Mock ResizeObserver for components that use it (including react-chessboard)
class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
    // Store callback if needed for advanced testing
  }

  // Define as prototype methods (some libs check ResizeObserver.prototype.*)
  observe(_target: Element, _options?: ResizeObserverOptions): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): ResizeObserverEntry[] { return []; }
}

// Attach spies to the prototype so methods are real functions and spy-able
MockResizeObserver.prototype.observe = vi.fn();
MockResizeObserver.prototype.unobserve = vi.fn();
MockResizeObserver.prototype.disconnect = vi.fn();
MockResizeObserver.prototype.takeRecords = vi.fn(() => []);

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
  configurable: true,
});

// Also set it on window to satisfy libraries that read from window directly
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ResizeObserver', {
    value: MockResizeObserver,
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