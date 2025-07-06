/**
 * Tests for Rollout Manager
 */

import { RolloutManager } from '../RolloutManager';
import { MonitoringPort } from '../../monitoring/ports/MonitoringPort';
import { FeatureFlagService } from '../../featureFlags/FeatureFlagService';
import { DiscrepancyMonitor } from '../../monitoring/DiscrepancyMonitor';
import { MetricsCollector } from '../../monitoring/adapters/MetricsCollector';
import { RolloutMetrics, RolloutStage } from '../types';
import { ROLLOUT_CONFIG } from '../config';

// Mock dependencies
jest.mock('../../featureFlags/FeatureFlagService');
jest.mock('../../monitoring/DiscrepancyMonitor');
jest.mock('../../monitoring/adapters/MetricsCollector');
jest.mock('../../monitoring/MonitoringFactory', () => ({
  MonitoringFactory: {
    createAdapter: jest.fn(() => mockMonitoring),
    getMetricsCollector: jest.fn(() => mockMetricsCollector)
  }
}));

const mockMonitoring: MonitoringPort = {
  captureDiscrepancy: jest.fn(),
  recordLatency: jest.fn(),
  recordError: jest.fn(),
  recordMetric: jest.fn(),
  incrementCounter: jest.fn()
};

const mockMetricsCollector = {
  getLatencyReport: jest.fn(),
  getErrorReport: jest.fn(),
  getCounters: jest.fn(),
  getDiscrepancyReport: jest.fn()
};

const mockDiscrepancyMonitor = {
  getStatistics: jest.fn()
};

describe('RolloutManager', () => {
  let manager: RolloutManager;
  
  beforeEach(() => {
    // Reset singleton
    (RolloutManager as any).instance = null;
    
    // Reset mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mock returns
    (DiscrepancyMonitor.getInstance as jest.Mock).mockReturnValue(mockDiscrepancyMonitor);
    mockDiscrepancyMonitor.getStatistics.mockReturnValue({
      total: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 }
    });
    
    mockMetricsCollector.getLatencyReport.mockReturnValue({
      'evaluation.latency[system:unified]': { p99: 50 },
      'evaluation.latency[system:legacy]': { p99: 45 }
    });
    
    mockMetricsCollector.getCounters.mockReturnValue({
      'evaluation.errors[system:unified]': 1,
      'evaluation.errors[system:legacy]': 1,
      'evaluation.requests[system:unified]': 1000,
      'evaluation.requests[system:legacy]': 1000
    });
    
    mockMetricsCollector.getErrorReport.mockReturnValue({
      total: 2,
      bySeverity: { error: 2 },
      recent: []
    });
    
    manager = RolloutManager.getInstance(mockMonitoring);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('start', () => {
    it('should start health checks and progression checks', async () => {
      manager.start();
      
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.started',
        value: 1,
        tags: { stage: 'shadow' }
      });
      
      const state = manager.getState();
      expect(state.isPaused).toBe(false);
      
      // Advance timers to trigger checks
      jest.advanceTimersByTime(ROLLOUT_CONFIG.healthCheckInterval);
      
      // Allow async operations to complete
      await Promise.resolve();
      
      // Should have performed health check
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'rollout.health_check'
        })
      );
    });
    
    it('should not start from rollback state', async () => {
      // Need to rollback first to set the state properly
      await manager.rollback('Test rollback');
      jest.clearAllMocks();
      
      manager.start();
      
      expect(mockMonitoring.recordError).toHaveBeenCalledWith({
        message: 'Cannot start rollout from rollback state',
        severity: 'warning'
      });
    });
  });
  
  describe('pause', () => {
    it('should pause rollout and stop timers', () => {
      manager.start();
      manager.pause();
      
      const state = manager.getState();
      expect(state.isPaused).toBe(true);
      
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.paused',
        value: 1,
        tags: { stage: 'shadow' }
      });
      
      // Advance timers - should not trigger health checks
      const callCount = (mockMonitoring.recordMetric as jest.Mock).mock.calls.length;
      jest.advanceTimersByTime(ROLLOUT_CONFIG.healthCheckInterval);
      expect((mockMonitoring.recordMetric as jest.Mock).mock.calls.length).toBe(callCount);
    });
  });
  
  describe('performHealthCheck', () => {
    it('should detect critical discrepancies and trigger rollback', async () => {
      mockDiscrepancyMonitor.getStatistics.mockReturnValue({
        total: 1,
        bySeverity: { critical: 1, high: 0, medium: 0, low: 0 }
      });
      
      const result = await manager.performHealthCheck();
      
      expect(result.isHealthy).toBe(false);
      expect(result.shouldRollback).toBe(true);
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          severity: 'critical',
          message: expect.stringContaining('1 critical discrepancies detected')
        })
      );
      
      expect(mockMonitoring.recordError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Emergency rollback initiated'),
          severity: 'critical'
        })
      );
    });
    
    it('should detect high discrepancy rate', async () => {
      // Progress to canary stage first (has lower thresholds)
      await manager.progressToNextStage();
      
      // Simulate being in stage for some time to get meaningful per-hour rate
      jest.advanceTimersByTime(15 * 60 * 1000); // 15 minutes
      
      mockDiscrepancyMonitor.getStatistics.mockReturnValue({
        total: 20,
        bySeverity: { critical: 0, high: 20, medium: 0, low: 0 }
      });
      
      const result = await manager.performHealthCheck();
      
      // 20 high discrepancies in 15 minutes = 80/hour, threshold is 5/hour
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          message: expect.stringContaining('High discrepancy rate')
        })
      );
    });
    
    it('should detect error rate spike', async () => {
      mockMetricsCollector.getCounters.mockReturnValue({
        'evaluation.errors[system:unified]': 50,
        'evaluation.errors[system:legacy]': 10,
        'evaluation.requests[system:unified]': 1000,
        'evaluation.requests[system:legacy]': 1000
      });
      
      const result = await manager.performHealthCheck();
      
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          message: expect.stringContaining('Error rate increased')
        })
      );
    });
    
    it('should detect latency degradation', async () => {
      mockMetricsCollector.getLatencyReport.mockReturnValue({
        'evaluation.latency[system:unified]': { p99: 100 },
        'evaluation.latency[system:legacy]': { p99: 50 }
      });
      
      const result = await manager.performHealthCheck();
      
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          severity: 'medium',
          message: expect.stringContaining('Latency degraded')
        })
      );
    });
    
    it('should return healthy when no issues', async () => {
      const result = await manager.performHealthCheck();
      
      expect(result.isHealthy).toBe(true);
      expect(result.shouldRollback).toBe(false);
      expect(result.alerts).toHaveLength(0);
      expect(result.recommendation).toBe('progress');
    });
  });
  
  describe('progressToNextStage', () => {
    it('should progress from shadow to canary', async () => {
      const result = await manager.progressToNextStage();
      
      expect(result).toBe(true);
      
      const state = manager.getState();
      expect(state.currentStage).toBe('canary');
      expect(state.currentPercentage).toBe(1); // Min percentage for canary
      
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'rollout.stage_transition',
          value: 1
        })
      );
    });
    
    it('should not progress when paused', async () => {
      manager.pause();
      
      const result = await manager.progressToNextStage();
      
      expect(result).toBe(false);
      expect(mockMonitoring.recordError).toHaveBeenCalledWith({
        message: 'Cannot progress while paused',
        severity: 'warning'
      });
    });
    
    it('should record manual approval requirement', async () => {
      // Progress to canary (which requires approval)
      await manager.progressToNextStage();
      
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.manual_approval_required',
        value: 1,
        tags: { next_stage: 'canary' }
      });
    });
    
    it('should not progress beyond full stage', async () => {
      // Progress through all stages to reach full
      await manager.progressToNextStage(); // shadow -> canary
      await manager.progressToNextStage(); // canary -> expansion
      await manager.progressToNextStage(); // expansion -> majority
      await manager.progressToNextStage(); // majority -> full
      
      const state = manager.getState();
      expect(state.currentStage).toBe('full');
      
      // Try to progress beyond full
      const result = await manager.progressToNextStage();
      expect(result).toBe(false);
    });
  });
  
  describe('rollback', () => {
    it('should set stage to rollback and percentage to 0', async () => {
      // Progress to canary first
      await manager.progressToNextStage();
      
      await manager.rollback('Test rollback reason');
      
      const state = manager.getState();
      expect(state.currentStage).toBe('rollback');
      expect(state.currentPercentage).toBe(0);
      expect(state.isHealthy).toBe(false);
      
      expect(mockMonitoring.recordError).toHaveBeenCalledWith({
        message: 'Emergency rollback initiated: Test rollback reason',
        severity: 'critical',
        context: expect.any(Object)
      });
    });
  });
  
  describe('getMetrics', () => {
    it('should collect and return current metrics', async () => {
      const metrics = await manager.getMetrics();
      
      expect(metrics).toMatchObject({
        discrepancies: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        performance: {
          canaryLatencyP99: 50,
          baselineLatencyP99: 45,
          latencyDegradation: expect.any(Number)
        },
        stability: {
          canaryErrorRate: 0.1,
          baselineErrorRate: 0.1,
          errorRateDelta: 0
        },
        volume: {
          totalRequests: 2000,
          canaryRequests: 1000,
          baselineRequests: 1000
        }
      });
    });
  });
  
  describe('auto-progression', () => {
    it('should auto-progress within canary stage', async () => {
      // Move to canary stage
      await manager.progressToNextStage();
      manager.start();
      
      // Mock stable metrics
      mockDiscrepancyMonitor.getStatistics.mockReturnValue({
        total: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 }
      });
      
      // Fast-forward past min stable duration (4 hours for canary)
      jest.advanceTimersByTime(4 * 60 * 60 * 1000 + 1000); // 4 hours + 1 second
      
      // Trigger progression check
      jest.advanceTimersByTime(ROLLOUT_CONFIG.progressionCheckInterval);
      
      // Allow async operations to complete
      await Promise.resolve();
      
      const state = manager.getState();
      expect(state.currentPercentage).toBeGreaterThan(1);
    });
    
    it('should not auto-progress when unhealthy', async () => {
      await manager.progressToNextStage();
      manager.start();
      
      // Set unhealthy metrics
      mockDiscrepancyMonitor.getStatistics.mockReturnValue({
        total: 1,
        bySeverity: { critical: 1, high: 0, medium: 0, low: 0 }
      });
      
      // Trigger health check
      jest.advanceTimersByTime(ROLLOUT_CONFIG.healthCheckInterval);
      
      const initialPercentage = manager.getState().currentPercentage;
      
      // Try to progress
      jest.advanceTimersByTime(ROLLOUT_CONFIG.progressionCheckInterval);
      
      expect(manager.getState().currentPercentage).toBe(initialPercentage);
    });
  });
});