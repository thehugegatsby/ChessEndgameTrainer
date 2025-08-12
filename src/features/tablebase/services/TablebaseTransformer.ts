/**
 * TablebaseTransformer - Critical Perspective Normalization
 * 
 * This transformer handles the complex perspective switching between
 * the Lichess API (always from White's perspective) and our domain
 * model (always from the player-to-move's perspective).
 * 
 * CRITICAL: This is the most important part of the tablebase service!
 * The API gives all evaluations from White's perspective, but we need
 * to show them from the perspective of whoever is to move.
 */

import type {
  TablebaseTransformerInterface,
  TablebaseApiResponse,
  TablebaseEvaluation,
  TablebaseOutcome,
} from '../types/interfaces';
import { FenUtils, WdlUtils } from '../types/models';

export class TablebaseTransformer implements TablebaseTransformerInterface {
  /**
   * Normalize position evaluation to the player's perspective
   * 
   * @param apiData - Raw API response (White's perspective)
   * @param fen - Current position
   * @returns Evaluation from the perspective of the player to move
   * 
   * @example
   * // White to move, White wins (wdl=2)
   * normalizePositionEvaluation({wdl: 2, ...}, "xxx w xxx") 
   * // Returns: { outcome: 'win', ... }
   * 
   * // Black to move, White wins (wdl=2) 
   * normalizePositionEvaluation({wdl: 2, ...}, "xxx b xxx")
   * // Returns: { outcome: 'loss', ... } (loss for Black!)
   */
  normalizePositionEvaluation(
    apiData: TablebaseApiResponse,
    fen: string
  ): TablebaseEvaluation {
    const isBlackToMove = FenUtils.isBlackToMove(fen);
    
    // API gives WDL from White's perspective
    // For Black, we need to invert it
    let normalizedWdl = apiData.wdl;
    
    if (isBlackToMove) {
      normalizedWdl = WdlUtils.invert(normalizedWdl);
    }
    
    // Now WDL is from the perspective of the player to move
    const outcome = WdlUtils.toOutcome(normalizedWdl);
    
    return {
      outcome,
      dtm: apiData.dtm ?? undefined,
      dtz: apiData.dtz ?? undefined,
    };
  }

  /**
   * Normalize move evaluation to the player's perspective
   * 
   * CRITICAL: This has DIFFERENT logic than position evaluation!
   * The API gives the evaluation AFTER the move (from White's perspective).
   * We need the evaluation from the perspective of the player MAKING the move.
   * 
   * @param moveWdl - WDL after the move from White's perspective
   * @param isBlackToMove - Whether Black is making the move
   * @returns Outcome from the mover's perspective
   * 
   * @example
   * // White moves, position is winning for White after (wdl=2)
   * // This means White made a GOOD move
   * normalizeMoveEvaluation(2, false) // Returns: 'win'
   * 
   * // White moves, position is losing for White after (wdl=-2)
   * // This means White made a BAD move  
   * normalizeMoveEvaluation(-2, false) // Returns: 'loss'
   * 
   * // Black moves, position is winning for White after (wdl=2)
   * // This means Black made a BAD move (good for White = bad for Black)
   * normalizeMoveEvaluation(2, true) // Returns: 'loss'
   * 
   * // Black moves, position is losing for White after (wdl=-2)
   * // This means Black made a GOOD move (bad for White = good for Black)
   * normalizeMoveEvaluation(-2, true) // Returns: 'win'
   */
  normalizeMoveEvaluation(
    moveWdl: number,
    isBlackToMove: boolean
  ): TablebaseOutcome {
    // CRITICAL: Different logic than position evaluation!
    // API gives evaluation AFTER the move (opponent's turn, White's perspective)
    
    // For White's moves:
    // - If position is good for White after, it's a good move for White
    // - If position is bad for White after, it's a bad move for White
    
    // For Black's moves:
    // - If position is good for White after, it's a bad move for Black
    // - If position is bad for White after, it's a good move for Black
    
    let normalizedWdl: number;
    
    if (isBlackToMove) {
      // Black's move: invert because good for White = bad for Black
      normalizedWdl = WdlUtils.invert(moveWdl);
    } else {
      // White's move: use as-is
      normalizedWdl = moveWdl;
    }
    
    return WdlUtils.toOutcome(normalizedWdl);
  }

  /**
   * Validate FEN before processing
   * @throws {TablebaseError} if FEN is invalid
   */
  validateFen(fen: string): void {
    if (!fen) {
      throw new Error('FEN is required');
    }
    
    if (!FenUtils.isValid(fen)) {
      throw new Error(`Invalid FEN format: ${fen}`);
    }
    
    const pieceCount = FenUtils.countPieces(fen);
    if (pieceCount > 7) {
      throw new Error(`Too many pieces for tablebase (${pieceCount} > 7)`);
    }
  }
}

// Export singleton instance
export const tablebaseTransformer = new TablebaseTransformer();