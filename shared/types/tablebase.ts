/**
 * Tablebase types for Lichess API integration
 *
 * @remarks
 * These types are designed to match the exact structure of the Lichess Tablebase API
 * while providing type safety and clear documentation for the data flow.
 */

/**
 * Raw response from Lichess Tablebase API
 * @interface LichessTablebaseResponse
 *
 * @example API Response:
 * ```json
 * {
 *   "category": "win",
 *   "dtz": 13,
 *   "dtm": 13,
 *   "moves": [
 *     {
 *       "uci": "h1b7",
 *       "san": "Qb7",
 *       "category": "loss",
 *       "dtz": -12,
 *       "dtm": -12
 *     }
 *   ]
 * }
 * ```
 */
export interface LichessTablebaseResponse {
  /** Position evaluation category */
  category: string;

  /** Distance to Zeroing (50-move rule) */
  dtz: number | null;

  /** Distance to Mate (if available) */
  dtm: number | null;

  /** Precise DTZ without rounding */
  precise_dtz?: number | null;

  /** DTZ for antichess variant */
  dtw?: number | null;

  /** Distance to conversion */
  dtc?: number | null;

  /** Position status flags */
  checkmate: boolean;
  stalemate: boolean;
  variant_win: boolean;
  variant_loss: boolean;
  insufficient_material: boolean;

  /** All legal moves with their evaluations */
  moves: LichessMove[];
}

/**
 * Individual move from Lichess API
 * @interface LichessMove
 */
export interface LichessMove {
  /** Move in UCI notation (e.g., "e2e4", "a7a8q") */
  uci: string;

  /** Move in Standard Algebraic Notation (e.g., "e4", "a8=Q+") */
  san: string;

  /** Evaluation category after this move */
  category: string;

  /** DTZ after this move */
  dtz: number | null;

  /** DTM after this move */
  dtm: number | null;

  /** Precise DTZ without rounding */
  precise_dtz?: number | null;

  /** Whether this move resets the 50-move counter */
  zeroing: boolean;

  /** Position status after this move */
  checkmate: boolean;
  stalemate: boolean;
  variant_win: boolean;
  variant_loss: boolean;
  insufficient_material: boolean;
}

/**
 * Tablebase evaluation categories
 * @type TablebaseCategory
 */
export type TablebaseCategory =
  | "win"
  | "draw"
  | "loss"
  | "cursed-win"
  | "blessed-loss"
  | "maybe-win"
  | "maybe-loss"
  | "unknown";

/**
 * Internal representation of tablebase data after transformation
 * @interface TablebaseEntry
 *
 * @remarks
 * This is our internal format after transforming the Lichess API response.
 * Key differences from API:
 * - WDL values are calculated from categories
 * - Move evaluations are from the player-to-move perspective
 * - Cleaner structure for application use
 */
export interface TablebaseEntry {
  /** Current position evaluation */
  position: PositionEvaluation;

  /** All legal moves sorted by quality (best first) */
  moves: TablebaseMoveInternal[];

  /** Original FEN for reference */
  fen: string;

  /** Timestamp when this entry was fetched */
  timestamp: number;
}

/**
 * Position evaluation data
 * @interface PositionEvaluation
 */
export interface PositionEvaluation {
  /** Evaluation category */
  category: TablebaseCategory;

  /** Win/Draw/Loss value: 2=win, 1=cursed-win, 0=draw, -1=blessed-loss, -2=loss */
  wdl: number;

  /** Distance to Zeroing */
  dtz: number | null;

  /** Distance to Mate */
  dtm: number | null;

  /** Whether DTZ is precise (not rounded) */
  precise: boolean;

  /** Human-readable evaluation in German */
  evaluation: string;
}

/**
 * Transformed move data with correct perspective
 * @interface TablebaseMoveInternal
 *
 * @remarks
 * Move evaluations are from the perspective of the player to move,
 * not White's perspective like in the raw API response.
 * This is the internal representation used by TablebaseEntry.
 */
export interface TablebaseMoveInternal {
  /** Move in UCI notation */
  uci: string;

  /** Move in SAN notation */
  san: string;

  /** Category after this move (from mover's perspective) */
  category: TablebaseCategory;

  /** WDL after this move (from mover's perspective) */
  wdl: number;

  /** DTZ after this move */
  dtz: number | null;

  /** DTM after this move */
  dtm: number | null;

  /** Whether this move zeroes the 50-move counter */
  zeroing: boolean;
}

/**
 * Cache entry structure
 * @interface TablebaseCacheEntry
 */
export interface TablebaseCacheEntry {
  /** The tablebase entry or null if not in tablebase */
  entry: TablebaseEntry | null;

  /** When this entry expires (timestamp) */
  expiry: number;
}

/**
 * Public move representation (without internal fields)
 * @interface TablebaseMove
 */
export interface TablebaseMove {
  uci: string;
  san: string;
  wdl: number;
  dtz: number | null;
  dtm: number | null;
  category: TablebaseCategory;
}

/**
 * Result wrapper for backward compatibility
 * @interface TablebaseResult
 */
export interface TablebaseResult {
  wdl: number;
  dtz: number | null;
  dtm: number | null;
  category: TablebaseCategory;
  precise: boolean;
  evaluation: string;
}

/**
 * Evaluation result wrapper
 * @interface TablebaseEvaluation
 */
export interface TablebaseEvaluation {
  isAvailable: boolean;
  result?: TablebaseResult;
  error?: string;
}

/**
 * Top moves result wrapper
 * @interface TablebaseMovesResult
 */
export interface TablebaseMovesResult {
  isAvailable: boolean;
  moves?: TablebaseMove[];
  error?: string;
}
