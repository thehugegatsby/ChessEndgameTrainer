/**
 * Type guard helpers for tablebase evaluation data
 * Provides type-safe access to discriminated union properties
 */

import type { DualEvaluation } from '@shared/lib/chess/ScenarioEngine/types';

/**
 * Type guard to check if tablebase data is available with results
 * @param tablebase - The tablebase object from DualEvaluation
 * @returns true if tablebase is available with result and evaluation
 */
export function isTablebaseAvailable(
  tablebase?: DualEvaluation['tablebase']
): tablebase is { 
  isAvailable: true; 
  result: {
    wdl: number;
    dtz?: number;
    category: 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss';
    precise: boolean;
  };
  evaluation: string;
} {
  return tablebase?.isAvailable === true;
}

/**
 * Type guard to check if tablebase is explicitly not available
 * @param tablebase - The tablebase object from DualEvaluation
 * @returns true if tablebase is explicitly marked as not available
 */
export function isTablebaseNotAvailable(
  tablebase?: DualEvaluation['tablebase']
): tablebase is { isAvailable: false } {
  return tablebase?.isAvailable === false;
}

/**
 * Safe getter for tablebase result
 * @param tablebase - The tablebase object from DualEvaluation
 * @returns The tablebase result if available, undefined otherwise
 */
export function getTablebaseResult(tablebase?: DualEvaluation['tablebase']) {
  if (isTablebaseAvailable(tablebase)) {
    return tablebase.result;
  }
  return undefined;
}

/**
 * Safe getter for tablebase evaluation string
 * @param tablebase - The tablebase object from DualEvaluation
 * @returns The tablebase evaluation string if available, undefined otherwise
 */
export function getTablebaseEvaluation(tablebase?: DualEvaluation['tablebase']) {
  if (isTablebaseAvailable(tablebase)) {
    return tablebase.evaluation;
  }
  return undefined;
}