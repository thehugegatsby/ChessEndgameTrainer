/**
 * Test Container Utilities
 * Easy setup for Jest tests with ServiceContainer
 */

import { ServiceContainer, IServiceContainer, IBrowserAPIs } from '@shared/services/container';

/**
 * Service overrides for specific tests
 */
export interface TestServiceOverrides {
  localStorage?: Storage;
  sessionStorage?: Storage;
  navigator?: Navigator;
  window?: Window;
  document?: Document;
  performance?: Performance;
}

/**
 * Create a test container with optional overrides
 * Main entry point for Jest tests - replaces global localStorage mocks
 */
export function createTestContainer(overrides?: TestServiceOverrides): IServiceContainer {
  // Create base mock APIs
  const mockAPIs: Partial<IBrowserAPIs> = {};

  // Apply overrides if provided
  if (overrides?.localStorage) mockAPIs.localStorage = overrides.localStorage;
  if (overrides?.sessionStorage) mockAPIs.sessionStorage = overrides.sessionStorage;
  if (overrides?.navigator) mockAPIs.navigator = overrides.navigator;
  if (overrides?.window) mockAPIs.window = overrides.window;
  if (overrides?.document) mockAPIs.document = overrides.document;
  if (overrides?.performance) mockAPIs.performance = overrides.performance;

  return ServiceContainer.createTestContainer(mockAPIs);
}

/**
 * Setup function for beforeEach hooks
 * Ensures clean container per test
 */
export function setupTestContainer(overrides?: TestServiceOverrides): () => IServiceContainer {
  let container: IServiceContainer;

  beforeEach(() => {
    container = createTestContainer(overrides);
  });

  return () => container;
}

/**
 * React Testing Library helper
 * Provides ServiceContainer context for component tests
 */
export function createTestWrapper(overrides?: TestServiceOverrides) {
  const container = createTestContainer(overrides);
  
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    // Dynamic import to avoid SSR issues
    const { ServiceProvider } = require('@shared/services/container/adapter');
    return <ServiceProvider container={container}>{children}</ServiceProvider>;
  };
}

/**
 * Mock localStorage that works with or without Jest
 */
export function createMockLocalStorage(): Storage {
  const store: Record<string, string> = {};

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
 * Pre-configured test scenarios for common use cases
 */
export const TestScenarios = {
  /**
   * Default test container - most common use case
   */
  default: () => createTestContainer(),

  /**
   * localStorage with pre-populated data
   */
  withStorageData: (data: Record<string, string>) => {
    const mockStorage = createMockLocalStorage();
    Object.entries(data).forEach(([key, value]) => {
      mockStorage.setItem(key, value);
    });
    
    return createTestContainer({ localStorage: mockStorage });
  },

  /**
   * Offline scenario
   */
  offline: () => {
    const mockNavigator = {
      onLine: false,
      userAgent: 'Mozilla/5.0 (Test Environment - Offline)'
    } as Navigator;
    
    return createTestContainer({ navigator: mockNavigator });
  },

  /**
   * Mobile device scenario
   */
  mobile: () => {
    const mockNavigator = {
      onLine: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
    } as Navigator;
    
    const mockWindow = {
      screen: { width: 375, height: 667 },
      devicePixelRatio: 2
    } as Window;
    
    return createTestContainer({ 
      navigator: mockNavigator,
      window: mockWindow
    });
  },

  /**
   * Low memory device scenario
   */
  lowMemory: () => {
    const mockNavigator = {
      deviceMemory: 2, // 2GB
      onLine: true
    } as any;
    
    return createTestContainer({ navigator: mockNavigator });
  }
};

/**
 * Assertion helpers for common test patterns
 */
export const TestAssertions = {
  /**
   * Assert localStorage operations
   */
  expectStorageCall: (storage: Storage, method: keyof Storage, ...args: any[]) => {
    if (typeof jest !== 'undefined') {
      expect(storage[method]).toHaveBeenCalledWith(...args);
    }
  },

  /**
   * Assert storage state
   */
  expectStorageState: (storage: Storage, expectedData: Record<string, string>) => {
    Object.entries(expectedData).forEach(([key, value]) => {
      expect(storage.getItem(key)).toBe(value);
    });
  },

  /**
   * Assert storage is empty
   */
  expectStorageEmpty: (storage: Storage) => {
    expect(storage.length).toBe(0);
  }
};