/**
 * @file Re-export for handlePlayerMove orchestrator
 * @module store/orchestrators/handlePlayerMove
 *
 * @description
 * This file re-exports the refactored handlePlayerMove orchestrator
 * from its modularized directory structure for backward compatibility.
 *
 * @deprecated Use direct imports from './handlePlayerMove' directory instead
 */

export { handlePlayerMove } from "./handlePlayerMove/index";
export type {
  MoveEvaluation,
  MoveExecutionResult,
  WDLOutcome,
} from "./handlePlayerMove/move.types";
