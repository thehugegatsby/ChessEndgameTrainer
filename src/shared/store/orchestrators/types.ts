/**
 * @file Types for orchestrator functions
 * @module store/orchestrators/types
 * @description Type definitions for async orchestrators that coordinate actions across multiple slices
 */

import { type RootState } from "../slices/types";
// ChessInstance imported where needed
import { type Move as ChessJsMove } from "chess.js";
import type { EndgamePosition } from "@shared/types/endgame";

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
   * Sets partial state using Immer draft syntax
   * @param {(draft: RootState) => void | Partial<RootState>} updater - State updater function or partial state
   */
  setState: (updater: (draft: RootState) => void | Partial<RootState>) => void;
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
  evalBefore?: unknown; // TablebaseResult type - using unknown for flexibility
  evalAfter?: unknown; // TablebaseResult type - using unknown for flexibility
  bestMove?: string;
}

/**
 * Orchestrator function type
 * @template TArgs - Arguments type
 * @template TReturn - Return type
 */
export type OrchestratorFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
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
   * @param {EndgamePosition} position - The endgame position to load
   * @returns {Promise<void>}
   */
  loadTrainingContext: OrchestratorFunction<[position: EndgamePosition], Promise<void>>;
}
