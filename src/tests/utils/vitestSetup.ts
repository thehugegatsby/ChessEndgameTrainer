import { vi } from 'vitest';
/**
 * Jest Setup Utilities
 * Common setup patterns for Vitest tests (ServiceContainer removed)
 */

// @testing-library/jest-dom removed - using Vitest native matchers
import React from 'react';

// Mock Next.js components that use IntersectionObserver
// This prevents "observer.observe is not a function" errors
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock Next.js internal use-intersection hook directly
vi.mock('next/dist/client/use-intersection', () => ({
  useIntersection: () => ({
    rootRef: { current: null },
    isIntersecting: false,
    entry: undefined,
  }),
}));

// Note: ServiceContainer removed - was over-engineering for React tests
// Using direct service mocking instead for better test performance

/**
 * Test environment detection
 */
export const testEnvironment = {
  isVitest: true,
  isJSDOM: typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom'),
  isNode: typeof process !== 'undefined' && process.versions?.node,
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
 * Mock console methods for tests
 */
export function mockConsole(): {
  expectConsoleLog: (message: string) => void;
  expectConsoleWarn: (message: string) => void;
  expectConsoleError: (message: string) => void;
} {
  const originalConsole = { ...console };

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
    },
  };
}