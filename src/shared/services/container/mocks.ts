/**
 * @file Mock Browser APIs for testing environments
 * @module services/container/mocks
 * 
 * @description
 * Provides mock implementations of browser APIs for testing environments.
 * Designed for Jest 30 compatibility with fallback support for non-Jest
 * environments. Creates lightweight, focused mocks that simulate browser
 * behavior without the complexity of full browser implementations.
 * 
 * @remarks
 * Key features:
 * - Jest-compatible mock functions with fallback implementations
 * - Storage API mocks (localStorage, sessionStorage) with persistent state
 * - Navigator API mocks with clipboard and sharing functionality
 * - Window object mocks with media queries and screen properties
 * - Document API mocks for DOM manipulation testing
 * - Performance API mocks with realistic timing simulation
 * - Clean, predictable mock behavior for consistent testing
 * 
 * The mocks are designed to be lightweight yet functional, providing
 * the essential behavior needed for unit and integration testing without
 * the overhead of full browser simulation frameworks.
 */

/**
 * Create a mock Storage implementation for localStorage/sessionStorage
 * 
 * @description
 * Creates a mock Storage object that implements the Web Storage API interface.
 * Maintains an in-memory store that persists for the duration of the test,
 * providing realistic storage behavior without actual browser persistence.
 * 
 * @returns {Storage} Mock storage object with full Storage API implementation
 * 
 * @example
 * ```typescript
 * const mockStorage = createMockStorage();
 * mockStorage.setItem('key', 'value');
 * expect(mockStorage.getItem('key')).toBe('value');
 * expect(mockStorage.length).toBe(1);
 * ```
 */
export function createMockStorage(): Storage {
  const store: Record<string, string> = {};

  // Helper to create mock function that works with or without Jest
  const mockFn = (impl: (...args: any[]) => any): any => {
    if (typeof jest !== "undefined" && jest.fn) {
      return jest.fn(impl);
    }
    return impl;
  };

  return {
    getItem: mockFn((key: string) => store[key] || null),
    setItem: mockFn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: mockFn((key: string) => {
      delete store[key];
    }),
    clear: mockFn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: mockFn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
}

/**
 * Create a mock Navigator implementation
 * 
 * @description
 * Creates a mock Navigator object with essential properties and methods
 * for testing browser navigation and API functionality. Includes clipboard
 * API, sharing functionality, and basic device information.
 * 
 * @returns {Navigator} Mock navigator object with common Navigator API methods
 * 
 * @example
 * ```typescript
 * const mockNav = createMockNavigator();
 * expect(mockNav.userAgent).toContain('Test Environment');
 * await mockNav.clipboard.writeText('test');
 * ```
 */
export function createMockNavigator(): Navigator {
  const mockFn = (impl?: (...args: any[]) => any): any => {
    if (typeof jest !== "undefined" && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn().mockResolvedValue(undefined);
    }
    return impl || (() => Promise.resolve(undefined));
  };

  return {
    userAgent: "Mozilla/5.0 (Test Environment)",
    onLine: true,
    clipboard: {
      writeText: mockFn(),
      readText: mockFn(() => Promise.resolve("mock text")),
    } as any,
    share: mockFn(),
    // Add other navigator properties as needed
  } as any;
}

/**
 * Create a mock Window implementation
 * 
 * @description
 * Creates a mock Window object with essential browser window properties
 * and methods. Includes storage APIs, screen information, media queries,
 * and device pixel ratio for comprehensive window testing.
 * 
 * @returns {Window} Mock window object with common Window API properties
 * 
 * @example
 * ```typescript
 * const mockWin = createMockWindow();
 * mockWin.localStorage.setItem('test', 'value');
 * expect(mockWin.screen.width).toBe(1920);
 * ```
 */
export function createMockWindow(): Window {
  const mockFn = (impl?: (...args: any[]) => any): any => {
    if (typeof jest !== "undefined" && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn();
    }
    return impl || (() => {});
  };

  return {
    localStorage: createMockStorage(),
    sessionStorage: createMockStorage(),
    screen: {
      width: 1920,
      height: 1080,
    },
    devicePixelRatio: 1,
    matchMedia: mockFn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: mockFn(),
      removeListener: mockFn(),
      addEventListener: mockFn(),
      removeEventListener: mockFn(),
      dispatchEvent: mockFn(),
    })),
  } as any;
}

/**
 * Create a mock Document implementation
 * 
 * @description
 * Creates a mock Document object with essential DOM manipulation methods.
 * Provides basic document functionality for testing components that
 * interact with the DOM without requiring a full DOM environment.
 * 
 * @returns {Document} Mock document object with common Document API methods
 * 
 * @example
 * ```typescript
 * const mockDoc = createMockDocument();
 * const element = mockDoc.createElement('div');
 * mockDoc.body.appendChild(element);
 * ```
 */
export function createMockDocument(): Document {
  const mockFn = (impl?: (...args: any[]) => any): any => {
    if (typeof jest !== "undefined" && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn();
    }
    return impl || (() => {});
  };

  return {
    createElement: mockFn(() => ({
      style: {},
      select: mockFn(),
      remove: mockFn(),
    })),
    body: {
      appendChild: mockFn(),
      removeChild: mockFn(),
    },
    execCommand: mockFn(() => true),
    referrer: "",
  } as any;
}

/**
 * Create a mock Performance implementation
 * 
 * @description
 * Creates a mock Performance object with timing and measurement functionality.
 * Simulates realistic timing behavior with ~60fps timing intervals and
 * provides performance marking and measurement capabilities for testing.
 * 
 * @returns {Performance} Mock performance object with Performance API methods
 * 
 * @example
 * ```typescript
 * const mockPerf = createMockPerformance();
 * const start = mockPerf.now();
 * mockPerf.mark('test-start');
 * // Simulate work
 * const end = mockPerf.now();
 * expect(end).toBeGreaterThan(start);
 * ```
 */
export function createMockPerformance(): Performance {
  let mockTime = 0;

  const mockFn = (impl?: (...args: any[]) => any): any => {
    if (typeof jest !== "undefined" && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn();
    }
    return impl || (() => {});
  };

  return {
    now: mockFn(() => {
      mockTime += 16.67; // ~60fps
      return mockTime;
    }),
    mark: mockFn(),
    measure: mockFn(),
    getEntries: mockFn(() => []),
    clearMarks: mockFn(),
    clearMeasures: mockFn(),
  } as any;
}
