/**
 * @file Chess evaluation utilities re-export module
 * @module utils/chess/evaluationHelpers
 * @deprecated This file has been refactored into separate modules.
 * 
 * @description
 * Legacy re-export module that maintains backward compatibility while the
 * codebase transitions to the new modular structure. All functionality has
 * been moved to the ./evaluation/ subdirectory for better organization.
 * 
 * @remarks
 * Migration guide:
 * - Instead of importing from this file, import directly from:
 *   - `@shared/utils/chess/evaluation` for evaluation utilities
 *   - Individual function imports for tree-shaking benefits
 * 
 * This file will be removed in a future version once all imports
 * have been updated to use the new module structure.
 * 
 * @example
 * ```typescript
 * // Old way (deprecated)
 * import { getMoveQualityDisplay } from './evaluationHelpers';
 * 
 * // New way (recommended)
 * import { getMoveQualityDisplay } from './evaluation';
 * ```
 */

/**
 * @deprecated Use direct imports from './evaluation' instead
 * 
 * Re-exports all functionality from the new modular structure
 * to maintain backward compatibility during the migration period.
 */
export {
  getMoveQualityDisplay,
  getEvaluationDisplay,
  // REMOVED: getMoveQualityByTablebaseComparison, (overengineered)
  // REMOVED: getCategory, (overengineered)
  formatEvaluation,
  getEvaluationColor,
  getEvaluationBarWidth,
  TABLEBASE_LEGEND,
  getSmartMoveEvaluation,
  type MoveEvaluation,
} from "./evaluation";
