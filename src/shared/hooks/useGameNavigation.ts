/**
 * @file Game navigation hook for chess training board
 * @module hooks/useGameNavigation
 * 
 * @description
 * Custom hook that encapsulates move history navigation logic for chess training.
 * Extracted from TrainingBoard to separate navigation concerns from UI rendering.
 * Handles move history tracking, previous FEN calculation, and parent callbacks.
 * 
 * @remarks
 * Key responsibilities:
 * - Previous FEN calculation for tablebase comparison
 * - Move history change notifications to parent
 * - Jump-to-move functionality coordination
 * - Chess game state reconstruction for navigation
 * 
 * This hook maintains navigation state logic while providing
 * a clean interface for move history management.
 * 
 * @example
 * ```tsx
 * const gameNavigation = useGameNavigation({
 *   history,
 *   initialFen,
 *   currentFen,
 *   onHistoryChange,
 *   onJumpToMove,
 *   jumpToMove
 * });
 * 
 * // Use previousFen for tablebase comparison
 * const analysis = usePositionAnalysis({
 *   fen: currentFen,
 *   previousFen: gameNavigation.previousFen
 * });
 * ```
 */

import { useMemo, useEffect } from 'react';
import { Chess, Move } from 'chess.js';
import { ValidatedMove } from '@shared/types';
import { toLibraryMove } from '@shared/infrastructure/chess-adapter';

/**
 * Configuration options for game navigation hook
 * 
 * @interface UseGameNavigationOptions
 * @description Options for configuring game navigation behavior
 */
export interface UseGameNavigationOptions {
  /** Current move history (validated moves) */
  history: ValidatedMove[];
  /** Initial FEN position of the game */
  initialFen: string;
  /** Current FEN position */
  currentFen?: string;
  /** Callback when move history changes */
  onHistoryChange?: (moves: Move[]) => void;
  /** Callback to provide jump-to-move function to parent */
  onJumpToMove?: (jumpToMoveFunc: (moveIndex: number) => void) => void;
  /** Jump to move function from training session */
  jumpToMove?: (moveIndex: number) => void;
}

/**
 * Game navigation state and utilities
 * 
 * @interface GameNavigationResult
 * @description Result object containing navigation state and utilities
 */
export interface GameNavigationResult {
  /** Previous FEN position for tablebase comparison */
  previousFen: string | undefined;
  /** Whether navigation is possible */
  canNavigate: boolean;
  /** Total number of moves in history */
  totalMoves: number;
}

/**
 * Game navigation hook
 * 
 * @description
 * Provides move history navigation functionality with FEN reconstruction
 * and parent callback coordination. Calculates previous positions for
 * tablebase comparison and manages navigation state.
 * 
 * @param {UseGameNavigationOptions} options - Navigation configuration
 * @returns {GameNavigationResult} Navigation state and utilities
 * 
 * @example
 * ```tsx
 * const gameNavigation = useGameNavigation({
 *   history: moveHistory,
 *   initialFen: startPosition,
 *   currentFen: currentPosition,
 *   onHistoryChange: handleHistoryChange,
 *   onJumpToMove: setJumpFunction,
 *   jumpToMove: jumpToMoveFunction
 * });
 * 
 * // Access previous position for comparison
 * if (gameNavigation.previousFen) {
 *   console.log('Previous position:', gameNavigation.previousFen);
 * }
 * ```
 */
export const useGameNavigation = ({
  history,
  initialFen,
  currentFen: _currentFen, // Reserved for future use
  onHistoryChange,
  onJumpToMove,
  jumpToMove
}: UseGameNavigationOptions): GameNavigationResult => {
  
  // Calculate previous FEN for tablebase move comparison
  const previousFen = useMemo(() => {
    if (history.length === 0) {
      return undefined;
    }

    if (history.length === 1) {
      return initialFen;
    }

    try {
      const tempGame = new Chess(initialFen);
      // Replay all moves except the last one to get previous position
      for (let i = 0; i < history.length - 1; i++) {
        const moveResult = tempGame.move(history[i]);
        if (!moveResult) {
          // Move doesn't apply to this position - history is from a different position
          return undefined;
        }
      }
      return tempGame.fen();
    } catch {
      // History doesn't match current position
      return undefined;
    }
  }, [history, initialFen]);

  // Notify parent when move history changes
  useEffect(() => {
    if (onHistoryChange && history) {
      // Convert ValidatedMove[] to Move[] for the callback
      const libraryMoves = history.map(toLibraryMove);
      onHistoryChange(libraryMoves);
    }
  }, [history, onHistoryChange]);

  // Provide jump-to-move function to parent
  useEffect(() => {
    if (onJumpToMove && jumpToMove) {
      onJumpToMove(jumpToMove);
    }
  }, [onJumpToMove, jumpToMove]);

  // Return navigation state
  return {
    previousFen,
    canNavigate: history.length > 0,
    totalMoves: history.length
  };
};