/**
 * Evaluation Domain - Public API
 * 
 * This domain handles all tablebase evaluation logic and related functionality.
 * It provides a clean interface for position evaluation, move analysis, and 
 * evaluation text generation.
 */

// Service exports
export { TablebaseService, tablebaseService } from './services/TablebaseService';

// Type exports for backward compatibility
export type {
  TablebaseMove,
  TablebaseResult,
  TablebaseEvaluation,
  TablebaseMovesResult,
} from './services/TablebaseService';

// Utilities
export { getEvaluationText } from '@shared/utils/evaluationText';

// Future exports (when types are migrated):
// export type {
//   TablebaseEntry,
//   TablebaseCategory,
//   TablebaseCacheEntry,
//   TablebaseMoveInternal,
//   LichessTablebaseResponse,
// } from './types/tablebase';