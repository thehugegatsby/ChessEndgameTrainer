/**
 * Global Observer Setup for Vitest
 *
 * This runs BEFORE Vite scans any modules, ensuring IntersectionObserver
 * is available when Next.js checks for it during module evaluation.
 *
 * CRITICAL: This must run via globalSetup, NOT setupFiles!
 */

// Define polyfills directly here to ensure they're available immediately

class IntersectionObserverPolyfill {
  _callback: any;
  root: any;
  rootMargin: string;
  thresholds: ReadonlyArray<number>;
  _elements: Set<Element>;

  constructor(callback: any, options: any = {}) {
    this._callback = callback;
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? '0px';
    const threshold = options.threshold;
    this.thresholds = Array.isArray(threshold) ? threshold.sort() : [threshold ?? 0];
    this._elements = new Set();
  }

  observe(target: any): void {
    this._elements.add(target);
  }

  unobserve(target: any): void {
    this._elements.delete(target);
  }

  disconnect(): void {
    this._elements.clear();
  }

  takeRecords(): any[] {
    return [];
  }
}

class ResizeObserverPolyfill {
  _callback: any;
  _elements: Set<Element>;

  constructor(callback: any) {
    this._callback = callback;
    this._elements = new Set();
  }

  observe(target: any, options?: any): void {
    this._elements.add(target);
  }

  unobserve(target: any): void {
    this._elements.delete(target);
  }

  disconnect(): void {
    this._elements.clear();
  }
}

// Attach to globalThis BEFORE any module loading
(globalThis as any).IntersectionObserver = IntersectionObserverPolyfill;
(globalThis as any).ResizeObserver = ResizeObserverPolyfill;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Also try to set on global if it exists
if (typeof global !== 'undefined') {
  (global as any).IntersectionObserver = IntersectionObserverPolyfill;
  (global as any).ResizeObserver = ResizeObserverPolyfill;
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
}

console.log('🚀 Global Observer Setup: Polyfills installed BEFORE module loading');
console.log(
  '   IntersectionObserver installed:',
  typeof (globalThis as any).IntersectionObserver === 'function'
);

export default async () => {
  console.log('🚀 Global setup function called');
  // Ensure polyfills persist
  (globalThis as any).IntersectionObserver = IntersectionObserverPolyfill;
  (globalThis as any).ResizeObserver = ResizeObserverPolyfill;
};
