/**
 * Centralized evaluation types for chess analysis
 * Consolidates all evaluation-related interfaces from across the codebase
 *
 * @module evaluation
 *
 * @remarks
 * ## WDL (Win/Draw/Loss) Value System
 *
 * The tablebase uses a 5-value WDL system from White's perspective:
 * - **2**: Win - White wins with perfect play
 * - **1**: Cursed-win - White wins but draw under 50-move rule
 * - **0**: Draw - Position is drawn with perfect play
 * - **-1**: Blessed-loss - White loses but draw under 50-move rule
 * - **-2**: Loss - White loses with perfect play
 *
 * For Black's perspective, invert the values.
 *
 * ## DTZ vs DTM
 *
 * - **DTZ** (Distance to Zeroing): Moves until pawn move or capture resets 50-move counter
 * - **DTM** (Distance to Mate): Total moves until checkmate with perfect play
 *
 * DTM is more accurate for resistance calculation but not always available.
 */

/**
 * Tablebase evaluation data for UI components
 * @interface TablebaseData
 * @property {boolean} isTablebasePosition - Whether position has tablebase data (≤7 pieces)
 * @property {number} [wdlBefore] - WDL value before the move
 * @property {number} [wdlAfter] - WDL value after the move
 * @property {string} [category] - Human-readable outcome category
 * @property {number} [dtz] - Distance to zeroing (50-move rule)
 * @property {Array} [topMoves] - Best moves from tablebase with evaluations
 */
export interface TablebaseData {
  isTablebasePosition: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  category?: string;
  dtz?: number;
  // Top 3 tablebase moves with DTZ/DTM like Lichess
  topMoves?: Array<{
    move: string;
    san: string;
    dtz: number;
    dtm: number;
    wdl: number;
    category: 'win' | 'draw' | 'loss';
  }>;
}

/**
 * Position Analysis - Central domain type for chess position evaluation
 * Replaces the old EvaluationData interface with cleaner, domain-centric naming
 */
export interface PositionAnalysis {
  /** FEN string for the position (used for caching) */
  fen: string;

  /** Numeric evaluation score (derived from WDL for tablebase positions) */
  evaluation: number;

  /** Mate in N moves (if applicable) */
  mateInMoves?: number;

  /** Top moves for this position */
  topMoves?: Array<{
    uci: string;
    san: string;
    wdl: number;
    dtz: number;
    dtm?: number | null;
    category: string;
    zeroing?: boolean;
    checkmate?: boolean;
    stalemate?: boolean;
    variant_win?: boolean;
    variant_loss?: boolean;
    insufficient_material?: boolean;
  }>;

  /** Whether this is a tablebase position */
  isTablebasePosition?: boolean;

  /** Tablebase data (always present for endgame positions) */
  tablebase?: TablebaseData;
}

// EvaluationData removed - use PositionAnalysis instead

/**
 * Display formatting for evaluation UI components
 * @interface EvaluationDisplay
 * @property {string} text - Human-readable evaluation text
 * @property {string} className - CSS class for styling
 * @property {string} color - Text color
 * @property {string} bgColor - Background color
 */
export interface EvaluationDisplay {
  text: string;
  className: string;
  color: string;
  bgColor: string;
}

/**
 * Simple move evaluation result
 * @interface MoveEvaluation
 * @property {number} evaluation - Numeric score (centipawns or WDL-derived)
 * @property {number} [mateInMoves] - Moves to mate if applicable
 */
export interface MoveEvaluation {
  evaluation: number;
  mateInMoves?: number;
}

/**
 * Move quality classification for training feedback
 * @typedef {string} MoveQuality
 */
export type MoveQuality = 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/**
 * Raw tablebase evaluation data as returned by the chess tablebase
 * Used by the new unified evaluation system
 */
export interface TablebaseEvaluation {
  /** Score in centipawns (100 = 1 pawn advantage) */
  score: number;

  /** Mate in N moves (positive = White mates, negative = Black mates, null = no mate) */
  mate: number | null;

  /** Human-readable evaluation text */
  evaluation: string;

  /** Search depth reached */
  depth: number;

  /** Number of positions evaluated */
  nodes: number;

  /** Time spent in milliseconds */
  time: number;

  // PHASE 2.2: Enhanced UCI evaluation data for PV display
  /** Principal variation moves array */
  pv?: string[];
  /** Raw PV string for debugging */
  pvString?: string;
  /** Nodes per second */
  nps?: number;
  /** Hash table usage percentage */
  hashfull?: number;
  /** Selective search depth */
  seldepth?: number;
  /** Multi-PV index */
  multipv?: number;
  /** Current move being analyzed */
  currmove?: string;
  /** Current move number */
  currmovenumber?: number;

  // PHASE 3: Multi-PV support
  /** All Multi-PV lines when using Multi-PV evaluation */
  multiPvLines?: Array<{
    multipv: number; // Line number (1, 2, 3, ...)
    score: { type: 'cp' | 'mate'; value: number };
    depth: number;
    pv: string; // Space-separated UCI moves
    nodes?: number;
    nps?: number;
    time?: number;
    seldepth?: number;
  }>;
}

/**
 * Raw tablebase result data from Lichess API
 * Core type for tablebase evaluation system
 *
 * @interface TablebaseResult
 * @see {@link TablebaseService} for usage examples
 */
export interface TablebaseResult {
  /**
   * Win/Draw/Loss value from White's perspective
   * - 2 = White wins
   * - 1 = Cursed-win (White wins but drawn with 50-move rule)
   * - 0 = Draw
   * - -1 = Blessed-loss (White loses but drawn with 50-move rule)
   * - -2 = White loses
   */
  wdl: number;

  /** Distance to Zero (moves to draw under 50-move rule) */
  dtz: number | null;

  /** Distance to Mate (total moves to checkmate) */
  dtm: number | null;

  /** Human-readable category */
  category: 'win' | 'cursed-win' | 'draw' | 'blessed-loss' | 'loss';

  /** Whether the tablebase data is precise */
  precise: boolean;
}

/**
 * Move quality classification for the MoveQualityAnalyzer
 */
export type MoveQualityType =
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'unknown';

/**
 * Simplified move quality result for the new architecture
 * Only contains essential information for UI display
 */
export interface SimplifiedMoveQualityResult {
  /** The quality classification of the move */
  quality: MoveQualityType;

  /** Human-readable reason for the classification */
  reason: string;

  /** Whether this analysis is based on tablebase data */
  isTablebaseAnalysis: boolean;

  /** Optional tablebase-specific info */
  tablebaseInfo?: {
    wdlBefore: number;
    wdlAfter: number;
  };

  /** Optional tablebase evaluation info */
  tablebaseEvalInfo?: {
    evalBefore: number;
    evalAfter: number;
  };
}

// MoveQualityResult has been replaced by SimplifiedMoveQualityResult above
