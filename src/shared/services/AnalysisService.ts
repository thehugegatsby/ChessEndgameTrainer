/**
 * Analysis Service - Common Logic for Position Analysis
 *
 * @remarks
 * This service encapsulates the shared logic for fetching and formatting
 * tablebase data, reducing duplication between hooks and store actions.
 */

// Note: Using direct service import for service-to-service integration
import { formatPositionAnalysis } from "../utils/positionAnalysisFormatter";
import { getLogger } from "./logging";
import type { PositionAnalysis } from "../types";

const logger = getLogger().setContext("AnalysisService");

/**
 * Analysis result with formatted data
 */
export interface AnalysisResult {
  evaluation: PositionAnalysis;
  rawTablebaseResult: {
    wdl: number;
    dtz: number | null;
    dtm: number | null;
    category: string;
  };
}

/**
 * Service for position analysis operations
 */
class AnalysisService {
  /**
   * Get complete position analysis with tablebase data
   *
   * @param fen - Position in FEN notation
   * @param moveLimit - Maximum number of moves to fetch (default: 5)
   * @returns Complete analysis result or null if no tablebase data
   *
   * @remarks
   * This method consolidates the logic previously duplicated between
   * usePositionAnalysis hook and requestPositionEvaluation action.
   * It makes two calls to tablebaseService but they're deduplicated
   * by the service's internal cache.
   */
  async getPositionAnalysis(
    fen: string,
    moveLimit: number = 5,
  ): Promise<AnalysisResult | null> {
    logger.info("Getting position analysis", {
      fen: fen.slice(0, 20) + "...",
      moveLimit,
    });

    // Get tablebase evaluation - this populates the cache
    const { tablebaseService } = await import("./TablebaseService");
    const tablebaseResult = await tablebaseService.getEvaluation(fen);

    if (!tablebaseResult.isAvailable || !tablebaseResult.result) {
      logger.debug("No tablebase data available for position");
      return null;
    }

    // Format tablebase result for display
    const displayData = formatPositionAnalysis(tablebaseResult.result);

    // Get top moves - this uses the cached data from the first call
    const topMoves = await tablebaseService.getTopMoves(fen, moveLimit);

    // Convert to PositionAnalysis format
    const evaluation: PositionAnalysis = {
      fen,
      evaluation: displayData.score,
      ...(displayData.isWin && tablebaseResult.result.dtz && {
        mateInMoves: Math.abs(tablebaseResult.result.dtz),
      }),
      tablebase: {
        isTablebasePosition: true,
        wdlAfter: tablebaseResult.result.wdl,
        category: tablebaseResult.result.category as "win" | "draw" | "loss",
        ...(tablebaseResult.result.dtz !== null && { dtz: tablebaseResult.result.dtz }),
        topMoves:
          topMoves.isAvailable && topMoves.moves
            ? topMoves.moves.map((move) => ({
                move: move.uci,
                san: move.san,
                dtz: move.dtz || 0,
                dtm: move.dtm || 0,
                wdl: move.wdl,
                category: move.category as "win" | "draw" | "loss",
              }))
            : [],
      },
    };

    logger.info("Analysis complete", {
      wdl: tablebaseResult.result.wdl,
      topMovesCount: evaluation.tablebase?.topMoves?.length,
    });

    return {
      evaluation,
      rawTablebaseResult: tablebaseResult.result,
    };
  }

  /**
   * Get position analysis or return empty evaluation
   *
   * @param fen - Position in FEN notation
   * @param moveLimit - Maximum number of moves to fetch
   * @returns Position analysis (empty if no tablebase data)
   */
  async getPositionAnalysisOrEmpty(
    fen: string,
    moveLimit: number = 5,
  ): Promise<PositionAnalysis> {
    const result = await this.getPositionAnalysis(fen, moveLimit);

    if (!result) {
      // Return empty evaluation when no tablebase data
      return {
        fen,
        evaluation: 0,
        // tablebase: undefined - omit instead of undefined
      };
    }

    return result.evaluation;
  }
}

/**
 * Singleton instance of AnalysisService
 */
export const analysisService = new AnalysisService();
