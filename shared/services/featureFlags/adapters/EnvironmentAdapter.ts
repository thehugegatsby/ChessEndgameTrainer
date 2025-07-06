/**
 * Environment-based feature flag adapter
 * Backward compatible with existing FEATURE_FLAGS constant
 */

import { FeatureFlagPort, FeatureFlagContext, FeatureFlagConfig } from '../ports/FeatureFlagPort';
import { FEATURE_FLAGS } from '../../../constants';

export class EnvironmentAdapter implements FeatureFlagPort {
  isFeatureEnabled(flagName: string, context: FeatureFlagContext): boolean {
    // Map to existing FEATURE_FLAGS for backward compatibility
    switch (flagName) {
      case 'USE_UNIFIED_EVALUATION_SYSTEM':
        return FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM;
      case 'LOG_EVALUATION_DISCREPANCIES':
        return FEATURE_FLAGS.LOG_EVALUATION_DISCREPANCIES;
      case 'USE_ENHANCED_PERSPECTIVE':
        return FEATURE_FLAGS.USE_ENHANCED_PERSPECTIVE;
      default:
        return false;
    }
  }

  getFlagConfig(flagName: string): FeatureFlagConfig | null {
    const enabled = this.isFeatureEnabled(flagName, {});
    if (enabled !== undefined) {
      return {
        enabled,
        rolloutPercentage: enabled ? 100 : 0
      };
    }
    return null;
  }

  getAllFlags(): string[] {
    return [
      'USE_UNIFIED_EVALUATION_SYSTEM',
      'LOG_EVALUATION_DISCREPANCIES',
      'USE_ENHANCED_PERSPECTIVE'
    ];
  }
}