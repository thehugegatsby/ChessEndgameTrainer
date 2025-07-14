/**
 * Jest Setup Utilities
 * Common setup patterns for Jest 30 with ServiceContainer
 */

import { IServiceContainer } from '@shared/services/container';
import { createTestContainer, TestServiceOverrides } from './createTestContainer';

/**
 * Global test container for tests that need shared state
 * Use sparingly - prefer per-test containers for better isolation
 */
let globalTestContainer: IServiceContainer | null = null;

/**
 * Setup global test container
 * Call in jest.setup.js or describe block
 */
export function setupGlobalTestContainer(overrides?: TestServiceOverrides): void {
  beforeAll(() => {
    globalTestContainer = createTestContainer(overrides);
  });

  afterAll(() => {
    globalTestContainer = null;
  });

  beforeEach(() => {
    // Clear instances between tests for fresh state
    globalTestContainer?.clearInstances();
  });
}

/**
 * Get global test container
 * Throws error if not set up
 */
export function getGlobalTestContainer(): IServiceContainer {
  if (!globalTestContainer) {
    throw new Error('Global test container not set up. Call setupGlobalTestContainer() first.');
  }
  return globalTestContainer;
}

/**
 * Per-test container setup
 * Preferred approach for better test isolation
 */
export function setupPerTestContainer(overrides?: TestServiceOverrides): () => IServiceContainer {
  let container: IServiceContainer;

  beforeEach(() => {
    container = createTestContainer(overrides);
  });

  afterEach(() => {
    container.clearInstances();
  });

  return () => container;
}

/**
 * React Testing Library setup with ServiceContainer
 */
export function setupReactTestingWithContainer(overrides?: TestServiceOverrides) {
  let container: IServiceContainer;
  let wrapper: React.ComponentType<{ children: React.ReactNode }>;

  beforeEach(() => {
    container = createTestContainer(overrides);
    
    // Create wrapper component
    wrapper = ({ children }: { children: React.ReactNode }) => {
      const { ServiceProvider } = require('@shared/services/container/adapter');
      return React.createElement(ServiceProvider, { container }, children);
    };
  });

  afterEach(() => {
    container.clearInstances();
  });

  return {
    getContainer: () => container,
    getWrapper: () => wrapper
  };
}

/**
 * Common Jest matchers for platform services
 */
export const platformServiceMatchers = {
  /**
   * Check if a service method was called
   */
  toHaveBeenCalledOnService: (service: any, method: string, ...args: any[]) => {
    if (typeof jest !== 'undefined') {
      expect(service[method]).toHaveBeenCalledWith(...args);
    }
  },

  /**
   * Check storage operations
   */
  toHaveStorageItem: (storage: Storage, key: string, value: string) => {
    expect(storage.getItem(key)).toBe(value);
  },

  /**
   * Check storage calls
   */
  toHaveCalledStorageMethod: (storage: Storage, method: keyof Storage, ...args: any[]) => {
    if (typeof jest !== 'undefined') {
      expect((storage as any)[method]).toHaveBeenCalledWith(...args);
    }
  }
};

/**
 * Test environment detection
 */
export const testEnvironment = {
  isJest: typeof jest !== 'undefined',
  isJSDOM: typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom'),
  isNode: typeof process !== 'undefined' && process.versions?.node
};

/**
 * Wait for next tick (useful for async operations)
 */
export const waitForNextTick = (): Promise<void> => {
  return new Promise(resolve => {
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
};

/**
 * Wait for container services to be ready
 * Useful when services have async initialization
 */
export const waitForServicesReady = async (container: IServiceContainer): Promise<void> => {
  // Give services time to initialize
  await waitForNextTick();
  
  // Try to resolve a basic service to ensure container is ready
  try {
    container.resolveCustom('browser.localStorage');
  } catch (error) {
    // If services aren't ready, wait a bit more
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

/**
 * Debug helper to inspect container state
 */
export function debugContainer(container: IServiceContainer): void {
  if (process.env.NODE_ENV === 'test' && process.env.DEBUG_CONTAINER) {
    console.log('Container Stats:', container.getStats());
    console.log('Registered Keys:', container.getRegisteredKeys());
  }
}

/**
 * Mock console methods for tests
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  return {
    expectConsoleLog: (message: string) => {
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message));
    },
    expectConsoleWarn: (message: string) => {
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(message));
    },
    expectConsoleError: (message: string) => {
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(message));
    }
  };
}