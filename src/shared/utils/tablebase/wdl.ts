/**
 * WDL (Win/Draw/Loss) Value Standardization
 * 
 * Provides canonical WDL handling following chess engine best practices:
 * - Single source of truth for WDL values and perspective conversion
 * - Eliminates scattered negation anti-patterns throughout the codebase
 * - Type-safe WDL operations with explicit perspective handling
 * 
 * @remarks
 * This module addresses the "ständige Probleme mit WDL und perspective kram"
 * by centralizing all WDL perspective conversion logic in a thin adapter layer.
 * 
 * Chess engines like Stockfish use canonical representation (always from white's perspective)
 * with explicit perspective conversion only when needed for display or analysis.
 */

/**
 * Canonical WDL value type
 * -1 = Loss, 0 = Draw, 1 = Win (from current perspective)
 */
export type WdlValue = -1 | 0 | 1;

/**
 * Raw numeric WDL values from Lichess Tablebase API
 * Typically ranges from -1000 to +1000, with 0 = draw
 */
export type RawWdlValue = number;

/**
 * Move quality classification based on WDL changes
 */
export type MoveQuality = 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'best';

/**
 * WDL Adapter - Central utility for all WDL operations
 * 
 * Replaces scattered `wdlAfter = -wdlAfter` negations with explicit, 
 * well-typed perspective conversion methods.
 */
export class WdlAdapter {
  /**
   * Convert raw numeric WDL value to canonical -1/0/1 representation
   * 
   * @param rawWdl - Raw WDL value from tablebase API (e.g., -1000 to +1000)
   * @returns Canonical WDL value (-1, 0, or 1)
   * 
   * @example
   * ```typescript
   * WdlAdapter.rawToCanonical(1000);  // returns 1 (win)
   * WdlAdapter.rawToCanonical(0);     // returns 0 (draw) 
   * WdlAdapter.rawToCanonical(-500);  // returns -1 (loss)
   * ```
   */
  static rawToCanonical(rawWdl: RawWdlValue): WdlValue {
    if (rawWdl > 0) return 1;   // Win
    if (rawWdl < 0) return -1;  // Loss
    return 0;                   // Draw
  }

  /**
   * Convert canonical WDL back to raw numeric value
   * Useful when interfacing with existing systems expecting numeric WDL
   * 
   * @param wdl - Canonical WDL value
   * @returns Raw numeric WDL value
   */
  static canonicalToRaw(wdl: WdlValue): RawWdlValue {
    return wdl * 1000; // -1000, 0, or 1000
  }

  /**
   * Convert WDL value from opponent's perspective to current player's perspective
   * 
   * This replaces the scattered `wdlAfter = -wdlAfter` negations found throughout
   * the codebase with an explicit, documented operation.
   * 
   * @param wdl - WDL value from opponent's perspective
   * @returns WDL value from current player's perspective
   * 
   * @example
   * ```typescript
   * // After a move, evaluation is from opponent's perspective
   * const opponentWdl = 1000; // Opponent sees a win
   * const playerWdl = WdlAdapter.flipPerspective(opponentWdl); // Player sees -1000 (loss)
   * ```
   */
  static flipPerspective(wdl: RawWdlValue): RawWdlValue {
    return -wdl;
  }

  /**
   * Convert WDL values to player perspective for move evaluation
   * 
   * Replaces MoveQualityEvaluator.convertToPlayerPerspective() with explicit logic:
   * - wdlBefore: already from player's perspective (side-to-move)
   * - wdlAfter: from opponent's perspective (they are now side-to-move) -> flip needed
   * 
   * @param wdlBefore - WDL before move (player's perspective)
   * @param wdlAfter - WDL after move (opponent's perspective) 
   * @returns Both values from original player's perspective
   */
  static convertToPlayerPerspective(wdlBefore: RawWdlValue, wdlAfter: RawWdlValue) {
    return {
      wdlBeforeFromPlayerPerspective: wdlBefore,
      wdlAfterFromPlayerPerspective: WdlAdapter.flipPerspective(wdlAfter)
    };
  }

  /**
   * Check if position degraded from win to draw/loss
   * 
   * @param wdlBefore - WDL value before move
   * @param wdlAfter - WDL value after move (same perspective as wdlBefore)
   * @returns True if position went from winning to drawing or losing
   */
  static isWinToDrawOrLoss(wdlBefore: RawWdlValue, wdlAfter: RawWdlValue): boolean {
    return wdlBefore > 0 && wdlAfter <= 0;
  }

  /**
   * Check if position degraded from draw to loss
   * 
   * @param wdlBefore - WDL value before move  
   * @param wdlAfter - WDL value after move (same perspective as wdlBefore)
   * @returns True if position went from drawing to losing
   */
  static isDrawToLoss(wdlBefore: RawWdlValue, wdlAfter: RawWdlValue): boolean {
    return wdlBefore === 0 && wdlAfter < 0;
  }

  /**
   * Determine if outcome changed significantly (blunder detection)
   * 
   * @param wdlBefore - Position evaluation before move
   * @param wdlAfter - Position evaluation after move (same perspective)
   * @returns True if move caused significant position degradation
   */
  static didOutcomeChange(wdlBefore: RawWdlValue, wdlAfter: RawWdlValue): boolean {
    return WdlAdapter.isWinToDrawOrLoss(wdlBefore, wdlAfter) || 
           WdlAdapter.isDrawToLoss(wdlBefore, wdlAfter);
  }

  /**
   * Classify move quality based on WDL change
   * 
   * @param wdlBefore - Position before move
   * @param wdlAfter - Position after move (same perspective)
   * @returns Move quality classification
   */
  static getMoveQuality(wdlBefore: RawWdlValue, wdlAfter: RawWdlValue): MoveQuality {
    if (WdlAdapter.isWinToDrawOrLoss(wdlBefore, wdlAfter)) {
      return 'blunder';
    }
    if (WdlAdapter.isDrawToLoss(wdlBefore, wdlAfter)) {
      return 'mistake'; 
    }
    if (wdlAfter > wdlBefore) {
      return 'good';
    }
    return 'best';
  }

  /**
   * Format WDL value for display
   * 
   * @param wdl - Raw WDL value
   * @returns Human-readable WDL description
   */
  static formatWdl(wdl: RawWdlValue): string {
    const canonical = WdlAdapter.rawToCanonical(wdl);
    switch (canonical) {
      case 1: return 'Winning';
      case 0: return 'Drawing'; 
      case -1: return 'Losing';
    }
  }

  /**
   * Check if WDL value represents a winning position
   */
  static isWinning(wdl: RawWdlValue): boolean {
    return wdl > 0;
  }

  /**
   * Check if WDL value represents a drawing position
   */
  static isDrawing(wdl: RawWdlValue): boolean {
    return wdl === 0;
  }

  /**
   * Check if WDL value represents a losing position
   */  
  static isLosing(wdl: RawWdlValue): boolean {
    return wdl < 0;
  }
}

/**
 * Legacy compatibility - gradually replace direct numeric comparisons with these helpers
 */
export const WdlUtils = {
  /** @deprecated Use WdlAdapter.isWinning() */
  isPositive: (wdl: RawWdlValue) => WdlAdapter.isWinning(wdl),
  /** @deprecated Use WdlAdapter.isDrawing() */
  isZero: (wdl: RawWdlValue) => WdlAdapter.isDrawing(wdl),
  /** @deprecated Use WdlAdapter.isLosing() */
  isNegative: (wdl: RawWdlValue) => WdlAdapter.isLosing(wdl),
};