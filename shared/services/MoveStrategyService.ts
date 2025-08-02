import { tablebaseService } from "./TablebaseService";
import { getLogger } from "./logging";

const logger = getLogger().setContext("MoveStrategyService");

/**
 * Service for chess move selection strategies.
 * Encapsulates the logic for choosing moves based on different criteria.
 */
class MoveStrategyService {
  /**
   * Selects the move that provides the longest resistance in a lost position.
   * For losing positions, chooses the move with the highest DTZ (Distance to Zero).
   * For drawn positions, maintains the draw.
   * For winning positions, plays the fastest win.
   *
   * @param fen - The current position in FEN notation
   * @returns The selected move or null if no moves available
   */
  async getLongestResistanceMove(fen: string): Promise<string | null> {
    try {
      const topMoves = await tablebaseService.getTopMoves(fen, 10);

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

          // TODO: Implement fetching DTM values from resulting positions
          // This would require making additional API calls for each possible move
          // to get the DTM value of the resulting position
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
   * Selects the objectively best move.
   * Prioritizes by WDL (win > draw > loss), then by DTZ.
   *
   * @param fen - The current position in FEN notation
   * @returns The selected move or null if no moves available
   */
  async getBestMove(fen: string): Promise<string | null> {
    try {
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
   * Selects a move that mimics human-like play.
   * Can introduce occasional suboptimal moves for realism.
   *
   * @param fen - The current position in FEN notation
   * @param strength - Playing strength (0-1, where 1 is perfect play)
   * @returns The selected move or null if no moves available
   */
  async getHumanLikeMove(
    fen: string,
    strength: number = 0.8,
  ): Promise<string | null> {
    try {
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

export /**
 *
 */
const moveStrategyService = new MoveStrategyService();
