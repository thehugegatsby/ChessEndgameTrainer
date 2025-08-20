/**
 * @fileoverview Evaluation constants barrel export
 * @module constants/evaluation
 */

export * from '../evaluation.constants';

// Create consolidated EVALUATION export for backward compatibility
import {
  SCORE_THRESHOLDS,
  MOVE_QUALITY,
  EVALUATION_CONFIG,
  CENTIPAWN_CONVERSION,
} from '../evaluation.constants';

export const EVALUATION = {
  SCORE_THRESHOLDS,
  MOVE_QUALITY,
  CONFIG: EVALUATION_CONFIG,
  CENTIPAWN_CONVERSION,
} as const;