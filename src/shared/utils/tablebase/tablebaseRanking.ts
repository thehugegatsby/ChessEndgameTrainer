/**
 * @file Tablebase move ranking utilities
 * @module utils/tablebase/tablebaseRanking
 *
 * @description
 * Pure functions for hierarchical tablebase move ranking based on the
 * training-optimized hierarchy: WDL → DTM → DTZ.
 *
 * @remarks
 * Key features:
 * - Training-optimized hierarchy (DTM before DTZ)
 * - Defensive strategy for losing positions
 * - Pure functions for maximum testability
 * - No dependencies on service context
 *
 * The ranking prioritizes instructive, fast mate paths over theoretical
 * 50-move rule safety, making it ideal for endgame training.
 */

/**
 * Internal tablebase move structure used by the service
 */
export interface TablebaseMoveInternal {
  uci: string;
  san: string;
  wdl: number;
  dtz: number | null;
  dtm: number | null;
  category: string;
  zeroing?: boolean;
}

/**
 * Compare two tablebase moves using hierarchical ranking
 *
 * @function compareTablebaseMoves
 * @param {TablebaseMoveInternal} a - First move to compare
 * @param {TablebaseMoveInternal} b - Second move to compare
 * @returns {number} Negative if a is better, positive if b is better, 0 if equal
 *
 * @description
 * Implements training-optimized hierarchical move ranking:
 * 1. WDL (Win/Draw/Loss) - Primary ranking criterion
 * 2. DTM (Distance to Mate) - Secondary tiebreaker (prioritized for training)
 * 3. DTZ (Distance to Zeroing) - Final tiebreaker
 *
 * This hierarchy prioritizes instructive, fast mate paths over theoretical
 * 50-move rule safety, making it ideal for endgame training.
 *
 * For winning positions: Lower DTM/DTZ is better (faster path to goal)
 * For losing positions: Higher DTM/DTZ is better (defensive strategy - prolong game)
 * For draws: DTM/DTZ are irrelevant for ranking
 *
 * @example
 * ```typescript
 * const moves = [
 *   { uci: 'e1e5', wdl: 2, dtm: -20, dtz: -6, ... },
 *   { uci: 'e1b1', wdl: 2, dtm: -38, dtz: -4, ... }
 * ];
 * moves.sort(compareTablebaseMoves);
 * // Result: e1e5 first (faster mate DTM=-20)
 * ```
 */
export function compareTablebaseMoves(a: TablebaseMoveInternal, b: TablebaseMoveInternal): number {
  // 1. Primary criterion: WDL (Win/Draw/Loss)
  // Higher WDL value is always better regardless of DTM/DTZ
  if (a.wdl !== b.wdl) {
    return b.wdl - a.wdl; // Descending order: Win(2) > Draw(0) > Loss(-2)
  }

  // From here on, WDL values are equal, so we use DTM as tiebreaker

  // 2. Secondary criterion: DTM (Distance to Mate) - Training Priority
  const aDtm = a.dtm ?? 0; // Use 0 for null DTM (positions with >5 pieces)
  const bDtm = b.dtm ?? 0;

  if (aDtm !== bDtm) {
    if (a.wdl > 0) {
      // Winning positions: Lower absolute DTM is better (faster mate - more instructive)
      return Math.abs(aDtm) - Math.abs(bDtm);
    } else if (a.wdl < 0) {
      // Losing positions: Higher absolute DTM is better (defensive strategy)
      return Math.abs(bDtm) - Math.abs(aDtm);
    }
    // For draws (wdl === 0): DTM doesn't affect ranking, continue to DTZ
  }

  // 3. Final criterion: DTZ (Distance to Zeroing) - 50-move rule safety
  const aDtz = a.dtz ?? 0;
  const bDtz = b.dtz ?? 0;

  if (aDtz !== bDtz) {
    if (a.wdl > 0) {
      // Winning positions: Lower absolute DTZ is better (safer against 50-move rule)
      return Math.abs(aDtz) - Math.abs(bDtz);
    } else if (a.wdl < 0) {
      // Losing positions: Higher absolute DTZ is better (defensive strategy)
      return Math.abs(bDtz) - Math.abs(aDtz);
    }
    // For draws: DTZ doesn't affect ranking
  }

  // 4. All criteria are equal - moves are equivalent
  return 0;
}

/**
 * Sort an array of tablebase moves using hierarchical ranking
 *
 * @function sortTablebaseMoves
 * @param {TablebaseMoveInternal[]} moves - Array of moves to sort
 * @returns {TablebaseMoveInternal[]} New sorted array (does not mutate original)
 *
 * @description
 * Convenience function that creates a sorted copy of the moves array
 * using the hierarchical ranking algorithm.
 *
 * @example
 * ```typescript
 * const sortedMoves = sortTablebaseMoves(unsortedMoves);
 * ```
 */
export function sortTablebaseMoves(moves: TablebaseMoveInternal[]): TablebaseMoveInternal[] {
  return [...moves].sort(compareTablebaseMoves);
}