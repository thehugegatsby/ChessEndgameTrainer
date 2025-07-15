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
    category: 'win' | 'draw' | 'loss';
  }>;
}


export interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: TablebaseData;
  // PHASE 2.2: Enhanced UCI evaluation data for PV display
  pv?: string[];          // Principal variation moves array
  pvString?: string;      // Raw PV string for debugging
  depth?: number;         // Search depth reached
  nps?: number;           // Nodes per second
  time?: number;          // Time spent in milliseconds
  nodes?: number;         // Number of positions evaluated
  hashfull?: number;      // Hash table usage percentage
  seldepth?: number;      // Selective search depth
  multipv?: number;       // Multi-PV index
  currmove?: string;      // Current move being analyzed
  currmovenumber?: number; // Current move number
  // Top 3 engine moves with Multi-PV like Lichess
  multiPvResults?: Array<{
    move: string;
    san: string;
    score: {
      type: 'cp' | 'mate';
      value: number;
    };
    pv: string[];
    rank: number;
  }>;
}

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

export type MoveQuality = 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

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
    multipv: number;  // Line number (1, 2, 3, ...)
    score: { type: 'cp' | 'mate'; value: number };
    depth: number;
    pv: string;       // Space-separated UCI moves
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
  category: 'win' | 'cursed-win' | 'draw' | 'blessed-loss' | 'loss';
  
  /** Whether the tablebase data is precise */
  precise: boolean;
}

/**
 * Normalized evaluation data - unified format for all evaluation sources
 * All values are from White's perspective for consistency
 */
export interface NormalizedEvaluation {
  /** Source of the evaluation */
  type: 'engine' | 'tablebase';
  
  /** 
   * Score in centipawns from White's perspective 
   * Positive = White advantage, Negative = Black advantage
   * null for tablebase positions or mate positions
   */
  scoreInCentipawns: number | null;
  
  /** 
   * Mate in N moves from White's perspective
   * Positive = White mates, Negative = Black mates
   * null if no mate or tablebase position
   */
  mate: number | null;
  
  /** Tablebase Win/Draw/Loss value (null for engine evaluations) */
  wdl: number | null;
  
  /** Tablebase Distance to Mate (null for engine evaluations) */
  dtm: number | null;
  
  /** Tablebase Distance to Zero (null for engine evaluations) */
  dtz: number | null;
  
  /** Whether this is a tablebase position */
  isTablebasePosition: boolean;
  
  /** Original raw data for debugging/logging */
  raw: EngineEvaluation | TablebaseResult | null;
}

/**
 * Evaluation from a specific player's perspective
 */
export interface PlayerPerspectiveEvaluation extends NormalizedEvaluation {
  /** Which player's perspective (w = White, b = Black) */
  perspective: 'w' | 'b';
  
  /** 
   * Adjusted score from player's perspective
   * For Black: inverted from scoreInCentipawns
   */
  perspectiveScore: number | null;
  
  /**
   * Adjusted mate from player's perspective
   * For Black: inverted from mate value
   */
  perspectiveMate: number | null;
  
  /**
   * Adjusted WDL from player's perspective
   * For Black: inverted from wdl value
   */
  perspectiveWdl: number | null;
  
  /**
   * Adjusted DTM from player's perspective
   * For Black: inverted from dtm value
   */
  perspectiveDtm: number | null;
  
  /**
   * Adjusted DTZ from player's perspective
   * For Black: inverted from dtz value
   */
  perspectiveDtz: number | null;
}

/**
 * Formatted evaluation ready for display
 */
export interface FormattedEvaluation {
  /** Main display text (e.g., "+0.50", "M+3", "TB Win") */
  mainText: string;
  
  /** Secondary details (e.g., "DTM: 25") */
  detailText: string | null;
  
  /** CSS class for styling */
  className: 'advantage' | 'disadvantage' | 'neutral' | 'winning' | 'losing';
  
  /** Additional metadata for tooltips/debugging */
  metadata: {
    isTablebase: boolean;
    isMate: boolean;
    isDrawn: boolean;
  };
}

/**
 * Move quality classification for the MoveQualityAnalyzer
 */
export type MoveQualityType = 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'unknown';

/**
 * Result of move quality analysis
 */
export interface MoveQualityResult {
  /** The quality classification of the move */
  quality: MoveQualityType;
  
  /** The FEN position before the move */
  fromFen: string;
  
  /** The FEN position after the move */
  toFen: string;
  
  /** Player who made the move */
  player: 'w' | 'b';
  
  /** Score difference in centipawns (positive = improvement for player) */
  scoreDifference: number | null;
  
  /** WDL change (for tablebase positions) */
  wdlChange: number | null;
  
  /** Mate change (for mate positions) */
  mateChange: number | null;
  
  /** Human-readable reason for the classification */
  reason: string;
  
  /** Whether this analysis is based on tablebase data */
  isTablebaseAnalysis: boolean;
  
  /** Metadata about the evaluation sources */
  metadata: {
    beforeEvaluation: PlayerPerspectiveEvaluation | null;
    afterEvaluation: PlayerPerspectiveEvaluation | null;
    error?: string;
  };
}

/**
 * BRÜCKENBAU-TRAINER: Enhanced evaluation types
 * For 5-level quality classification of Win→Win moves
 */

/** Move quality classes based on ΔDTM for Win→Win transitions */
export type MoveQualityClass = 'optimal' | 'sicher' | 'umweg' | 'riskant' | 'fehler';

/** Robustness classification based on available winning moves */
export type RobustnessTag = 'robust' | 'präzise' | 'haarig';

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