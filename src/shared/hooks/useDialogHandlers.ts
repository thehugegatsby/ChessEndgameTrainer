/**
 * @file Dialog handlers hook for chess training board
 * @module hooks/useDialogHandlers
 * 
 * @description
 * Custom hook that encapsulates all dialog handling logic for chess training.
 * Extracted from TrainingBoard to separate dialog business logic from UI coordination.
 * Handles error dialogs, success dialogs, and training workflow actions.
 * 
 * @remarks
 * Key responsibilities:
 * - Move error dialog actions (take back, restart, continue, show best move)
 * - Move success dialog actions (close, continue)
 * - Training session reset coordination
 * - Complex opponent turn scheduling and cancellation
 * - Comprehensive logging and state coordination
 * 
 * This hook maintains all the complex business logic while providing
 * a clean interface for dialog action coordination.
 * 
 * @example
 * ```tsx
 * const dialogHandlers = useDialogHandlers({
 *   undoMove,
 *   resetGame,
 *   clearEvaluations,
 *   trainingActions,
 *   gameActions,
 *  *   trainingState,
 *   storeApi,
 *   trainingUIState,
 * });
 * 
 * <DialogManager
 *   errorDialog={trainingState.moveErrorDialog}
 *   successDialog={trainingState.moveSuccessDialog}
 *   onErrorTakeBack={dialogHandlers.handleMoveErrorTakeBack}
 *   onErrorRestart={dialogHandlers.handleMoveErrorRestart}
 *   onErrorContinue={dialogHandlers.handleMoveErrorContinue}
 *   onErrorShowBestMove={dialogHandlers.handleShowBestMove}
 *   onSuccessClose={dialogHandlers.handleMoveSuccessClose}
 *   onSuccessContinue={dialogHandlers.handleMoveSuccessContinue}
 * />
 * ```
 */

import { useCallback } from 'react';
import { getLogger } from '@shared/services/logging/Logger';
import { getOpponentTurnManager } from '@shared/store/orchestrators/handlePlayerMove';
import { showInfoToast } from '@shared/utils/toast';
import { chessService } from '@shared/services/ChessService';
// Note: Direct service import maintained for callback context
import type { StoreApi } from '@shared/store/StoreContext';

/**
 * Dialog types for training actions
 */
type MoveErrorDialog = {
  isOpen: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  bestMove?: string;
} | null;

type MoveSuccessDialog = {
  isOpen: boolean;
  promotionPiece?: string;
  moveDescription?: string;
} | null;

/**
 * Training actions interface (subset needed for dialog handling)
 */
interface TrainingActionsSubset {
  setPlayerTurn: (isPlayerTurn: boolean) => void;
  clearOpponentThinking: () => void;
  setMoveErrorDialog: (dialog: MoveErrorDialog) => void;
  setMoveSuccessDialog: (dialog: MoveSuccessDialog) => void;
  setEvaluationBaseline: (wdl: number, fen: string) => void;
  clearEvaluationBaseline: () => void;
}

/**
 * Game actions interface (subset needed for dialog handling)
 */
interface GameActionsSubset {
  resetGame: () => void;
}

/**
 * UI actions interface (subset needed for dialog handling)
 */
interface UIActionsSubset {
  showToast: (message: string, type: string) => void;
}

/**
 * Training state interface (subset needed for dialog handling)
 */
interface TrainingStateSubset {
  isPlayerTurn: boolean;
  isOpponentThinking: boolean;
  currentPosition?: {
    id: number;
    colorToTrain?: string;
  } | null;
  moveErrorDialog?: {
    bestMove?: string;
  } | null;
}


/**
 * Training UI state interface (subset needed for dialog handling)
 */
interface TrainingUIStateSubset {
  handleReset: () => void;
}

/**
 * Props for useDialogHandlers hook
 */
interface UseDialogHandlersProps {
  /** Training session function to undo moves */
  undoMove: () => boolean;
  /** Training session function to reset game */
  resetGame: () => void;
  /** Training session function to clear evaluations */
  clearEvaluations: () => void;
  
  /** Training store actions */
  trainingActions: TrainingActionsSubset;
  /** Game store actions */
  gameActions: GameActionsSubset;
  /** UI store actions */
  uiActions: UIActionsSubset;
  
  /** Training state */
  trainingState: TrainingStateSubset;
  
  /** Store API for direct state access */
  storeApi: StoreApi;
  
  /** Training UI state management */
  trainingUIState: TrainingUIStateSubset;
}

/**
 * Return value from useDialogHandlers hook
 */
interface UseDialogHandlersReturn {
  /** Handler for move error dialog - take back move (undo) */
  handleMoveErrorTakeBack: () => void;
  /** Handler for move error dialog - restart game */
  handleMoveErrorRestart: () => void;
  /** Handler for move error dialog - continue playing */
  handleMoveErrorContinue: () => void;
  /** Handler for move error dialog - show best move */
  handleShowBestMove: () => void;
  
  /** Handler for move success dialog - close dialog */
  handleMoveSuccessClose: () => void;
  /** Handler for move success dialog - continue to next */
  handleMoveSuccessContinue: () => void;
  
  /** Handler for general game reset */
  handleReset: () => void;
}

/**
 * Custom hook for chess dialog handling logic
 * 
 * @description
 * Encapsulates all dialog handling logic including:
 * - Move error dialog actions with complex undo and opponent turn logic
 * - Move success dialog actions for training flow continuation
 * - Training session reset coordination across multiple services
 * - State management for opponent turns and player interactions
 * - Comprehensive logging and error handling
 * 
 * @remarks
 * This hook maintains all the complex business logic that was previously
 * embedded in TrainingBoard. It coordinates between multiple services:
 * - TrainingSession hooks for game state management
 * - Store actions for state updates
 * - Opponent turn orchestrators for training flow
 * - Logging service for debugging and monitoring
 * 
 * The hook preserves all original functionality while providing a clean
 * interface that separates concerns between dialog actions and UI coordination.
 * 
 * @param props Configuration object with session functions, store actions, and state
 * @returns Object with all dialog handler functions
 */
export const useDialogHandlers = ({
  undoMove,
  resetGame,
  clearEvaluations,
  trainingActions,
  gameActions,
  trainingState,
  storeApi,
  trainingUIState,
}: UseDialogHandlersProps): UseDialogHandlersReturn => {

  /**
   * Resets the training board to initial state
   *
   * @description
   * Performs comprehensive cleanup including:
   * - Resetting chess game to starting position
   * - Clearing all position evaluations
   * - Resetting UI state and dialogs
   * - Clearing training session data
   *
   * @remarks
   * This handler is called when:
   * - User clicks reset button
   * - Training session needs restart
   * - Parent component triggers reset
   */
  const handleReset = useCallback(() => {
    resetGame();
    clearEvaluations();
    trainingUIState.handleReset();
    gameActions.resetGame();
    // Clear evaluation baseline when resetting
    trainingActions.clearEvaluationBaseline();
  }, [resetGame, clearEvaluations, gameActions, trainingUIState, trainingActions]);

  /**
   * Handles move error dialog dismissal with undo
   *
   * @description
   * Closes the move error dialog and undoes the suboptimal move,
   * allowing the user to try a different move.
   *
   * @remarks
   * When a suboptimal move is detected, it has already been executed
   * on the board and added to the move history. This function removes
   * the move from history and reverts the board position.
   */
  const handleMoveErrorTakeBack = useCallback(() => {
    const logger = getLogger().setContext("useDialogHandlers-MoveError");
    logger.info("Undoing suboptimal move using useTrainingSession undoMove");

    // CRITICAL: Cancel any scheduled opponent turn BEFORE undoing
    // This prevents the opponent from playing after we undo
    getOpponentTurnManager().cancel();
    logger.info("Cancelled any scheduled opponent turn");

    // Use the undoMove function from useTrainingSession which properly handles ChessService
    const undoResult = undoMove();

    if (undoResult) {
      logger.info("Move successfully undone");

      // CRITICAL: Set player turn to true after undoing a suboptimal move
      // This prevents the opponent from playing immediately after undo
      logger.debug("Before setPlayerTurn - current state", {
        isPlayerTurn: trainingState.isPlayerTurn,
        isOpponentThinking: trainingState.isOpponentThinking,
      });
      trainingActions.setPlayerTurn(true);
      trainingActions.clearOpponentThinking(); // Clear opponent thinking flag
      trainingActions.clearEvaluationBaseline(); // Clear baseline since we're back to original position
      logger.info(
        "Set player turn to true, cleared opponent thinking, and cleared evaluation baseline",
      );
      logger.debug("After setPlayerTurn call");
    } else {
      logger.error("Failed to undo move - no moves in history");
    }

    // Close the dialog using the trainingActions hook which properly accesses the action
    // The hook extracts the action from the slice creator, not from the nested store state
    if (trainingActions && trainingActions.setMoveErrorDialog) {
      trainingActions.setMoveErrorDialog(null);
      logger.info(
        "Successfully closed move error dialog via trainingActions hook",
      );
    } else {
      logger.error("setMoveErrorDialog not available in trainingActions");
    }
  }, [undoMove, trainingActions, trainingState]);

  /**
   * Restarts the entire training session after move error
   *
   * @description
   * Completely resets the game and closes the error dialog when
   * the user chooses to restart after making a critical mistake.
   *
   * @remarks
   * This is typically used when the user has made a game-losing
   * mistake and wants to start the position from the beginning.
   */
  const handleMoveErrorRestart = useCallback(() => {
    const logger = getLogger().setContext("useDialogHandlers-MoveError");
    logger.info("Restarting game due to move error");
    handleReset();
    trainingActions.setMoveErrorDialog(null);
  }, [handleReset, trainingActions]);

  /**
   * Handles "Weiterspielen" (continue playing) action from error dialog
   *
   * @description
   * Closes the error dialog and schedules the opponent's turn.
   * This allows the game to continue even after a suboptimal move,
   * letting the opponent respond to the player's move.
   *
   * @remarks
   * This provides a smoother training experience by allowing players
   * to continue playing and learning from their mistakes rather than
   * always having to take back moves.
   */
  const handleMoveErrorContinue = useCallback(() => {
    const logger = getLogger().setContext("useDialogHandlers-MoveError");
    
    // Get current state for debugging
    const currentState = storeApi.getState();
    logger.info(
      "🎯 WEITERSPIELEN clicked - Current state BEFORE action:",
      {
        isPlayerTurn: currentState.training.isPlayerTurn,
        isOpponentThinking: currentState.training.isOpponentThinking,
        currentFen: chessService.getFen(),
        currentTurn: chessService.turn(),
        colorToTrain: currentState.training.currentPosition?.colorToTrain,
        moveCount: currentState.game.moveHistory.length,
      }
    );

    // CRITICAL FIX: Set turn state before scheduling opponent turn
    // This ensures the opponent can actually execute their move
    const currentTurn = chessService.turn();
    const trainingColor = currentState.training.currentPosition?.colorToTrain?.charAt(0);
    
    if (currentTurn !== trainingColor) {
      logger.info("🔧 FIXING BUG: Setting isPlayerTurn=false for opponent to move");
      trainingActions.setPlayerTurn(false);
    }

    // Close the error dialog
    trainingActions.setMoveErrorDialog(null);
    logger.info("✅ Error dialog closed");

    // Schedule opponent turn to respond to player's move
    logger.info("📅 Calling scheduleOpponentTurn with evaluation baseline callback...");
    getOpponentTurnManager().schedule(storeApi, 500, {
      onOpponentMoveComplete: async () => {
        logger.info("🎯 Opponent move completed - updating evaluation baseline");
        
        try {
          // Get current position evaluation
          const currentFen = chessService.getFen();
          // Dynamic import for callback context
          const { tablebaseService } = await import('@shared/services/TablebaseService');
          const currentEval = await tablebaseService.getEvaluation(currentFen);
          
          if (currentEval.isAvailable && currentEval.result) {
            // Update baseline to current position's evaluation using the actions provided to this hook
            trainingActions.setEvaluationBaseline(currentEval.result.wdl, currentFen);
            logger.info("✅ Evaluation baseline updated successfully", {
              newBaseline: currentEval.result.wdl,
              fen: currentFen,
            });
          } else {
            logger.warn("⚠️ Could not get evaluation for baseline update - tablebase unavailable");
          }
        } catch (error) {
          logger.error("❌ Failed to update evaluation baseline:", error);
        }
      }
    });

    // Check state after scheduling
    const stateAfter = storeApi.getState();
    logger.info("📊 State AFTER scheduling opponent turn:", {
      isPlayerTurn: stateAfter.training.isPlayerTurn,
      isOpponentThinking: stateAfter.training.isOpponentThinking,
    });
  }, [trainingActions, storeApi]);

  /**
   * Displays the best move as a toast notification
   *
   * @description
   * Shows the optimal move in a toast message when the user
   * requests to see the best move after making a mistake.
   *
   * @remarks
   * The best move is determined by tablebase analysis and
   * represents the objectively best continuation from the
   * position before the user's suboptimal move.
   */
  const handleShowBestMove = useCallback(() => {
    if (trainingState.moveErrorDialog?.bestMove) {
      const logger = getLogger().setContext("useDialogHandlers-MoveError");
      logger.info("Showing best move", { bestMove: trainingState.moveErrorDialog.bestMove });
      showInfoToast(
        `Der beste Zug war: ${trainingState.moveErrorDialog.bestMove}`,
        { duration: 4000 }
      );
    }
    trainingActions.setMoveErrorDialog(null);
  }, [trainingState.moveErrorDialog, trainingActions]);

  /**
   * Handles success dialog close
   *
   * @description
   * Closes the move success dialog when user dismisses it.
   */
  const handleMoveSuccessClose = useCallback(() => {
    trainingActions.setMoveSuccessDialog(null);
  }, [trainingActions]);

  /**
   * Handles continuing to next position after success
   *
   * @description
   * Closes the success dialog and allows training to continue.
   * Training completion logic is handled elsewhere in the system.
   */
  const handleMoveSuccessContinue = useCallback(() => {
    trainingActions.setMoveSuccessDialog(null);
    // Training completion logic is already handled by PawnPromotionHandler
  }, [trainingActions]);

  return {
    handleMoveErrorTakeBack,
    handleMoveErrorRestart,
    handleMoveErrorContinue,
    handleShowBestMove,
    handleMoveSuccessClose,
    handleMoveSuccessContinue,
    handleReset,
  };
};