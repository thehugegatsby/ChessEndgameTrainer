/**
 * @fileoverview Engine State Reducer
 * @description Redux-like reducer for managing engine state transitions
 * Pure function that handles all state updates immutably
 */

import type { EngineState, EngineAction } from './state';
import { createInitialEngineState, isChessMove, isEngineEvaluation } from './state';

/**
 * Engine State Reducer
 * Pure function that takes current state and an action, returns new state
 * 
 * @param state Current engine state
 * @param action Action to process
 * @returns New engine state (immutable update)
 */
export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    // Worker lifecycle actions
    case 'WORKER_INIT_START':
      return {
        ...state,
        worker: {
          ...state.worker,
          isInitialized: false,
          isReady: false,
          initializationAttempts: state.worker.initializationAttempts + 1,
          lastError: null,
        },
      };

    case 'WORKER_INIT_SUCCESS':
      return {
        ...state,
        worker: {
          ...state.worker,
          isInitialized: true,
          lastError: null,
        },
        metrics: {
          ...state.metrics,
          initializationTime: action.payload.initializationTime,
        },
      };

    case 'WORKER_INIT_FAILURE':
      return {
        ...state,
        worker: {
          ...state.worker,
          isInitialized: false,
          isReady: false,
          lastError: action.payload.error,
        },
      };

    case 'WORKER_READY':
      return {
        ...state,
        worker: {
          ...state.worker,
          isReady: true,
        },
      };

    case 'WORKER_ERROR':
      return {
        ...state,
        worker: {
          ...state.worker,
          lastError: action.payload.error,
        },
      };

    case 'WORKER_TERMINATE':
      return {
        ...state,
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
      };

    // Request management actions
    case 'REQUEST_ENQUEUE':
      return {
        ...state,
        requests: {
          ...state.requests,
          queue: [
            ...state.requests.queue,
            {
              id: action.payload.id,
              type: action.payload.requestType,
              fen: action.payload.fen,
              timestamp: action.timestamp,
            },
          ],
        },
        metrics: {
          ...state.metrics,
          totalRequests: state.metrics.totalRequests + 1,
        },
      };

    case 'REQUEST_START':
      return {
        ...state,
        requests: {
          ...state.requests,
          currentRequestId: action.payload.id,
          isProcessing: true,
          // Remove from queue
          queue: state.requests.queue.filter(req => req.id !== action.payload.id),
        },
      };

    case 'REQUEST_SUCCESS': {
      const responseTime = action.payload.responseTime;
      const newSuccessCount = state.metrics.successfulRequests + 1;
      const totalResponseTime = state.metrics.averageResponseTime * state.metrics.successfulRequests + responseTime;
      const newAverageResponseTime = totalResponseTime / newSuccessCount;

      // Update last results based on result type
      const lastResults = { ...state.lastResults };
      if (isChessMove(action.payload.result)) {
        lastResults.bestMove = action.payload.result;
        lastResults.timestamp = action.timestamp;
      } else if (isEngineEvaluation(action.payload.result)) {
        lastResults.evaluation = action.payload.result;
        lastResults.timestamp = action.timestamp;
      }

      return {
        ...state,
        requests: {
          ...state.requests,
          currentRequestId: null,
          isProcessing: false,
        },
        metrics: {
          ...state.metrics,
          successfulRequests: newSuccessCount,
          averageResponseTime: newAverageResponseTime,
          lastResponseTime: responseTime,
        },
        lastResults,
      };
    }

    case 'REQUEST_FAILURE':
    case 'REQUEST_TIMEOUT':
      return {
        ...state,
        requests: {
          ...state.requests,
          currentRequestId: state.requests.currentRequestId === action.payload.id 
            ? null 
            : state.requests.currentRequestId,
          isProcessing: state.requests.currentRequestId === action.payload.id 
            ? false 
            : state.requests.isProcessing,
          // Remove from queue if still there
          queue: state.requests.queue.filter(req => req.id !== action.payload.id),
        },
        metrics: {
          ...state.metrics,
          failedRequests: state.metrics.failedRequests + 1,
        },
      };

    case 'REQUEST_CANCEL':
      return {
        ...state,
        requests: {
          ...state.requests,
          currentRequestId: state.requests.currentRequestId === action.payload.id 
            ? null 
            : state.requests.currentRequestId,
          isProcessing: state.requests.currentRequestId === action.payload.id 
            ? false 
            : state.requests.isProcessing,
          queue: state.requests.queue.filter(req => req.id !== action.payload.id),
        },
      };

    case 'REQUEST_CANCEL_ALL':
      return {
        ...state,
        requests: {
          queue: [],
          currentRequestId: null,
          isProcessing: false,
        },
      };

    // Configuration update
    case 'CONFIG_UPDATE':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };

    // State reset
    case 'STATE_RESET':
      return createInitialEngineState(state.config);

    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustiveCheck: never = action;
      return state;
  }
}

/**
 * Selector functions for accessing state
 */
export const EngineSelectors = {
  // Worker selectors
  isWorkerReady: (state: EngineState): boolean => 
    state.worker.isInitialized && state.worker.isReady,

  getWorkerError: (state: EngineState): string | null => 
    state.worker.lastError,

  getInitializationAttempts: (state: EngineState): number =>
    state.worker.initializationAttempts,

  // Request selectors
  isProcessing: (state: EngineState): boolean => 
    state.requests.isProcessing,

  getQueueLength: (state: EngineState): number => 
    state.requests.queue.length,

  getCurrentRequestId: (state: EngineState): string | null =>
    state.requests.currentRequestId,

  // Metrics selectors
  getMetrics: (state: EngineState) => state.metrics,

  getSuccessRate: (state: EngineState): number => {
    const total = state.metrics.totalRequests;
    if (total === 0) return 0;
    return (state.metrics.successfulRequests / total) * 100;
  },

  // Result selectors
  getLastBestMove: (state: EngineState) => state.lastResults.bestMove,
  
  getLastEvaluation: (state: EngineState) => state.lastResults.evaluation,

  // Config selectors
  getConfig: (state: EngineState) => state.config,
};

/**
 * Middleware-like logger for debugging state transitions
 * Use in development to track state changes
 */
export function createStateLogger() {
  return (state: EngineState, action: EngineAction, nextState: EngineState) => {
    console.group(`Engine Action: ${action.type}`);
    console.log('Previous State:', state);
    console.log('Action:', action);
    console.log('Next State:', nextState);
    console.groupEnd();
  };
}