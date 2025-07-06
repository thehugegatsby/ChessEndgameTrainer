/**
 * In-memory metrics collector for aggregating metrics data
 * Useful for generating reports and dashboards
 */

import { 
  MonitoringPort, 
  DiscrepancyData, 
  LatencyData, 
  ErrorData, 
  MetricData 
} from '../ports/MonitoringPort';

interface LatencyStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  values: number[];
}

interface CounterData {
  value: number;
  lastUpdated: Date;
}

export class MetricsCollector implements MonitoringPort {
  private discrepancies: DiscrepancyData[] = [];
  private latencies: Map<string, LatencyStats> = new Map();
  private errors: ErrorData[] = [];
  private metrics: Map<string, MetricData[]> = new Map();
  private counters: Map<string, CounterData> = new Map();
  
  private readonly maxStoredItems = 1000;

  captureDiscrepancy(data: DiscrepancyData): void {
    this.discrepancies.push({
      ...data,
      context: { ...data.context, timestamp: new Date().toISOString() }
    });
    
    // Limit memory usage
    if (this.discrepancies.length > this.maxStoredItems) {
      this.discrepancies.shift();
    }
  }

  recordLatency(data: LatencyData): void {
    const key = this.getLatencyKey(data.operation, data.tags);
    const stats = this.latencies.get(key) || {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      values: []
    };
    
    stats.count++;
    stats.sum += data.duration;
    stats.min = Math.min(stats.min, data.duration);
    stats.max = Math.max(stats.max, data.duration);
    stats.values.push(data.duration);
    
    // Keep only last 1000 values for percentile calculations
    if (stats.values.length > 1000) {
      stats.values.shift();
    }
    
    this.latencies.set(key, stats);
  }

  recordError(data: ErrorData): void {
    this.errors.push({
      ...data,
      context: { ...data.context, timestamp: new Date().toISOString() }
    });
    
    // Limit memory usage
    if (this.errors.length > this.maxStoredItems) {
      this.errors.shift();
    }
  }

  recordMetric(data: MetricData): void {
    const key = this.getMetricKey(data.name, data.tags);
    const metrics = this.metrics.get(key) || [];
    
    metrics.push({
      ...data,
      tags: { ...data.tags, timestamp: new Date().toISOString() }
    });
    
    // Keep only last 1000 values
    if (metrics.length > 1000) {
      metrics.shift();
    }
    
    this.metrics.set(key, metrics);
  }

  incrementCounter(name: string, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    const counter = this.counters.get(key) || { value: 0, lastUpdated: new Date() };
    
    counter.value++;
    counter.lastUpdated = new Date();
    
    this.counters.set(key, counter);
  }

  async flush(): Promise<void> {
    // No-op for in-memory collector
    return Promise.resolve();
  }

  // Reporting methods
  
  getDiscrepancyReport(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recent: DiscrepancyData[];
  } {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    this.discrepancies.forEach(d => {
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      byType[d.type] = (byType[d.type] || 0) + 1;
    });
    
    return {
      total: this.discrepancies.length,
      bySeverity,
      byType,
      recent: this.discrepancies.slice(-10)
    };
  }

  getLatencyReport(operation?: string): Record<string, {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    count: number;
  }> {
    const report: Record<string, any> = {};
    
    this.latencies.forEach((stats, key) => {
      if (operation && !key.startsWith(operation)) return;
      
      const sorted = [...stats.values].sort((a, b) => a - b);
      const p50Index = Math.floor(sorted.length * 0.5);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      report[key] = {
        avg: stats.sum / stats.count,
        min: stats.min,
        max: stats.max,
        p50: sorted[p50Index] || 0,
        p95: sorted[p95Index] || 0,
        p99: sorted[p99Index] || 0,
        count: stats.count
      };
    });
    
    return report;
  }

  getErrorReport(): {
    total: number;
    bySeverity: Record<string, number>;
    recent: ErrorData[];
  } {
    const bySeverity: Record<string, number> = {};
    
    this.errors.forEach(e => {
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });
    
    return {
      total: this.errors.length,
      bySeverity,
      recent: this.errors.slice(-10)
    };
  }

  getCounters(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.counters.forEach((data, key) => {
      result[key] = data.value;
    });
    
    return result;
  }

  // Clear all collected data
  clear(): void {
    this.discrepancies = [];
    this.latencies.clear();
    this.errors = [];
    this.metrics.clear();
    this.counters.clear();
  }

  private getLatencyKey(operation: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return operation;
    }
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${operation}[${tagStr}]`;
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    return this.getLatencyKey(name, tags);
  }
}