/**
 * Event-based move dialog manager - replaces direct store manipulation with events
 * 
 * @description
 * New implementation that uses EventEmitter for UI communication instead of
 * directly manipulating the store. This provides better separation of concerns
 * and makes testing easier.
 */

import { trainingEvents } from './EventEmitter';
import type { TrainingEvents } from './EventEmitter';

export class EventBasedMoveDialogManager {
  /**
   * Emits move feedback event for UI to handle
   * 
   * Instead of directly updating store.ui.moveErrorDialog, we emit an event
   * that UI components can subscribe to.
   */
  showMoveErrorDialog(
    wdlBefore: number,
    wdlAfter: number,
    bestMove?: string,
    playedMove?: string,
    _moveNumber?: number
  ): void {
    const feedbackData: TrainingEvents['move:feedback'] = {
      type: 'error',
      wasOptimal: false,
      wdlBefore,
      wdlAfter,
      ...(bestMove !== undefined && { bestMove }),
      ...(playedMove !== undefined && { playedMove })
    };

    trainingEvents.emit('move:feedback', feedbackData);
  }

  /**
   * Emits success feedback event
   * 
   * Used for successful moves, promotions, or other positive feedback
   */
  showMoveSuccessDialog(
    _message?: string,
    _promotionPiece?: string
  ): void {
    const feedbackData: TrainingEvents['move:feedback'] = {
      type: 'success',
      wasOptimal: true
    };

    trainingEvents.emit('move:feedback', feedbackData);
  }

  /**
   * Emits promotion required event
   * 
   * UI components can subscribe to this to show promotion dialog
   */
  requestPromotion(
    from: string,
    to: string,
    color: 'w' | 'b'
  ): void {
    trainingEvents.emit('promotion:required', {
      from,
      to,
      color
    });
  }

  /**
   * Helper to convert WDL difference to human-readable format
   * This stays here as it's presentation logic
   */
  formatWdlChange(wdlBefore: number, wdlAfter: number): string {
    const change = wdlAfter - wdlBefore;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  /**
   * Helper to determine feedback severity based on WDL change
   */
  getFeedbackSeverity(wdlBefore: number, wdlAfter: number): 'error' | 'warning' | 'success' {
    const change = wdlAfter - wdlBefore;
    
    if (change < -50) {
      return 'error'; // Major mistake
    } else if (change < -20) {
      return 'warning'; // Minor mistake
    } else {
      return 'success'; // Good move
    }
  }
}