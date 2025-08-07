/**
 * @file Move dialog manager module
 * @module store/orchestrators/handlePlayerMove/MoveDialogManager
 * 
 * @description
 * Manages various move-related dialog interactions including error dialogs,
 * pawn promotion choices, and confirmation dialogs. Centralizes dialog logic
 * for better maintainability and consistent UX.
 */

import { getLogger } from "@shared/services/logging";
import type { StoreApi } from "../types";

export interface MoveErrorDialogData {
  isOpen: boolean;
  wdlBefore: number;
  wdlAfter: number;
  bestMove?: string;
}

export interface PromotionDialogData {
  isOpen: boolean;
  from: string;
  to: string;
  availablePieces: ('q' | 'r' | 'n' | 'b')[];
  callback?: (piece: 'q' | 'r' | 'n' | 'b') => void;
}

/**
 * Manages move-related dialog interactions
 */
export class MoveDialogManager {

  /**
   * Shows error dialog for suboptimal moves
   * 
   * @param api - Store API for state updates
   * @param wdlBefore - Position evaluation before move
   * @param wdlAfter - Position evaluation after move  
   * @param bestMove - Recommended optimal move (optional)
   */
  showMoveErrorDialog(
    api: StoreApi, 
    wdlBefore: number, 
    wdlAfter: number, 
    bestMove?: string
  ): void {
    getLogger().debug("[MoveDialog] Showing move error dialog:", { 
      wdlBefore, 
      wdlAfter, 
      bestMove 
    });

    const { setState } = api;
    
    setState((draft) => {
      draft.training.moveErrorDialog = {
        isOpen: true,
        wdlBefore,
        wdlAfter,
        bestMove,
      };
    });
  }

  /**
   * Closes the move error dialog
   * 
   * @param api - Store API for state updates
   */
  closeMoveErrorDialog(api: StoreApi): void {
    getLogger().debug("[MoveDialog] Closing move error dialog");

    const { setState } = api;
    
    setState((draft) => {
      draft.training.moveErrorDialog = {
        isOpen: false,
        wdlBefore: 0,
        wdlAfter: 0,
        bestMove: undefined,
      };
    });
  }

  /**
   * Shows pawn promotion dialog (future implementation)
   * 
   * @param api - Store API for state updates
   * @param from - Source square (e.g., "e7")
   * @param to - Target square (e.g., "e8")
   * @param callback - Callback to execute with chosen piece
   */
  showPromotionDialog(
    api: StoreApi, 
    from: string, 
    to: string, 
    callback: (piece: 'q' | 'r' | 'n' | 'b') => void
  ): void {
    getLogger().debug("[MoveDialog] Showing promotion dialog:", { from, to });
    
    const { setState } = api;
    
    // For now, store callback in a temporary way
    // TODO: Implement proper promotion dialog state management
    setState((draft) => {
      // Add promotion dialog to UI state when UI is implemented
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Bauernumwandlung: ${from}-${to}`,
        type: "info",
      });
    });

    // For now, auto-promote to queen (chess.js default behavior)
    const chosenPiece: 'q' | 'r' | 'n' | 'b' = 'q';
    callback(chosenPiece);
  }

  /**
   * Shows confirmation dialog for critical moves (future implementation)
   * 
   * @param api - Store API for state updates
   * @param message - Confirmation message
   * @param onConfirm - Callback for confirmed action
   * @param onCancel - Callback for cancelled action
   */
  showConfirmationDialog(
    api: StoreApi, 
    message: string,
    onConfirm: () => void,
    onCancel: () => void
  ): void {
    getLogger().debug("[MoveDialog] Showing confirmation dialog:", { message });
    
    const { setState } = api;
    
    // TODO: Implement proper confirmation dialog state management
    setState((draft) => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: message,
        type: "info",
      });
    });

    // For now, auto-confirm
    onConfirm();
  }

  /**
   * Formats WDL difference for user-friendly display
   * 
   * @param wdlBefore - WDL before move
   * @param wdlAfter - WDL after move
   * @returns Formatted message describing the position change
   */
  formatWdlChange(wdlBefore: number, wdlAfter: number): string {
    const difference = wdlAfter - wdlBefore;
    
    if (difference > 0) {
      return `Position verbessert sich um ${difference} Punkte`;
    } else if (difference < 0) {
      return `Position verschlechtert sich um ${Math.abs(difference)} Punkte`;
    } else {
      return `Position unverändert`;
    }
  }

  /**
   * Determines if a WDL change is significant enough to show dialog
   * 
   * @param wdlBefore - WDL before move
   * @param wdlAfter - WDL after move
   * @param threshold - Minimum change threshold (default: 1)
   * @returns True if change is significant
   */
  isSignificantWdlChange(wdlBefore: number, wdlAfter: number, threshold: number = 1): boolean {
    return Math.abs(wdlAfter - wdlBefore) >= threshold;
  }

  /**
   * Gets user-friendly move quality description
   * 
   * @param wasOptimal - Whether the move was optimal
   * @param outcomeChanged - Whether the game outcome changed
   * @returns German description of move quality
   */
  getMoveQualityDescription(wasOptimal: boolean, outcomeChanged: boolean): string {
    if (wasOptimal) {
      return "Ausgezeichneter Zug! Dies ist einer der besten Züge in dieser Position.";
    } else if (outcomeChanged) {
      return "Achtung! Dieser Zug verschlechtert deine Position erheblich.";
    } else {
      return "Guter Zug, aber nicht optimal. Es gibt bessere Alternativen.";
    }
  }
}