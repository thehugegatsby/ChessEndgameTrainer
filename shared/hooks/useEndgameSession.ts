import { useCallback } from "react";
import { useStore } from "@shared/store/rootStore";
import type { ValidatedMove } from "@shared/types/chess";
import { ErrorService } from "@shared/services/ErrorService";

/**
 * Configuration options for the useEndgameSession hook
 * @interface UseEndgameSessionOptions
 * @property {Function} [onComplete] - Callback fired when endgame ends (checkmate/stalemate)
 * @property {Function} [onPositionChange] - Callback fired after each move with new FEN and PGN
 */
interface UseEndgameSessionOptions {
  onComplete?: (success: boolean) => void;
  onPositionChange?: (fen: string, pgn: string) => void;
}

/**
 * Return value of the useEndgameSession hook
 * @interface UseEndgameSessionReturn
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
interface UseEndgameSessionReturn {
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
 * Hook providing endgame session functionality using Zustand store as single source of truth
 *
 * @param {UseEndgameSessionOptions} options - Configuration for the endgame session hook
 * @param {Function} [options.onComplete] - Called when game ends with success boolean
 * @param {Function} [options.onPositionChange] - Called after moves with (fen, pgn)
 * @returns {UseEndgameSessionReturn} Endgame session interface with state and methods
 *
 * @remarks
 * This hook is a thin wrapper around Zustand store actions. It:
 * - Delegates all state management to the store (no local state)
 * - Provides callbacks for endgame training events (completion, position changes)
 * - Handles error cases gracefully with ErrorService
 * - Automatically detects game endings and triggers completion
 *
 * @example
 * const { game, makeMove, history } = useEndgameSession({
 *   onComplete: (success) => console.log('Endgame completed:', success),
 *   onPositionChange: (fen, pgn) => console.log('New position:', fen)
 * });
 *
 * // Make a move in the endgame
 * const success = await makeMove({ from: 'e7', to: 'e8' });
 */
export const useEndgameSession = ({
  onComplete,
  onPositionChange,
}: UseEndgameSessionOptions): UseEndgameSessionReturn => {
  const training = useStore((state) => ({
    game: state.game,
    isGameFinished: state.isGameFinished,
    currentFen: state.currentFen,
    currentPgn: state.currentPgn,
    moveHistory: state.moveHistory,
    currentPosition: state.currentPosition,
  }));
  const actions = useStore((state) => ({
    makeUserMove: state.makeUserMove,
    completeTraining: state.completeTraining,
    goToMove: state.goToMove,
    resetPosition: state.resetPosition,
    undoMove: state.undoMove,
  }));

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
      if (training.isGameFinished) return false;

      try {
        // Simply delegate to Store - no double validation needed
        // Store will validate the move and update all states atomically
        const moveResult = await actions.makeUserMove(move as any);
        if (!moveResult) return false;

        // Check if game is finished after move
        if (training.game?.isGameOver()) {
          const success =
            training.game.turn() !== training.currentPosition?.sideToMove?.[0];
          actions.completeTraining(success);
          onComplete?.(success);
        }

        // Notify position change with current Store state
        onPositionChange?.(
          training.currentFen || "",
          training.currentPgn || "",
        );

        return true;
      } catch (error) {
        ErrorService.handleUIError(
          error instanceof Error ? error : new Error(String(error)),
          "useEndgameSession",
          { action: "makeMove", additionalData: { move } },
        );
        return false;
      }
    },
    [training, actions, onComplete, onPositionChange],
  );

  /**
   * Navigate to a specific move in the game history
   * @param {number} moveIndex - Move number to jump to (1-based index)
   */
  const jumpToMove = useCallback(
    (moveIndex: number) => {
      // Convert 1-based index to 0-based for store
      const zeroBasedIndex = moveIndex - 1;
      actions.goToMove(zeroBasedIndex);

      // Notify position change
      if (onPositionChange && training.currentFen) {
        onPositionChange(training.currentFen, training.currentPgn || "");
      }
    },
    [actions, training.currentFen, training.currentPgn, onPositionChange],
  );

  /**
   * Reset the game to initial position
   * Clears move history and resets to starting FEN
   */
  const resetGame = useCallback(() => {
    actions.resetPosition();

    // Notify position change
    if (onPositionChange && training.currentPosition) {
      onPositionChange(training.currentPosition.fen, "");
    }
  }, [actions, training.currentPosition, onPositionChange]);

  /**
   * Undo the last move in the game
   * @returns {boolean} True if move was undone, false if no moves to undo
   */
  const undoMove = useCallback((): boolean => {
    if (training.moveHistory.length === 0) return false;

    // Use the store's undoMove action
    actions.undoMove();

    // Notify position change
    if (onPositionChange && training.currentFen) {
      onPositionChange(training.currentFen, training.currentPgn || "");
    }

    return true;
  }, [
    training.moveHistory,
    training.currentFen,
    training.currentPgn,
    actions,
    onPositionChange,
  ]);

  return {
    game: training.game,
    history: training.moveHistory,
    isGameFinished: training.isGameFinished,
    currentFen: training.currentFen || training.currentPosition?.fen || "",
    currentPgn: training.currentPgn || "",
    makeMove,
    jumpToMove,
    resetGame,
    undoMove,
  };
};
