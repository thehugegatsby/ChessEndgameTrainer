/**
 * React hook for feature flags with automatic re-rendering on flag changes
 */

import { useEffect, useState, useSyncExternalStore, useMemo } from 'react';
import { featureFlags, type FeatureFlag } from '@shared/services/FeatureFlagService';

/**
 * Hook to check if a feature flag is enabled
 * Automatically re-renders component when flag changes
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const isEnabled = useSyncExternalStore(
    (callback) => {
      // Subscribe to feature flag changes
      const handleChange = (event: Event): void => {
        if (event instanceof CustomEvent) {
          const { flag: changedFlag } = event.detail;
          if (changedFlag === flag) {
            callback();
          }
        }
      };

      window.addEventListener('featureFlagChanged', handleChange);
      return () => {
        window.removeEventListener('featureFlagChanged', handleChange);
      };
    },
    // Get current flag state
    () => featureFlags.isEnabled(flag),
    // Server-side rendering fallback
    () => false
  );

  return isEnabled;
}

/**
 * Hook to get multiple feature flags at once
 */
export function useFeatureFlags(...flags: FeatureFlag[]): Record<FeatureFlag, boolean> {
  const [flagStates, setFlagStates] = useState<Record<FeatureFlag, boolean>>(() => {
    const initial: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
    flags.forEach(flag => {
      initial[flag] = featureFlags.isEnabled(flag);
    });
    return initial;
  });

  // Memoize the flags key to prevent unnecessary re-renders
  const flagsKey = useMemo(() => flags.sort().join(','), [flags]);

  useEffect(() => {
    const handleChange = (event: Event): void => {
      if (event instanceof CustomEvent) {
        const { flag: changedFlag, enabled } = event.detail;
        if (flags.includes(changedFlag)) {
          setFlagStates(prev => ({
            ...prev,
            [changedFlag]: enabled
          }));
        }
      }
    };

    window.addEventListener('featureFlagChanged', handleChange);
    
    // Update initial states
    const current: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
    flags.forEach(flag => {
      current[flag] = featureFlags.isEnabled(flag);
    });
    setFlagStates(current);

    return () => {
      window.removeEventListener('featureFlagChanged', handleChange);
    };
  }, [flagsKey, flags]);

  return flagStates;
}

/**
 * Hook for development/testing to toggle feature flags
 */
export function useFeatureFlagControls(): {
  isEnabled: (flag: FeatureFlag) => boolean;
  toggle: (flag: FeatureFlag) => void;
  enable: (flag: FeatureFlag) => void;
  disable: (flag: FeatureFlag) => void;
  enablePhase: (phase: 'chess' | 'tablebase' | 'training' | 'move-quality' | 'progress') => void;
  disablePhase: (phase: 'chess' | 'tablebase' | 'training' | 'move-quality' | 'progress') => void;
  getAllFlags: () => Record<string, boolean>;
} {
  const [, forceUpdate] = useState({});

  const handleChange = (): void => {
    forceUpdate({});
  };

  useEffect(() => {
    window.addEventListener('featureFlagChanged', handleChange);
    return () => {
      window.removeEventListener('featureFlagChanged', handleChange);
    };
  }, []);

  return {
    isEnabled: (flag: FeatureFlag) => featureFlags.isEnabled(flag),
    toggle: (flag: FeatureFlag) => {
      const currentState = featureFlags.isEnabled(flag);
      featureFlags.override(flag, !currentState);
    },
    enable: (flag: FeatureFlag) => featureFlags.override(flag, true),
    disable: (flag: FeatureFlag) => featureFlags.override(flag, false),
    enablePhase: (phase) => featureFlags.enablePhase(phase),
    disablePhase: (phase) => featureFlags.disablePhase(phase),
    getAllFlags: () => featureFlags.getAllFlags(),
  };
}