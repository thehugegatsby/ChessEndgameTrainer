/**
 * Console monitoring adapter for development and testing
 * Logs all monitoring data to console with structured formatting
 */

import { 
  MonitoringPort, 
  DiscrepancyData, 
  LatencyData, 
  ErrorData, 
  MetricData 
} from '../ports/MonitoringPort';

export class ConsoleAdapter implements MonitoringPort {
  private readonly prefix = '[MONITORING]';
  private readonly enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  captureDiscrepancy(data: DiscrepancyData): void {
    if (!this.enabled) return;
    
    const emoji = this.getSeverityEmoji(data.severity);
    console.log(
      `${this.prefix} ${emoji} DISCREPANCY`,
      JSON.stringify({
        severity: data.severity,
        type: data.type,
        context: data.context,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  }

  recordLatency(data: LatencyData): void {
    if (!this.enabled) return;
    
    const status = data.duration > 1000 ? '🐌' : '⚡';
    console.log(
      `${this.prefix} ${status} LATENCY`,
      `${data.operation}: ${data.duration}ms`,
      data.tags || ''
    );
  }

  recordError(data: ErrorData): void {
    if (!this.enabled) return;
    
    const emoji = this.getSeverityEmoji(data.severity);
    console.error(
      `${this.prefix} ${emoji} ERROR`,
      data.message,
      data.context || '',
      data.stack || ''
    );
  }

  recordMetric(data: MetricData): void {
    if (!this.enabled) return;
    
    console.log(
      `${this.prefix} 📊 METRIC`,
      `${data.name}: ${data.value}`,
      data.tags || ''
    );
  }

  incrementCounter(name: string, tags?: Record<string, string>): void {
    if (!this.enabled) return;
    
    console.log(
      `${this.prefix} ➕ COUNTER`,
      name,
      tags || ''
    );
  }

  async flush(): Promise<void> {
    // No-op for console adapter
    return Promise.resolve();
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'error': return '❌';
      case 'medium': return '🟡';
      case 'warning': return '⚡';
      case 'low': return '🔵';
      default: return '📝';
    }
  }
}