/**
 * @fileoverview Chess Evaluation Utilities
 * @description Modular evaluation helpers for chess training
 * Refactored from evaluationHelpers.ts for better maintainability
 */

// Display helpers for engine and move quality evaluations
export {
  getMoveQualityDisplay,
  getEvaluationDisplay
} from './displayHelpers';

// Tablebase-specific evaluation helpers
export {
  getMoveQualityByTablebaseComparison,
  getCategory
} from './tablebaseHelpers';

// Formatting utilities for evaluation data
export {
  formatEvaluation,
  getEvaluationColor,
  getEvaluationBarWidth
} from './formattingHelpers';

// Symbol legends for UI display
export {
  TABLEBASE_LEGEND,
  ENGINE_LEGEND
} from './legends';

// Smart evaluation that prioritizes tablebase over engine
export {
  getSmartMoveEvaluation,
  type MoveEvaluation
} from './smartEvaluation';