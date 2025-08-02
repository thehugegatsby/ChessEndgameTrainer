import { useCallback } from "react";
import { useTraining, useTrainingActions } from "@shared/store/store";
import { Move } from "chess.js";
import { ErrorService } from "@shared/services/errorService";

/**
 *
 */
interface UseTrainingGameOptions {
  onComplete?: (success: boolean) => void;
  onPositionChange?: (fen: string, pgn: string) => void;
}

/**
 *
 */
interface UseTrainingGameReturn {
  game: any; // Chess instance from store
  history: Move[];
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
 * A hook that provides a chess game interface using the Zustand store as the single source of truth.
 * This replaces the old useChessGame hook which maintained its own state.
 * @param root0
 * @param root0.onComplete
 * @param root0.onPositionChange
 */
export /**
 *
 */
const useTrainingGame = ({
  onComplete,
  onPositionChange,
}: UseTrainingGameOptions): UseTrainingGameReturn => {
  const training = useTraining();
  const actions = useTrainingActions();

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
          "useTrainingGame",
          { action: "makeMove", additionalData: { move } },
        );
        return false;
      }
    },
    [training, actions, onComplete, onPositionChange],
  );

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

  const resetGame = useCallback(() => {
    actions.resetPosition();

    // Notify position change
    if (onPositionChange && training.currentPosition) {
      onPositionChange(training.currentPosition.fen, "");
    }
  }, [actions, training.currentPosition, onPositionChange]);

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
