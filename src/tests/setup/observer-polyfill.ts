/**
 * Observer API Polyfill for JSDOM
 *
 * Uses the official intersection-observer polyfill for maximum compatibility
 */

// Import the official polyfill
import 'intersection-observer';

console.log('🔧 Loading observer-polyfill with official package');
console.log('   IntersectionObserver available:', typeof IntersectionObserver !== 'undefined');

// React 19 requirement - must be set on all global objects
if (typeof globalThis !== 'undefined') {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}
if (typeof global !== 'undefined') {
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
}
if (typeof window !== 'undefined') {
  (window as any).IS_REACT_ACT_ENVIRONMENT = true;
}

// ---- IntersectionObserver Polyfill (Class-based) ----
class IntersectionObserverPolyfill {
  _callback: IntersectionObserverCallback;
  root: Element | Document | null;
  rootMargin: string;
  thresholds: ReadonlyArray<number>;
  _elements: Set<Element>;

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this._callback = callback;
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? '0px';
    const threshold = options.threshold;
    this.thresholds = Array.isArray(threshold) ? threshold.sort() : [threshold ?? 0];
    this._elements = new Set();

    if (process.env.NODE_ENV === 'test') {
      (globalThis as any).__lastIntersectionObserver = this;
    }
  }

  observe(target: Element): void {
    this._elements.add(target);
  }

  unobserve(target: Element): void {
    this._elements.delete(target);
  }

  disconnect(): void {
    this._elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// ---- ResizeObserver Polyfill (Class-based) ----
class ResizeObserverPolyfill {
  _callback: ResizeObserverCallback;
  _elements: Set<Element>;

  constructor(callback: ResizeObserverCallback) {
    this._callback = callback;
    this._elements = new Set();

    if (process.env.NODE_ENV === 'test') {
      (globalThis as any).__lastResizeObserver = this;
    }
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    this._elements.add(target);
  }

  unobserve(target: Element): void {
    this._elements.delete(target);
  }

  disconnect(): void {
    this._elements.clear();
  }
}

// Enhanced prototype setup with proper descriptors
Object.defineProperties(IntersectionObserverPolyfill.prototype, {
  constructor: { value: IntersectionObserverPolyfill, writable: true, configurable: true },
  [Symbol.toStringTag]: { value: 'IntersectionObserver' },
});

Object.defineProperties(ResizeObserverPolyfill.prototype, {
  constructor: { value: ResizeObserverPolyfill, writable: true, configurable: true },
  [Symbol.toStringTag]: { value: 'ResizeObserver' },
});

// Remove any existing implementations and set our polyfills on ALL possible globals
const setPolyfills = () => {
  // Set on globalThis
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).IntersectionObserver;
    delete (globalThis as any).ResizeObserver;
    (globalThis as any).IntersectionObserver = IntersectionObserverPolyfill;
    (globalThis as any).ResizeObserver = ResizeObserverPolyfill;
    console.log('✅ Polyfills set on globalThis');
  }

  // Set on global
  if (typeof global !== 'undefined') {
    delete (global as any).IntersectionObserver;
    delete (global as any).ResizeObserver;
    (global as any).IntersectionObserver = IntersectionObserverPolyfill;
    (global as any).ResizeObserver = ResizeObserverPolyfill;
    console.log('✅ Polyfills set on global');
  }

  // Set on window
  if (typeof window !== 'undefined') {
    delete (window as any).IntersectionObserver;
    delete (window as any).ResizeObserver;
    (window as any).IntersectionObserver = IntersectionObserverPolyfill;
    (window as any).ResizeObserver = ResizeObserverPolyfill;
    console.log('✅ Polyfills set on window');
  }

  // CRITICAL: Also set on globalThis.window if it exists (Vitest v3 specific)
  if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
    delete (globalThis as any).window.IntersectionObserver;
    delete (globalThis as any).window.ResizeObserver;
    (globalThis as any).window.IntersectionObserver = IntersectionObserverPolyfill;
    (globalThis as any).window.ResizeObserver = ResizeObserverPolyfill;
    console.log('✅ Polyfills set on globalThis.window');
  }

  // Verify cross-realm consistency
  console.log('🔍 Cross-realm check:');
  if (typeof window !== 'undefined' && typeof globalThis !== 'undefined') {
    console.log('   window === globalThis.window:', window === (globalThis as any).window);
    console.log(
      '   Same IntersectionObserver:',
      (window as any).IntersectionObserver === (globalThis as any).IntersectionObserver
    );
  }

  // Verify instance creation works
  try {
    const testObserver = new (IntersectionObserverPolyfill as any)(() => {});
    console.log('   Instance has observe method:', typeof testObserver.observe === 'function');
  } catch (e) {
    console.error('   ❌ Failed to create test instance:', e);
  }
};

// Execute polyfill setup
setPolyfills();

// Export for manual use in tests if needed
export { IntersectionObserverPolyfill, ResizeObserverPolyfill };

// TypeScript declarations
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
  var __lastIntersectionObserver: any;
  var __lastResizeObserver: any;

  interface Window {
    IntersectionObserver: typeof IntersectionObserverPolyfill;
    ResizeObserver: typeof ResizeObserverPolyfill;
  }
}

// Ensure this file is treated as a module
export {};
