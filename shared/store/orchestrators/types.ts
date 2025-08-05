/**
 * @file Types for orchestrator functions
 * @module store/orchestrators/types
 * @description Type definitions for async orchestrators that coordinate actions across multiple slices
 */

import { RootState } from "../slices/types";
// ChessInstance imported where needed
import { Move as ChessJsMove } from "chess.js";

/**
 * Store API interface provided to orchestrators
 * @interface StoreApi
 * @description Provides access to state and actions for orchestration
 */
export interface StoreApi {
  /**
   * Gets the current store state
   * @returns {RootState} The current root state
   */
  getState: () => RootState;

  /**
   * Sets partial state (use slice actions instead when possible)
   * @param {Partial<RootState>} state - Partial state to merge
   */
  setState: (state: Partial<RootState>) => void;
}

/**
 * Move validation result
 * @interface MoveValidationResult
 */
export interface MoveValidationResult {
  valid: boolean;
  error?: string;
  move?: ChessJsMove;
  fenBefore?: string;
  fenAfter?: string;
}

/**
 * WDL (Win/Draw/Loss) perspective data
 * @interface WDLPerspective
 */
export interface WDLPerspective {
  wdlBefore: number;
  wdlAfter: number;
  wdlAfterFromTrainingPerspective: number;
  positionWorsened: boolean;
  outcomeChange?: "Win->Draw/Loss" | "Draw->Loss" | null;
}

/**
 * Tablebase evaluation result
 * @interface TablebaseEvalResult
 */
export interface TablebaseEvalResult {
  evalBefore?: any; // TablebaseResult type
  evalAfter?: any; // TablebaseResult type
  bestMove?: string;
}

/**
 * Orchestrator function type
 * @template TArgs - Arguments type
 * @template TReturn - Return type
 */
export type OrchestratorFunction<TArgs extends any[] = any[], TReturn = any> = (
  api: StoreApi,
  ...args: TArgs
) => TReturn;

/**
 * All orchestrator functions interface
 * @interface Orchestrators
 */
export interface Orchestrators {
  /**
   * Makes a user move with full validation and tablebase checking
   * @param {StoreApi} api - Store API
   * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
   * @returns {Promise<boolean>} Whether the move was successful
   */
  makeUserMove: OrchestratorFunction<
    [
      move:
        | ChessJsMove
        | { from: string; to: string; promotion?: string }
        | string,
    ],
    Promise<boolean>
  >;

  /**
   * Requests a tablebase move for the current position
   * @param {StoreApi} api - Store API
   * @returns {Promise<void>}
   */
  requestTablebaseMove: OrchestratorFunction<[], Promise<void>>;

  /**
   * Requests position evaluation from tablebase
   * @param {StoreApi} api - Store API
   * @param {string} [fen] - Optional FEN to evaluate (defaults to current position)
   * @returns {Promise<void>}
   */
  requestPositionEvaluation: OrchestratorFunction<
    [fen?: string],
    Promise<void>
  >;

  /**
   * Loads training context for a position
   * @param {StoreApi} api - Store API
   * @param {any} position - The endgame position to load
   * @returns {Promise<void>}
   */
  loadTrainingContext: OrchestratorFunction<[position: any], Promise<void>>;
}
