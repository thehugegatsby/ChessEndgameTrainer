/**
 * Smart evaluation that prioritizes tablebase comparison over engine evaluation
 */

import { getMoveQualityByTablebaseComparison } from './tablebaseHelpers';
import { getMoveQualityDisplay } from './displayHelpers';

export interface MoveEvaluation {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: {
    isTablebasePosition: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    category?: string;
  };
}

/**
 * Smart evaluation function that prioritizes tablebase comparison over engine evaluation
 * @param evaluation - The move evaluation data
 * @param isWhite - Whether the player is white
 * @param moveIndex - The index of the move (for future use)
 * @returns The evaluation display data
 */
export const getSmartMoveEvaluation = (
  evaluation: MoveEvaluation, 
  isWhite: boolean, 
  moveIndex: number
) => {
  // Priority 1: Use tablebase comparison if available
  if (evaluation.tablebase?.isTablebasePosition && 
      evaluation.tablebase.wdlBefore !== undefined && 
      evaluation.tablebase.wdlAfter !== undefined) {
    
    return getMoveQualityByTablebaseComparison(
      evaluation.tablebase.wdlBefore,
      evaluation.tablebase.wdlAfter,
      isWhite ? 'w' : 'b'
    );
  }
  
  // Priority 2: Fallback to engine evaluation
  return getMoveQualityDisplay(evaluation.evaluation, evaluation.mateInMoves, isWhite);
};