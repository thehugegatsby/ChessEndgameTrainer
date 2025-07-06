/**
 * Feature flag utilities for gradual feature rollout
 */

export interface UserContext {
  userId?: string;
  isAdmin?: boolean;
  isDeveloper?: boolean;
}

/**
 * Get enhanced perspective mode based on user context
 * For now, always returns 'enhanced' as per FEATURE_FLAGS
 */
export function getEnhancedPerspectiveMode(context?: UserContext): 'legacy' | 'enhanced' {
  // Always use enhanced mode as per FEATURE_FLAGS.USE_ENHANCED_PERSPECTIVE
  return 'enhanced';
}