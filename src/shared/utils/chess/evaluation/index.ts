/**
 * @file Chess Evaluation Utilities
 * @description Modular evaluation helpers for tablebase-only chess training
 * Refactored from evaluationHelpers.ts for better maintainability
 */

// Display helpers for tablebase and move quality evaluations
export { getMoveQualityDisplay, getEvaluationDisplay } from "./displayHelpers";

// Formatting utilities for evaluation data
export {
  formatEvaluation,
  getEvaluationColor,
  getEvaluationBarWidth,
} from "./formattingHelpers";

// Symbol legends for UI display
export { TABLEBASE_LEGEND } from "./legends";

// Smart evaluation using tablebase WDL comparison for accurate move quality
export { getSmartMoveEvaluation, type MoveEvaluation } from "./smartEvaluation";
