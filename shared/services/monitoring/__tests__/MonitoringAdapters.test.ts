/**
 * Tests for monitoring adapters
 */

import { ConsoleAdapter } from '../adapters/ConsoleAdapter';
import { MetricsCollector } from '../adapters/MetricsCollector';
import { CompositeAdapter } from '../adapters/CompositeAdapter';
import { MonitoringFactory } from '../MonitoringFactory';

describe('ConsoleAdapter', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let adapter: ConsoleAdapter;
  
  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    adapter = new ConsoleAdapter(true);
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  it('should log discrepancies with appropriate emoji', () => {
    adapter.captureDiscrepancy({
      severity: 'critical',
      type: 'mate_difference',
      context: { fen: 'test' }
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('🚨 DISCREPANCY'),
      expect.any(String)
    );
  });
  
  it('should not log when disabled', () => {
    const disabledAdapter = new ConsoleAdapter(false);
    disabledAdapter.captureDiscrepancy({
      severity: 'low',
      type: 'score_mismatch',
      context: {}
    });
    
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
  
  it('should log errors to console.error', () => {
    adapter.recordError({
      message: 'Test error',
      severity: 'critical',
      context: { test: true }
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('🚨 ERROR'),
      'Test error',
      expect.any(Object),
      ''
    );
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;
  
  beforeEach(() => {
    collector = new MetricsCollector();
  });
  
  describe('discrepancy tracking', () => {
    it('should collect discrepancy data', () => {
      collector.captureDiscrepancy({
        severity: 'high',
        type: 'wdl_mismatch',
        context: { fen: 'test1' }
      });
      
      collector.captureDiscrepancy({
        severity: 'low',
        type: 'score_mismatch',
        context: { fen: 'test2' }
      });
      
      const report = collector.getDiscrepancyReport();
      expect(report.total).toBe(2);
      expect(report.bySeverity.high).toBe(1);
      expect(report.bySeverity.low).toBe(1);
      expect(report.byType.wdl_mismatch).toBe(1);
      expect(report.byType.score_mismatch).toBe(1);
    });
    
    it('should limit stored discrepancies', () => {
      // Add 1100 discrepancies
      for (let i = 0; i < 1100; i++) {
        collector.captureDiscrepancy({
          severity: 'low',
          type: 'test',
          context: { index: i }
        });
      }
      
      const report = collector.getDiscrepancyReport();
      expect(report.total).toBeLessThanOrEqual(1000);
    });
  });
  
  describe('latency tracking', () => {
    it('should calculate latency statistics', () => {
      collector.recordLatency({ operation: 'evaluate', duration: 100 });
      collector.recordLatency({ operation: 'evaluate', duration: 200 });
      collector.recordLatency({ operation: 'evaluate', duration: 150 });
      
      const report = collector.getLatencyReport('evaluate');
      const stats = report['evaluate'];
      
      expect(stats.count).toBe(3);
      expect(stats.avg).toBe(150);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
      expect(stats.p50).toBe(150);
    });
    
    it('should track latencies with tags separately', () => {
      collector.recordLatency({ operation: 'evaluate', duration: 100, tags: { system: 'legacy' } });
      collector.recordLatency({ operation: 'evaluate', duration: 200, tags: { system: 'unified' } });
      
      const report = collector.getLatencyReport();
      expect(Object.keys(report)).toHaveLength(2);
      expect(report['evaluate[system:legacy]']).toBeDefined();
      expect(report['evaluate[system:unified]']).toBeDefined();
    });
  });
  
  describe('counter tracking', () => {
    it('should increment counters', () => {
      collector.incrementCounter('test.count');
      collector.incrementCounter('test.count');
      collector.incrementCounter('test.count', { variant: 'a' });
      
      const counters = collector.getCounters();
      expect(counters['test.count']).toBe(2);
      expect(counters['test.count[variant:a]']).toBe(1);
    });
  });
  
  describe('clear functionality', () => {
    it('should clear all data', () => {
      collector.captureDiscrepancy({ severity: 'low', type: 'test', context: {} });
      collector.recordLatency({ operation: 'test', duration: 100 });
      collector.incrementCounter('test');
      
      collector.clear();
      
      expect(collector.getDiscrepancyReport().total).toBe(0);
      expect(collector.getLatencyReport()).toEqual({});
      expect(collector.getCounters()).toEqual({});
    });
  });
});

describe('CompositeAdapter', () => {
  it('should forward calls to all adapters', () => {
    const adapter1 = {
      captureDiscrepancy: jest.fn(),
      recordLatency: jest.fn(),
      recordError: jest.fn(),
      recordMetric: jest.fn(),
      incrementCounter: jest.fn()
    };
    
    const adapter2 = {
      captureDiscrepancy: jest.fn(),
      recordLatency: jest.fn(),
      recordError: jest.fn(),
      recordMetric: jest.fn(),
      incrementCounter: jest.fn()
    };
    
    const composite = new CompositeAdapter([adapter1, adapter2]);
    
    const discrepancy = { severity: 'low' as const, type: 'test', context: {} };
    composite.captureDiscrepancy(discrepancy);
    
    expect(adapter1.captureDiscrepancy).toHaveBeenCalledWith(discrepancy);
    expect(adapter2.captureDiscrepancy).toHaveBeenCalledWith(discrepancy);
  });
  
  it('should handle errors in individual adapters', () => {
    const failingAdapter = {
      captureDiscrepancy: jest.fn().mockImplementation(() => {
        throw new Error('Adapter error');
      }),
      recordLatency: jest.fn(),
      recordError: jest.fn(),
      recordMetric: jest.fn(),
      incrementCounter: jest.fn()
    };
    
    const workingAdapter = {
      captureDiscrepancy: jest.fn(),
      recordLatency: jest.fn(),
      recordError: jest.fn(),
      recordMetric: jest.fn(),
      incrementCounter: jest.fn()
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const composite = new CompositeAdapter([failingAdapter, workingAdapter]);
    
    const discrepancy = { severity: 'low' as const, type: 'test', context: {} };
    composite.captureDiscrepancy(discrepancy);
    
    expect(workingAdapter.captureDiscrepancy).toHaveBeenCalledWith(discrepancy);
    expect(consoleSpy).toHaveBeenCalledWith('Error in monitoring adapter:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});

describe('MonitoringFactory', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
    MonitoringFactory.resetMetrics();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('should create metrics collector for test environment', () => {
    process.env.NODE_ENV = 'test';
    const adapter = MonitoringFactory.createAdapter();
    expect(adapter).toBeInstanceOf(MetricsCollector);
  });
  
  it('should create composite adapter for development', () => {
    process.env.NODE_ENV = 'development';
    const adapter = MonitoringFactory.createAdapter();
    expect(adapter).toBeInstanceOf(CompositeAdapter);
  });
  
  it('should create appropriate adapter for production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_LOG_EVAL_DISCREPANCIES = 'false';
    
    const adapter = MonitoringFactory.createAdapter();
    expect(adapter).toBeInstanceOf(MetricsCollector);
  });
  
  it('should include console adapter in production when enabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_LOG_EVAL_DISCREPANCIES = 'true';
    
    const adapter = MonitoringFactory.createAdapter();
    expect(adapter).toBeInstanceOf(CompositeAdapter);
  });
  
  it('should return singleton metrics collector', () => {
    const collector1 = MonitoringFactory.getMetricsCollector();
    const collector2 = MonitoringFactory.getMetricsCollector();
    expect(collector1).toBe(collector2);
  });
  
  it('should generate metrics report', () => {
    const collector = MonitoringFactory.getMetricsCollector();
    collector.captureDiscrepancy({ severity: 'low', type: 'test', context: {} });
    
    const report = MonitoringFactory.getMetricsReport();
    expect(report.discrepancies.total).toBe(1);
    expect(report.latencies).toBeDefined();
    expect(report.errors).toBeDefined();
    expect(report.counters).toBeDefined();
  });
});