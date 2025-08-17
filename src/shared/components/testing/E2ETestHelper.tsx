/**
 * @file E2E Test Helper for automated move execution
 * @module components/testing/E2ETestHelper
 *
 * @description
 * Extracted from TrainingBoard to separate E2E testing concerns from business logic.
 * Handles automated move execution via URL parameters for E2E test scenarios.
 *
 * @example
 * // URL: /train/position?moves=e2-e4,Nf3,d5
 * <E2ETestHelper
 *   currentFen={fen}
 *   isGameFinished={finished}
 *   onMove={handleMove}
 *   moveHistory={history}
 * />
 */

import { useState, useEffect } from 'react';
import { parseMove, makeMove } from '@shared/utils/chess-logic';
import { createValidatedMove } from '@shared/types/chess';
import { getLogger } from '@shared/services/logging';
import { ANIMATION } from '@shared/constants';
import type { ValidatedMove } from '@shared/types/chess';

/**
 * Props for E2ETestHelper component
 */
interface E2ETestHelperProps {
  /** Current position in FEN notation */
  currentFen: string;
  /** Whether the game has finished */
  isGameFinished: boolean;
  /** Callback to execute moves - should match TrainingBoard's handleMove signature */
  onMove: (move: ValidatedMove) => Promise<boolean | null>;
  /** Move history for logging/debugging */
  moveHistory: ValidatedMove[];
}

/**
 * E2E Test Helper Component
 *
 * Automatically executes moves from URL parameters for E2E testing.
 * Only activates when "moves" parameter is present in URL.
 *
 * @param props Configuration for automated test execution
 * @returns null (headless component for side effects only)
 *
 * @remarks
 * This component:
 * - Parses moves from URL parameter "moves" (comma-separated)
 * - Supports multiple notation formats (e2-e4, e4, Nf3)
 * - Includes error recovery (skips invalid moves)
 * - Uses delays to simulate realistic user interaction
 * - Provides comprehensive logging for test debugging
 *
 * URL Format: ?moves=e2-e4,Nf3,d5
 * Move Formats Supported:
 * - Coordinate notation: e2-e4, g1-f3
 * - SAN notation: e4, Nf3, O-O
 * - Auto-promotion to Queen for pawn moves
 */
export const E2ETestHelper: React.FC<E2ETestHelperProps> = ({
  currentFen,
  isGameFinished,
  onMove,
  moveHistory,
}) => {
  const [testMoveProcessed, setTestMoveProcessed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !testMoveProcessed) {
      const urlParams = new URLSearchParams(window.location.search);
      const testMoves = urlParams.get('moves');

      // Debug logging
      const logger = getLogger().setContext('E2ETestHelper');
      logger.debug('URL check', {
        url: window.location.href,
        search: window.location.search,
        testMoves,
        gameReady: Boolean(currentFen),
        isGameFinished,
        historyLength: moveHistory.length,
        testMoveProcessed,
      });

      if (testMoves && currentFen && !isGameFinished) {
        setTestMoveProcessed(true);
        const moves = testMoves.split(',');
        let moveIndex = 0;

        logger.info('Starting automated moves', {
          moves,
          totalMoves: moves.length,
        });

        /**
         * Recursively plays moves from URL parameter for automated testing
         *
         * @description
         * Internal function that processes a sequence of moves provided
         * via URL parameter. Supports multiple notation formats and
         * includes error recovery.
         *
         * @remarks
         * Moves are played with animation delays to simulate user interaction.
         * Failed moves are skipped and the sequence continues.
         */
        const playNextMove = async (): Promise<void> => {
          if (moveIndex < moves.length) {
            const moveNotation = moves[moveIndex]?.trim();

            logger.debug('Attempting move', {
              moveIndex,
              moveNotation,
              currentFen, // Log the FEN we are validating against
              currentHistoryLength: moveHistory.length,
            });

            if (!moveNotation) {
              logger.warn('Empty move notation, skipping');
              moveIndex++;
              setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_NORMAL);
              return;
            }

            // Pure, stateless validation using parseMove
            const chessjsMove = parseMove(currentFen, moveNotation);

            if (chessjsMove) {
              // Get the move result to determine the new FEN
              const moveResult = makeMove(currentFen, moveNotation);
              if (moveResult) {
                // Create a proper ValidatedMove with FEN context
                const validatedMove = createValidatedMove(
                  chessjsMove,
                  currentFen,
                  moveResult.newFen
                );
                
                logger.debug('Move parsed successfully', { move: validatedMove });
                const result = await onMove(validatedMove);

                if (result) {
                  logger.debug('Move executed successfully', { moveIndex });
                  moveIndex++;
                  setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_NORMAL);
                } else {
                  logger.warn('onMove execution failed', { moveNotation });
                  moveIndex++;
                  setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
                }
              } else {
                logger.warn('Move makeMove failed', { moveNotation });
                moveIndex++;
                setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
              }
            } else {
              logger.warn('Move parsing failed or move is invalid', { moveNotation });
              moveIndex++;
              setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
            }
          } else {
            logger.info('Automated moves completed', {
              finalMoveIndex: moveIndex,
              finalHistoryLength: moveHistory.length,
            });
          }
        };

        // Start after initial render
        setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_SLOW);
      }
    }
  }, [currentFen, isGameFinished, onMove, testMoveProcessed, moveHistory]);

  // Headless component - no rendering
  return null;
};
