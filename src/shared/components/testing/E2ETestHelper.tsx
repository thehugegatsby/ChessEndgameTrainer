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
import { Chess } from 'chess.js';
import { chessService } from '@shared/services/ChessService';
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
    if (typeof window !== "undefined" && !testMoveProcessed) {
      const urlParams = new URLSearchParams(window.location.search);
      const testMoves = urlParams.get("moves");

      // Debug logging
      const logger = getLogger().setContext("E2ETestHelper");
      logger.debug("URL check", {
        url: window.location.href,
        search: window.location.search,
        testMoves,
        gameReady: !!currentFen,
        isGameFinished,
        historyLength: moveHistory.length,
        testMoveProcessed,
      });

      if (testMoves && currentFen && !isGameFinished) {
        setTestMoveProcessed(true);
        const moves = testMoves.split(",");
        let moveIndex = 0;

        logger.info("Starting automated moves", {
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
        const playNextMove = async () => {
          if (moveIndex < moves.length) {
            const moveNotation = moves[moveIndex];

            logger.debug("Attempting move", {
              moveIndex,
              moveNotation,
              currentHistoryLength: moveHistory.length,
            });

            try {
              // Parse move notation to standardized format
              let move;
              if (moveNotation.includes("-")) {
                // Format: e2-e4
                const [from, to] = moveNotation.split("-");
                move = {
                  from: from,
                  to: to,
                  promotion: "q",
                };
              } else {
                // Format: e4 (SAN) - parse it properly
                const tempGame = new Chess(chessService.getFen());
                const parsedMove = tempGame.move(moveNotation);
                if (parsedMove) {
                  move = {
                    from: parsedMove.from,
                    to: parsedMove.to,
                    promotion: parsedMove.promotion || "q",
                  };
                }
              }

              if (move) {
                logger.debug("Move parsed successfully", { move });
                const result = await onMove(move);

                if (result) {
                  moveIndex++;
                  logger.debug("Move executed successfully", {
                    moveIndex,
                    newHistoryLength: moveHistory.length,
                  });

                  // Wait and then next move
                  setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_NORMAL);
                } else {
                  logger.warn("Move execution failed", { moveNotation });
                  // Try next move
                  moveIndex++;
                  setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
                }
              } else {
                logger.warn("Move parsing returned null", { moveNotation });
                // Try next move
                moveIndex++;
                setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
              }
            } catch (error) {
              logger.error("Test move failed", error, { moveNotation });
              // Try next move
              moveIndex++;
              setTimeout(playNextMove, ANIMATION.MOVE_PLAY_DELAY_FAST);
            }
          } else {
            logger.info("Automated moves completed", {
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