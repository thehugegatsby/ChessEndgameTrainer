/**
 * Smart evaluation that prioritizes tablebase comparison over engine evaluation
 * SIMPLIFIED: Removed overengineered tablebase helpers
 */

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
  _moveIndex: number
) => {
  // SIMPLIFIED: Just use engine evaluation for now
  // TODO: Re-implement tablebase comparison if needed with simplified approach
  return getMoveQualityDisplay(evaluation.evaluation, evaluation.mateInMoves, isWhite);
};