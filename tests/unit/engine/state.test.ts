/**
 * @fileoverview Tests for Engine State Management
 * @description Tests for state types, action creators, and reducer
 */

import {
  createInitialEngineState,
  EngineActions,
  EngineState,
  isChessMove,
  isEngineEvaluation,
} from '@shared/lib/chess/engine/state';
import { engineReducer, EngineSelectors } from '@shared/lib/chess/engine/reducer';
import type { ChessJsMove } from 'chess.js';
import type { EngineEvaluation } from '@shared/lib/chess/engine/types';

describe('Engine State Management', () => {
  describe('Initial State', () => {
    it('should create initial state with defaults', () => {
      const state = createInitialEngineState();
      
      expect(state.worker.isInitialized).toBe(false);
      expect(state.worker.isReady).toBe(false);
      expect(state.worker.initializationAttempts).toBe(0);
      expect(state.worker.lastError).toBeNull();
      
      expect(state.requests.queue).toEqual([]);
      expect(state.requests.currentRequestId).toBeNull();
      expect(state.requests.isProcessing).toBe(false);
      
      expect(state.metrics.totalRequests).toBe(0);
      expect(state.metrics.successfulRequests).toBe(0);
      expect(state.metrics.failedRequests).toBe(0);
      
      expect(state.config.maxDepth).toBe(15);
      expect(state.config.maxTime).toBe(1000);
      expect(state.config.useThreads).toBe(1);
    });

    it('should create initial state with custom config', () => {
      const customConfig = {
        maxDepth: 20,
        maxTime: 2000,
        hashSize: 32,
      };
      
      const state = createInitialEngineState(customConfig);
      
      expect(state.config.maxDepth).toBe(20);
      expect(state.config.maxTime).toBe(2000);
      expect(state.config.hashSize).toBe(32);
      expect(state.config.useThreads).toBe(1); // Default unchanged
    });
  });

  describe('Action Creators', () => {
    it('should create worker actions with timestamps', () => {
      const startAction = EngineActions.workerInitStart();
      expect(startAction.type).toBe('WORKER_INIT_START');
      expect(startAction.timestamp).toBeGreaterThan(0);

      const successAction = EngineActions.workerInitSuccess(1500);
      expect(successAction.type).toBe('WORKER_INIT_SUCCESS');
      expect(successAction.payload.initializationTime).toBe(1500);

      const errorAction = EngineActions.workerError('Test error');
      expect(errorAction.type).toBe('WORKER_ERROR');
      expect(errorAction.payload.error).toBe('Test error');
    });

    it('should create request actions with proper payloads', () => {
      const enqueueAction = EngineActions.requestEnqueue('req-1', 'bestmove', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(enqueueAction.type).toBe('REQUEST_ENQUEUE');
      expect(enqueueAction.payload.id).toBe('req-1');
      expect(enqueueAction.payload.requestType).toBe('bestmove');

      const mockMove: ChessJsMove = { from: 'e2', to: 'e4' };
      const successAction = EngineActions.requestSuccess('req-1', mockMove, 150);
      expect(successAction.type).toBe('REQUEST_SUCCESS');
      expect(successAction.payload.result).toEqual(mockMove);
      expect(successAction.payload.responseTime).toBe(150);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify ChessJsMove', () => {
      const move: ChessJsMove = { from: 'e2', to: 'e4' };
      const evaluation: EngineEvaluation = { score: 100, mate: null };

      expect(isChessMove(move)).toBe(true);
      expect(isChessMove(evaluation)).toBe(false);
    });

    it('should correctly identify EngineEvaluation', () => {
      const move: ChessJsMove = { from: 'e2', to: 'e4' };
      const evaluation: EngineEvaluation = { score: 100, mate: null };

      expect(isEngineEvaluation(evaluation)).toBe(true);
      expect(isEngineEvaluation(move)).toBe(false);
    });
  });

  describe('Engine Reducer', () => {
    let initialState: EngineState;

    beforeEach(() => {
      initialState = createInitialEngineState();
    });

    describe('Worker Actions', () => {
      it('should handle WORKER_INIT_START', () => {
        const action = EngineActions.workerInitStart();
        const newState = engineReducer(initialState, action);

        expect(newState.worker.initializationAttempts).toBe(1);
        expect(newState.worker.isInitialized).toBe(false);
        expect(newState.worker.isReady).toBe(false);
      });

      it('should handle WORKER_INIT_SUCCESS', () => {
        const action = EngineActions.workerInitSuccess(1234);
        const newState = engineReducer(initialState, action);

        expect(newState.worker.isInitialized).toBe(true);
        expect(newState.metrics.initializationTime).toBe(1234);
      });

      it('should handle WORKER_READY', () => {
        const action = EngineActions.workerReady();
        const newState = engineReducer(initialState, action);

        expect(newState.worker.isReady).toBe(true);
      });

      it('should handle WORKER_TERMINATE', () => {
        // Set up some state first
        const stateWithWorker = {
          ...initialState,
          worker: {
            isInitialized: true,
            isReady: true,
            initializationAttempts: 3,
            lastError: null,
          },
          requests: {
            queue: [{ id: 'req-1', type: 'bestmove' as const, fen: 'test', timestamp: 123 }],
            currentRequestId: 'req-1',
            isProcessing: true,
          },
        };

        const action = EngineActions.workerTerminate();
        const newState = engineReducer(stateWithWorker, action);

        expect(newState.worker.isInitialized).toBe(false);
        expect(newState.worker.isReady).toBe(false);
        expect(newState.worker.initializationAttempts).toBe(0);
        expect(newState.requests.queue).toEqual([]);
        expect(newState.requests.isProcessing).toBe(false);
      });
    });

    describe('Request Actions', () => {
      it('should handle REQUEST_ENQUEUE', () => {
        const action = EngineActions.requestEnqueue('req-1', 'bestmove', 'test-fen');
        const newState = engineReducer(initialState, action);

        expect(newState.requests.queue).toHaveLength(1);
        expect(newState.requests.queue[0].id).toBe('req-1');
        expect(newState.metrics.totalRequests).toBe(1);
      });

      it('should handle REQUEST_START', () => {
        // First enqueue a request
        const enqueueAction = EngineActions.requestEnqueue('req-1', 'bestmove', 'test-fen');
        const stateWithQueue = engineReducer(initialState, enqueueAction);

        const startAction = EngineActions.requestStart('req-1');
        const newState = engineReducer(stateWithQueue, startAction);

        expect(newState.requests.currentRequestId).toBe('req-1');
        expect(newState.requests.isProcessing).toBe(true);
        expect(newState.requests.queue).toHaveLength(0); // Removed from queue
      });

      it('should handle REQUEST_SUCCESS with move result', () => {
        const stateWithRequest = {
          ...initialState,
          requests: {
            ...initialState.requests,
            currentRequestId: 'req-1',
            isProcessing: true,
          },
        };

        const move: ChessJsMove = { from: 'e2', to: 'e4' };
        const action = EngineActions.requestSuccess('req-1', move, 100);
        const newState = engineReducer(stateWithRequest, action);

        expect(newState.requests.currentRequestId).toBeNull();
        expect(newState.requests.isProcessing).toBe(false);
        expect(newState.metrics.successfulRequests).toBe(1);
        expect(newState.metrics.averageResponseTime).toBe(100);
        expect(newState.lastResults.bestMove).toEqual(move);
      });

      it('should handle REQUEST_SUCCESS with evaluation result', () => {
        const evaluation: EngineEvaluation = { score: 50, mate: null };
        const action = EngineActions.requestSuccess('req-1', evaluation, 200);
        const newState = engineReducer(initialState, action);

        expect(newState.lastResults.evaluation).toEqual(evaluation);
        expect(newState.metrics.successfulRequests).toBe(1);
      });

      it('should calculate average response time correctly', () => {
        let state = initialState;

        // First request: 100ms
        const action1 = EngineActions.requestSuccess('req-1', { from: 'e2', to: 'e4' }, 100);
        state = engineReducer(state, action1);
        expect(state.metrics.averageResponseTime).toBe(100);

        // Second request: 200ms, average should be 150ms
        const action2 = EngineActions.requestSuccess('req-2', { from: 'd2', to: 'd4' }, 200);
        state = engineReducer(state, action2);
        expect(state.metrics.averageResponseTime).toBe(150);

        // Third request: 300ms, average should be 200ms
        const action3 = EngineActions.requestSuccess('req-3', { from: 'g1', to: 'f3' }, 300);
        state = engineReducer(state, action3);
        expect(state.metrics.averageResponseTime).toBe(200);
      });

      it('should handle REQUEST_FAILURE', () => {
        const action = EngineActions.requestFailure('req-1', 'Engine error');
        const newState = engineReducer(initialState, action);

        expect(newState.metrics.failedRequests).toBe(1);
      });

      it('should handle REQUEST_CANCEL_ALL', () => {
        const stateWithRequests = {
          ...initialState,
          requests: {
            queue: [
              { id: 'req-1', type: 'bestmove' as const, fen: 'test1', timestamp: 123 },
              { id: 'req-2', type: 'evaluation' as const, fen: 'test2', timestamp: 124 },
            ],
            currentRequestId: 'req-0',
            isProcessing: true,
          },
        };

        const action = EngineActions.requestCancelAll('Reset');
        const newState = engineReducer(stateWithRequests, action);

        expect(newState.requests.queue).toEqual([]);
        expect(newState.requests.currentRequestId).toBeNull();
        expect(newState.requests.isProcessing).toBe(false);
      });
    });

    describe('Config Actions', () => {
      it('should handle CONFIG_UPDATE', () => {
        const action = EngineActions.configUpdate({
          maxDepth: 25,
          hashSize: 64,
        });
        const newState = engineReducer(initialState, action);

        expect(newState.config.maxDepth).toBe(25);
        expect(newState.config.hashSize).toBe(64);
        expect(newState.config.maxTime).toBe(1000); // Unchanged
      });
    });

    describe('State Reset', () => {
      it('should handle STATE_RESET preserving config', () => {
        const modifiedState = {
          ...initialState,
          worker: { ...initialState.worker, isReady: true },
          metrics: { ...initialState.metrics, totalRequests: 100 },
          config: { ...initialState.config, maxDepth: 30 },
        };

        const action = EngineActions.stateReset();
        const newState = engineReducer(modifiedState, action);

        expect(newState.worker.isReady).toBe(false);
        expect(newState.metrics.totalRequests).toBe(0);
        expect(newState.config.maxDepth).toBe(30); // Config preserved
      });
    });
  });

  describe('Selectors', () => {
    it('should select worker ready state', () => {
      const state = createInitialEngineState();
      expect(EngineSelectors.isWorkerReady(state)).toBe(false);

      const readyState = {
        ...state,
        worker: {
          ...state.worker,
          isInitialized: true,
          isReady: true,
        },
      };
      expect(EngineSelectors.isWorkerReady(readyState)).toBe(true);
    });

    it('should calculate success rate', () => {
      const state = {
        ...createInitialEngineState(),
        metrics: {
          ...createInitialEngineState().metrics,
          totalRequests: 10,
          successfulRequests: 7,
          failedRequests: 3,
        },
      };

      expect(EngineSelectors.getSuccessRate(state)).toBe(70);
    });

    it('should handle zero requests in success rate', () => {
      const state = createInitialEngineState();
      expect(EngineSelectors.getSuccessRate(state)).toBe(0);
    });
  });
});