/**
 * Centralized evaluation types for chess analysis
 * Consolidates all evaluation-related interfaces from across the codebase
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
    category: "win" | "draw" | "loss";
  }>;
}

/**
 * Position Analysis - Central domain type for chess position evaluation
 * Replaces the old EvaluationData interface with cleaner, domain-centric naming
 */
export interface PositionAnalysis {
  /** Numeric evaluation score (derived from WDL for tablebase positions) */
  evaluation: number;

  /** Mate in N moves (if applicable) */
  mateInMoves?: number;

  /** Tablebase data (always present for endgame positions) */
  tablebase?: TablebaseData;
}

// EvaluationData has been replaced by PositionAnalysis
// This export maintains backwards compatibility
export type EvaluationData = PositionAnalysis;

export interface EvaluationDisplay {
  text: string;
  className: string;
  color: string;
  bgColor: string;
}

export interface MoveEvaluation {
  evaluation: number;
  mateInMoves?: number;
}

export type MoveQuality =
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface DualEvaluation {
  engine: {
    score: number;
    mate?: number | null;
    evaluation: string;
  };
  tablebase?: {
    isTablebasePosition: boolean;
    wdl?: number;
    dtz?: number;
    category?: string;
    evaluation?: string;
  };
}

/**
 * Raw engine evaluation data as returned by the chess engine
 * Used by the new unified evaluation system
 */
export interface EngineEvaluation {
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
    score: { type: "cp" | "mate"; value: number };
    depth: number;
    pv: string; // Space-separated UCI moves
    nodes?: number;
    nps?: number;
    time?: number;
    seldepth?: number;
  }>;
}

/**
 * Raw tablebase result data
 * Used by the new unified evaluation system
 */
export interface TablebaseResult {
  /** Win/Draw/Loss: 2=win, 1=cursed-win, 0=draw, -1=blessed-loss, -2=loss */
  wdl: number;

  /** Distance to Zero (moves to draw under 50-move rule) */
  dtz: number | null;

  /** Distance to Mate (total moves to checkmate) */
  dtm: number | null;

  /** Human-readable category */
  category: "win" | "cursed-win" | "draw" | "blessed-loss" | "loss";

  /** Whether the tablebase data is precise */
  precise: boolean;
}

/**
 * Move quality classification for the MoveQualityAnalyzer
 */
export type MoveQualityType =
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "unknown";

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

  /** Optional engine-specific info */
  engineInfo?: {
    evalBefore: number;
    evalAfter: number;
  };
}

// MoveQualityResult has been replaced by SimplifiedMoveQualityResult above

/**
 * BRÜCKENBAU-TRAINER: Enhanced evaluation types
 * For 5-level quality classification of Win→Win moves
 */

/** Move quality classes based on ΔDTM for Win→Win transitions */
export type MoveQualityClass =
  | "optimal"
  | "sicher"
  | "umweg"
  | "riskant"
  | "fehler";

/** Robustness classification based on available winning moves */
export type RobustnessTag = "robust" | "präzise" | "haarig";

/** Enhanced evaluation display for BRÜCKENBAU-TRAINER feature */
export interface EnhancedEvaluationDisplay extends EvaluationDisplay {
  /** Quality classification for the move */
  qualityClass?: MoveQualityClass;

  /** Robustness of the position */
  robustness?: RobustnessTag;

  /** Educational tip for learning */
  educationalTip?: string;

  /** Number of winning moves available */
  winningMovesCount?: number;
}
