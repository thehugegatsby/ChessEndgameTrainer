/**
 * Test Container Utilities
 * Easy setup for Jest tests with ServiceContainer
 */

import { ServiceContainer, IServiceContainer, IBrowserAPIs } from '@shared/services/container';
import { BrowserAPIs } from '@shared/services/platform/web/WebPlatformService';
import { MockStorage } from './MockStorage';

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
  const container = new ServiceContainer();
  
  // Create mock instances
  const mockStorage = overrides?.localStorage || new MockStorage();
  const mockNavigator = overrides?.navigator || {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    onLine: true,
    deviceMemory: 8,
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue('mocked text')
    },
    share: jest.fn().mockResolvedValue(undefined)
  } as any;

  const mockWindow = overrides?.window || {
    screen: { width: 1920, height: 1080 },
    devicePixelRatio: 1,
    localStorage: mockStorage,
    sessionStorage: overrides?.sessionStorage || new MockStorage()
  } as any;

  const mockDocument = overrides?.document || {
    createElement: jest.fn(),
    body: { appendChild: jest.fn(), removeChild: jest.fn() }
  } as any;

  const mockPerformance = overrides?.performance || {
    now: jest.fn().mockReturnValue(1000)
  } as any;

  // Build browser APIs object
  const browserAPIs: BrowserAPIs = {
    localStorage: mockStorage,
    sessionStorage: mockWindow.sessionStorage,
    navigator: mockNavigator,
    window: mockWindow,
    document: mockDocument,
    performance: mockPerformance
  };

  // Register browser APIs individually for direct access
  container.registerCustom('browser.localStorage', () => browserAPIs.localStorage);
  container.registerCustom('browser.navigator', () => browserAPIs.navigator);
  container.registerCustom('browser.window', () => browserAPIs.window!);
  container.registerCustom('browser.document', () => browserAPIs.document!);
  container.registerCustom('browser.performance', () => browserAPIs.performance!);

  // Register the WebPlatformService with injected mock dependencies
  container.registerCustom('platform.service', () => {
    const { WebPlatformService } = require('@shared/services/platform/web/WebPlatformService');
    return new WebPlatformService(browserAPIs);
  });

  // Register individual platform services that delegate to the main service
  container.register('platform.storage', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.storage;
  });
  
  container.register('platform.notifications', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.notifications;
  });
  
  container.register('platform.device', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.device;
  });
  
  container.register('platform.performance', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.performance;
  });
  
  container.register('platform.clipboard', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.clipboard;
  });
  
  container.register('platform.share', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.share;
  });
  
  container.register('platform.analytics', (c) => {
    const platformService = c.resolveCustom('platform.service');
    return platformService.analytics;
  });

  return container;
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
    return React.createElement(ServiceProvider, { container }, children);
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
      userAgent: 'Mozilla/5.0 (Test Environment - Offline)',
      deviceMemory: 8,
      connection: { type: 'none', effectiveType: undefined, downlink: 0 },
      mozConnection: { type: 'none', effectiveType: undefined, downlink: 0 },
      webkitConnection: { type: 'none', effectiveType: undefined, downlink: 0 },
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue('mocked text')
      },
      share: jest.fn().mockResolvedValue(undefined)
    } as any;
    
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
      onLine: true,
      userAgent: 'Mozilla/5.0 (Test Environment - Low Memory)',
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue('mocked text')
      },
      share: jest.fn().mockResolvedValue(undefined)
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