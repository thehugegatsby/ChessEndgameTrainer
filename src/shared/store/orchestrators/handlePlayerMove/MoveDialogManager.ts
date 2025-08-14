/**
 * Move dialog manager - handles error dialogs and user feedback
 */

import { getLogger } from "@shared/services/logging";
import type { StoreApi } from "../types";
import { ALGORITHM_MULTIPLIERS } from "@shared/constants/multipliers";

export interface MoveErrorDialogData {
  isOpen: boolean;
  wdlBefore: number;
  wdlAfter: number;
  bestMove?: string;
  playedMove?: string;
  moveNumber?: number;
}

/**
 * Data structure for pawn promotion dialog state (future implementation)
 * @interface PromotionDialogData
 */
export interface PromotionDialogData {
  /** Whether the promotion dialog is currently open */
  isOpen: boolean;
  /** Source square of the promoting pawn */
  from: string;
  /** Target square where pawn promotes */
  to: string;
  /** Available pieces for promotion */
  availablePieces: ("q" | "r" | "n" | "b")[];
  /** Callback function executed when user selects a piece */
  callback?: (piece: "q" | "r" | "n" | "b") => void;
}

/**
 * Manages comprehensive dialog interactions for chess move feedback
 * @class MoveDialogManager
 *
 * @description
 * Centralizes all dialog-related functionality for chess move execution including:
 * - Error dialogs for suboptimal moves with detailed feedback
 * - Move quality assessment with German localization
 * - WDL (Win/Draw/Loss) change formatting for user understanding
 * - Future support for pawn promotion and confirmation dialogs
 * - Consistent state management through the Zustand store API
 *
 * @remarks
 * The MoveDialogManager provides a clean separation between dialog logic and the main
 * move orchestration flow. It handles all user-facing feedback related to move quality,
 * ensuring consistent presentation of chess evaluation data.
 *
 * Dialog types handled:
 * 1. **Move Error Dialog**: Shows when user makes suboptimal move that changes outcome
 * 2. **Promotion Dialog**: Future enhancement for pawn promotion choices
 * 3. **Confirmation Dialog**: Future enhancement for critical move confirmation
 *
 * The manager integrates with the training store to update UI state and provides
 * localized German messages for all user interactions.
 *
 * @example
 * ```typescript
 * const dialogManager = new MoveDialogManager();
 *
 * // Show detailed error dialog for move that worsened position
 * dialogManager.showMoveErrorDialog(api, 2, -1, "Be5");
 *
 * // Check if WDL change is significant enough for dialog
 * const shouldShow = dialogManager.isSignificantWdlChange(2, -1, 1);
 * // Returns: true (change of 3 >= threshold of 1)
 *
 * // Get user-friendly description of move quality
 * const description = dialogManager.getMoveQualityDescription(false, true);
 * // Returns: "Achtung! Dieser Zug verschlechtert deine Position erheblich."
 * ```
 */
export class MoveDialogManager {
  /**
   * Shows error dialog for suboptimal moves
   *
   * @param api - Store API for state updates
   * @param wdlBefore - Position evaluation before move
   * @param wdlAfter - Position evaluation after move
   * @param bestMove - Recommended optimal move (optional)
   * @param playedMove - The actual move that was played (optional)
   * @param moveNumber - The current move number (optional)
   */
  showMoveErrorDialog(
    api: StoreApi,
    wdlBefore: number,
    wdlAfter: number,
    bestMove?: string,
    playedMove?: string,
    moveNumber?: number,
  ): void {
    getLogger().debug("[MoveDialog] Showing move error dialog:", {
      wdlBefore,
      wdlAfter,
      bestMove,
      playedMove,
      moveNumber,
    });

    const { setState } = api;

    setState((draft) => {
      draft.training.moveErrorDialog = {
        isOpen: true,
        wdlBefore,
        wdlAfter,
        ...(bestMove !== undefined && { bestMove }),
        ...(playedMove !== undefined && { playedMove }),
        ...(moveNumber !== undefined && { moveNumber }),
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
        // bestMove: undefined - omit instead of setting undefined
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
    callback: (piece: "q" | "r" | "n" | "b") => void,
  ): void {
    getLogger().debug("[MoveDialog] Showing promotion dialog:", { from, to });

    const { setState } = api;

    // Promotion dialog is implemented in Chessboard component
    // This is a fallback for orchestrator-level handling
    setState((draft) => {
      // Add promotion dialog to UI state when UI is implemented
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Bauernumwandlung: ${from}-${to}`,
        type: "info",
      });
    });

    // For now, auto-promote to queen (chess.js default behavior)
    const chosenPiece: "q" | "r" | "n" | "b" = "q";
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
    _onCancel: () => void, // Cancel handler not needed in current implementation
  ): void {
    getLogger().debug("[MoveDialog] Showing confirmation dialog:", { message });

    const { setState } = api;

    // Confirmation dialog not yet implemented - using toast for now
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
    // Round to avoid floating point precision issues
    const roundedDifference = Math.round(difference * ALGORITHM_MULTIPLIERS.DEFAULT_BATCH_SIZE) / ALGORITHM_MULTIPLIERS.DEFAULT_BATCH_SIZE;

    if (roundedDifference > 0) {
      return `Position verbessert sich um ${roundedDifference} Punkte`;
    } else if (roundedDifference < 0) {
      return `Position verschlechtert sich um ${Math.abs(roundedDifference)} Punkte`;
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
  isSignificantWdlChange(
    wdlBefore: number,
    wdlAfter: number,
    threshold: number = 1,
  ): boolean {
    return Math.abs(wdlAfter - wdlBefore) >= threshold;
  }

  /**
   * Gets user-friendly move quality description
   *
   * @param wasOptimal - Whether the move was optimal
   * @param outcomeChanged - Whether the game outcome changed
   * @returns German description of move quality
   */
  getMoveQualityDescription(
    wasOptimal: boolean,
    outcomeChanged: boolean,
  ): string {
    if (wasOptimal) {
      return "Ausgezeichneter Zug! Dies ist einer der besten Züge in dieser Position.";
    } else if (outcomeChanged) {
      return "Achtung! Dieser Zug verschlechtert deine Position erheblich.";
    } else {
      return "Guter Zug, aber nicht optimal. Es gibt bessere Alternativen.";
    }
  }
}
