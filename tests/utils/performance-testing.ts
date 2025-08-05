/**
 * Performance Testing Utilities
 * Measure and assert performance metrics
 */

import { Page, CDPSession } from "@playwright/test";

export interface PerformanceMetrics {
  // Navigation Timing
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;

  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Resource Timing
  totalResourceSize: number;
  totalResourceCount: number;
  cachedResourceCount: number;

  // Memory
  jsHeapUsedSize?: number;
  jsHeapTotalSize?: number;

  // Custom metrics
  customMetrics: Record<string, number>;
}

export interface PerformanceBudget {
  // Time-based budgets (ms)
  maxLoadTime?: number;
  maxDomContentLoaded?: number;
  maxLCP?: number;
  maxFCP?: number;
  maxTTFB?: number;

  // Size-based budgets (bytes)
  maxResourceSize?: number;
  maxJSHeapSize?: number;

  // Count-based budgets
  maxResourceCount?: number;

  // Score-based budgets
  minCLS?: number; // Lower is better
}

export class PerformanceTester {
  private page: Page;
  private cdpSession?: CDPSession;
  private metrics: PerformanceMetrics;

  constructor(page: Page) {
    this.page = page;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize CDP session for advanced metrics
   */
  async initialize(): Promise<void> {
    this.cdpSession = await this.page.context().newCDPSession(this.page);
    await this.cdpSession.send("Performance.enable");
    await this.cdpSession.send("Runtime.enable");
  }

  /**
   * Start performance measurement
   */
  async startMeasurement(): Promise<void> {
    this.metrics = this.initializeMetrics();

    // Clear browser caches for clean measurement
    await this.page.context().clearCookies();

    // Start recording
    await this.page.evaluate(() => {
      window.performance.mark("test-start");
    });
  }

  /**
   * Measure page load performance
   */
  async measurePageLoad(url: string): Promise<PerformanceMetrics> {
    await this.startMeasurement();

    // Navigate and wait for load
    const startTime = Date.now();
    await this.page.goto(url, { waitUntil: "networkidle" });
    const loadTime = Date.now() - startTime;

    // Collect metrics
    const metrics = await this.collectMetrics();
    metrics.loadComplete = loadTime;

    return metrics;
  }

  /**
   * Measure specific action performance
   */
  async measureAction(
    name: string,
    action: () => Promise<void>,
  ): Promise<number> {
    // Mark start
    await this.page.evaluate((actionName) => {
      window.performance.mark(`${actionName}-start`);
    }, name);

    const startTime = Date.now();
    await action();
    const duration = Date.now() - startTime;

    // Mark end
    await this.page.evaluate((actionName) => {
      window.performance.mark(`${actionName}-end`);
      window.performance.measure(
        actionName,
        `${actionName}-start`,
        `${actionName}-end`,
      );
    }, name);

    this.metrics.customMetrics[name] = duration;
    return duration;
  }

  /**
   * Collect all performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    // Navigation timing
    const navigationTiming = await this.page.evaluate(() => {
      const nav = window.performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return {
        navigationStart: nav.startTime,
        domContentLoaded:
          nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        ttfb: nav.responseStart - nav.requestStart,
      };
    });

    // Core Web Vitals
    const webVitals = await this.collectWebVitals();

    // Resource timing
    const resourceMetrics = await this.page.evaluate(() => {
      const resources = window.performance.getEntriesByType("resource");
      let totalSize = 0;
      let cachedCount = 0;

      resources.forEach((resource) => {
        const res = resource as PerformanceResourceTiming;
        totalSize += res.transferSize || 0;
        if (res.transferSize === 0 && res.decodedBodySize > 0) {
          cachedCount++;
        }
      });

      return {
        totalResourceSize: totalSize,
        totalResourceCount: resources.length,
        cachedResourceCount: cachedCount,
      };
    });

    // Memory metrics (if available)
    let memoryMetrics = {};
    if (this.cdpSession) {
      try {
        const result = await this.cdpSession.send("Runtime.evaluate", {
          expression: "performance.memory",
          returnByValue: true,
        });

        if (result.result.value) {
          memoryMetrics = {
            jsHeapUsedSize: result.result.value.usedJSHeapSize,
            jsHeapTotalSize: result.result.value.totalJSHeapSize,
          };
        }
      } catch {
        // Memory API might not be available
      }
    }

    return {
      ...this.metrics,
      ...navigationTiming,
      ...webVitals,
      ...resourceMetrics,
      ...memoryMetrics,
    };
  }

  /**
   * Collect Core Web Vitals
   */
  private async collectWebVitals(): Promise<Partial<PerformanceMetrics>> {
    return await this.page.evaluate(() => {
      return new Promise<any>((resolve) => {
        const metrics: any = {};

        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ["largest-contentful-paint"] });

        // FCP
        const fcpEntry = performance.getEntriesByName(
          "first-contentful-paint",
        )[0];
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
        }

        // CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cls = clsValue;
        }).observe({ entryTypes: ["layout-shift"] });

        // Wait a bit to collect metrics
        setTimeout(() => resolve(metrics), 2000);
      });
    });
  }

  /**
   * Assert performance budget
   */
  async assertBudget(budget: PerformanceBudget): Promise<void> {
    const metrics = await this.collectMetrics();

    if (budget.maxLoadTime && metrics.loadComplete > budget.maxLoadTime) {
      throw new Error(
        `Load time ${metrics.loadComplete}ms exceeds budget ${budget.maxLoadTime}ms`,
      );
    }

    if (budget.maxLCP && metrics.lcp && metrics.lcp > budget.maxLCP) {
      throw new Error(`LCP ${metrics.lcp}ms exceeds budget ${budget.maxLCP}ms`);
    }

    if (
      budget.maxResourceSize &&
      metrics.totalResourceSize > budget.maxResourceSize
    ) {
      throw new Error(
        `Resource size ${metrics.totalResourceSize} exceeds budget ${budget.maxResourceSize}`,
      );
    }

    if (
      budget.maxJSHeapSize &&
      metrics.jsHeapUsedSize &&
      metrics.jsHeapUsedSize > budget.maxJSHeapSize
    ) {
      throw new Error(
        `JS heap size ${metrics.jsHeapUsedSize} exceeds budget ${budget.maxJSHeapSize}`,
      );
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<string> {
    const metrics = await this.collectMetrics();

    return `
Performance Report
==================
Navigation Timing:
- DOM Content Loaded: ${metrics.domContentLoaded}ms
- Page Load Complete: ${metrics.loadComplete}ms
- TTFB: ${metrics.ttfb}ms

Core Web Vitals:
- LCP: ${metrics.lcp}ms
- FCP: ${metrics.fcp}ms
- CLS: ${metrics.cls}

Resources:
- Total Size: ${(metrics.totalResourceSize / 1024 / 1024).toFixed(2)}MB
- Total Count: ${metrics.totalResourceCount}
- Cached: ${metrics.cachedResourceCount}

Memory:
- JS Heap Used: ${((metrics.jsHeapUsedSize || 0) / 1024 / 1024).toFixed(2)}MB

Custom Metrics:
${Object.entries(metrics.customMetrics)
  .map(([name, value]) => `- ${name}: ${value}ms`)
  .join("\n")}
`;
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.cdpSession) {
      await this.cdpSession.detach();
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      navigationStart: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      totalResourceSize: 0,
      totalResourceCount: 0,
      cachedResourceCount: 0,
      customMetrics: {},
    };
  }
}

/**
 * Performance test scenarios
 */
export class PerformanceScenarios {
  /**
   * Cold load test (no cache)
   */
  static async coldLoad(
    page: Page,
    url: string,
    budget?: PerformanceBudget,
  ): Promise<PerformanceMetrics> {
    const tester = new PerformanceTester(page);
    await tester.initialize();

    // Clear all caches
    await page.context().clearCookies();
    await page.context().route("**/*", (route) => route.continue());

    const metrics = await tester.measurePageLoad(url);

    if (budget) {
      await tester.assertBudget(budget);
    }

    await tester.cleanup();
    return metrics;
  }

  /**
   * Warm load test (with cache)
   */
  static async warmLoad(
    page: Page,
    url: string,
    budget?: PerformanceBudget,
  ): Promise<PerformanceMetrics> {
    const tester = new PerformanceTester(page);
    await tester.initialize();

    // First load to warm cache
    await page.goto(url);

    // Second load with cache
    const metrics = await tester.measurePageLoad(url);

    if (budget) {
      await tester.assertBudget(budget);
    }

    await tester.cleanup();
    return metrics;
  }

  /**
   * User journey performance test
   */
  static async userJourney(
    page: Page,
    journey: {
      name: string;
      steps: Array<{
        name: string;
        action: () => Promise<void>;
        budget?: number;
      }>;
    },
  ): Promise<PerformanceMetrics> {
    const tester = new PerformanceTester(page);
    await tester.initialize();
    await tester.startMeasurement();

    for (const step of journey.steps) {
      const duration = await tester.measureAction(step.name, step.action);

      if (step.budget && duration > step.budget) {
        throw new Error(
          `Step "${step.name}" took ${duration}ms, exceeding budget of ${step.budget}ms`,
        );
      }
    }

    const metrics = await tester.collectMetrics();
    await tester.cleanup();

    return metrics;
  }
}

/**
 * Performance monitoring fixture
 */
export async function withPerformanceMonitoring<T>(
  page: Page,
  test: () => Promise<T>,
  options?: {
    budget?: PerformanceBudget;
    reportPath?: string;
  },
): Promise<T> {
  const tester = new PerformanceTester(page);
  await tester.initialize();
  await tester.startMeasurement();

  try {
    const result = await test();

    if (options?.budget) {
      await tester.assertBudget(options.budget);
    }

    if (options?.reportPath) {
      const report = await tester.generateReport();
      // Save report to file system
      console.log(report);
    }

    return result;
  } finally {
    await tester.cleanup();
  }
}
