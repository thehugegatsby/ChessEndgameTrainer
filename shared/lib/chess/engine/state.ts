/**
 * @fileoverview Engine State Management Types
 * @description Redux-like state management for Chess Engine
 * Provides predictable state updates and better debugging
 */

import type { EngineConfig, EngineEvaluation } from './types';
import type { Move as ChessJsMove } from 'chess.js';

/**
 * Engine State Interface
 * Represents the complete state of the chess engine at any point in time
 */
export interface EngineState {
  // Worker status
  worker: {
    isInitialized: boolean;
    isReady: boolean;
    initializationAttempts: number;
    lastError: string | null;
  };

  // Request processing
  requests: {
    queue: Array<{
      id: string;
      type: 'bestmove' | 'evaluation';
      fen: string;
      timestamp: number;
    }>;
    currentRequestId: string | null;
    isProcessing: boolean;
  };

  // Performance metrics
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastResponseTime: number;
    initializationTime: number | null;
  };

  // Configuration
  config: EngineConfig;

  // Last results
  lastResults: {
    bestMove: ChessJsMove | null;
    evaluation: EngineEvaluation | null;
    timestamp: number | null;
  };
}

/**
 * Base Action Interface
 */
interface BaseAction {
  type: string;
  timestamp: number;
}

/**
 * Worker Actions
 */
export interface WorkerInitStartAction extends BaseAction {
  type: 'WORKER_INIT_START';
}

export interface WorkerInitSuccessAction extends BaseAction {
  type: 'WORKER_INIT_SUCCESS';
  payload: {
    initializationTime: number;
  };
}

export interface WorkerInitFailureAction extends BaseAction {
  type: 'WORKER_INIT_FAILURE';
  payload: {
    error: string;
    attempt: number;
  };
}

export interface WorkerReadyAction extends BaseAction {
  type: 'WORKER_READY';
}

export interface WorkerErrorAction extends BaseAction {
  type: 'WORKER_ERROR';
  payload: {
    error: string;
  };
}

export interface WorkerTerminateAction extends BaseAction {
  type: 'WORKER_TERMINATE';
}

/**
 * Request Actions
 */
export interface RequestEnqueueAction extends BaseAction {
  type: 'REQUEST_ENQUEUE';
  payload: {
    id: string;
    requestType: 'bestmove' | 'evaluation';
    fen: string;
  };
}

export interface RequestStartAction extends BaseAction {
  type: 'REQUEST_START';
  payload: {
    id: string;
  };
}

export interface RequestSuccessAction extends BaseAction {
  type: 'REQUEST_SUCCESS';
  payload: {
    id: string;
    result: ChessJsMove | EngineEvaluation;
    responseTime: number;
  };
}

export interface RequestFailureAction extends BaseAction {
  type: 'REQUEST_FAILURE';
  payload: {
    id: string;
    error: string;
  };
}

export interface RequestTimeoutAction extends BaseAction {
  type: 'REQUEST_TIMEOUT';
  payload: {
    id: string;
  };
}

export interface RequestCancelAction extends BaseAction {
  type: 'REQUEST_CANCEL';
  payload: {
    id: string;
  };
}

export interface RequestCancelAllAction extends BaseAction {
  type: 'REQUEST_CANCEL_ALL';
  payload: {
    reason: string;
  };
}

/**
 * Configuration Actions
 */
export interface ConfigUpdateAction extends BaseAction {
  type: 'CONFIG_UPDATE';
  payload: Partial<EngineConfig>;
}

/**
 * State Reset Action
 */
export interface StateResetAction extends BaseAction {
  type: 'STATE_RESET';
}

/**
 * Union of all Engine Actions
 */
export type EngineAction =
  | WorkerInitStartAction
  | WorkerInitSuccessAction
  | WorkerInitFailureAction
  | WorkerReadyAction
  | WorkerErrorAction
  | WorkerTerminateAction
  | RequestEnqueueAction
  | RequestStartAction
  | RequestSuccessAction
  | RequestFailureAction
  | RequestTimeoutAction
  | RequestCancelAction
  | RequestCancelAllAction
  | ConfigUpdateAction
  | StateResetAction;

/**
 * Action Creators
 * Factory functions for creating type-safe actions
 */
export const EngineActions = {
  // Worker actions
  workerInitStart: (): WorkerInitStartAction => ({
    type: 'WORKER_INIT_START',
    timestamp: Date.now(),
  }),

  workerInitSuccess: (initializationTime: number): WorkerInitSuccessAction => ({
    type: 'WORKER_INIT_SUCCESS',
    timestamp: Date.now(),
    payload: { initializationTime },
  }),

  workerInitFailure: (error: string, attempt: number): WorkerInitFailureAction => ({
    type: 'WORKER_INIT_FAILURE',
    timestamp: Date.now(),
    payload: { error, attempt },
  }),

  workerReady: (): WorkerReadyAction => ({
    type: 'WORKER_READY',
    timestamp: Date.now(),
  }),

  workerError: (error: string): WorkerErrorAction => ({
    type: 'WORKER_ERROR',
    timestamp: Date.now(),
    payload: { error },
  }),

  workerTerminate: (): WorkerTerminateAction => ({
    type: 'WORKER_TERMINATE',
    timestamp: Date.now(),
  }),

  // Request actions
  requestEnqueue: (
    id: string,
    requestType: 'bestmove' | 'evaluation',
    fen: string
  ): RequestEnqueueAction => ({
    type: 'REQUEST_ENQUEUE',
    timestamp: Date.now(),
    payload: { id, requestType, fen },
  }),

  requestStart: (id: string): RequestStartAction => ({
    type: 'REQUEST_START',
    timestamp: Date.now(),
    payload: { id },
  }),

  requestSuccess: (
    id: string,
    result: ChessJsMove | EngineEvaluation,
    responseTime: number
  ): RequestSuccessAction => ({
    type: 'REQUEST_SUCCESS',
    timestamp: Date.now(),
    payload: { id, result, responseTime },
  }),

  requestFailure: (id: string, error: string): RequestFailureAction => ({
    type: 'REQUEST_FAILURE',
    timestamp: Date.now(),
    payload: { id, error },
  }),

  requestTimeout: (id: string): RequestTimeoutAction => ({
    type: 'REQUEST_TIMEOUT',
    timestamp: Date.now(),
    payload: { id },
  }),

  requestCancel: (id: string): RequestCancelAction => ({
    type: 'REQUEST_CANCEL',
    timestamp: Date.now(),
    payload: { id },
  }),

  requestCancelAll: (reason: string): RequestCancelAllAction => ({
    type: 'REQUEST_CANCEL_ALL',
    timestamp: Date.now(),
    payload: { reason },
  }),

  // Config actions
  configUpdate: (config: Partial<EngineConfig>): ConfigUpdateAction => ({
    type: 'CONFIG_UPDATE',
    timestamp: Date.now(),
    payload: config,
  }),

  // State reset
  stateReset: (): StateResetAction => ({
    type: 'STATE_RESET',
    timestamp: Date.now(),
  }),
};

/**
 * Initial Engine State
 * Factory function for creating a fresh engine state
 */
export function createInitialEngineState(config?: Partial<EngineConfig>): EngineState {
  return {
    worker: {
      isInitialized: false,
      isReady: false,
      initializationAttempts: 0,
      lastError: null,
    },
    requests: {
      queue: [],
      currentRequestId: null,
      isProcessing: false,
    },
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      initializationTime: null,
    },
    config: {
      maxDepth: 15,
      maxTime: 1000,
      maxNodes: 1000000,
      useThreads: 1,
      hashSize: 16,
      skillLevel: 20,
      ...config,
    },
    lastResults: {
      bestMove: null,
      evaluation: null,
      timestamp: null,
    },
  };
}

/**
 * Type guard to check if a result is a ChessJsMove
 */
export function isChessMove(result: ChessJsMove | EngineEvaluation): result is ChessJsMove {
  return 'from' in result && 'to' in result;
}

/**
 * Type guard to check if a result is an EngineEvaluation
 */
export function isEngineEvaluation(result: ChessJsMove | EngineEvaluation): result is EngineEvaluation {
  return 'score' in result && 'mate' in result;
}