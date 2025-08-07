/**
 * @file Move quality evaluation module
 * @module store/orchestrators/handlePlayerMove/MoveQualityEvaluator
 * 
 * @description
 * Evaluates chess move quality using tablebase analysis.
 * Compares player moves against optimal tablebase recommendations.
 */

import type { Move as ChessJsMove } from "chess.js";
import { tablebaseService, type TablebaseEvaluation, type TablebaseMovesResult } from "@shared/services/TablebaseService";
import { getLogger } from "@shared/services/logging";

export interface MoveQualityResult {
  shouldShowErrorDialog: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  bestMove?: string;
  wasOptimal: boolean;
  outcomeChanged: boolean;
}

/** Number of top moves to fetch for comparison */
const TOP_MOVES_LIMIT = 3;

/**
 * Evaluates chess move quality using tablebase analysis
 */
export class MoveQualityEvaluator {
  
  /**
   * Evaluates the quality of a played move against tablebase recommendations
   * 
   * @param fenBefore - FEN position before the move
   * @param fenAfter - FEN position after the move  
   * @param validatedMove - The move that was played
   * @returns Quality evaluation result
   */
  async evaluateMoveQuality(
    fenBefore: string,
    fenAfter: string,
    validatedMove: ChessJsMove
  ): Promise<MoveQualityResult> {
    try {
      // Get evaluations before and after the move in parallel for better performance
      const [evalBefore, evalAfter] = await Promise.all([
        this.getEvaluation(fenBefore),
        this.getEvaluation(fenAfter)
      ]);

      // Check if both evaluations are available
      if (!this.areEvaluationsValid(evalBefore, evalAfter)) {
        getLogger().debug("[MoveQuality] Skipping evaluation - insufficient data:", {
          evalBeforeAvailable: evalBefore?.isAvailable,
          evalAfterAvailable: evalAfter?.isAvailable,
          hasBeforeResult: evalBefore && "result" in evalBefore,
          hasAfterResult: evalAfter && "result" in evalAfter,
        });
        
        return {
          shouldShowErrorDialog: false,
          wasOptimal: false, // Conservative - if we can't evaluate, don't assume optimal
          outcomeChanged: false
        };
      }

      const wdlBefore = evalBefore.result!.wdl;
      const wdlAfter = evalAfter.result!.wdl;

      getLogger().debug("[MoveQuality] Evaluating move quality:", {
        moveColor: validatedMove.color,
        moveSan: validatedMove.san,
        wdlBefore,
        wdlAfter,
        fenBefore: fenBefore.split(" ")[0], // Just board position
        fenAfter: fenAfter.split(" ")[0],
      });

      // Convert WDL values to player perspective
      const { wdlBeforeFromPlayerPerspective, wdlAfterFromPlayerPerspective } = 
        this.convertToPlayerPerspective(wdlBefore, wdlAfter, validatedMove.color);

      getLogger().debug("[MoveQuality] WDL from player perspective:", {
        wdlBeforeFromPlayerPerspective,
        wdlAfterFromPlayerPerspective,
      });

      // Get best moves for comparison
      const topMoves = await tablebaseService
        .getTopMoves(fenBefore, TOP_MOVES_LIMIT)
        .catch(() => ({ isAvailable: false, moves: [] }));

      // Check if the played move was one of the best moves
      const playedMoveWasBest = this.wasMoveBest(topMoves, validatedMove.san);
      
      this.logBestMovesComparison(topMoves, validatedMove.san, playedMoveWasBest);

      // Determine if outcome changed significantly
      const outcomeChanged = this.didOutcomeChange(
        wdlBeforeFromPlayerPerspective, 
        wdlAfterFromPlayerPerspective
      );

      this.logDecisionValues(
        outcomeChanged,
        playedMoveWasBest,
        wdlBeforeFromPlayerPerspective,
        wdlAfterFromPlayerPerspective
      );

      const shouldShowErrorDialog = !playedMoveWasBest && outcomeChanged;
      const bestMove = this.getBestMove(topMoves);

      if (shouldShowErrorDialog) {
        getLogger().info("[MoveQuality] Move quality issue detected - suggesting error dialog");
      }

      return {
        shouldShowErrorDialog,
        wdlBefore,
        wdlAfter,
        bestMove,
        wasOptimal: playedMoveWasBest,
        outcomeChanged
      };

    } catch (error) {
      getLogger().error("Move quality evaluation failed:", error);
      return {
        shouldShowErrorDialog: false,
        wasOptimal: false, // Conservative - don't assume optimal on evaluation failure
        outcomeChanged: false
      };
    }
  }

  /**
   * Gets tablebase evaluation for a position with error handling
   */
  private async getEvaluation(fen: string): Promise<TablebaseEvaluation> {
    return await tablebaseService
      .getEvaluation(fen)
      .catch(() => ({ isAvailable: false }));
  }

  /**
   * Validates that both evaluations are available and have results
   */
  private areEvaluationsValid(evalBefore: TablebaseEvaluation, evalAfter: TablebaseEvaluation): boolean {
    return evalBefore.isAvailable &&
           evalAfter.isAvailable &&
           "result" in evalBefore &&
           "result" in evalAfter &&
           !!evalBefore.result &&
           !!evalAfter.result;
  }

  /**
   * Converts WDL values to player perspective
   * 
   * @remarks
   * WDL values are from white's perspective:
   * - Positive = good for white, Negative = good for black
   * After white moves, it's black's turn, so evaluation perspective needs careful handling
   */
  private convertToPlayerPerspective(
    wdlBefore: number, 
    wdlAfter: number, 
    movedColor: 'w' | 'b'
  ) {
    // Convert WDL to player's perspective consistently
    const wdlBeforeFromPlayerPerspective = movedColor === "w" ? wdlBefore : -wdlBefore;
    
    // After the move, it's the opponent's turn, so we need to invert
    const wdlAfterFromPlayerPerspective = movedColor === "w" ? -wdlAfter : wdlAfter;
    
    return { wdlBeforeFromPlayerPerspective, wdlAfterFromPlayerPerspective };
  }

  /**
   * Checks if the played move was among the best moves
   */
  private wasMoveBest(topMoves: TablebaseMovesResult, playedMoveSan: string): boolean {
    return topMoves.isAvailable &&
           topMoves.moves &&
           topMoves.moves.some((m) => m.san === playedMoveSan);
  }

  /**
   * Determines if the move outcome changed significantly
   */
  private didOutcomeChange(wdlBeforeFromPlayerPerspective: number, wdlAfterFromPlayerPerspective: number): boolean {
    return (wdlBeforeFromPlayerPerspective > 0 && wdlAfterFromPlayerPerspective <= 0) || // Win -> Draw/Loss
           (wdlBeforeFromPlayerPerspective === 0 && wdlAfterFromPlayerPerspective < 0);   // Draw -> Loss
  }

  /**
   * Gets the best move from top moves result
   */
  private getBestMove(topMoves: TablebaseMovesResult): string | undefined {
    return topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0
      ? topMoves.moves[0].san
      : undefined;
  }

  /**
   * Logs best moves comparison for debugging
   */
  private logBestMovesComparison(topMoves: TablebaseMovesResult, playedMoveSan: string, playedMoveWasBest: boolean): void {
    getLogger().debug("[MoveQuality] Best moves check:");
    getLogger().debug("  topMovesAvailable:", topMoves.isAvailable);
    getLogger().debug("  bestMoves:", JSON.stringify(topMoves.moves?.map((m) => m.san)));
    getLogger().debug("  playedMove:", playedMoveSan);
    getLogger().debug("  playedMoveWasBest:", playedMoveWasBest);

    // Debug each move comparison
    if (topMoves.moves) {
      getLogger().debug("  Comparing each move:");
      topMoves.moves.forEach((m, i) => {
        getLogger().debug(`    Move ${i}: "${m.san}" === "${playedMoveSan}" ? ${m.san === playedMoveSan}`);
      });
    }
  }

  /**
   * Logs decision values for debugging
   */
  private logDecisionValues(
    outcomeChanged: boolean,
    playedMoveWasBest: boolean,
    wdlBeforeFromPlayerPerspective: number,
    wdlAfterFromPlayerPerspective: number
  ): void {
    getLogger().debug("[MoveQuality] DECISION VALUES:");
    getLogger().debug("  outcomeChanged:", outcomeChanged);
    getLogger().debug("  playedMoveWasBest:", playedMoveWasBest);
    getLogger().debug("  wdlBeforeFromPlayerPerspective:", wdlBeforeFromPlayerPerspective);
    getLogger().debug("  wdlAfterFromPlayerPerspective:", wdlAfterFromPlayerPerspective);
    getLogger().debug("  showDialog:", !playedMoveWasBest && outcomeChanged);
  }
}