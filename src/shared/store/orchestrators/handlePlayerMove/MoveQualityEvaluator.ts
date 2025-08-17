/**
 * Move quality evaluator - compares moves against tablebase recommendations
 * @see docs/orchestrators/handlePlayerMove/MoveQualityEvaluator.md
 */

import type { ValidatedMove } from '@shared/types/chess';
import {
  tablebaseService,
  type TablebaseEvaluation,
  type TablebaseMovesResult,
} from '@domains/evaluation';
import type { TablebaseResult } from '@shared/types/tablebase';
import { getLogger } from '@shared/services/logging';
import { WdlAdapter } from '@shared/utils/tablebase/wdl';

/** Result of move quality evaluation */
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

const TOP_MOVES_LIMIT = 3;

const logger = getLogger().setContext('MoveQualityEvaluator');

/** TablebaseEvaluation with guaranteed result property */
type ValidatedTablebaseEvaluation = TablebaseEvaluation & {
  result: TablebaseResult;
};

/** TablebaseMovesResult with guaranteed moves array */
type ValidatedTablebaseMovesResult = TablebaseMovesResult & {
  moves: NonNullable<TablebaseMovesResult['moves']>;
};

/** Evaluates move quality using tablebase analysis */
export class MoveQualityEvaluator {
  /** Evaluates move quality against tablebase recommendations */
  async evaluateMoveQuality(
    fenBefore: string,
    fenAfter: string,
    validatedMove: ValidatedMove,
    trainingBaseline?: { wdl: number; fen: string } | null
  ): Promise<MoveQualityResult> {
    try {
      // Get evaluations before and after the move in parallel for better performance
      const [evalBefore, evalAfter] = await Promise.all([
        this.getEvaluation(fenBefore),
        this.getEvaluation(fenAfter),
      ]);

      // Check if both evaluations are available using type guards
      if (!this.hasValidResult(evalBefore) || !this.hasValidResult(evalAfter)) {
        logger.debug('[MoveQuality] Skipping evaluation - insufficient data:', {
          evalBeforeAvailable: evalBefore?.isAvailable,
          evalAfterAvailable: evalAfter?.isAvailable,
          hasBeforeResult: evalBefore && 'result' in evalBefore,
          hasAfterResult: evalAfter && 'result' in evalAfter,
        });

        return {
          shouldShowErrorDialog: false,
          wasOptimal: false, // Conservative - if we can't evaluate, don't assume optimal
          outcomeChanged: false,
        };
      }

      // TypeScript now knows that both evaluations have valid results
      const wdlBefore = evalBefore.result.wdl;
      const wdlAfter = evalAfter.result.wdl;

      logger.debug('[MoveQuality] Evaluating move quality:', {
        moveColor: validatedMove.color,
        moveSan: validatedMove.san,
        wdlBefore,
        wdlAfter,
        fenBefore: fenBefore.split(' ')[0], // Just board position
        fenAfter: fenAfter.split(' ')[0],
      });

      // Convert WDL values to player perspective
      const { wdlBeforeFromPlayerPerspective, wdlAfterFromPlayerPerspective } =
        this.convertToPlayerPerspective(wdlBefore, wdlAfter);

      // Determine effective baseline for comparison
      const effectiveWdlBefore = trainingBaseline?.wdl ?? wdlBeforeFromPlayerPerspective;

      logger.debug('[MoveQuality] WDL evaluation context:', {
        wdlBeforeFromPlayerPerspective,
        wdlAfterFromPlayerPerspective,
        trainingBaselineWdl: trainingBaseline?.wdl,
        effectiveWdlBefore,
        usingBaseline: Boolean(trainingBaseline),
      });

      // Get best moves for comparison
      const topMoves = await tablebaseService
        .getTopMoves(fenBefore, TOP_MOVES_LIMIT)
        .catch(() => ({ isAvailable: false, moves: [] }));

      // Check if the played move was one of the best moves
      const playedMoveWasBest = this.wasMoveBest(topMoves, validatedMove.san);

      this.logBestMovesComparison(topMoves, validatedMove.san, playedMoveWasBest);

      // Determine if outcome changed significantly - use baseline if available
      const outcomeChanged = WdlAdapter.didOutcomeChange(
        effectiveWdlBefore,
        wdlAfterFromPlayerPerspective
      );

      const shouldShowErrorDialog = !playedMoveWasBest && outcomeChanged;
      const bestMove =
        topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0 && topMoves.moves[0]
          ? topMoves.moves[0].san
          : undefined;

      if (shouldShowErrorDialog) {
        logger.info('[MoveQuality] Showing error dialog', {
          validatedMove: validatedMove.san,
          bestMove,
          outcomeChanged,
          effectiveWdlBefore,
          wdlAfterFromPlayerPerspective,
        });
      } else {
        logger.debug('[MoveQuality] No error dialog', {
          playedMoveWasBest,
          outcomeChanged,
          effectiveWdlBefore,
          wdlAfterFromPlayerPerspective,
        });
      }

      return {
        shouldShowErrorDialog,
        // Provide values from the original player's perspective for UI
        // Normalize -0 to 0 to avoid test assertion issues
        wdlBefore: wdlBeforeFromPlayerPerspective === 0 ? 0 : wdlBeforeFromPlayerPerspective,
        wdlAfter: wdlAfterFromPlayerPerspective === 0 ? 0 : wdlAfterFromPlayerPerspective,
        ...(bestMove !== undefined && { bestMove }),
        wasOptimal: playedMoveWasBest,
        outcomeChanged,
      };
    } catch (error) {
      getLogger().error('Move quality evaluation failed:', error);
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
    return await tablebaseService.getEvaluation(fen).catch(() => ({ isAvailable: false }));
  }

  /**
   * Type guard to check if a single evaluation has a valid result
   */
  private hasValidResult(
    evaluation: TablebaseEvaluation
  ): evaluation is ValidatedTablebaseEvaluation {
    return evaluation.isAvailable && 'result' in evaluation && Boolean(evaluation.result);
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
  private convertToPlayerPerspective(
    wdlBefore: number,
    wdlAfter: number
  ): { wdlBeforeFromPlayerPerspective: number; wdlAfterFromPlayerPerspective: number } {
    return WdlAdapter.convertToPlayerPerspective(wdlBefore, wdlAfter);
  }

  /**
   * Type guard to check if TablebaseMovesResult has valid moves
   */
  private hasValidMoves(topMoves: TablebaseMovesResult): topMoves is ValidatedTablebaseMovesResult {
    return (
      topMoves.isAvailable &&
      Boolean(topMoves.moves) &&
      topMoves.moves !== undefined &&
      topMoves.moves.length > 0
    );
  }

  /**
   * Checks if the played move was among the best moves
   */
  private wasMoveBest(topMoves: TablebaseMovesResult, playedMoveSan: string): boolean {
    if (!this.hasValidMoves(topMoves)) {
      return false;
    }
    // TypeScript now knows that topMoves.moves is a non-empty array
    return topMoves.moves.some(m => m.san === playedMoveSan);
  }

  /**
   * Logs best moves comparison for debugging
   */
  private logBestMovesComparison(
    topMoves: TablebaseMovesResult,
    playedMoveSan: string,
    playedMoveWasBest: boolean
  ): void {
    logger.debug('[MoveQuality] Best moves check:');
    logger.debug('  topMovesAvailable:', topMoves.isAvailable);
    logger.debug('  bestMoves:', JSON.stringify(topMoves.moves?.map(m => m.san)));
    logger.debug('  playedMove:', playedMoveSan);
    logger.debug('  playedMoveWasBest:', playedMoveWasBest);

    // Debug each move comparison
    if (topMoves.moves) {
      logger.debug('  Comparing each move:');
      topMoves.moves.forEach((m, i) => {
        logger.debug(
          `    Move ${i}: "${m.san}" === "${playedMoveSan}" ? ${m.san === playedMoveSan}`
        );
      });
    }
  }
}
