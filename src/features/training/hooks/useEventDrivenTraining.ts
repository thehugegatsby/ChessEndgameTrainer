/**
 * Event-driven training system hook
 * 
 * @description
 * Always returns EventBasedMoveDialogManager - simplified after feature flag removal.
 * Previously used for A/B testing, now the standard implementation.
 */

import { EventBasedMoveDialogManager } from '../events/EventBasedMoveDialogManager';

/**
 * Hook to get the dialog manager (always event-based now)
 */
export function useMoveDialogManager(): EventBasedMoveDialogManager {
  return new EventBasedMoveDialogManager();
}