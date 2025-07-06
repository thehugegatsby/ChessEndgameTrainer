/**
 * Evaluation System Monitoring - Production Readiness
 * 
 * Based on expert recommendations (Gemini 9/10 + Claude Opus 8/10):
 * - Structured logging for pipeline mode tracking
 * - Performance metrics for legacy vs enhanced comparison  
 * - Circuit breaker patterns for safe rollout
 * 
 * @module EvaluationMonitoring
 */

import { Logger } from '@shared/services/logging/LoggerCompat';
import type { ILogger } from '@shared/services/logging/types';

export interface EvaluationMetrics {
  pipelineMode: 'legacy' | 'enhanced';
  responseTime: number;
  errorCount: number;
  totalEvaluations: number;
  cacheHitRate?: number;
}

export interface EvaluationEvent {
  timestamp: number;
  mode: 'legacy' | 'enhanced';
  operation: 'engine_evaluation' | 'tablebase_evaluation' | 'perspective_transform';
  duration: number;
  success: boolean;
  error?: string;
  metadata?: {
    perspective?: 'w' | 'b';
    hasBlackPerspectiveBug?: boolean;
    positionHash?: string;
  };
}

/**
 * Evaluation System Monitor
 * Tracks performance and reliability metrics for legacy vs enhanced modes
 */
export class EvaluationMonitor {
  private static instance: EvaluationMonitor;
  private readonly logger: ILogger;
  private metrics: Map<string, EvaluationMetrics> = new Map();
  private events: EvaluationEvent[] = [];
  private readonly maxEventHistory = 1000;

  private constructor() {
    this.logger = Logger.getInstance();
    this.initializeMetrics();
  }

  static getInstance(): EvaluationMonitor {
    if (!EvaluationMonitor.instance) {
      EvaluationMonitor.instance = new EvaluationMonitor();
    }
    return EvaluationMonitor.instance;
  }

  private initializeMetrics(): void {
    this.metrics.set('legacy', {
      pipelineMode: 'legacy',
      responseTime: 0,
      errorCount: 0,
      totalEvaluations: 0
    });
    
    this.metrics.set('enhanced', {
      pipelineMode: 'enhanced',
      responseTime: 0,
      errorCount: 0,
      totalEvaluations: 0
    });
  }

  /**
   * Record an evaluation event with timing and outcome
   */
  recordEvent(event: Omit<EvaluationEvent, 'timestamp'>): void {
    const fullEvent: EvaluationEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Add to event history
    this.events.push(fullEvent);
    if (this.events.length > this.maxEventHistory) {
      this.events.shift();
    }

    // Update metrics
    this.updateMetrics(fullEvent);

    // Log structured event for production monitoring
    this.logger.debug('EvaluationEvent', {
      mode: fullEvent.mode,
      operation: fullEvent.operation,
      duration: fullEvent.duration,
      success: fullEvent.success,
      metadata: fullEvent.metadata
    });

    // Check for performance degradation
    this.checkPerformanceAlerts(fullEvent);
  }

  private updateMetrics(event: EvaluationEvent): void {
    const metrics = this.metrics.get(event.mode);
    if (!metrics) return;

    metrics.totalEvaluations++;
    
    if (!event.success) {
      metrics.errorCount++;
    }

    // Update rolling average response time
    const alpha = 0.1; // Smoothing factor
    metrics.responseTime = metrics.responseTime * (1 - alpha) + event.duration * alpha;
  }

  private checkPerformanceAlerts(event: EvaluationEvent): void {
    // Alert on slow evaluation (> 5 seconds)
    if (event.duration > 5000) {
      this.logger.warn('SlowEvaluation', {
        mode: event.mode,
        operation: event.operation,
        duration: event.duration,
        metadata: event.metadata
      });
    }

    // Alert on error rate spike
    const metrics = this.metrics.get(event.mode);
    if (metrics && metrics.totalEvaluations > 10) {
      const errorRate = metrics.errorCount / metrics.totalEvaluations;
      if (errorRate > 0.1) { // > 10% error rate
        this.logger.error('HighErrorRate', {
          mode: event.mode,
          errorRate,
          totalEvaluations: metrics.totalEvaluations,
          errorCount: metrics.errorCount
        });
      }
    }
  }

  /**
   * Get current performance metrics for monitoring dashboards
   */
  getMetrics(): Record<string, EvaluationMetrics> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Compare legacy vs enhanced performance
   */
  getPerformanceComparison(): {
    legacyResponseTime: number;
    enhancedResponseTime: number;
    legacyErrorRate: number;
    enhancedErrorRate: number;
    recommendation: 'use_legacy' | 'use_enhanced' | 'insufficient_data';
  } {
    const legacy = this.metrics.get('legacy')!;
    const enhanced = this.metrics.get('enhanced')!;

    const legacyErrorRate = legacy.totalEvaluations > 0 ? legacy.errorCount / legacy.totalEvaluations : 0;
    const enhancedErrorRate = enhanced.totalEvaluations > 0 ? enhanced.errorCount / enhanced.totalEvaluations : 0;

    let recommendation: 'use_legacy' | 'use_enhanced' | 'insufficient_data' = 'insufficient_data';

    if (legacy.totalEvaluations > 10 && enhanced.totalEvaluations > 10) {
      // Enhanced is better if it has lower error rate and similar/better performance
      if (enhancedErrorRate <= legacyErrorRate && enhanced.responseTime <= legacy.responseTime * 1.2) {
        recommendation = 'use_enhanced';
      } else {
        recommendation = 'use_legacy';
      }
    }

    return {
      legacyResponseTime: legacy.responseTime,
      enhancedResponseTime: enhanced.responseTime,
      legacyErrorRate,
      enhancedErrorRate,
      recommendation
    };
  }

  /**
   * Circuit breaker check for safe rollout
   */
  shouldUseEnhancedMode(): boolean {
    const comparison = this.getPerformanceComparison();
    
    // Fail-safe: Use legacy if enhanced has significantly higher error rate
    if (comparison.enhancedErrorRate > comparison.legacyErrorRate + 0.05) {
      this.logger.warn('CircuitBreaker', {
        reason: 'enhanced_mode_high_error_rate',
        enhancedErrorRate: comparison.enhancedErrorRate,
        legacyErrorRate: comparison.legacyErrorRate
      });
      return false;
    }

    // Use enhanced if it's performing well or we don't have enough data
    return comparison.recommendation !== 'use_legacy';
  }

  /**
   * Reset metrics (for testing or maintenance windows)
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.events = [];
    this.initializeMetrics();
    this.logger.debug('EvaluationMonitor metrics reset');
  }
}

/**
 * Utility function for timing evaluation operations
 */
export async function monitoredEvaluation<T>(
  operation: EvaluationEvent['operation'],
  mode: 'legacy' | 'enhanced',
  fn: () => Promise<T>,
  metadata?: EvaluationEvent['metadata']
): Promise<T> {
  const monitor = EvaluationMonitor.getInstance();
  const startTime = Date.now();
  
  try {
    const result = await fn();
    
    monitor.recordEvent({
      mode,
      operation,
      duration: Date.now() - startTime,
      success: true,
      metadata
    });
    
    return result;
  } catch (error) {
    monitor.recordEvent({
      mode,
      operation,
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata
    });
    
    throw error;
  }
}