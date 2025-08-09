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
import { WdlAdapter } from "@shared/utils/tablebase/wdl";

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
   * @param trainingBaseline - Optional evaluation baseline for training context
   * @returns Quality evaluation result
   */
  async evaluateMoveQuality(
    fenBefore: string,
    fenAfter: string,
    validatedMove: ValidatedMove,
    trainingBaseline?: { wdl: number; fen: string } | null,
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
        this.convertToPlayerPerspective(wdlBefore, wdlAfter);

      // Determine effective baseline for comparison
      const effectiveWdlBefore = this.determineEffectiveBaseline(
        trainingBaseline,
        wdlBeforeFromPlayerPerspective
      );

      getLogger().debug("[MoveQuality] WDL evaluation context:", {
        wdlBeforeFromPlayerPerspective,
        wdlAfterFromPlayerPerspective,
        trainingBaselineWdl: trainingBaseline?.wdl,
        effectiveWdlBefore,
        usingBaseline: !!trainingBaseline,
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

      // Determine if outcome changed significantly - use baseline if available
      const outcomeChanged = this.didOutcomeChange(
        effectiveWdlBefore,
        wdlAfterFromPlayerPerspective,
      );

      this.logDecisionValues(
        outcomeChanged,
        playedMoveWasBest,
        effectiveWdlBefore,
        wdlAfterFromPlayerPerspective,
      );

      const shouldShowErrorDialog = this.shouldShowErrorDialog(
        playedMoveWasBest,
        outcomeChanged
      );
      const bestMove = this.getBestMove(topMoves);

      getLogger().info("[MoveQuality] Decision to show error dialog:", {
        shouldShowErrorDialog,
        playedMoveWasBest,
        outcomeChanged,
        effectiveWdlBefore,
        wdlAfterFromPlayerPerspective,
        usingBaseline: !!trainingBaseline,
        validatedMove: validatedMove.san,
        bestMove,
      });

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
    return this.hasValidResult(evalBefore) && this.hasValidResult(evalAfter);
  }

  /**
   * Checks if a single evaluation has a valid result
   */
  private hasValidResult(evaluation: TablebaseEvaluation): boolean {
    return (
      evaluation.isAvailable &&
      "result" in evaluation &&
      !!evaluation.result
    );
  }

  /**
   * Converts WDL values from the Lichess Tablebase API to a consistent perspective
   * for the player who just moved.
   *
   * @remarks
   * The Lichess Tablebase API returns WDL from the perspective of the side whose turn it is
   * (the side-to-move perspective). This is standard behavior for chess tablebases and engines.
   *
   * - `wdlBefore`: The WDL score before the move was made. This is from the perspective
   *   of the player making the move (they were the side-to-move).
   * - `wdlAfter`: The WDL score after the move was made. The turn has now passed to the
   *   opponent, so this score is from the opponent's perspective.
   *
   * Therefore, to maintain the original player's perspective for comparison:
   * - `wdlBefore` needs no conversion (already from player's perspective)
   * - `wdlAfter` must be negated (convert from opponent's to player's perspective)
   *
   * @param wdlBefore The WDL score for the position before the move
   * @param wdlAfter The WDL score for the position after the move
   * @returns An object with both WDL values from the original player's perspective
   *
   * @example
   * // Black plays a losing move (Kd7 instead of drawing Ke7)
   * // wdlBefore = 0 (draw from Black's perspective as side-to-move)
   * // wdlAfter = 1000 (win from White's perspective as side-to-move)
   * // Returns: { wdlBeforeFromPlayerPerspective: 0, wdlAfterFromPlayerPerspective: -1000 }
   * // This correctly shows Black went from draw (0) to loss (-1000)
   */
  private convertToPlayerPerspective(wdlBefore: number, wdlAfter: number) {
    return WdlAdapter.convertToPlayerPerspective(wdlBefore, wdlAfter);
  }

  /**
   * Checks if the played move was among the best moves
   */
  private wasMoveBest(
    topMoves: TablebaseMovesResult,
    playedMoveSan: string,
  ): boolean {
    if (!this.hasAvailableMoves(topMoves)) {
      return false;
    }
    return topMoves.moves!.some((m) => m.san === playedMoveSan);
  }

  /**
   * Checks if tablebase moves are available
   */
  private hasAvailableMoves(topMoves: TablebaseMovesResult): boolean {
    return topMoves.isAvailable && !!topMoves.moves && topMoves.moves.length > 0;
  }

  /**
   * Determines if the move outcome changed significantly
   */
  private didOutcomeChange(
    wdlBeforeFromPlayerPerspective: number,
    wdlAfterFromPlayerPerspective: number,
  ): boolean {
    return WdlAdapter.didOutcomeChange(wdlBeforeFromPlayerPerspective, wdlAfterFromPlayerPerspective);
  }

  /**
   * Checks if a winning position turned into a draw or loss
   */
  private isWinToDrawOrLoss(wdlBefore: number, wdlAfter: number): boolean {
    return WdlAdapter.isWinToDrawOrLoss(wdlBefore, wdlAfter);
  }

  /**
   * Checks if a drawn position turned into a loss
   */
  private isDrawToLoss(wdlBefore: number, wdlAfter: number): boolean {
    return WdlAdapter.isDrawToLoss(wdlBefore, wdlAfter);
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
    getLogger().info("[MoveQuality] Best moves check:");
    getLogger().info("  topMovesAvailable:", topMoves.isAvailable);
    getLogger().info(
      "  bestMoves:",
      JSON.stringify(topMoves.moves?.map((m) => m.san)),
    );
    getLogger().info("  playedMove:", playedMoveSan);
    getLogger().info("  playedMoveWasBest:", playedMoveWasBest);

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
   * Determines the effective baseline for comparison
   */
  private determineEffectiveBaseline(
    trainingBaseline: { wdl: number; fen: string } | null | undefined,
    wdlBeforeFromPlayerPerspective: number
  ): number {
    return trainingBaseline?.wdl ?? wdlBeforeFromPlayerPerspective;
  }

  /**
   * Determines if error dialog should be shown based on move quality
   */
  private shouldShowErrorDialog(
    playedMoveWasBest: boolean,
    outcomeChanged: boolean
  ): boolean {
    return !playedMoveWasBest && outcomeChanged;
  }

  /**
   * Logs decision values for debugging
   */
  private logDecisionValues(
    outcomeChanged: boolean,
    playedMoveWasBest: boolean,
    effectiveWdlBefore: number,
    wdlAfterFromPlayerPerspective: number,
  ): void {
    getLogger().debug("[MoveQuality] DECISION VALUES:");
    getLogger().debug("  outcomeChanged:", outcomeChanged);
    getLogger().debug("  playedMoveWasBest:", playedMoveWasBest);
    getLogger().debug(
      "  effectiveWdlBefore:",
      effectiveWdlBefore,
    );
    getLogger().debug(
      "  wdlAfterFromPlayerPerspective:",
      wdlAfterFromPlayerPerspective,
    );
    getLogger().debug("  showDialog:", !playedMoveWasBest && outcomeChanged);
  }
}
