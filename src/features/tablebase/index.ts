/**
 * Tablebase Feature - Public API
 *
 * This is the main entry point for the tablebase feature.
 * Only exports what's needed by the rest of the application.
 */

// Service
export { tablebaseService } from '@domains/evaluation';

// Hooks
export {
  useTablebaseEvaluation,
  useTablebaseMoves,
  useTablebase,
  tablebaseQueryKeys,
} from './hooks/useTablebase';

// Types
export type {
  TablebaseServiceInterface,
  TablebaseEvaluation,
  TablebaseMove,
  TablebaseOutcome,
} from './types/interfaces';

export { TablebaseError } from './types/interfaces';

// Formatters
export {
  formatEvaluationGerman,
  formatMoveGerman,
  formatOutcomeGerman,
  formatErrorGerman,
  getMoveQualityIndicator,
  getMoveQualityClass,
} from './utils/formatters';

// Configuration (if needed externally)
export { TablebaseConfig } from './types/models';
