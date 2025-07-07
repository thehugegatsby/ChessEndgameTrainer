/**
 * @fileoverview Chess Evaluation Utilities
 * @description Modular evaluation helpers for chess training
 * @deprecated This file has been refactored into separate modules.
 * Use individual imports from ./evaluation/ subdirectory for better maintainability.
 */

// Re-export all functionality from the new modular structure
export {
  getMoveQualityDisplay,
  getEvaluationDisplay,
  getMoveQualityByTablebaseComparison,
  getCategory,
  formatEvaluation,
  getEvaluationColor,
  getEvaluationBarWidth,
  TABLEBASE_LEGEND,
  ENGINE_LEGEND
} from './evaluation';