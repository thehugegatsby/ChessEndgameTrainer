import { vi } from 'vitest';
/**
 * Jest Setup Utilities
 * Common setup patterns for Jest 30 with ServiceContainer
 */

// @testing-library/jest-dom removed - using Vitest native matchers
import React from "react";

// Note: MSW polyfills removed - using service-level mocking instead
// This significantly improves test performance and stability
import { type ServiceContainer } from "@shared/services/container";
import {
  createTestContainer,
  type TestServiceOverrides,
} from "./createTestContainer";

/**
 * Global test container for tests that need shared state
 * Use sparingly - prefer per-test containers for better isolation
 */
let globalTestContainer: ServiceContainer | null = null;

/**
 * Setup global test container
 * Call in vi.setup.js or describe block
 * @param overrides
 */
export function setupGlobalTestContainer(
  overrides?: TestServiceOverrides,
): void {
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
export function getGlobalTestContainer(): ServiceContainer {
  if (!globalTestContainer) {
    throw new Error(
      "Global test container not set up. Call setupGlobalTestContainer() first.",
    );
  }
  return globalTestContainer;
}

/**
 * Per-test container setup
 * Preferred approach for better test isolation
 * @param overrides
 */
export function setupPerTestContainer(
  overrides?: TestServiceOverrides,
): () => IServiceContainer {
  let container: ServiceContainer;

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
 * @param overrides
 */
export function setupReactTestingWithContainer(
  overrides?: TestServiceOverrides,
): { getContainer: () => ServiceContainer; getWrapper: () => React.ComponentType<{ children: React.ReactNode }> } {
  let container: ServiceContainer;
  let wrapper: React.ComponentType<{ children: React.ReactNode }>;

  beforeEach(() => {
    container = createTestContainer(overrides);

    // Create wrapper component
    /**
     *
     * @param root0
     * @param root0.children
     */
    wrapper = ({ children }: { children: React.ReactNode }) => {
      const { ServiceProvider } = require("@shared/services/container/adapter");
      return React.createElement(ServiceProvider, { container }, children);
    };
  });

  afterEach(() => {
    container.clearInstances();
  });

  return {
    /**
     *
     */
    getContainer: () => container,
    /**
     *
     */
    getWrapper: () => wrapper,
  };
}

/**
 * Common Jest matchers for platform services
 */
export const platformServiceMatchers = {
  /**
   * Check if a service method was called
   * @param service
   * @param method
   * @param args
   */
  toHaveBeenCalledOnService: (service: any, method: string, ...args: any[]) => {
    // Check if running in test environment
    expect(service[method]).toHaveBeenCalledWith(...args);
  },

  /**
   * Check storage operations
   * @param storage
   * @param key
   * @param value
   */
  toHaveStorageItem: (storage: Storage, key: string, value: string) => {
    expect(storage.getItem(key)).toBe(value);
  },

  /**
   * Check storage calls
   * @param storage
   * @param method
   * @param args
   */
  toHaveCalledStorageMethod: (
    storage: Storage,
    method: keyof Storage,
    ...args: any[]
  ) => {
    // Check if running in test environment
    expect((storage as any)[method]).toHaveBeenCalledWith(...args);
  }
};

/**
 * Test environment detection
 */
export const testEnvironment = {
  isVitest: true,
  isJSDOM:
    typeof window !== "undefined" &&
    window.navigator?.userAgent?.includes("jsdom"),
  isNode: typeof process !== "undefined" && process.versions?.node,
};

/**
 * Wait for next tick (useful for async operations)
 */
export /**
 *
 */
const waitForNextTick = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof setImmediate !== "undefined") {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
};

/**
 * Wait for container services to be ready
 * Useful when services have async initialization
 * @param container
 */
export /**
 *
 */
const waitForServicesReady = async (
  container: ServiceContainer,
): Promise<void> => {
  // Give services time to initialize
  await waitForNextTick();

  // Try to resolve a basic service to ensure container is ready
  try {
    container.resolveCustom("browser.localStorage");
  } catch (error) {
    // If services aren't ready, wait a bit more
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

/**
 * Debug helper to inspect container state
 * @param container
 */
export function debugContainer(container: ServiceContainer): void {
  if (process.env['NODE_ENV'] === "test" && process.env['DEBUG_CONTAINER']) {
    console.log("Container Stats:", (container as any).getStats?.());
    console.log("Registered Keys:", (container as any).getRegisteredKeys?.());
  }
}

/**
 * Mock console methods for tests
 */
export function mockConsole(): {
  expectConsoleLog: (message: string) => void;
  expectConsoleWarn: (message: string) => void;
  expectConsoleError: (message: string) => void;
} {
  const originalConsole = { ...console };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  return {
    /**
     *
     * @param message
     */
    expectConsoleLog: (message: string) => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(message),
      );
    },
    /**
     *
     * @param message
     */
    expectConsoleWarn: (message: string) => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(message),
      );
    },
    /**
     *
     * @param message
     */
    expectConsoleError: (message: string) => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(message),
      );
    },
  };
}
