/**
 * @fileoverview Training Actions - Async Engine Operations
 * @description Zustand thunk functions for chess engine operations
 * 
 * PRINCIPLES:
 * - Async thunks for engine communication
 * - Clean separation from store state
 * - Error handling for engine failures
 * - Stateless engine calls (pass FEN)
 */

import { getSimpleEngine } from '../lib/chess/engine/simple/SimpleEngine';
// import type { EvaluationResult } from '../lib/chess/engine/simple/SimpleEngine';
import { getLogger } from '../services/logging';
import type { TrainingState } from './types';

const logger = getLogger().setContext('TrainingActions');

/**
 * Request engine to find best move for current position
 * @param fen - Current position in FEN notation
 * @param options - Engine analysis options
 * @returns Thunk function for Zustand store
 */
export const requestEngineMove = (fen: string, options?: { depth?: number; timeout?: number }) => 
  async (_get: () => { training: TrainingState }, set: (partial: any) => void) => {
    try {
      logger.debug('Requesting engine move', { fen, options });
      
      // Set engine thinking state
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: true,
          engineStatus: 'analyzing'
        }
      }));

      // Get engine instance and find best move
      const engine = getSimpleEngine();
      const move = await engine.findBestMove(fen);
      const evaluation = await engine.evaluatePosition(fen);
      
      logger.debug('Engine move received', { move, evaluation: evaluation.score.value });

      // Update store with engine move
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineMove: move,
          engineStatus: 'ready'
        }
      }));

      return move;

    } catch (error) {
      logger.error('Engine move request failed', error);
      
      // Update store with error state
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineStatus: 'error'
        }
      }));

      throw new Error(`Engine move failed: ${error}`);
    }
  };

/**
 * Request engine to evaluate current position
 * @param fen - Current position in FEN notation
 * @param options - Engine analysis options
 * @returns Thunk function for Zustand store
 */
export const requestPositionEvaluation = (fen: string, options?: { depth?: number; timeout?: number }) =>
  async (_get: () => { training: TrainingState }, set: (partial: any) => void) => {
    try {
      logger.debug('Requesting position evaluation', { fen, options });

      // Set analyzing state
      set((state: any) => ({
        training: {
          ...state.training,
          engineStatus: 'analyzing'
        }
      }));

      // Get engine instance and evaluate position
      const engine = getSimpleEngine();
      const result = await engine.evaluatePosition(fen);
      
      logger.debug('Position evaluation received', { evaluation: result.score.value });

      // Update store with evaluation
      set((state: any) => ({
        training: {
          ...state.training,
          currentEvaluation: {
            evaluation: result.score.value,
            mate: result.score.type === 'mate' ? result.score.value : null,
            depth: result.depth
          },
          engineStatus: 'ready'
        }
      }));

      return result;

    } catch (error) {
      logger.error('Position evaluation failed', error);
      
      // Update store with error state
      set((state: any) => ({
        training: {
          ...state.training,
          engineStatus: 'error'
        }
      }));

      throw new Error(`Position evaluation failed: ${error}`);
    }
  };

/**
 * Stop current engine analysis
 * @returns Thunk function for Zustand store
 */
export const stopEngineAnalysis = () =>
  async (_get: () => { training: TrainingState }, set: (partial: any) => void) => {
    try {
      logger.debug('Stopping engine analysis');

      // SimpleEngine doesn't have stop method, just update state
      // Update store state
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineStatus: 'ready'
        }
      }));

    } catch (error) {
      logger.error('Failed to stop engine analysis', error);
    }
  };

/**
 * Terminate engine and clean up resources
 * @returns Thunk function for Zustand store
 */
export const terminateEngine = () =>
  async (_get: () => { training: TrainingState }, set: (partial: any) => void) => {
    try {
      logger.info('Terminating chess engine');

      const engine = getSimpleEngine();
      engine.terminate();
      
      // Reset engine state in store
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineMove: undefined,
          engineStatus: 'idle'
        }
      }));

    } catch (error) {
      logger.error('Failed to terminate engine', error);
    }
  };