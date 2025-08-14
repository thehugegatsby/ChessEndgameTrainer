/**
 * Custom JSDOM Environment with Observer Polyfills
 * 
 * This ensures IntersectionObserver and ResizeObserver are available
 * BEFORE any modules are loaded, fixing the Next.js 15 issue.
 */

import { Environment } from 'vitest';
import { builtinEnvironments } from 'vitest/environments';

// Define the polyfills
class IntersectionObserverPolyfill {
  _callback: any;
  root: any;
  rootMargin: string;
  thresholds: ReadonlyArray<number>;
  _elements: Set<any> = new Set();

  constructor(callback: any, options: any = {}) {
    this._callback = callback;
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? '0px';
    const threshold = options.threshold;
    this.thresholds = Array.isArray(threshold) ? threshold.sort() : [threshold ?? 0];
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
  _elements: Set<any> = new Set();

  constructor(callback: any) {
    this._callback = callback;
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

export default <Environment>{
  name: 'jsdom-with-polyfills',
  transformMode: 'web',
  async setup(global, options) {
    // First, setup JSDOM environment
    const jsdomEnv = builtinEnvironments.jsdom;
    const teardown = await jsdomEnv.setup(global, options);
    
    // Then add our polyfills to the JSDOM window
    global.IntersectionObserver = IntersectionObserverPolyfill as any;
    global.ResizeObserver = ResizeObserverPolyfill as any;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    
    // Also set on globalThis
    (globalThis as any).IntersectionObserver = IntersectionObserverPolyfill;
    (globalThis as any).ResizeObserver = ResizeObserverPolyfill;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    
    console.log('✨ Custom JSDOM Environment: Observer polyfills installed');
    
    return {
      teardown
    };
  }
};