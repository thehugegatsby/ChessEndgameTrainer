/**
 * Feature Flag Service - Main entry point for feature flag evaluation
 * Supports monitoring integration for A/B testing metrics
 */

import { FeatureFlagPort, FeatureFlagContext } from './ports/FeatureFlagPort';
import { ConfigFileAdapter } from './adapters/ConfigFileAdapter';
import { EnvironmentAdapter } from './adapters/EnvironmentAdapter';
import { MonitoringPort } from '../monitoring/ports/MonitoringPort';
import { MonitoringFactory } from '../monitoring/MonitoringFactory';

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private adapter: FeatureFlagPort;
  private monitoring: MonitoringPort;
  private evaluationCache: Map<string, boolean> = new Map();

  private constructor(adapter?: FeatureFlagPort, monitoring?: MonitoringPort) {
    // Use provided adapter or choose based on environment
    this.adapter = adapter || this.createDefaultAdapter();
    this.monitoring = monitoring || MonitoringFactory.createAdapter();
  }

  static getInstance(adapter?: FeatureFlagPort, monitoring?: MonitoringPort): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService(adapter, monitoring);
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if a feature is enabled and track the evaluation
   */
  isFeatureEnabled(flagName: string, context: FeatureFlagContext): boolean {
    const startTime = Date.now();
    
    // Create cache key from flag name and context
    const cacheKey = this.getCacheKey(flagName, context);
    
    // Check cache first
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!;
    }

    try {
      // Evaluate the flag
      const result = this.adapter.isFeatureEnabled(flagName, context);
      
      // Cache the result
      this.evaluationCache.set(cacheKey, result);
      
      // Track metrics
      this.monitoring.recordLatency({
        operation: 'feature_flag.evaluation',
        duration: Date.now() - startTime,
        tags: { flag: flagName, result: String(result) }
      });
      
      this.monitoring.incrementCounter('feature_flag.evaluations', {
        flag: flagName,
        result: String(result),
        has_user_id: String(!!context.userId),
        has_session_id: String(!!context.sessionId)
      });
      
      return result;
    } catch (error) {
      // Track error
      this.monitoring.recordError({
        message: `Failed to evaluate feature flag: ${flagName}`,
        severity: 'error',
        context: { flagName, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      // Default to false on error
      return false;
    }
  }

  /**
   * Get all available feature flags
   */
  getAllFlags(): string[] {
    return this.adapter.getAllFlags();
  }

  /**
   * Get flag configuration
   */
  getFlagConfig(flagName: string) {
    return this.adapter.getFlagConfig(flagName);
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Set a new adapter (useful for testing)
   */
  setAdapter(adapter: FeatureFlagPort): void {
    this.adapter = adapter;
    this.clearCache();
  }

  /**
   * Create default adapter based on environment
   */
  private createDefaultAdapter(): FeatureFlagPort {
    // In production, use config file for flexibility
    // In development/test, use environment variables for simplicity
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_CONFIG_FLAGS === 'true') {
      return new ConfigFileAdapter();
    }
    
    return new EnvironmentAdapter();
  }

  /**
   * Create cache key from flag name and context
   */
  private getCacheKey(flagName: string, context: FeatureFlagContext): string {
    const parts = [flagName];
    
    if (context.userId) {
      parts.push(`u:${context.userId}`);
    }
    
    if (context.sessionId) {
      parts.push(`s:${context.sessionId}`);
    }
    
    if (context.custom) {
      // Sort keys for consistent caching
      const customStr = Object.keys(context.custom)
        .sort()
        .map(key => `${key}:${context.custom![key]}`)
        .join(',');
      parts.push(`c:${customStr}`);
    }
    
    return parts.join('|');
  }

  /**
   * Get metrics report for feature flag usage
   */
  getMetricsReport() {
    const metricsCollector = MonitoringFactory.getMetricsCollector();
    const counters = metricsCollector.getCounters();
    
    // Extract feature flag specific metrics
    const flagMetrics: Record<string, any> = {};
    
    Object.entries(counters).forEach(([key, value]) => {
      if (key.startsWith('feature_flag.')) {
        flagMetrics[key] = value;
      }
    });
    
    return {
      evaluations: flagMetrics,
      cacheSize: this.evaluationCache.size,
      flags: this.getAllFlags().map(flag => ({
        name: flag,
        config: this.getFlagConfig(flag)
      }))
    };
  }
}