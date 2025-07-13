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

import { EngineService } from '../services/chess/EngineService';
import type { IChessEngine, EngineOptions } from '../lib/chess/IChessEngine';
import { getLogger } from '../services/logging';
import type { TrainingState } from './types';

const logger = getLogger().setContext('TrainingActions');

/**
 * Request engine to find best move for current position
 * @param fen - Current position in FEN notation
 * @param options - Engine analysis options
 * @returns Thunk function for Zustand store
 */
export const requestEngineMove = (fen: string, options?: EngineOptions) => 
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
      const engine: IChessEngine = EngineService.getInstance();
      const result = await engine.findBestMove(fen, options);
      
      logger.debug('Engine move received', { move: result.move, evaluation: result.evaluation });

      // Update store with engine move
      set((state: any) => ({
        training: {
          ...state.training,
          isEngineThinking: false,
          engineMove: result.move,
          engineStatus: 'ready'
        }
      }));

      return result.move;

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
export const requestPositionEvaluation = (fen: string, options?: EngineOptions) =>
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
      const engine: IChessEngine = EngineService.getInstance();
      const result = await engine.evaluatePosition(fen, options);
      
      logger.debug('Position evaluation received', { evaluation: result.evaluation });

      // Update store with evaluation
      set((state: any) => ({
        training: {
          ...state.training,
          currentEvaluation: {
            evaluation: result.evaluation,
            mate: result.mate,
            depth: options?.depth || 15
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

      const engine: IChessEngine = EngineService.getInstance();
      await engine.stop();
      
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

      const engine: IChessEngine = EngineService.getInstance();
      await engine.terminate();
      
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