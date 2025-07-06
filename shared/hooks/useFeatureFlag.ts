/**
 * React hook for feature flag evaluation
 * Provides easy access to feature flags in components
 */

import { useState, useEffect, useMemo } from 'react';
import { FeatureFlagService } from '../services/featureFlags/FeatureFlagService';
import { FeatureFlagContext } from '../services/featureFlags/ports/FeatureFlagPort';

/**
 * Get or create a stable session ID for anonymous users
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr';
  }

  const SESSION_ID_KEY = 'chess_trainer_session_id';
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    // Generate a random session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Hook for evaluating a single feature flag
 */
export function useFeatureFlag(
  flagName: string, 
  userId?: string,
  customContext?: Record<string, any>
): boolean {
  const [isEnabled, setIsEnabled] = useState(false);
  
  const context = useMemo<FeatureFlagContext>(() => ({
    userId,
    sessionId: getSessionId(),
    custom: customContext
  }), [userId, customContext]);

  useEffect(() => {
    const service = FeatureFlagService.getInstance();
    const result = service.isFeatureEnabled(flagName, context);
    setIsEnabled(result);
  }, [flagName, context]);

  return isEnabled;
}

/**
 * Hook for evaluating multiple feature flags
 */
export function useFeatureFlags(
  flagNames: string[], 
  userId?: string,
  customContext?: Record<string, any>
): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  
  const context = useMemo<FeatureFlagContext>(() => ({
    userId,
    sessionId: getSessionId(),
    custom: customContext
  }), [userId, customContext]);

  useEffect(() => {
    const service = FeatureFlagService.getInstance();
    const results: Record<string, boolean> = {};
    
    flagNames.forEach(flagName => {
      results[flagName] = service.isFeatureEnabled(flagName, context);
    });
    
    setFlags(results);
  }, [flagNames, context]);

  return flags;
}

/**
 * Hook to get all available feature flags
 */
export function useAllFeatureFlags(
  userId?: string,
  customContext?: Record<string, any>
): {
  flags: Record<string, boolean>;
  isLoading: boolean;
} {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const context = useMemo<FeatureFlagContext>(() => ({
    userId,
    sessionId: getSessionId(),
    custom: customContext
  }), [userId, customContext]);

  useEffect(() => {
    const service = FeatureFlagService.getInstance();
    const allFlagNames = service.getAllFlags();
    const results: Record<string, boolean> = {};
    
    allFlagNames.forEach(flagName => {
      results[flagName] = service.isFeatureEnabled(flagName, context);
    });
    
    setFlags(results);
    setIsLoading(false);
  }, [context]);

  return { flags, isLoading };
}