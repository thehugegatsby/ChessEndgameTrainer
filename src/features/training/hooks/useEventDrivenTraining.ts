/**
 * Feature flag hook for event-driven training system
 * 
 * @description
 * Controls whether to use the new event-based system or the legacy direct store manipulation.
 * This allows for safe A/B testing and gradual rollout.
 */

import { useFeatureFlag } from '@shared/hooks/useFeatureFlag';
import { FeatureFlag } from '@shared/services/FeatureFlagService';
import { EventBasedMoveDialogManager } from '../events/EventBasedMoveDialogManager';
import { MoveDialogManager } from '@shared/store/orchestrators/handlePlayerMove/MoveDialogManager';

export function useEventDrivenTraining(): boolean {
  // Check feature flag from environment or localStorage
  const isEnabled = useFeatureFlag(FeatureFlag.USE_EVENT_DRIVEN_TRAINING);
  
  // Also check URL param for testing
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('eventDriven')) {
      return urlParams.get('eventDriven') === 'true';
    }
  }
  
  return isEnabled;
}

/**
 * Hook to conditionally use either event-based or legacy dialog manager
 */
type DialogManager = EventBasedMoveDialogManager | MoveDialogManager;

export function useMoveDialogManager(): DialogManager {
  const useEvents = useEventDrivenTraining();
  
  if (useEvents) {
    // Return event-based implementation
    return new EventBasedMoveDialogManager();
  } else {
    // Return legacy implementation
    return new MoveDialogManager();
  }
}