/**
 * Alert Manager for rollout monitoring
 * Manages alert rules, notifications, and circuit breaker logic
 */

import { MonitoringPort } from '../../monitoring/ports/MonitoringPort';
import { RolloutMetrics, AlertThresholds } from '../types';

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  context?: Record<string, any>;
  isActive: boolean;
  acknowledgedAt?: number;
  resolvedAt?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: Alert['severity'];
  evaluate: (metrics: RolloutMetrics, thresholds: AlertThresholds) => boolean;
  getMessage: (metrics: RolloutMetrics, thresholds: AlertThresholds) => string;
  autoResolve: boolean;
  cooldownMs: number; // Prevent alert spam
}

export class AlertManager {
  private static instance: AlertManager;
  private alerts: Map<string, Alert> = new Map();
  private monitoring: MonitoringPort;
  private alertRules: AlertRule[];
  private lastAlertTime: Map<string, number> = new Map();
  private circuitBreakerTripped = false;
  
  private constructor(monitoring: MonitoringPort) {
    this.monitoring = monitoring;
    this.alertRules = this.initializeAlertRules();
  }
  
  static getInstance(monitoring: MonitoringPort): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager(monitoring);
    }
    return AlertManager.instance;
  }
  
  /**
   * Evaluate all alert rules against current metrics
   */
  evaluateAlerts(metrics: RolloutMetrics, thresholds: AlertThresholds): Alert[] {
    const activeAlerts: Alert[] = [];
    
    for (const rule of this.alertRules) {
      const ruleId = rule.id;
      const existingAlert = this.alerts.get(ruleId);
      const shouldTrigger = rule.evaluate(metrics, thresholds);
      
      if (shouldTrigger) {
        // Check cooldown
        const lastAlert = this.lastAlertTime.get(ruleId) || 0;
        if (Date.now() - lastAlert < rule.cooldownMs) {
          continue; // Skip due to cooldown
        }
        
        if (!existingAlert || !existingAlert.isActive) {
          // Create new alert
          const alert: Alert = {
            id: ruleId,
            timestamp: Date.now(),
            severity: rule.severity,
            type: rule.name,
            message: rule.getMessage(metrics, thresholds),
            context: { metrics, thresholds },
            isActive: true
          };
          
          this.alerts.set(ruleId, alert);
          this.lastAlertTime.set(ruleId, Date.now());
          
          // Send notification
          this.notifyAlert(alert);
          
          // Check circuit breaker
          if (rule.severity === 'critical') {
            this.tripCircuitBreaker(alert);
          }
          
          activeAlerts.push(alert);
        } else {
          // Alert already active
          activeAlerts.push(existingAlert);
        }
      } else if (existingAlert && existingAlert.isActive && rule.autoResolve) {
        // Auto-resolve alert
        existingAlert.isActive = false;
        existingAlert.resolvedAt = Date.now();
        this.notifyResolution(existingAlert);
      }
    }
    
    return activeAlerts;
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && alert.isActive) {
      alert.acknowledgedAt = Date.now();
      
      this.monitoring.recordMetric({
        name: 'rollout.alert.acknowledged',
        value: 1,
        tags: { alert_id: alertId, severity: alert.severity }
      });
    }
  }
  
  /**
   * Manually resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && alert.isActive) {
      alert.isActive = false;
      alert.resolvedAt = Date.now();
      
      this.monitoring.recordMetric({
        name: 'rollout.alert.resolved',
        value: 1,
        tags: { alert_id: alertId, severity: alert.severity }
      });
    }
  }
  
  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.isActive);
  }
  
  /**
   * Check if circuit breaker is tripped
   */
  isCircuitBreakerTripped(): boolean {
    return this.circuitBreakerTripped;
  }
  
  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerTripped = false;
    
    this.monitoring.recordMetric({
      name: 'rollout.circuit_breaker.reset',
      value: 1
    });
  }
  
  // Private methods
  
  private initializeAlertRules(): AlertRule[] {
    return [
      {
        id: 'critical_discrepancies',
        name: 'Critical Discrepancies',
        description: 'Critical discrepancies detected between evaluation systems',
        severity: 'critical',
        evaluate: (metrics) => metrics.discrepancies.critical > 0,
        getMessage: (metrics) => `${metrics.discrepancies.critical} critical discrepancies detected - immediate rollback required`,
        autoResolve: false,
        cooldownMs: 0 // No cooldown for critical alerts
      },
      
      {
        id: 'high_discrepancy_rate',
        name: 'High Discrepancy Rate',
        description: 'High rate of discrepancies detected',
        severity: 'high',
        evaluate: (metrics, thresholds) => {
          const highPerHour = this.calculatePerHour(metrics.discrepancies.high);
          return highPerHour > thresholds.highDiscrepanciesPerHour;
        },
        getMessage: (metrics, thresholds) => {
          const rate = this.calculatePerHour(metrics.discrepancies.high);
          return `High discrepancy rate: ${rate.toFixed(1)}/hour (threshold: ${thresholds.highDiscrepanciesPerHour}/hour)`;
        },
        autoResolve: true,
        cooldownMs: 5 * 60 * 1000 // 5 minutes
      },
      
      {
        id: 'error_rate_spike',
        name: 'Error Rate Spike',
        description: 'Canary error rate significantly higher than baseline',
        severity: 'high',
        evaluate: (metrics, thresholds) => metrics.stability.errorRateDelta > thresholds.errorRateDelta,
        getMessage: (metrics) => `Canary error rate ${metrics.stability.canaryErrorRate.toFixed(2)}% vs baseline ${metrics.stability.baselineErrorRate.toFixed(2)}% (delta: ${metrics.stability.errorRateDelta.toFixed(2)}%)`,
        autoResolve: true,
        cooldownMs: 10 * 60 * 1000 // 10 minutes
      },
      
      {
        id: 'latency_degradation',
        name: 'Latency Degradation',
        description: 'Canary latency significantly worse than baseline',
        severity: 'medium',
        evaluate: (metrics, thresholds) => metrics.performance.latencyDegradation > thresholds.latencyDegradation,
        getMessage: (metrics) => `Canary latency degraded by ${metrics.performance.latencyDegradation.toFixed(1)}% (p99: ${metrics.performance.canaryLatencyP99.toFixed(0)}ms vs ${metrics.performance.baselineLatencyP99.toFixed(0)}ms)`,
        autoResolve: true,
        cooldownMs: 15 * 60 * 1000 // 15 minutes
      },
      
      {
        id: 'low_traffic_volume',
        name: 'Low Traffic Volume',
        description: 'Insufficient traffic for reliable metrics',
        severity: 'low',
        evaluate: (metrics) => metrics.volume.canaryRequests < 100,
        getMessage: (metrics) => `Low canary traffic volume: ${metrics.volume.canaryRequests} requests - metrics may be unreliable`,
        autoResolve: true,
        cooldownMs: 30 * 60 * 1000 // 30 minutes
      }
    ];
  }
  
  private notifyAlert(alert: Alert): void {
    // Log the alert
    this.monitoring.recordError({
      message: alert.message,
      severity: alert.severity === 'critical' ? 'critical' : 
               alert.severity === 'high' ? 'error' : 'warning',
      context: alert.context
    });
    
    // Track metric
    this.monitoring.incrementCounter('rollout.alerts', {
      severity: alert.severity,
      type: alert.type
    });
    
    // In a real implementation, this would send notifications
    // to Slack, PagerDuty, email, etc.
  }
  
  private notifyResolution(alert: Alert): void {
    this.monitoring.recordMetric({
      name: 'rollout.alert.auto_resolved',
      value: 1,
      tags: { alert_id: alert.id, severity: alert.severity }
    });
  }
  
  private tripCircuitBreaker(alert: Alert): void {
    this.circuitBreakerTripped = true;
    
    this.monitoring.recordError({
      message: 'Circuit breaker tripped - automatic rollback initiated',
      severity: 'critical',
      context: { triggering_alert: alert }
    });
    
    this.monitoring.incrementCounter('rollout.circuit_breaker.trips');
  }
  
  private calculatePerHour(count: number): number {
    // This is a simplified calculation
    // In reality, we'd track the time window more precisely
    return count * 4; // Assuming 15-minute metric window
  }
}