/**
 * Smart evaluation that prioritizes tablebase comparison over engine evaluation
 * SIMPLIFIED: Removed overengineered tablebase helpers
 */

import { getMoveQualityDisplay } from "./displayHelpers";

/**
 *
 */
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
 * Smart evaluation function that uses tablebase WDL comparison for accurate move quality assessment
 * @param evaluation - The move evaluation data including tablebase WDL states
 * @param isWhite - Whether the player is white
 * @param moveIndex - The index of the move (for future use)
 * @param _moveIndex
 * @returns The evaluation display data based on WDL transition quality
 */
export /**
 *
 */
const getSmartMoveEvaluation = (
  evaluation: MoveEvaluation,
  isWhite: boolean,
  _moveIndex: number,
) => {
  const { evaluation: rawEvaluation, mateInMoves, tablebase } = evaluation;

  // If tablebase WDL data is available, use it for accurate move quality assessment
  if (
    tablebase &&
    typeof tablebase.wdlBefore === "number" &&
    typeof tablebase.wdlAfter === "number"
  ) {
    // WDL values are absolute (from White's perspective). Adjust for the current player
    const wdlBefore = isWhite ? tablebase.wdlBefore : -tablebase.wdlBefore;
    const wdlAfter = isWhite ? tablebase.wdlAfter : -tablebase.wdlAfter;

    // Map WDL state transitions to a quality score for display
    // This score represents the quality of the move, not the position state
    let qualityScore = 0;
    if (wdlAfter > wdlBefore)
      qualityScore = 300; // Improved position (e.g., Draw -> Win) -> Brilliant
    else if (wdlAfter < wdlBefore) qualityScore = -300; // Worsened position (e.g., Win -> Draw) -> Blunder
    // If wdlAfter === wdlBefore, qualityScore remains 0 (neutral move)

    return getMoveQualityDisplay(qualityScore, mateInMoves, isWhite);
  }

  // Fallback to numeric evaluation if tablebase WDL data is not available
  return getMoveQualityDisplay(rawEvaluation, mateInMoves, isWhite);
};
