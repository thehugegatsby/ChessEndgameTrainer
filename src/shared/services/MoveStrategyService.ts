// Note: Using direct service import for service-to-service integration
import { getLogger } from "./logging";

const logger = getLogger().setContext("MoveStrategyService");

/**
 * Service for chess move selection strategies
 *
 * @class MoveStrategyService
 * @description
 * Provides different algorithms for selecting chess moves from tablebase data.
 * Supports multiple strategies:
 * - Longest resistance: Maximize DTM (Distance to Mate) in losing positions
 * - Best move: Objectively optimal move by WDL and DTZ
 * - Human-like: Introduces occasional suboptimal moves for realism
 *
 * @remarks
 * All methods query the tablebase service and apply different selection criteria.
 * The service is stateless - each method call is independent.
 * Used primarily by the training system for opponent move selection.
 */
class MoveStrategyService {
  /**
   * Select the move providing longest resistance (best defensive play)
   *
   * @param {string} fen - Current position in FEN notation
   * @returns {Promise<string|null>} Best defensive move in UCI format, or null if unavailable
   *
   * @remarks
   * Strategy varies by position evaluation:
   * - **Winning positions**: Fastest win (lowest DTZ)
   * - **Losing positions**: Longest resistance (highest DTM if available, else DTZ)
   * - **Drawn positions**: Any move maintaining the draw
   *
   * DTM (Distance to Mate) is preferred over DTZ for losing positions because:
   * - DTM shows actual moves until checkmate
   * - DTZ only shows moves until 50-move rule reset
   * - DTM provides more accurate resistance measurement
   *
   * @example
   * const move = await moveStrategyService.getLongestResistanceMove(fen);
   * if (move) {
   *   logger.info('Best defensive move:', move); // e.g., "e7e8"
   * }
   */
  async getLongestResistanceMove(fen: string): Promise<string | null> {
    try {
      // Get ALL moves efficiently with single API call
      const { tablebaseService } = await import("./TablebaseService");
      const topMoves = await tablebaseService.getTopMoves(fen, 100);

      if (
        !topMoves.isAvailable ||
        !topMoves.moves ||
        topMoves.moves.length === 0
      ) {
        logger.warn("No tablebase moves available for position", { fen });
        return null;
      }

      const moves = topMoves.moves;
      let selectedMove = moves[0];

      // Determine the position evaluation from the first move
      // wdl values: -2 (loss), 0 (draw), 2 (win) from side to move perspective
      const positionWdl = moves[0].wdl;

      if (positionWdl === 2) {
        // Position is winning - find the fastest win (lowest DTZ)
        let minDtz =
          selectedMove.dtz !== null && selectedMove.dtz !== undefined
            ? Math.abs(selectedMove.dtz)
            : Infinity;
        for (const move of moves) {
          if (move.wdl === 2 && move.dtz !== undefined && move.dtz !== null) {
            const absDtz = Math.abs(move.dtz);
            if (absDtz < minDtz) {
              minDtz = absDtz;
              selectedMove = move;
            }
          }
        }
        logger.debug("Selected fastest winning move", {
          move: selectedMove.san,
          dtz: selectedMove.dtz,
        });
      } else if (positionWdl === -2) {
        // Position is losing - find the longest resistance (highest DTM, not DTZ!)
        // DTM shows actual moves to mate, DTZ only shows moves to 50-move rule

        // Check if we have DTM values directly in the moves
        const movesWithDtm = moves.filter(
          (m) => m.wdl === -2 && m.dtm !== null && m.dtm !== undefined,
        );

        if (movesWithDtm.length > 0) {
          // We have DTM values - use them directly
          let maxDtm = Math.abs(movesWithDtm[0].dtm!);
          let maxDtz = Math.abs(movesWithDtm[0].dtz || 0);
          selectedMove = movesWithDtm[0];

          for (const move of movesWithDtm) {
            const absDtm = Math.abs(move.dtm!);
            const absDtz = Math.abs(move.dtz || 0);

            // Primary criterion: maximize DTM (delay mate as long as possible)
            if (absDtm > maxDtm) {
              maxDtm = absDtm;
              maxDtz = absDtz;
              selectedMove = move;
            }
            // Secondary criterion: if DTM is equal, maximize DTZ
            else if (absDtm === maxDtm && absDtz > maxDtz) {
              maxDtz = absDtz;
              selectedMove = move;
            }
          }
        } else {
          // No DTM values in moves - need to fetch DTM from resulting positions
          logger.debug(
            "No DTM values in moves, fetching from resulting positions",
          );

          // For now, fall back to DTZ-based selection
          let maxDtz = Math.abs(selectedMove.dtz || 0);

          for (const move of moves) {
            if (
              move.wdl === -2 &&
              move.dtz !== null &&
              move.dtz !== undefined
            ) {
              const absDtz = Math.abs(move.dtz);
              if (absDtz > maxDtz) {
                maxDtz = absDtz;
                selectedMove = move;
              }
            }
          }

          // Note: DTM values are only available for positions with ≤5 pieces
          // For 6-7 piece positions, we must use DTZ for resistance calculation
        }

        logger.debug("Selected longest resistance move", {
          move: selectedMove.san,
          dtm: selectedMove.dtm,
          dtz: selectedMove.dtz,
        });
      } else {
        // Position is drawn - maintain the draw
        const drawMove = moves.find((m) => m.wdl === 0);
        if (drawMove) {
          selectedMove = drawMove;
        }
        logger.debug("Selected draw maintaining move", {
          move: selectedMove.san,
        });
      }

      return selectedMove.uci;
    } catch (error) {
      logger.error("Failed to get longest resistance move", error as Error, {
        fen,
      });
      return null;
    }
  }

  /**
   * Select the objectively best move according to tablebase
   *
   * @param {string} fen - Current position in FEN notation
   * @returns {Promise<string|null>} Best move in UCI format, or null if unavailable
   *
   * @remarks
   * Uses tablebase's pre-sorted move list which orders by:
   * 1. WDL value (win > draw > loss)
   * 2. DTZ for tiebreaking (lower is better for wins)
   *
   * This is the "perfect play" strategy - always choosing the objectively best move.
   *
   * @example
   * const move = await moveStrategyService.getBestMove(fen);
   * logger.info('Tablebase says best is:', move); // e.g., "a7a8q"
   */
  async getBestMove(fen: string): Promise<string | null> {
    try {
      const { tablebaseService } = await import("./TablebaseService");
      const topMoves = await tablebaseService.getTopMoves(fen, 1);

      if (
        !topMoves.isAvailable ||
        !topMoves.moves ||
        topMoves.moves.length === 0
      ) {
        logger.warn("No tablebase moves available for position", { fen });
        return null;
      }

      // The API already returns moves sorted by best first
      return topMoves.moves[0].uci;
    } catch (error) {
      logger.error("Failed to get best move", error as Error, { fen });
      return null;
    }
  }

  /**
   * Select a move with human-like imperfection
   *
   * @param {string} fen - Current position in FEN notation
   * @param {number} [strength=0.8] - Playing strength from 0 to 1
   * @returns {Promise<string|null>} Selected move in UCI format, or null if unavailable
   *
   * @remarks
   * Simulates human play by occasionally choosing suboptimal moves:
   * - strength = 1.0: Always plays the best move (perfect play)
   * - strength = 0.8: 80% chance of best move, 20% chance of top-3 move
   * - strength = 0.5: 50% chance of best move, 50% chance of top-3 move
   * - strength = 0.0: Random selection from top-3 moves
   *
   * Useful for creating more realistic training opponents that make
   * occasional mistakes like human players.
   *
   * @example
   * // Medium strength opponent
   * const move = await moveStrategyService.getHumanLikeMove(fen, 0.7);
   *
   * // Very strong but not perfect
   * const move = await moveStrategyService.getHumanLikeMove(fen, 0.95);
   */
  async getHumanLikeMove(
    fen: string,
    strength: number = 0.8,
  ): Promise<string | null> {
    try {
      const { tablebaseService } = await import("./TablebaseService");
      const topMoves = await tablebaseService.getTopMoves(fen, 5);

      if (
        !topMoves.isAvailable ||
        !topMoves.moves ||
        topMoves.moves.length === 0
      ) {
        return null;
      }

      // With perfect strength, always play the best move
      if (strength >= 1) {
        return topMoves.moves[0].uci;
      }

      // Otherwise, occasionally pick a suboptimal move
      // Higher strength = higher chance of picking the best move
      const random = Math.random();
      if (random < strength) {
        return topMoves.moves[0].uci;
      }

      // Pick a random move from the top moves
      const moveIndex = Math.floor(
        Math.random() * Math.min(3, topMoves.moves.length),
      );
      return topMoves.moves[moveIndex].uci;
    } catch (error) {
      logger.error("Failed to get human-like move", error as Error, { fen });
      return null;
    }
  }
}

/**
 * Singleton instance of MoveStrategyService
 *
 * @remarks
 * Provides move selection strategies for chess training:
 * - `getLongestResistanceMove()`: Best defensive play
 * - `getBestMove()`: Objectively optimal move
 * - `getHumanLikeMove()`: Realistic opponent with configurable strength
 *
 * @example
 * import { moveStrategyService } from '@shared/services/MoveStrategyService';
 *
 * // For training opponent moves
 * const defenseMove = await moveStrategyService.getLongestResistanceMove(fen);
 *
 * // For showing best play
 * const bestMove = await moveStrategyService.getBestMove(fen);
 */
export const moveStrategyService = new MoveStrategyService();
