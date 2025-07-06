/**
 * Rollout Manager for gradual feature flag progression
 * Manages staged rollout with health checks and automatic rollback
 */

import { FeatureFlagService } from '../featureFlags/FeatureFlagService';
import { MonitoringPort } from '../monitoring/ports/MonitoringPort';
import { MonitoringFactory } from '../monitoring/MonitoringFactory';
import { DiscrepancyMonitor } from '../monitoring/DiscrepancyMonitor';
import { MetricsCollector } from '../monitoring/adapters/MetricsCollector';
import { 
  RolloutState, 
  RolloutStage, 
  HealthCheckResult, 
  RolloutMetrics,
  RolloutHistoryEntry 
} from './types';
import { ROLLOUT_STAGES, STAGE_ORDER, ROLLOUT_CONFIG } from './config';

export class RolloutManager {
  private static instance: RolloutManager;
  private state: RolloutState;
  private monitoring: MonitoringPort;
  private metricsCollector: MetricsCollector;
  private healthCheckTimer?: NodeJS.Timeout;
  private progressionTimer?: NodeJS.Timeout;
  private featureFlagName = 'USE_UNIFIED_EVALUATION_SYSTEM';
  
  private constructor(monitoring?: MonitoringPort) {
    this.monitoring = monitoring || MonitoringFactory.createAdapter();
    this.metricsCollector = MonitoringFactory.getMetricsCollector();
    
    // Initialize state
    this.state = this.loadState() || {
      currentStage: 'shadow',
      currentPercentage: 0,
      stageStartTime: Date.now(),
      lastHealthCheck: Date.now(),
      lastProgression: Date.now(),
      isHealthy: true,
      isPaused: false,
      history: []
    };
  }
  
  static getInstance(monitoring?: MonitoringPort): RolloutManager {
    if (!RolloutManager.instance) {
      RolloutManager.instance = new RolloutManager(monitoring);
    }
    return RolloutManager.instance;
  }
  
  /**
   * Start the rollout process
   */
  start(): void {
    if (this.state.currentStage === 'rollback') {
      this.monitoring.recordError({
        message: 'Cannot start rollout from rollback state',
        severity: 'warning'
      });
      return;
    }
    
    this.addHistoryEntry('resume', 'Rollout started');
    this.state.isPaused = false;
    this.saveState();
    
    // Start health checks and progression checks
    this.startHealthChecks();
    this.startProgressionChecks();
    
    this.monitoring.recordMetric({
      name: 'rollout.started',
      value: 1,
      tags: { stage: this.state.currentStage }
    });
  }
  
  /**
   * Pause the rollout
   */
  pause(): void {
    this.addHistoryEntry('pause', 'Rollout paused');
    this.state.isPaused = true;
    this.saveState();
    
    this.stopTimers();
    
    this.monitoring.recordMetric({
      name: 'rollout.paused',
      value: 1,
      tags: { stage: this.state.currentStage }
    });
  }
  
  /**
   * Manually progress to next stage
   */
  async progressToNextStage(): Promise<boolean> {
    if (this.state.isPaused) {
      this.monitoring.recordError({
        message: 'Cannot progress while paused',
        severity: 'warning'
      });
      return false;
    }
    
    const currentIndex = STAGE_ORDER.indexOf(this.state.currentStage);
    if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
      return false;
    }
    
    const nextStage = STAGE_ORDER[currentIndex + 1] as RolloutStage;
    const nextConfig = ROLLOUT_STAGES[nextStage];
    
    if (nextConfig.requiresApproval) {
      this.monitoring.recordMetric({
        name: 'rollout.manual_approval_required',
        value: 1,
        tags: { next_stage: nextStage }
      });
    }
    
    return this.transitionToStage(nextStage);
  }
  
  /**
   * Emergency rollback
   */
  async rollback(reason: string): Promise<void> {
    this.monitoring.recordError({
      message: `Emergency rollback initiated: ${reason}`,
      severity: 'critical',
      context: {
        currentStage: this.state.currentStage,
        currentPercentage: this.state.currentPercentage
      }
    });
    
    // Set feature flag to 0%
    const flagService = FeatureFlagService.getInstance();
    // Note: This would need to be implemented in the flag service
    await this.updateFeatureFlagPercentage(0);
    
    this.state.currentStage = 'rollback';
    this.state.currentPercentage = 0;
    this.state.isHealthy = false;
    
    this.addHistoryEntry('rollback', reason);
    this.saveState();
    
    this.stopTimers();
  }
  
  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const metrics = await this.collectMetrics();
    const config = ROLLOUT_STAGES[this.state.currentStage];
    const alerts: any[] = [];
    let shouldRollback = false;
    
    // Check critical discrepancies (immediate rollback)
    if (metrics.discrepancies.critical > 0) {
      shouldRollback = true;
      alerts.push({
        severity: 'critical',
        message: `${metrics.discrepancies.critical} critical discrepancies detected`
      });
    }
    
    // Check high discrepancies
    const highPerHour = this.calculatePerHour(metrics.discrepancies.high);
    if (highPerHour > config.alertThresholds.highDiscrepanciesPerHour) {
      alerts.push({
        severity: 'high',
        message: `High discrepancy rate: ${highPerHour}/hour (threshold: ${config.alertThresholds.highDiscrepanciesPerHour})`
      });
    }
    
    // Check error rate
    if (metrics.stability.errorRateDelta > config.alertThresholds.errorRateDelta) {
      alerts.push({
        severity: 'high',
        message: `Error rate increased by ${metrics.stability.errorRateDelta}% (threshold: ${config.alertThresholds.errorRateDelta}%)`
      });
      
      if (metrics.stability.errorRateDelta > config.alertThresholds.errorRateDelta * 2) {
        shouldRollback = true;
      }
    }
    
    // Check latency
    if (metrics.performance.latencyDegradation > config.alertThresholds.latencyDegradation) {
      alerts.push({
        severity: 'medium',
        message: `Latency degraded by ${metrics.performance.latencyDegradation}% (threshold: ${config.alertThresholds.latencyDegradation}%)`
      });
    }
    
    const isHealthy = alerts.length === 0 && !shouldRollback;
    const recommendation = shouldRollback ? 'rollback' : 
                          isHealthy ? 'progress' : 'hold';
    
    const result: HealthCheckResult = {
      isHealthy,
      shouldRollback,
      alerts,
      metrics,
      recommendation,
      details: this.generateHealthDetails(metrics, config)
    };
    
    // Update state
    this.state.isHealthy = isHealthy;
    this.state.lastHealthCheck = Date.now();
    
    // Track metrics
    this.monitoring.recordMetric({
      name: 'rollout.health_check',
      value: isHealthy ? 1 : 0,
      tags: {
        stage: this.state.currentStage,
        recommendation
      }
    });
    
    // Auto-rollback if needed
    if (shouldRollback && !this.state.isPaused) {
      await this.rollback('Automatic rollback due to critical issues');
    }
    
    return result;
  }
  
  /**
   * Get current rollout state
   */
  getState(): RolloutState {
    return { ...this.state };
  }
  
  /**
   * Get rollout metrics
   */
  async getMetrics(): Promise<RolloutMetrics> {
    return this.collectMetrics();
  }
  
  // Private methods
  
  private async collectMetrics(): Promise<RolloutMetrics> {
    // Get discrepancy data
    const discrepancyMonitor = DiscrepancyMonitor.getInstance();
    const discrepancyStats = discrepancyMonitor.getStatistics();
    
    // Get performance data from metrics collector
    const latencyReport = this.metricsCollector.getLatencyReport();
    const errorReport = this.metricsCollector.getErrorReport();
    const counters = this.metricsCollector.getCounters();
    
    // Calculate canary vs baseline metrics
    const canaryLatency = latencyReport['evaluation.latency[system:unified]'];
    const baselineLatency = latencyReport['evaluation.latency[system:legacy]'];
    
    const canaryErrors = counters['evaluation.errors[system:unified]'] || 0;
    const baselineErrors = counters['evaluation.errors[system:legacy]'] || 0;
    const canaryRequests = counters['evaluation.requests[system:unified]'] || 1;
    const baselineRequests = counters['evaluation.requests[system:legacy]'] || 1;
    
    const canaryErrorRate = (canaryErrors / canaryRequests) * 100;
    const baselineErrorRate = (baselineErrors / baselineRequests) * 100;
    
    return {
      discrepancies: {
        critical: discrepancyStats.bySeverity.critical || 0,
        high: discrepancyStats.bySeverity.high || 0,
        medium: discrepancyStats.bySeverity.medium || 0,
        low: discrepancyStats.bySeverity.low || 0
      },
      performance: {
        canaryLatencyP99: canaryLatency?.p99 || 0,
        baselineLatencyP99: baselineLatency?.p99 || 0,
        latencyDegradation: baselineLatency?.p99 
          ? ((canaryLatency?.p99 || 0) - baselineLatency.p99) / baselineLatency.p99 * 100
          : 0
      },
      stability: {
        canaryErrorRate,
        baselineErrorRate,
        errorRateDelta: canaryErrorRate - baselineErrorRate
      },
      volume: {
        totalRequests: canaryRequests + baselineRequests,
        canaryRequests,
        baselineRequests
      }
    };
  }
  
  private async transitionToStage(newStage: RolloutStage): Promise<boolean> {
    const config = ROLLOUT_STAGES[newStage];
    const fromStage = this.state.currentStage;
    
    // Update feature flag percentage
    await this.updateFeatureFlagPercentage(config.minPercentage);
    
    // Update state
    this.state.currentStage = newStage;
    this.state.currentPercentage = config.minPercentage;
    this.state.stageStartTime = Date.now();
    
    this.addHistoryEntry('enter', `Entered ${config.displayName} stage`);
    this.saveState();
    
    this.monitoring.recordMetric({
      name: 'rollout.stage_transition',
      value: 1,
      tags: {
        from_stage: fromStage,
        to_stage: newStage
      }
    });
    
    return true;
  }
  
  private async updateFeatureFlagPercentage(percentage: number): Promise<void> {
    // This would need to be implemented in the feature flag service
    // For now, we'll update the config file
    const configPath = './shared/services/featureFlags/config/feature-flags.json';
    // TODO: Implement actual update logic
    
    this.monitoring.recordMetric({
      name: 'rollout.percentage_update',
      value: percentage,
      tags: { stage: this.state.currentStage }
    });
  }
  
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(),
      ROLLOUT_CONFIG.healthCheckInterval
    );
  }
  
  private startProgressionChecks(): void {
    this.progressionTimer = setInterval(
      () => this.checkAutoProgression(),
      ROLLOUT_CONFIG.progressionCheckInterval
    );
  }
  
  private async checkAutoProgression(): Promise<void> {
    if (this.state.isPaused || !this.state.isHealthy) return;
    
    const config = ROLLOUT_STAGES[this.state.currentStage];
    if (!config.autoProgress) return;
    
    // Check if we've been in this stage long enough
    const timeInStage = Date.now() - this.state.stageStartTime;
    if (timeInStage < config.successCriteria.minStableDuration) return;
    
    // Check if we can progress within the stage
    if (this.state.currentPercentage < config.maxPercentage) {
      const newPercentage = Math.min(
        this.state.currentPercentage * 2, // Double the percentage
        config.maxPercentage
      );
      
      await this.updateFeatureFlagPercentage(newPercentage);
      this.state.currentPercentage = newPercentage;
      this.state.lastProgression = Date.now();
      
      this.addHistoryEntry('progress', `Auto-progressed to ${newPercentage}%`);
      this.saveState();
    }
  }
  
  private stopTimers(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    
    if (this.progressionTimer) {
      clearInterval(this.progressionTimer);
      this.progressionTimer = undefined;
    }
  }
  
  private calculatePerHour(count: number): number {
    const timeInStage = Date.now() - this.state.stageStartTime;
    const hours = timeInStage / (60 * 60 * 1000);
    return hours > 0 ? count / hours : 0;
  }
  
  private generateHealthDetails(metrics: RolloutMetrics, config: any): string {
    const details: string[] = [];
    
    details.push(`Stage: ${this.state.currentStage} (${this.state.currentPercentage}%)`);
    details.push(`Time in stage: ${this.formatDuration(Date.now() - this.state.stageStartTime)}`);
    details.push(`Discrepancies: C:${metrics.discrepancies.critical} H:${metrics.discrepancies.high} M:${metrics.discrepancies.medium} L:${metrics.discrepancies.low}`);
    details.push(`Latency: Canary ${metrics.performance.canaryLatencyP99.toFixed(2)}ms vs Baseline ${metrics.performance.baselineLatencyP99.toFixed(2)}ms (${metrics.performance.latencyDegradation.toFixed(1)}% degradation)`);
    details.push(`Error Rate: Canary ${metrics.stability.canaryErrorRate.toFixed(2)}% vs Baseline ${metrics.stability.baselineErrorRate.toFixed(2)}% (${metrics.stability.errorRateDelta.toFixed(2)}% delta)`);
    
    return details.join('\n');
  }
  
  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  }
  
  private addHistoryEntry(action: RolloutHistoryEntry['action'], reason?: string): void {
    this.state.history.push({
      timestamp: Date.now(),
      stage: this.state.currentStage,
      percentage: this.state.currentPercentage,
      action,
      reason
    });
    
    // Keep only last 100 entries
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(-100);
    }
  }
  
  private loadState(): RolloutState | null {
    // In a real implementation, this would load from persistent storage
    // For now, return null to use default state
    return null;
  }
  
  private saveState(): void {
    // In a real implementation, this would save to persistent storage
    // For now, we'll just log
    this.monitoring.recordMetric({
      name: 'rollout.state_saved',
      value: 1,
      tags: { stage: this.state.currentStage }
    });
  }
}