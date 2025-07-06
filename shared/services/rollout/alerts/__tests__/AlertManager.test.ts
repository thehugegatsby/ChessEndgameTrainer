/**
 * Tests for Alert Manager
 */

import { AlertManager, Alert, AlertRule } from '../AlertManager';
import { MonitoringPort } from '../../../monitoring/ports/MonitoringPort';
import { RolloutMetrics, AlertThresholds } from '../../types';

const mockMonitoring: MonitoringPort = {
  captureDiscrepancy: jest.fn(),
  recordLatency: jest.fn(),
  recordError: jest.fn(),
  recordMetric: jest.fn(),
  incrementCounter: jest.fn()
};

describe('AlertManager', () => {
  let alertManager: AlertManager;
  
  const baseMetrics: RolloutMetrics = {
    discrepancies: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    performance: {
      canaryLatencyP99: 50,
      baselineLatencyP99: 50,
      latencyDegradation: 0
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
  };
  
  const baseThresholds: AlertThresholds = {
    criticalDiscrepancies: 1,
    highDiscrepanciesPerHour: 5,
    errorRateDelta: 1.0,
    latencyDegradation: 20
  };
  
  beforeEach(() => {
    // Reset singleton
    (AlertManager as any).instance = null;
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    alertManager = AlertManager.getInstance(mockMonitoring);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('evaluateAlerts', () => {
    it('should trigger critical alert for critical discrepancies', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, critical: 1 }
      };
      
      const alerts = alertManager.evaluateAlerts(metrics, baseThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: 'critical',
        type: 'Critical Discrepancies',
        message: expect.stringContaining('1 critical discrepancies detected'),
        isActive: true
      });
      
      expect(mockMonitoring.recordError).toHaveBeenCalledWith({
        message: expect.stringContaining('1 critical discrepancies detected'),
        severity: 'critical',
        context: expect.any(Object)
      });
      
      expect(mockMonitoring.incrementCounter).toHaveBeenCalledWith('rollout.alerts', {
        severity: 'critical',
        type: 'Critical Discrepancies'
      });
    });
    
    it('should trigger high alert for high discrepancy rate', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, high: 20 }
      };
      
      const alerts = alertManager.evaluateAlerts(metrics, baseThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: 'high',
        type: 'High Discrepancy Rate',
        message: expect.stringContaining('High discrepancy rate')
      });
    });
    
    it('should trigger error rate spike alert', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        stability: {
          canaryErrorRate: 2.5,
          baselineErrorRate: 0.5,
          errorRateDelta: 2.0
        }
      };
      
      const alerts = alertManager.evaluateAlerts(metrics, baseThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: 'high',
        type: 'Error Rate Spike',
        message: expect.stringContaining('Canary error rate 2.50% vs baseline 0.50%')
      });
    });
    
    it('should trigger latency degradation alert', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        performance: {
          canaryLatencyP99: 75,
          baselineLatencyP99: 50,
          latencyDegradation: 50
        }
      };
      
      const alerts = alertManager.evaluateAlerts(metrics, baseThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: 'medium',
        type: 'Latency Degradation',
        message: expect.stringContaining('Canary latency degraded by 50.0%')
      });
    });
    
    it('should trigger low traffic volume alert', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        volume: {
          totalRequests: 150,
          canaryRequests: 50,
          baselineRequests: 100
        }
      };
      
      const alerts = alertManager.evaluateAlerts(metrics, baseThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: 'low',
        type: 'Low Traffic Volume',
        message: expect.stringContaining('Low canary traffic volume: 50 requests')
      });
    });
    
    it('should respect cooldown periods', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, high: 20 }
      };
      
      // First evaluation - creates new alert
      const alerts1 = alertManager.evaluateAlerts(metrics, baseThresholds);
      expect(alerts1).toHaveLength(1);
      expect(mockMonitoring.incrementCounter).toHaveBeenCalledTimes(1);
      
      // Clear the alert to test cooldown on new alert creation
      alertManager.resolveAlert('high_discrepancy_rate');
      
      // Second evaluation immediately after - should be blocked by cooldown
      jest.clearAllMocks();
      const alerts2 = alertManager.evaluateAlerts(metrics, baseThresholds);
      expect(alerts2).toHaveLength(0); // No alert due to cooldown
      expect(mockMonitoring.incrementCounter).not.toHaveBeenCalled();
      
      // Advance past cooldown
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
      
      // Third evaluation - should create new alert
      jest.clearAllMocks();
      const alerts3 = alertManager.evaluateAlerts(metrics, baseThresholds);
      expect(alerts3).toHaveLength(1);
      expect(mockMonitoring.incrementCounter).toHaveBeenCalledTimes(1);
    });
    
    it('should auto-resolve alerts when condition clears', () => {
      // Trigger an alert
      const badMetrics: RolloutMetrics = {
        ...baseMetrics,
        performance: {
          canaryLatencyP99: 75,
          baselineLatencyP99: 50,
          latencyDegradation: 50
        }
      };
      
      const alerts1 = alertManager.evaluateAlerts(badMetrics, baseThresholds);
      expect(alerts1).toHaveLength(1);
      
      // Clear the condition
      jest.clearAllMocks();
      const alerts2 = alertManager.evaluateAlerts(baseMetrics, baseThresholds);
      expect(alerts2).toHaveLength(0);
      
      // Should have recorded resolution
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.alert.auto_resolved',
        value: 1,
        tags: expect.any(Object)
      });
    });
    
    it('should trip circuit breaker on critical alert', () => {
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, critical: 1 }
      };
      
      alertManager.evaluateAlerts(metrics, baseThresholds);
      
      expect(alertManager.isCircuitBreakerTripped()).toBe(true);
      expect(mockMonitoring.recordError).toHaveBeenCalledWith({
        message: 'Circuit breaker tripped - automatic rollback initiated',
        severity: 'critical',
        context: expect.any(Object)
      });
      expect(mockMonitoring.incrementCounter).toHaveBeenCalledWith('rollout.circuit_breaker.trips');
    });
  });
  
  describe('acknowledgeAlert', () => {
    it('should acknowledge active alert', () => {
      // Trigger an alert first
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, critical: 1 }
      };
      
      alertManager.evaluateAlerts(metrics, baseThresholds);
      
      // Acknowledge it
      jest.clearAllMocks();
      alertManager.acknowledgeAlert('critical_discrepancies');
      
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.alert.acknowledged',
        value: 1,
        tags: { alert_id: 'critical_discrepancies', severity: 'critical' }
      });
      
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts[0].acknowledgedAt).toBeDefined();
    });
    
    it('should not acknowledge non-existent alert', () => {
      alertManager.acknowledgeAlert('non_existent');
      expect(mockMonitoring.recordMetric).not.toHaveBeenCalled();
    });
  });
  
  describe('resolveAlert', () => {
    it('should manually resolve active alert', () => {
      // Trigger an alert first
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, critical: 1 }
      };
      
      alertManager.evaluateAlerts(metrics, baseThresholds);
      
      // Resolve it
      jest.clearAllMocks();
      alertManager.resolveAlert('critical_discrepancies');
      
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.alert.resolved',
        value: 1,
        tags: { alert_id: 'critical_discrepancies', severity: 'critical' }
      });
      
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });
  });
  
  describe('getActiveAlerts', () => {
    it('should return only active alerts', () => {
      // Trigger multiple alerts
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, critical: 1, high: 20 },
        performance: {
          canaryLatencyP99: 75,
          baselineLatencyP99: 50,
          latencyDegradation: 50
        }
      };
      
      alertManager.evaluateAlerts(metrics, baseThresholds);
      
      let activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts).toHaveLength(3);
      
      // Resolve one
      alertManager.resolveAlert('critical_discrepancies');
      
      activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts).toHaveLength(2);
      expect(activeAlerts.find(a => a.id === 'critical_discrepancies')).toBeUndefined();
    });
  });
  
  describe('resetCircuitBreaker', () => {
    it('should reset circuit breaker', () => {
      // Trip circuit breaker first
      const metrics: RolloutMetrics = {
        ...baseMetrics,
        discrepancies: { ...baseMetrics.discrepancies, critical: 1 }
      };
      
      alertManager.evaluateAlerts(metrics, baseThresholds);
      expect(alertManager.isCircuitBreakerTripped()).toBe(true);
      
      // Reset it
      jest.clearAllMocks();
      alertManager.resetCircuitBreaker();
      
      expect(alertManager.isCircuitBreakerTripped()).toBe(false);
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith({
        name: 'rollout.circuit_breaker.reset',
        value: 1
      });
    });
  });
});