/**
 * Mock Browser APIs for Testing
 * Simple, focused mocks for Jest 30 compatibility
 */

/**
 * Create a mock Storage (localStorage/sessionStorage)
 */
export function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  
  // Helper to create mock function that works with or without Jest
  const mockFn = (impl: Function) => {
    if (typeof jest !== 'undefined' && jest.fn) {
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
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: mockFn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
}

/**
 * Create a mock Navigator
 */
export function createMockNavigator(): Navigator {
  const mockFn = (impl?: Function) => {
    if (typeof jest !== 'undefined' && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn().mockResolvedValue(undefined);
    }
    return impl || (() => Promise.resolve(undefined));
  };

  return {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    onLine: true,
    clipboard: {
      writeText: mockFn(),
      readText: mockFn(() => Promise.resolve('mock text'))
    } as any,
    share: mockFn(),
    // Add other navigator properties as needed
  } as any;
}

/**
 * Create a mock Window
 */
export function createMockWindow(): Window {
  const mockFn = (impl?: Function) => {
    if (typeof jest !== 'undefined' && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn();
    }
    return impl || (() => {});
  };

  return {
    localStorage: createMockStorage(),
    sessionStorage: createMockStorage(),
    screen: {
      width: 1920,
      height: 1080
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
    }))
  } as any;
}

/**
 * Create a mock Document
 */
export function createMockDocument(): Document {
  const mockFn = (impl?: Function) => {
    if (typeof jest !== 'undefined' && jest.fn) {
      return impl ? jest.fn(impl) : jest.fn();
    }
    return impl || (() => {});
  };

  return {
    createElement: mockFn(() => ({
      style: {},
      select: mockFn(),
      remove: mockFn()
    })),
    body: {
      appendChild: mockFn(),
      removeChild: mockFn()
    },
    execCommand: mockFn(() => true),
    referrer: ''
  } as any;
}

/**
 * Create a mock Performance
 */
export function createMockPerformance(): Performance {
  let mockTime = 0;
  
  const mockFn = (impl?: Function) => {
    if (typeof jest !== 'undefined' && jest.fn) {
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
    clearMeasures: mockFn()
  } as any;
}