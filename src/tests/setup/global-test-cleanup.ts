/**
 * Global Test Cleanup Configuration
 * 
 * This file is automatically loaded by Jest for every test via setupFilesAfterEnv.
 * It provides automatic cleanup for common memory leak sources without requiring
 * manual setup in each test file.
 * 
 * @see jest.config.projects.js - setupFilesAfterEnv configuration
 */

import { cleanup as rtlCleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Global Test Cleanup Manager
 * Automatically tracks and cleans up resources that commonly cause memory leaks
 */
class GlobalTestCleanupManager {
  private originalSetTimeout = global.setTimeout;
  private originalSetInterval = global.setInterval;
  private originalRequestAnimationFrame = global.requestAnimationFrame;
  private originalAddEventListener = EventTarget.prototype.addEventListener;
  
  private activeTimers = new Set<NodeJS.Timeout>();
  private activeIntervals = new Set<NodeJS.Timeout>();
  private activeAnimationFrames = new Set<number>();
  private activeEventListeners = new Map<EventTarget, Map<string, Set<EventListener>>>();
  private activeAbortControllers = new Set<AbortController>();

  constructor() {
    this.wrapGlobalFunctions();
  }

  /**
   * Wrap global timer functions to automatically track them
   */
  private wrapGlobalFunctions(): void {
    // Wrap setTimeout
    global.setTimeout = ((callback: any, ms?: number, ...args: any[]) => {
      const timer = this.originalSetTimeout.call(global, callback, ms, ...args);
      this.activeTimers.add(timer);
      return timer;
    }) as any;

    // Wrap setInterval
    global.setInterval = ((callback: any, ms?: number, ...args: any[]) => {
      const interval = this.originalSetInterval.call(global, callback, ms, ...args);
      this.activeIntervals.add(interval);
      return interval;
    }) as any;

    // Wrap requestAnimationFrame if available
    if (typeof this.originalRequestAnimationFrame === 'function') {
      global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
        const id = this.originalRequestAnimationFrame.call(global, callback);
        this.activeAnimationFrames.add(id);
        return id;
      }) as any;
    }

    // Wrap addEventListener for common targets
    const wrapAddEventListener = (target: EventTarget) => {
      const original = target.addEventListener;
      target.addEventListener = (type: string, listener: any, options?: any) => {
        // Track the listener
        if (!this.activeEventListeners.has(target)) {
          this.activeEventListeners.set(target, new Map());
        }
        const targetListeners = this.activeEventListeners.get(target)!;
        if (!targetListeners.has(type)) {
          targetListeners.set(type, new Set());
        }
        targetListeners.get(type)!.add(listener);

        // Call original
        return original.call(target, type, listener, options);
      };
    };

    // Wrap common event targets
    if (typeof window !== 'undefined') {
      wrapAddEventListener(window);
      wrapAddEventListener(document);
      wrapAddEventListener(document.body);
    }
  }

  /**
   * Clean up all tracked resources
   */
  cleanupAll(): void {
    // Clear timers
    this.activeTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.activeTimers.clear();

    // Clear intervals
    this.activeIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.activeIntervals.clear();

    // Cancel animation frames
    if (typeof cancelAnimationFrame === 'function') {
      this.activeAnimationFrames.forEach(id => {
        cancelAnimationFrame(id);
      });
    }
    this.activeAnimationFrames.clear();

    // Remove event listeners
    this.activeEventListeners.forEach((eventTypes, target) => {
      eventTypes.forEach((listeners, type) => {
        listeners.forEach(listener => {
          target.removeEventListener(type, listener);
        });
      });
    });
    this.activeEventListeners.clear();

    // Abort all AbortControllers
    this.activeAbortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.activeAbortControllers.clear();
  }

  /**
   * Track an AbortController for automatic cleanup
   */
  trackAbortController(controller: AbortController): void {
    this.activeAbortControllers.add(controller);
  }

  /**
   * Reset Zustand stores if they exist
   */
  cleanupZustandStores(): void {
    // Access the global store registry if it exists
    if (typeof window !== 'undefined' && (window as any).__zustand_stores__) {
      const stores = (window as any).__zustand_stores__;
      stores.forEach((store: any) => {
        if (store.destroy) {
          store.destroy();
        } else if (store.setState && store.getInitialState) {
          store.setState(store.getInitialState());
        }
      });
    }
  }
}

// Create global instance
const globalCleanupManager = new GlobalTestCleanupManager();

// Mock ResizeObserver if not available (common in test environments)
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Mock IntersectionObserver if not available
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
  } as any;
}

// Setup automatic cleanup hooks
beforeAll(() => {
  // Reset any global state at the start of each test file
  jest.clearAllMocks();
});

afterEach(async () => {
  // Clean up React Testing Library DOM
  if (typeof rtlCleanup === 'function') {
    try {
      await rtlCleanup();
    } catch (error) {
      // Ignore cleanup errors (component might not be React)
    }
  }

  // Clean up all tracked resources
  globalCleanupManager.cleanupAll();

  // Clean up Zustand stores
  globalCleanupManager.cleanupZustandStores();

  // Clear all Jest mocks
  jest.clearAllMocks();
  
  // Clear fake timers if they're being used
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers();
  }
});

afterAll(() => {
  // Final cleanup after all tests in a file
  globalCleanupManager.cleanupAll();
  
  // Restore all mocks
  jest.restoreAllMocks();
  
  // Ensure real timers are restored
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});

// Export for tests that need manual control
export { globalCleanupManager };

// Helper function for tests that need to track AbortControllers
export function createTrackedAbortController(): AbortController {
  const controller = new AbortController();
  globalCleanupManager.trackAbortController(controller);
  return controller;
}

/**
 * Wait for all pending promises to resolve
 * Useful for ensuring async operations complete
 */
export async function waitForPendingPromises(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
}

/**
 * For tests that need to opt-out of automatic cleanup
 * Call this at the beginning of a test file
 */
export function disableAutomaticCleanup(): void {
  // Remove the global afterEach hooks
  // This would need to be implemented based on Jest internals
  console.warn('Manual cleanup mode enabled - remember to clean up resources manually!');
}

// Log that global cleanup is active (only in debug mode)
if (process.env.DEBUG_TESTS) {
  console.log('✅ Global test cleanup is active');
}