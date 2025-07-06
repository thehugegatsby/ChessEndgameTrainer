/**
 * Factory for creating monitoring adapters based on environment
 * Centralizes monitoring configuration
 */

import { MonitoringPort } from './ports/MonitoringPort';
import { ConsoleAdapter } from './adapters/ConsoleAdapter';
import { MetricsCollector } from './adapters/MetricsCollector';
import { CompositeAdapter } from './adapters/CompositeAdapter';

export class MonitoringFactory {
  private static metricsCollector: MetricsCollector | null = null;

  /**
   * Create monitoring adapter based on environment
   */
  static createAdapter(): MonitoringPort {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    const enableConsoleLogging = process.env.NEXT_PUBLIC_LOG_EVAL_DISCREPANCIES === 'true';
    
    if (isTest) {
      // In tests, use metrics collector only (no console noise)
      return this.getMetricsCollector();
    }
    
    if (isDevelopment) {
      // In development, use both console and metrics collector
      return new CompositeAdapter([
        new ConsoleAdapter(true),
        this.getMetricsCollector()
      ]);
    }
    
    // In production
    const adapters: MonitoringPort[] = [];
    
    // Always collect metrics in production
    adapters.push(this.getMetricsCollector());
    
    // Optionally enable console logging in production (for debugging)
    if (enableConsoleLogging) {
      adapters.push(new ConsoleAdapter(true));
    }
    
    // TODO: Add production monitoring service (Sentry, DataDog, etc.)
    // if (process.env.SENTRY_DSN) {
    //   adapters.push(new SentryAdapter());
    // }
    
    return adapters.length === 1 
      ? adapters[0] 
      : new CompositeAdapter(adapters);
  }

  /**
   * Get singleton metrics collector instance
   */
  static getMetricsCollector(): MetricsCollector {
    if (!this.metricsCollector) {
      this.metricsCollector = new MetricsCollector();
    }
    return this.metricsCollector;
  }

  /**
   * Reset metrics collector (useful for tests)
   */
  static resetMetrics(): void {
    if (this.metricsCollector) {
      this.metricsCollector.clear();
    }
  }

  /**
   * Get current metrics report
   */
  static getMetricsReport() {
    const collector = this.getMetricsCollector();
    return {
      discrepancies: collector.getDiscrepancyReport(),
      latencies: collector.getLatencyReport(),
      errors: collector.getErrorReport(),
      counters: collector.getCounters()
    };
  }
}