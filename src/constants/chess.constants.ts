/**
 * Chess Constants - Additional Magic Number Replacements
 * Extends existing constants from shared/constants/
 * 
 * Note: Main chess constants already exist in:
 * - shared/constants/evaluation.constants.ts
 * - shared/constants/multipliers.ts (WDL values)
 * - shared/constants/progress.constants.ts (SuperMemo)
 */

/**
 * Smart evaluation centipawn thresholds
 * From smartEvaluation.ts
 */
export const SMART_EVALUATION_THRESHOLDS = {
  SIGNIFICANT_ADVANTAGE: 300,  // centipawns
  SIGNIFICANT_DISADVANTAGE: -300,  // centipawns
} as const;

/**
 * Result classification thresholds
 * From resultClassification.ts  
 */
export const RESULT_CLASSIFICATION = {
  MISTAKE_THRESHOLD: 50,
  BLUNDER_THRESHOLD: 80, 
  ADVANTAGE_THRESHOLD: 20,
  PERCENTAGE_BASE: 100,
  PERCENTAGE_RATIO: 20,
} as const;

/**
 * WDL score conversion
 * From wdl.ts
 */
export const WDL_CONVERSION = {
  SCORE_DIVISOR: 1000,  // For converting Win-Draw-Loss scores
  PERCENTAGE_BASE: 100, // Base percentage for calculations  
} as const;

/**
 * Move completion thresholds
 * From move.completion.ts
 */
export const MOVE_COMPLETION = {
  PERCENTAGE_COMPLETE: 100,
  PROGRESS_MULTIPLIER: 100,
  COMPLETION_DELAY_MS: 2000,
} as const;

/**
 * Training evaluation formatting
 * From formattingHelpers.ts
 */
export const EVALUATION_FORMATTING = {
  DECIMAL_THRESHOLD: 0.1,  // For decimal rounding
  CENTIPAWN_DISPLAY_THRESHOLD: 50,
  PERCENTAGE_BASE: 100,
  PERCENTAGE_HALF: 50,
  RATING_DIVISOR: 10,
} as const;

/**
 * Position analysis scoring factors
 * From positionAnalysisFormatter.ts
 */
export const POSITION_ANALYSIS = {
  CURSED_BLESSED_FACTOR: 0.8,  // Discount factor for 50-move rule positions
} as const;

/**
 * Chess evaluation constants for Win-Draw-Loss (WDL) 
 * and advantage thresholds
 */
export const CHESS_EVALUATION = {
  // Win-Draw-Loss (WDL) evaluation constants
  WDL_WIN: 2,
  WDL_DRAW: 0,
  WDL_LOSS: -2,
  
  // Evaluation advantage thresholds
  SLIGHT_ADVANTAGE: 0.5,
  SLIGHT_DISADVANTAGE: -0.5,
  SIGNIFICANT_ADVANTAGE: 2,
  SIGNIFICANT_DISADVANTAGE: -2,
} as const;