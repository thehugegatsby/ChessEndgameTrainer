/**
 * @file Shared types for handlePlayerMove orchestrator
 * @module store/orchestrators/handlePlayerMove/move.types
 *
 * @description
 * Type definitions shared across the handlePlayerMove orchestrator modules.
 * Centralizes data structures to prevent circular dependencies.
 */

import type { ValidatedMove } from "@shared/types/chess";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";

/**
 * Result of move execution with validation
 */
export interface MoveExecutionResult {
  fenBefore: string;
  fenAfter: string;
  validatedMove: ValidatedMove;
}

/**
 * Result of move quality evaluation
 */
export interface MoveEvaluation {
  /** Whether the move was optimal according to tablebase */
  isOptimal: boolean;
  /** WDL value before the move (from training perspective) */
  wdlBefore?: number;
  /** WDL value after the move (from training perspective) */
  wdlAfter?: number;
  /** Best move in the position */
  bestMove?: string;
}

/**
 * Context required for validating a move
 */
export interface MoveContext {
  game?: any; // ChessInstance type
  currentPosition?: TrainingPosition;
  currentFen: string;
  isGameFinished: boolean;
  sessionStartTime?: number;
  moveHistory: ValidatedMove[];
  mistakeCount: number;
  showToast?: (
    message: string,
    type: "error" | "warning" | "success" | "info",
    duration?: number,
  ) => void;
}

/**
 * Error dialog configuration for move feedback
 */
export interface MoveErrorDialog {
  isOpen: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  bestMove?: string;
}

/**
 * Success dialog configuration for move celebrations
 */
export interface MoveSuccessDialog {
  isOpen: boolean;
  promotionPiece?: string;
  moveDescription?: string;
}
