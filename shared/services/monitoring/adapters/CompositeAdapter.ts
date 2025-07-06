/**
 * Composite monitoring adapter that forwards to multiple monitoring services
 * Useful for sending data to both console and production monitoring simultaneously
 */

import { 
  MonitoringPort, 
  DiscrepancyData, 
  LatencyData, 
  ErrorData, 
  MetricData 
} from '../ports/MonitoringPort';

export class CompositeAdapter implements MonitoringPort {
  private adapters: MonitoringPort[];

  constructor(adapters: MonitoringPort[]) {
    this.adapters = adapters;
  }

  captureDiscrepancy(data: DiscrepancyData): void {
    this.adapters.forEach(adapter => {
      try {
        adapter.captureDiscrepancy(data);
      } catch (error) {
        console.error('Error in monitoring adapter:', error);
      }
    });
  }

  recordLatency(data: LatencyData): void {
    this.adapters.forEach(adapter => {
      try {
        adapter.recordLatency(data);
      } catch (error) {
        console.error('Error in monitoring adapter:', error);
      }
    });
  }

  recordError(data: ErrorData): void {
    this.adapters.forEach(adapter => {
      try {
        adapter.recordError(data);
      } catch (error) {
        console.error('Error in monitoring adapter:', error);
      }
    });
  }

  recordMetric(data: MetricData): void {
    this.adapters.forEach(adapter => {
      try {
        adapter.recordMetric(data);
      } catch (error) {
        console.error('Error in monitoring adapter:', error);
      }
    });
  }

  incrementCounter(name: string, tags?: Record<string, string>): void {
    this.adapters.forEach(adapter => {
      try {
        adapter.incrementCounter(name, tags);
      } catch (error) {
        console.error('Error in monitoring adapter:', error);
      }
    });
  }

  async flush(): Promise<void> {
    const flushPromises = this.adapters
      .filter(adapter => adapter.flush)
      .map(adapter => adapter.flush!());
    
    await Promise.all(flushPromises);
  }

  /**
   * Add a new adapter to the composite
   */
  addAdapter(adapter: MonitoringPort): void {
    this.adapters.push(adapter);
  }

  /**
   * Remove an adapter from the composite
   */
  removeAdapter(adapter: MonitoringPort): void {
    const index = this.adapters.indexOf(adapter);
    if (index > -1) {
      this.adapters.splice(index, 1);
    }
  }
}