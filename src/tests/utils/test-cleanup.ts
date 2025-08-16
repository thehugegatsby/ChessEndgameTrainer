import { vi } from 'vitest';
/**
 * Test Cleanup Utilities
 *
 * Provides comprehensive cleanup functions to prevent memory leaks in tests
 * and ensure proper test isolation.
 */

import { cleanup as rtlCleanup } from '@testing-library/react';
import { act } from '@testing-library/react';

/**
 * Tracks all timers, intervals, and async operations for cleanup
 */
class TestCleanupManager {
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();
  private animationFrames = new Set<number>();
  private eventListeners = new Map<EventTarget, Map<string, EventListener>>();
  private abortControllers = new Set<AbortController>();
  private resizeObservers = new Set<ResizeObserver>();
  private intersectionObservers = new Set<IntersectionObserver>();
  private mutationObservers = new Set<MutationObserver>();

  /**
   * Track a timer for cleanup
   */
  trackTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  /**
   * Track an interval for cleanup
   */
  trackInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  /**
   * Track an animation frame request
   */
  trackAnimationFrame(id: number): void {
    this.animationFrames.add(id);
  }

  /**
   * Track an event listener
   */
  trackEventListener(target: EventTarget, event: string, listener: EventListener): void {
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map());
    }
    this.eventListeners.get(target)!.set(event, listener);
  }

  /**
   * Track an AbortController
   */
  trackAbortController(controller: AbortController): void {
    this.abortControllers.add(controller);
  }

  /**
   * Track a ResizeObserver
   */
  trackResizeObserver(observer: ResizeObserver): void {
    this.resizeObservers.add(observer);
  }

  /**
   * Track an IntersectionObserver
   */
  trackIntersectionObserver(observer: IntersectionObserver): void {
    this.intersectionObservers.add(observer);
  }

  /**
   * Track a MutationObserver
   */
  trackMutationObserver(observer: MutationObserver): void {
    this.mutationObservers.add(observer);
  }

  /**
   * Clean up all tracked resources
   */
  cleanupAll(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Cancel all animation frames
    this.animationFrames.forEach(id => cancelAnimationFrame(id));
    this.animationFrames.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, event) => {
        target.removeEventListener(event, listener);
      });
    });
    this.eventListeners.clear();

    // Abort all abort controllers
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.abortControllers.clear();

    // Disconnect all observers
    this.resizeObservers.forEach(observer => observer.disconnect());
    this.resizeObservers.clear();

    this.intersectionObservers.forEach(observer => observer.disconnect());
    this.intersectionObservers.clear();

    this.mutationObservers.forEach(observer => observer.disconnect());
    this.mutationObservers.clear();
  }
}

// Global cleanup manager instance
const cleanupManager = new TestCleanupManager();

/**
 * Comprehensive cleanup function for React component tests
 */
export async function cleanupReactTest(): Promise<void> {
  // Clean up React Testing Library
  await act(() => {
    rtlCleanup();
    return Promise.resolve();
  });

  // Clean up tracked resources
  cleanupManager.cleanupAll();

  // Clear all mock timers if using fake timers
  if (vi.isMockFunction(setTimeout)) {
    vi.clearAllTimers();
    vi.useRealTimers();
  }

  // Clear all mocks
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Clear module registry to prevent state leakage
  vi.resetModules();

  // Force garbage collection if available (V8 only)
  if (global.gc) {
    global.gc();
  }
}

/**
 * Cleanup function for service/unit tests (non-React)
 */
export function cleanupUnitTest(): void {
  // Clean up tracked resources
  cleanupManager.cleanupAll();

  // Clear all mock timers
  if (vi.isMockFunction(setTimeout)) {
    vi.clearAllTimers();
    vi.useRealTimers();
  }

  // Clear all mocks
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Reset modules
  vi.resetModules();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}

/**
 * Setup automatic cleanup for a test suite
 * Call this in your test file's top-level describe block
 */
export function setupTestCleanup(isReactTest = false): void {
  afterEach(async () => {
    if (isReactTest) {
      await cleanupReactTest();
    } else {
      cleanupUnitTest();
    }
  });

  afterAll(() => {
    // Final cleanup
    cleanupManager.cleanupAll();

    // Ensure real timers are restored
    vi.useRealTimers();

    // Clear all mocks one final time
    vi.clearAllMocks();
  });
}

/**
 * Wait for all pending promises to resolve
 * Useful for ensuring async operations complete before cleanup
 */
export async function waitForPendingPromises(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setImmediate(resolve));
  });
}

/**
 * Wait for next tick
 * Useful for ensuring microtasks complete
 */
export async function waitForNextTick(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => process.nextTick(resolve));
  });
}

/**
 * Create a wrapped timer functions that auto-track for cleanup
 */
export const trackedTimers = {
  setTimeout: (callback: () => void, ms?: number): NodeJS.Timeout => {
    const timer = setTimeout(callback, ms);
    cleanupManager.trackTimer(timer);
    return timer;
  },

  setInterval: (callback: () => void, ms?: number): NodeJS.Timeout => {
    const interval = setInterval(callback, ms);
    cleanupManager.trackInterval(interval);
    return interval;
  },

  requestAnimationFrame: (callback: FrameRequestCallback): number => {
    const id = requestAnimationFrame(callback);
    cleanupManager.trackAnimationFrame(id);
    return id;
  },
};

/**
 * Create a wrapped AbortController that auto-tracks for cleanup
 */
export function createTrackedAbortController(): AbortController {
  const controller = new AbortController();
  cleanupManager.trackAbortController(controller);
  return controller;
}

/**
 * Mock and track ResizeObserver for tests
 */
export function mockResizeObserver(): void {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      cleanupManager.trackResizeObserver(this);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

/**
 * Mock and track IntersectionObserver for tests
 */
export function mockIntersectionObserver(): void {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      cleanupManager.trackIntersectionObserver(this);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  };
}

/**
 * Cleanup Zustand stores to prevent state leakage
 */
export function cleanupZustandStores(): void {
  // Get all Zustand store instances and reset them
  const storeRegistry = (global as any).__zustand_stores__;
  if (storeRegistry) {
    storeRegistry.forEach((store: any) => {
      if (store.destroy) {
        store.destroy();
      } else if (store.setState) {
        // Reset to initial state
        store.setState(store.getInitialState ? store.getInitialState() : {});
      }
    });
    storeRegistry.clear();
  }
}

/**
 * Export the cleanup manager for advanced usage
 */
export { cleanupManager };

/**
 * Helper to ensure all async operations in a test complete
 */
export async function ensureAsyncCompletion(): Promise<void> {
  // Wait for promises
  await waitForPendingPromises();

  // Wait for next tick
  await waitForNextTick();

  // Small delay to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 0));
}

export default {
  setupTestCleanup,
  cleanupReactTest,
  cleanupUnitTest,
  waitForPendingPromises,
  waitForNextTick,
  trackedTimers,
  createTrackedAbortController,
  mockResizeObserver,
  mockIntersectionObserver,
  cleanupZustandStores,
  ensureAsyncCompletion,
  cleanupManager,
};
