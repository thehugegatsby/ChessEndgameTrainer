/**
 * Event-driven version of handlePlayerMove orchestrator
 * 
 * @description
 * This factory creates a handlePlayerMove function that uses the event-based
 * MoveDialogManager when the feature flag is enabled.
 */

import type { HandlePlayerMoveDependencies } from './index';
import { createHandlePlayerMove } from './index';
import { MoveValidator } from './MoveValidator';
import { MoveQualityEvaluator } from './MoveQualityEvaluator';
import { PawnPromotionHandler } from './PawnPromotionHandler';
import { MoveDialogManager } from './MoveDialogManager';
import { EventBasedMoveDialogManager } from '../../../../features/training/events/EventBasedMoveDialogManager';
import { getLogger } from '@shared/services/logging/Logger';

const logger = getLogger().setContext('HandlePlayerMoveWithEvents');

// Check if we should use event-driven version
function shouldUseEventDriven(): boolean {
  // Check localStorage for feature flag
  if (typeof window !== 'undefined') {
    const featureFlags = localStorage.getItem('featureFlags');
    if (featureFlags) {
      try {
        const flags = JSON.parse(featureFlags);
        if (flags.eventDrivenTraining) {
          return true;
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('eventDriven')) {
      return urlParams.get('eventDriven') === 'true';
    }
  }
  
  // Check environment variable
  return process.env['NEXT_PUBLIC_EVENT_DRIVEN_TRAINING'] === 'true';
}

/**
 * Creates a handlePlayerMove function with appropriate dialog manager
 * based on feature flag
 */
export function createAdaptiveHandlePlayerMove(
  customDependencies?: HandlePlayerMoveDependencies
): ReturnType<typeof createHandlePlayerMove> {
  let dialogManager: MoveDialogManager;
  
  if (shouldUseEventDriven()) {
    // Use event-based dialog manager
    // Create instance that will emit events
    const eventManager = new EventBasedMoveDialogManager();
    
    // Create adapter that matches the MoveDialogManager interface
    dialogManager = {
      showMoveErrorDialog: (
        _api: unknown,
        wdlBefore: number,
        wdlAfter: number,
        bestMove?: string,
        playedMove?: string,
        moveNumber?: number
      ): void => {
        eventManager.showMoveErrorDialog(wdlBefore, wdlAfter, bestMove, playedMove, moveNumber);
      },
      
      showPromotionDialog: (_api: unknown, from: string, to: string, color: 'w' | 'b'): void => {
        eventManager.requestPromotion(from, to, color);
      }
    } as unknown as MoveDialogManager;
    
    logger.info('Using EVENT-DRIVEN dialog manager');
  } else {
    // Use legacy dialog manager
    dialogManager = new MoveDialogManager();
    logger.info('Using LEGACY dialog manager');
  }
  
  // Create dependencies with appropriate dialog manager
  const dependencies: HandlePlayerMoveDependencies = {
    moveValidator: new MoveValidator(),
    moveQualityEvaluator: new MoveQualityEvaluator(),
    pawnPromotionHandler: new PawnPromotionHandler(),
    moveDialogManager: dialogManager,
    ...customDependencies
  };
  
  return createHandlePlayerMove(dependencies);
}

// Export the adaptive version as default
export const handlePlayerMove = createAdaptiveHandlePlayerMove();