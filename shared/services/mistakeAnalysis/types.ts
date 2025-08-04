/**
 * Types for the Adaptive Mistake Analysis system
 * Provides intelligent feedback on chess moves based on evaluation changes
 */

import { RATING } from "../../constants";

// EvaluationResult type removed - not exported from evaluation types
// Using local types instead

/**
 * Classification of move mistakes based on tablebase results and learning value
 * Prioritizes objective correctness over evaluation nuances
 */
export type MistakeType =
  | "PERFECT" // Fastest route to win/draw (tablebase optimal)
  | "CORRECT" // Maintains win/draw but not fastest
  | "SUBOPTIMAL" // Prolongs win significantly but still winning
  | "IMPRECISE" // Minor evaluation loss but position type unchanged
  | "ERROR" // Changes winning position to difficult win
  | "BLUNDER" // Loses objective advantage (win→draw, win→loss)
  | "CRITICAL_ERROR"; // Complete position type change (win→loss, draw→loss)

/**
 * Tablebase position result for objective evaluation
 */
export interface TablebaseResult {
  /** Objective game result from this position */
  result: "win" | "draw" | "loss";

  /** Distance to mate/conversion (positive = moves to win, negative = moves to mate) */
  dtm?: number;

  /** Whether this is a tablebase position */
  isTablebase: boolean;
}

/**
 * Detailed analysis of a specific move's impact
 * Prioritizes tablebase accuracy over alternative evaluation
 */
export interface MoveAnalysis {
  /** Type of mistake classification */
  type: MistakeType;

  /** Tablebase results before and after move */
  tablebase: {
    before: TablebaseResult;
    after: TablebaseResult;
  };

  /** Engine evaluation as secondary information */
  engine?: {
    beforeEval: number;
    afterEval: number;
    centipawnDelta: number;
  };

  /** Human-readable explanation focused on winning technique */
  explanation: string;

  /** Suggested better move based on tablebase optimality */
  betterMove?: {
    move: string;
    san: string;
    tablebaseResult: TablebaseResult;
    explanation: string;
    isOptimal: boolean; // True if this is tablebase optimal
  };

  /** Learning themes for endgame improvement */
  themes: MistakeTheme[];

  /** Practical severity for learning (not just evaluation) */
  learningSeverity: "excellent" | "good" | "attention" | "serious" | "critical";
}

/**
 * Strategic and tactical themes for educational context
 */
export type MistakeTheme =
  | "TACTICS" // Missed tactical opportunity
  | "ENDGAME_TECHNIQUE" // Poor endgame technique
  | "KING_SAFETY" // King safety violation
  | "PIECE_ACTIVITY" // Poor piece coordination
  | "PAWN_STRUCTURE" // Pawn structure damage
  | "TIME_PRESSURE" // Move suggests time pressure
  | "CALCULATION" // Miscalculation
  | "POSITIONAL" // General positional error
  | "THEORETICAL" // Known theoretical mistake
  | "BLUNDER_CHECK"; // Missed check or mate

/**
 * User skill level for adaptive feedback
 * Thresholds based on centralized RATING constants
 */
export type SkillLevel =
  | "BEGINNER" // < RATING.BEGINNER_THRESHOLD (1200)
  | "INTERMEDIATE" // RATING.BEGINNER_THRESHOLD to RATING.INTERMEDIATE_THRESHOLD (1200-1800)
  | "ADVANCED" // RATING.INTERMEDIATE_THRESHOLD to RATING.ADVANCED_THRESHOLD (1800-2200)
  | "EXPERT"; // RATING.EXPERT_THRESHOLD+ (2200+)

/**
 * Get skill level based on rating using centralized constants
 * @param rating
 */
export function getSkillLevel(rating: number): SkillLevel {
  if (rating < RATING.BEGINNER_THRESHOLD) {
    return "BEGINNER";
  } else if (rating < RATING.INTERMEDIATE_THRESHOLD) {
    return "INTERMEDIATE";
  } else if (rating < RATING.ADVANCED_THRESHOLD) {
    return "ADVANCED";
  } else {
    return "EXPERT";
  }
}

/**
 * Configuration for adaptive mistake analysis
 */
export interface AdaptiveConfig {
  /** User's estimated skill level */
  skillLevel: SkillLevel;

  /** Focus areas for personalized feedback */
  focusAreas: MistakeTheme[];

  /** Minimum centipawn loss to trigger analysis */
  sensitivityThreshold: number;

  /** Whether to show tablebase lines in explanations */
  showTablebaseLines: boolean;

  /** Maximum depth for alternative move analysis */
  analysisDepth: number;
}

/**
 * Historical mistake data for pattern recognition
 */
export interface MistakeHistory {
  /** User identifier */
  userId: string;

  /** Timestamp of the mistake */
  timestamp: Date;

  /** Position FEN when mistake occurred */
  position: string;

  /** The mistake analysis */
  analysis: MoveAnalysis;

  /** Whether user learned from this mistake (repeat analysis) */
  isLearned: boolean;

  /** Endgame category this mistake occurred in */
  endgameCategory: string;
}

/**
 * Service interface for mistake analysis operations
 */
export interface MistakeAnalysisService {
  /** Analyze a single move for mistakes */
  analyzeMove(
    beforePosition: string,
    afterPosition: string,
    move: string,
    config: AdaptiveConfig,
  ): Promise<MoveAnalysis>;

  /** Get mistake patterns for a user */
  getUserMistakePatterns(userId: string): Promise<MistakeTheme[]>;

  /** Record a mistake for learning pattern analysis */
  recordMistake(mistake: MistakeHistory): Promise<void>;

  /** Get adaptive configuration recommendations */
  getAdaptiveRecommendations(userId: string): Promise<Partial<AdaptiveConfig>>;
}

/**
 * Result of mistake classification with confidence
 */
export interface MistakeClassificationResult {
  /** The classified mistake type */
  type: MistakeType;

  /** Confidence in the classification (0-1) */
  confidence: number;

  /** Whether this classification used adaptive logic */
  isAdaptive: boolean;

  /** Raw centipawn delta used for classification */
  centipawnDelta: number;

  /** Additional context for the classification */
  context: {
    isEndgame: boolean;
    isComplexPosition: boolean;
    hasTimelinePressure: boolean;
  };
}

/**
 * Events emitted by the mistake analysis system
 */
export interface MistakeAnalysisEvents {
  /** Emitted when a significant mistake is detected */
  "mistake-detected": {
    analysis: MoveAnalysis;
    position: string;
    timestamp: Date;
  };

  /** Emitted when analysis is complete */
  "analysis-complete": {
    analysis: MoveAnalysis;
    duration: number;
  };

  /** Emitted when adaptive recommendations change */
  "recommendations-updated": {
    userId: string;
    newConfig: Partial<AdaptiveConfig>;
  };
}
