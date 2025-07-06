/**
 * Abstract monitoring interface for production monitoring integration
 * Allows swapping between different monitoring services (Sentry, console, etc.)
 */

export interface DiscrepancyData {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string; // e.g., 'score_mismatch', 'mate_difference', 'wdl_mismatch'
  context: Record<string, any>; // Legacy output, unified output, FEN, etc.
}

export interface LatencyData {
  operation: string;
  duration: number;
  tags?: Record<string, string>;
}

export interface ErrorData {
  message: string;
  severity: 'warning' | 'error' | 'critical';
  context?: Record<string, any>;
  stack?: string;
}

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface MonitoringPort {
  /**
   * Captures a specific discrepancy event for error tracking and alerting
   */
  captureDiscrepancy(data: DiscrepancyData): void;

  /**
   * Records operation latency for performance monitoring
   */
  recordLatency(data: LatencyData): void;

  /**
   * Records an error or exception
   */
  recordError(data: ErrorData): void;

  /**
   * Records a custom metric (counter, gauge, etc.)
   */
  recordMetric(data: MetricData): void;

  /**
   * Increments a counter metric
   */
  incrementCounter(name: string, tags?: Record<string, string>): void;

  /**
   * Flush any pending data (useful for serverless environments)
   */
  flush?(): Promise<void>;
}