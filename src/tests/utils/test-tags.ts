/**
 * Test Tagging and Monitoring System
 * Enterprise test organization and observability
 */

import { test as base, type TestInfo, type Page } from "@playwright/test";

// Custom type for test function since TestFn is not exported
type TestFunction = (
  fixtures: { page: Page; [key: string]: any },
  testInfo: TestInfo,
) => Promise<void> | void;

// Test categories
export const TestTags = {
  // Test types
  SMOKE: "@smoke",
  REGRESSION: "@regression",
  CRITICAL_PATH: "@critical-path",
  E2E: "@e2e",
  INTEGRATION: "@integration",
  PERFORMANCE: "@performance",
  VISUAL: "@visual",
  A11Y: "@a11y",
  SECURITY: "@security",

  // Features
  AUTH: "@auth",
  CHESS_BOARD: "@chess-board",
  TRAINING: "@training",
  REAL_TIME: "@real-time",
  OFFLINE: "@offline",

  // Priorities
  P0: "@p0", // Critical
  P1: "@p1", // High
  P2: "@p2", // Medium
  P3: "@p3", // Low

  // Environments
  DEV_ONLY: "@dev-only",
  STAGING_ONLY: "@staging-only",
  PROD_SAFE: "@prod-safe",

  // Special
  FLAKY: "@flaky",
  SLOW: "@slow",
  SKIP_CI: "@skip-ci",
  QUARANTINE: "@quarantine",
} as const;

// Test metadata interface
export interface TestMetadata {
  tags: string[];
  priority: "p0" | "p1" | "p2" | "p3";
  expectedDuration: number; // ms
  owner?: string;
  jiraTicket?: string;
  lastModified?: Date;
  flakyHistory?: {
    failureRate: number;
    lastFailure?: Date;
  };
}

// Test monitoring data
export interface TestMetrics {
  testName: string;
  duration: number;
  status: "passed" | "failed" | "skipped" | "flaky";
  error?: string;
  retries: number;
  tags: string[];
  timestamp: Date;
  environment: {
    browser: string;
    os: string;
    node: string;
  };
  performance?: {
    memory: number;
    cpu: number;
  };
}

/**
 * Test monitoring reporter
 */
export class TestMonitor {
  private metrics: TestMetrics[] = [];
  private startTime: Map<string, number> = new Map();

  /**
   * Start monitoring a test
   */
  startTest(testInfo: TestInfo): void {
    this.startTime.set(testInfo.title, Date.now());
  }

  /**
   * End monitoring a test
   */
  endTest(testInfo: TestInfo): void {
    const startTime = this.startTime.get(testInfo.title);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    const tags = this.extractTags(testInfo);

    const metric: TestMetrics = {
      testName: testInfo.title,
      duration,
      status: testInfo.status as TestMetrics["status"],
      error: testInfo.error?.message,
      retries: testInfo.retry,
      tags,
      timestamp: new Date(),
      environment: {
        browser: testInfo.project.name,
        os: process.platform,
        node: process.version,
      },
    };

    this.metrics.push(metric);
    this.startTime.delete(testInfo.title);
  }

  /**
   * Extract tags from test info
   */
  private extractTags(testInfo: TestInfo): string[] {
    const tags: string[] = [];

    // Extract from test title
    const titleTags = testInfo.title.match(/@\w+(-\w+)*/g) || [];
    tags.push(...titleTags);

    // Extract from annotations
    testInfo.annotations.forEach((annotation) => {
      if (annotation.type === "tag") {
        tags.push(annotation.description || "");
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate test report
   */
  generateReport(): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      flaky: number;
      avgDuration: number;
    };
    byTag: Record<
      string,
      {
        total: number;
        passed: number;
        failed: number;
        avgDuration: number;
      }
    >;
    slowTests: TestMetrics[];
    failedTests: TestMetrics[];
  } {
    const summary = {
      total: this.metrics.length,
      passed: this.metrics.filter((m) => m.status === "passed").length,
      failed: this.metrics.filter((m) => m.status === "failed").length,
      flaky: this.metrics.filter((m) => m.status === "flaky").length,
      avgDuration:
        this.metrics.reduce((sum, m) => sum + m.duration, 0) /
        this.metrics.length,
    };

    // Group by tags
    const byTag: Record<string, any> = {};
    this.metrics.forEach((metric) => {
      metric.tags.forEach((tag) => {
        if (!byTag[tag]) {
          byTag[tag] = { total: 0, passed: 0, failed: 0, totalDuration: 0 };
        }
        byTag[tag].total++;
        if (metric.status === "passed") byTag[tag].passed++;
        if (metric.status === "failed") byTag[tag].failed++;
        byTag[tag].totalDuration += metric.duration;
      });
    });

    // Calculate averages
    Object.keys(byTag).forEach((tag) => {
      byTag[tag].avgDuration = byTag[tag].totalDuration / byTag[tag].total;
      delete byTag[tag].totalDuration;
    });

    // Find slow tests (top 10%)
    const sortedByDuration = [...this.metrics].sort(
      (a, b) => b.duration - a.duration,
    );
    const slowTests = sortedByDuration.slice(
      0,
      Math.ceil(this.metrics.length * 0.1),
    );

    // Failed tests
    const failedTests = this.metrics.filter((m) => m.status === "failed");

    return {
      summary,
      byTag,
      slowTests,
      failedTests,
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(format: "json" | "prometheus" | "datadog"): string {
    switch (format) {
      case "json":
        return JSON.stringify(this.metrics, null, 2);

      case "prometheus":
        return this.toPrometheusFormat();

      case "datadog":
        return this.toDatadogFormat();

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private toPrometheusFormat(): string {
    const lines: string[] = [];

    this.metrics.forEach((metric) => {
      const labels = `test="${metric.testName}",status="${metric.status}",browser="${metric.environment.browser}"`;
      lines.push(`test_duration_seconds{${labels}} ${metric.duration / 1000}`);
      lines.push(
        `test_status{${labels}} ${metric.status === "passed" ? 1 : 0}`,
      );
    });

    return lines.join("\n");
  }

  private toDatadogFormat(): string {
    return this.metrics
      .map((metric) => ({
        metric: "test.duration",
        points: [
          [Math.floor(metric.timestamp.getTime() / 1000), metric.duration],
        ],
        type: "gauge",
        tags: [
          `test:${metric.testName}`,
          `status:${metric.status}`,
          `browser:${metric.environment.browser}`,
          ...metric.tags,
        ],
      }))
      .map((m) => JSON.stringify(m))
      .join("\n");
  }
}

/**
 * Tagged test function
 */
export function taggedTest(
  title: string,
  tags: string[],
  testFunction: TestFunction,
) {
  const taggedTitle = `${title} ${tags.join(" ")}`;

  return base(taggedTitle, async ({ page }, testInfo) => {
    // Add tags as annotations
    tags.forEach((tag) => {
      testInfo.annotations.push({ type: "tag", description: tag });
    });

    // Run test with monitoring
    const monitor = new TestMonitor();
    monitor.startTest(testInfo);

    try {
      await testFunction({ page }, testInfo);
    } finally {
      monitor.endTest(testInfo);
    }
  });
}

/**
 * Test suite with tags
 */
export function taggedDescribe(
  title: string,
  tags: string[],
  suiteFunction: () => void,
) {
  base.describe(`${title} ${tags.join(" ")}`, () => {
    base.beforeEach(({}, testInfo) => {
      // Add suite tags to each test
      tags.forEach((tag) => {
        testInfo.annotations.push({ type: "tag", description: tag });
      });
    });

    suiteFunction();
  });
}

/**
 * Skip tests based on tags and environment
 */
export function conditionalTest(
  title: string,
  condition: {
    tags?: string[];
    environment?: "dev" | "staging" | "prod";
    skipOn?: {
      browser?: string[];
      os?: string[];
    };
  },
  testFunction: TestFunction,
) {
  return base(title, async (fixtures, testInfo) => {
    // Check environment
    if (
      condition.environment &&
      process.env['TEST_ENV'] !== condition.environment
    ) {
      testInfo.skip();
      return;
    }

    // Check browser
    if (condition.skipOn?.browser?.includes(testInfo.project.name)) {
      testInfo.skip();
      return;
    }

    // Check OS
    if (condition.skipOn?.os?.includes(process.platform)) {
      testInfo.skip();
      return;
    }

    await testFunction(fixtures, testInfo);
  });
}

/**
 * Flaky test handler
 */
export function flakyTest(
  title: string,
  options: {
    maxRetries?: number;
    quarantine?: boolean;
    expectedFailureRate?: number;
  },
  testFunction: TestFunction,
): ReturnType<typeof base> {
  const taggedTitle = `${title} ${TestTags.FLAKY}`;

  return base(taggedTitle, async (fixtures, testInfo) => {
    if (options.quarantine) {
      testInfo.skip();
      return;
    }

    testInfo.retry = options.maxRetries || 3;

    await testFunction(fixtures, testInfo);
  });
}
