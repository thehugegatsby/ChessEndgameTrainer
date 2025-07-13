/**
 * TEMPORARILY COMMENTED OUT - Needs refactoring for clean architecture
 * Type guard helpers for tablebase evaluation data
 * Provides type-safe access to discriminated union properties
 * 
 * TODO: Refactor for new evaluation system when tablebase integration is added
 */

// import type { DualEvaluation } from '@shared/lib/chess/ScenarioEngine/types';

/*
// TODO: Refactor these for clean architecture when tablebase integration is added

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

export function isTablebaseNotAvailable(
  tablebase?: DualEvaluation['tablebase']
): tablebase is { isAvailable: false } {
  return tablebase?.isAvailable === false;
}

export function getTablebaseResult(tablebase?: DualEvaluation['tablebase']) {
  if (isTablebaseAvailable(tablebase)) {
    return tablebase.result;
  }
  return undefined;
}

export function getTablebaseEvaluation(tablebase?: DualEvaluation['tablebase']) {
  if (isTablebaseAvailable(tablebase)) {
    return tablebase.evaluation;
  }
  return undefined;
}
*/