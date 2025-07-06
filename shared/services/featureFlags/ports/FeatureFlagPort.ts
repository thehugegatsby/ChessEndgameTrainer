/**
 * Abstract interface for feature flag evaluation
 * Allows switching between different feature flag providers
 */

export interface FeatureFlagContext {
  userId?: string;
  sessionId?: string;
  custom?: Record<string, any>;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  targetingRules?: TargetingRule[];
}

export interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'notIn';
  value: any;
}

export interface FeatureFlagPort {
  /**
   * Check if a feature is enabled for the given context
   */
  isFeatureEnabled(flagName: string, context: FeatureFlagContext): boolean;

  /**
   * Get the configuration for a specific flag
   */
  getFlagConfig(flagName: string): FeatureFlagConfig | null;

  /**
   * Refresh flag configurations (if applicable)
   */
  refresh?(): Promise<void>;

  /**
   * Get all available flags
   */
  getAllFlags(): string[];
}