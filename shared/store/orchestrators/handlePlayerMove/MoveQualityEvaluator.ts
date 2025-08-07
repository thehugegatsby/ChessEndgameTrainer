/**
 * @file Move quality evaluation module
 * @module store/orchestrators/handlePlayerMove/MoveQualityEvaluator
 *
 * @description
 * Evaluates chess move quality using tablebase analysis.
 * Compares player moves against optimal tablebase recommendations to determine
 * if moves are suboptimal and warrant user feedback through error dialogs.
 *
 * @remarks
 * Key features:
 * - Parallel tablebase API calls for performance
 * - WDL (Win/Draw/Loss) perspective conversion for accurate evaluation
 * - Best move comparison against top 3 tablebase recommendations
 * - Outcome change detection (Win->Draw/Loss, Draw->Loss)
 * - Comprehensive logging for debugging move evaluation logic
 *
 * @example
 * ```typescript
 * const evaluator = new MoveQualityEvaluator();
 * const result = await evaluator.evaluateMoveQuality(
 *   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
 *   "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
 *   { from: "e2", to: "e4", san: "e4", color: "w" }
 * );
 * if (result.shouldShowErrorDialog) {
 *   // Show error dialog to user
 * }
 * ```
 */

import type { ValidatedMove } from "@shared/types/chess";
import {
  tablebaseService,
  type TablebaseEvaluation,
  type TablebaseMovesResult,
} from "@shared/services/TablebaseService";
import { getLogger } from "@shared/services/logging";

/**
 * Result of move quality evaluation containing recommendation data
 * @interface MoveQualityResult
 */
export interface MoveQualityResult {
  /** Whether to display an error dialog to the user */
  shouldShowErrorDialog: boolean;
  /** WDL value before the move (from white's perspective) */
  wdlBefore?: number;
  /** WDL value after the move (from white's perspective) */
  wdlAfter?: number;
  /** Best recommended move in algebraic notation */
  bestMove?: string;
  /** Whether the played move was among the optimal moves */
  wasOptimal: boolean;
  /** Whether the move significantly changed the game outcome */
  outcomeChanged: boolean;
}

/** Number of top moves to fetch from tablebase for comparison */
const TOP_MOVES_LIMIT = 3;

/**
 * Evaluates chess move quality using advanced tablebase analysis
 * @class MoveQualityEvaluator
 *
 * @description
 * Provides comprehensive move quality assessment including:
 * - Tablebase evaluation comparison (before/after positions)
 * - WDL perspective conversion for accurate player-centric evaluation
 * - Best move detection using top tablebase recommendations
 * - Outcome change analysis (Win/Draw/Loss transitions)
 * - Performance-optimized parallel API calls
 * - Detailed logging for debugging evaluation decisions
 *
 * @remarks
 * The evaluator uses sophisticated logic to determine when to show error dialogs:
 * 1. Move must NOT be among the top 3 tablebase recommendations
 * 2. Move must cause a significant outcome change (Win->Draw/Loss or Draw->Loss)
 *
 * WDL (Win/Draw/Loss) values are handled carefully:
 * - Tablebase returns values from white's perspective
 * - Values are converted to moving player's perspective
 * - After a move, evaluation is from opponent's perspective
 *
 * @example
 * ```typescript
 * const evaluator = new MoveQualityEvaluator();
 *
 * // Evaluate a potentially suboptimal move
 * const result = await evaluator.evaluateMoveQuality(
 *   fenBefore,
 *   fenAfter,
 *   playedMove
 * );
 *
 * if (result.shouldShowErrorDialog) {
 *   console.log(`Suboptimal move! Best was: ${result.bestMove}`);
 *   console.log(`WDL change: ${result.wdlBefore} -> ${result.wdlAfter}`);
 * }
 * ```
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
    validatedMove: ValidatedMove,
  ): Promise<MoveQualityResult> {
    try {
      // Get evaluations before and after the move in parallel for better performance
      const [evalBefore, evalAfter] = await Promise.all([
        this.getEvaluation(fenBefore),
        this.getEvaluation(fenAfter),
      ]);

      // Check if both evaluations are available
      if (!this.areEvaluationsValid(evalBefore, evalAfter)) {
        getLogger().debug(
          "[MoveQuality] Skipping evaluation - insufficient data:",
          {
            evalBeforeAvailable: evalBefore?.isAvailable,
            evalAfterAvailable: evalAfter?.isAvailable,
            hasBeforeResult: evalBefore && "result" in evalBefore,
            hasAfterResult: evalAfter && "result" in evalAfter,
          },
        );

        return {
          shouldShowErrorDialog: false,
          wasOptimal: false, // Conservative - if we can't evaluate, don't assume optimal
          outcomeChanged: false,
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
        this.convertToPlayerPerspective(
          wdlBefore,
          wdlAfter,
          validatedMove.color,
        );

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

      this.logBestMovesComparison(
        topMoves,
        validatedMove.san,
        playedMoveWasBest,
      );

      // Determine if outcome changed significantly
      const outcomeChanged = this.didOutcomeChange(
        wdlBeforeFromPlayerPerspective,
        wdlAfterFromPlayerPerspective,
      );

      this.logDecisionValues(
        outcomeChanged,
        playedMoveWasBest,
        wdlBeforeFromPlayerPerspective,
        wdlAfterFromPlayerPerspective,
      );

      const shouldShowErrorDialog = !playedMoveWasBest && outcomeChanged;
      const bestMove = this.getBestMove(topMoves);

      if (shouldShowErrorDialog) {
        getLogger().info(
          "[MoveQuality] Move quality issue detected - suggesting error dialog",
        );
      }

      return {
        shouldShowErrorDialog,
        wdlBefore,
        wdlAfter,
        bestMove,
        wasOptimal: playedMoveWasBest,
        outcomeChanged,
      };
    } catch (error) {
      getLogger().error("Move quality evaluation failed:", error);
      return {
        shouldShowErrorDialog: false,
        wasOptimal: false, // Conservative - don't assume optimal on evaluation failure
        outcomeChanged: false,
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
  private areEvaluationsValid(
    evalBefore: TablebaseEvaluation,
    evalAfter: TablebaseEvaluation,
  ): boolean {
    return (
      evalBefore.isAvailable &&
      evalAfter.isAvailable &&
      "result" in evalBefore &&
      "result" in evalAfter &&
      !!evalBefore.result &&
      !!evalAfter.result
    );
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
    movedColor: "w" | "b",
  ) {
    // Convert WDL to player's perspective consistently
    const wdlBeforeFromPlayerPerspective =
      movedColor === "w" ? wdlBefore : -wdlBefore;

    // After the move, it's the opponent's turn, so we need to invert
    const wdlAfterFromPlayerPerspective =
      movedColor === "w" ? -wdlAfter : wdlAfter;

    return { wdlBeforeFromPlayerPerspective, wdlAfterFromPlayerPerspective };
  }

  /**
   * Checks if the played move was among the best moves
   */
  private wasMoveBest(
    topMoves: TablebaseMovesResult,
    playedMoveSan: string,
  ): boolean {
    return !!(
      topMoves.isAvailable &&
      topMoves.moves &&
      topMoves.moves.some((m) => m.san === playedMoveSan)
    );
  }

  /**
   * Determines if the move outcome changed significantly
   */
  private didOutcomeChange(
    wdlBeforeFromPlayerPerspective: number,
    wdlAfterFromPlayerPerspective: number,
  ): boolean {
    return (
      (wdlBeforeFromPlayerPerspective > 0 &&
        wdlAfterFromPlayerPerspective <= 0) || // Win -> Draw/Loss
      (wdlBeforeFromPlayerPerspective === 0 &&
        wdlAfterFromPlayerPerspective < 0)
    ); // Draw -> Loss
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
  private logBestMovesComparison(
    topMoves: TablebaseMovesResult,
    playedMoveSan: string,
    playedMoveWasBest: boolean,
  ): void {
    getLogger().debug("[MoveQuality] Best moves check:");
    getLogger().debug("  topMovesAvailable:", topMoves.isAvailable);
    getLogger().debug(
      "  bestMoves:",
      JSON.stringify(topMoves.moves?.map((m) => m.san)),
    );
    getLogger().debug("  playedMove:", playedMoveSan);
    getLogger().debug("  playedMoveWasBest:", playedMoveWasBest);

    // Debug each move comparison
    if (topMoves.moves) {
      getLogger().debug("  Comparing each move:");
      topMoves.moves.forEach((m, i) => {
        getLogger().debug(
          `    Move ${i}: "${m.san}" === "${playedMoveSan}" ? ${m.san === playedMoveSan}`,
        );
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
    wdlAfterFromPlayerPerspective: number,
  ): void {
    getLogger().debug("[MoveQuality] DECISION VALUES:");
    getLogger().debug("  outcomeChanged:", outcomeChanged);
    getLogger().debug("  playedMoveWasBest:", playedMoveWasBest);
    getLogger().debug(
      "  wdlBeforeFromPlayerPerspective:",
      wdlBeforeFromPlayerPerspective,
    );
    getLogger().debug(
      "  wdlAfterFromPlayerPerspective:",
      wdlAfterFromPlayerPerspective,
    );
    getLogger().debug("  showDialog:", !playedMoveWasBest && outcomeChanged);
  }
}
