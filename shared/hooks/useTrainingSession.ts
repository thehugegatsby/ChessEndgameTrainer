/**
 * @file Hook for managing chess endgame training sessions
 * @module hooks/useTrainingSession
 *
 * @description
 * Core hook that connects React components to the Zustand store for chess training.
 * Provides a clean API for move execution, history navigation, and game state management.
 * Uses the store as the single source of truth for all chess state.
 */

import { useCallback } from "react";
import {
  useBoardState,
  useTrainingActions,
  useGameActions,
} from "@shared/store/hooks";
import type { ValidatedMove } from "@shared/types/chess";
import { ErrorService } from "@shared/services/ErrorService";

/**
 * Configuration options for the useTrainingSession hook
 *
 * @interface UseTrainingSessionOptions
 * @property {Function} [onComplete] - Callback fired when training ends (checkmate/stalemate)
 * @property {Function} [onPositionChange] - Callback fired after each move with new FEN and PGN
 */
interface UseTrainingSessionOptions {
  onComplete?: (success: boolean) => void;
  onPositionChange?: (fen: string, pgn: string) => void;
}

/**
 * Return value of the useTrainingSession hook
 * @interface UseTrainingSessionReturn
 * @property {Chess} game - Chess.js instance from Zustand store (read-only reference)
 * @property {ValidatedMove[]} history - Array of validated moves played in the endgame
 * @property {boolean} isGameFinished - Whether endgame has ended (checkmate/stalemate)
 * @property {string} currentFen - Current position in FEN notation
 * @property {string} currentPgn - Current game in PGN notation
 * @property {Function} makeMove - Execute a chess move and update store
 * @property {Function} jumpToMove - Navigate to a specific move in history
 * @property {Function} resetGame - Reset to initial endgame position
 * @property {Function} undoMove - Take back the last move
 */
interface UseTrainingSessionReturn {
  game: any; // Chess instance from store
  history: ValidatedMove[];
  isGameFinished: boolean;
  currentFen: string;
  currentPgn: string;
  makeMove: (move: {
    from: string;
    to: string;
    promotion?: string;
  }) => Promise<boolean>;
  jumpToMove: (moveIndex: number) => void;
  resetGame: () => void;
  undoMove: () => boolean;
}

/**
 * Hook providing training session functionality using Zustand store as single source of truth
 *
 * @description
 * Central hook for chess endgame training sessions. Bridges React components with
 * the Zustand store, providing a clean API for chess operations while maintaining
 * store as the single source of truth.
 *
 * @param {UseTrainingSessionOptions} options - Configuration for the training session hook
 * @param {Function} [options.onComplete] - Called when game ends with success boolean
 * @param {Function} [options.onPositionChange] - Called after moves with (fen, pgn)
 * @returns {UseTrainingSessionReturn} Training session interface with state and methods
 *
 * @remarks
 * This hook is a thin wrapper around Zustand store actions. It:
 * - Delegates all state management to the store (no local state)
 * - Provides callbacks for training events (completion, position changes)
 * - Handles error cases gracefully with ErrorService
 * - Automatically detects game endings and triggers completion
 * - Integrates with tablebase for opponent moves
 *
 * @example
 * ```tsx
 * function TrainingBoard() {
 *   const { game, makeMove, history, isGameFinished } = useTrainingSession({
 *     onComplete: (success) => {
 *       if (success) {
 *         showToast('Well done! You achieved the target outcome!');
 *       } else {
 *         showToast('Game ended. Try again!');
 *       }
 *     },
 *     onPositionChange: (fen, pgn) => {
 *       console.log('New position:', fen);
 *       updateAnalysis(fen);
 *     }
 *   });
 *
 *   const handleMove = async (from: string, to: string) => {
 *     const success = await makeMove({ from, to, promotion: 'q' });
 *     if (!success) {
 *       showError('Invalid move!');
 *     }
 *   };
 *
 *   return (
 *     <Chessboard
 *       position={game.fen()}
 *       onPieceDrop={handleMove}
 *       arePiecesDraggable={!isGameFinished}
 *     />
 *   );
 * }
 * ```
 */
export const useTrainingSession = ({
  onComplete,
  onPositionChange,
}: UseTrainingSessionOptions): UseTrainingSessionReturn => {
  const {
    game,
    isGameFinished,
    currentFen,
    currentPgn,
    moveHistory,
    currentPosition,
  } = useBoardState();

  const { handlePlayerMove, completeTraining } = useTrainingActions();

  const { goToMove, resetPosition, undoMove } = useGameActions();

  /**
   * Execute a chess move and update the game state
   * @param {Object} move - Move to execute
   * @param {string} move.from - Source square (e.g., 'e2')
   * @param {string} move.to - Target square (e.g., 'e4')
   * @param {string} [move.promotion] - Promotion piece ('q', 'r', 'b', 'n')
   * @returns {Promise<boolean>} True if move was successful, false otherwise
   */
  const makeMove = useCallback(
    async (move: {
      from: string;
      to: string;
      promotion?: string;
    }): Promise<boolean> => {
      if (isGameFinished) return false;

      try {
        // Simply delegate to Store - no double validation needed
        // Store will validate the move and update all states atomically
        const moveResult = await handlePlayerMove(move as any);
        if (!moveResult) return false;

        // Check if game is finished after move
        if (game?.isGameOver()) {
          const success = game.turn() !== currentPosition?.sideToMove?.[0];
          completeTraining(success);
          onComplete?.(success);
        }

        // Notify position change with current Store state
        onPositionChange?.(currentFen || "", currentPgn || "");

        return true;
      } catch (error) {
        ErrorService.handleUIError(
          error instanceof Error ? error : new Error(String(error)),
          "useTrainingSession",
          { action: "makeMove", additionalData: { move } },
        );
        return false;
      }
    },
    [
      game,
      isGameFinished,
      currentPosition,
      currentFen,
      currentPgn,
      handlePlayerMove,
      completeTraining,
      onComplete,
      onPositionChange,
    ],
  );

  /**
   * Navigate to a specific move in the game history
   * @param {number} moveIndex - Move number to jump to (1-based index)
   */
  const jumpToMove = useCallback(
    (moveIndex: number) => {
      // Convert 1-based index to 0-based for store
      const zeroBasedIndex = moveIndex - 1;
      goToMove(zeroBasedIndex);

      // Notify position change
      if (onPositionChange && currentFen) {
        onPositionChange(currentFen, currentPgn || "");
      }
    },
    [goToMove, currentFen, currentPgn, onPositionChange],
  );

  /**
   * Reset the game to initial position
   * Clears move history and resets to starting FEN
   */
  const resetGame = useCallback(() => {
    resetPosition();

    // Notify position change
    if (onPositionChange && currentPosition) {
      onPositionChange(currentPosition.fen, "");
    }
  }, [resetPosition, currentPosition, onPositionChange]);

  /**
   * Undo the last move in the game
   * @returns {boolean} True if move was undone, false if no moves to undo
   */
  const undoMoveAction = useCallback((): boolean => {
    if (moveHistory.length === 0) return false;

    // Use the store's undoMove action
    undoMove();

    // Notify position change
    if (onPositionChange && currentFen) {
      onPositionChange(currentFen, currentPgn || "");
    }

    return true;
  }, [moveHistory, currentFen, currentPgn, undoMove, onPositionChange]);

  return {
    game: game,
    history: moveHistory,
    isGameFinished: isGameFinished,
    currentFen: currentFen || currentPosition?.fen || "",
    currentPgn: currentPgn || "",
    makeMove,
    jumpToMove,
    resetGame,
    undoMove: undoMoveAction,
  };
};
