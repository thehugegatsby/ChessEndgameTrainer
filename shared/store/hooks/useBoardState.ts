/**
 * @file Board state hook for chess components
 * @module store/hooks/useBoardState
 *
 * @description
 * Task-oriented hook providing chess board state for components
 * that display or interact with the chess board. Uses useShallow
 * for optimal re-render performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Hook for chess board display state
 *
 * @description
 * Provides essential state for chess board components including
 * current position, move history, and game status. Optimized to
 * only trigger re-renders when relevant data changes.
 *
 * @returns {Object} Board state
 * @returns {ValidatedMove[]} moveHistory - Array of played moves
 * @returns {string} currentFen - Current board position in FEN
 * @returns {string} currentPgn - Current game in PGN notation
 * @returns {boolean} isGameFinished - Whether game has ended
 * @returns {ChessInstance} game - Chess.js game instance
 *
 * @example
 * ```tsx
 * const { currentFen, moveHistory, isGameFinished } = useBoardState();
 *
 * return (
 *   <Chessboard
 *     position={currentFen}
 *     arePiecesDraggable={!isGameFinished}
 *   />
 * );
 * ```
 */
export const useBoardState = () =>
  useStore(
    useShallow((state) => ({
      // Game state
      game: state.game,
      currentFen: state.currentFen,
      currentPgn: state.currentPgn,
      moveHistory: state.moveHistory,
      isGameFinished: state.isGameFinished,
      gameResult: state.gameResult,

      // Current position for validation
      currentPosition: state.currentPosition,
    })),
  );
