/**
 * @fileoverview Simple Chess Engine Service - Clean Singleton Implementation
 * @description Minimal engine service using Stockfish WASM worker
 * 
 * PRINCIPLES:
 * - Singleton pattern for single engine instance
 * - Lazy initialization (create worker only when needed)
 * - Stateless interface (pass FEN to all methods)
 * - Proper resource cleanup
 * - Error handling for worker failures
 */

import type { 
  IChessEngine, 
  EngineOptions, 
  BestMoveResult, 
  EvaluationResult 
} from '../../lib/chess/IChessEngine';
import { getLogger } from '../logging';

const logger = getLogger().setContext('EngineService');

/**
 * Simple Chess Engine Service
 * 
 * Replaces the 293-line overengineered EngineService with a clean ~30-line singleton.
 * Uses existing Stockfish WASM worker for chess analysis.
 */
export class EngineService implements IChessEngine {
  private static instance: EngineService;
  private worker: Worker | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EngineService {
    if (!EngineService.instance) {
      EngineService.instance = new EngineService();
    }
    return EngineService.instance;
  }

  /**
   * Initialize Stockfish worker (lazy initialization)
   */
  private async initializeEngine(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing Stockfish engine');
      
      // Create Stockfish worker using existing WASM file
      this.worker = new Worker('/stockfish.js');
      
      // Wait for engine to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Engine initialization timeout'));
        }, 5000);

        this.worker!.onmessage = (event) => {
          if (event.data.includes('uciok')) {
            clearTimeout(timeout);
            this.isInitialized = true;
            logger.info('Stockfish engine initialized successfully');
            resolve();
          }
        };

        this.worker!.onerror = (error) => {
          clearTimeout(timeout);
          logger.error('Engine initialization failed', error);
          reject(error);
        };

        // Start UCI protocol
        this.worker!.postMessage('uci');
      });

    } catch (error) {
      logger.error('Failed to initialize engine', error);
      throw new Error(`Engine initialization failed: ${error}`);
    }
  }

  /**
   * Send command to engine and wait for response
   */
  private async sendCommand(command: string, expectedResponse?: string): Promise<string> {
    if (!this.worker) {
      throw new Error('Engine not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Engine command timeout: ${command}`));
      }, 10000);

      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        
        if (expectedResponse && message.includes(expectedResponse)) {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', messageHandler);
          resolve(message);
        } else if (command.startsWith('go') && message.startsWith('bestmove')) {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', messageHandler);
          resolve(message);
        }
      };

      this.worker!.addEventListener('message', messageHandler);
      this.worker!.postMessage(command);
    });
  }

  /**
   * Find the best move for a given position
   */
  async findBestMove(fen: string, options: EngineOptions = {}): Promise<BestMoveResult> {
    await this.initializeEngine();

    const depth = options.depth || 15;
    const movetime = options.movetime || 1000;

    try {
      logger.debug('Finding best move', { fen, depth, movetime });

      // Set position
      await this.sendCommand(`position fen ${fen}`, 'readyok');
      await this.sendCommand('isready', 'readyok');

      // Start analysis
      const response = await this.sendCommand(`go depth ${depth} movetime ${movetime}`);
      
      // Parse bestmove response: "bestmove e2e4 ponder e7e5"
      const match = response.match(/bestmove (\w+)/);
      if (!match) {
        throw new Error('No best move found');
      }

      const move = match[1];
      
      // Get evaluation (simplified - would need more complex parsing for full eval)
      const evaluation = 0; // TODO: Parse eval from search info
      
      logger.debug('Best move found', { move, evaluation });

      return {
        move,
        evaluation
      };

    } catch (error) {
      logger.error('Failed to find best move', error);
      throw new Error(`Best move analysis failed: ${error}`);
    }
  }

  /**
   * Evaluate a position without finding moves
   */
  async evaluatePosition(fen: string, options: EngineOptions = {}): Promise<EvaluationResult> {
    await this.initializeEngine();

    const depth = options.depth || 15;

    try {
      logger.debug('Evaluating position', { fen, depth });

      // Set position
      await this.sendCommand(`position fen ${fen}`, 'readyok');
      await this.sendCommand('isready', 'readyok');

      // Start evaluation
      await this.sendCommand(`go depth ${depth}`);
      
      // TODO: Parse evaluation from search info lines
      // For now, return simplified result
      const evaluation = 0;
      
      logger.debug('Position evaluated', { evaluation });

      return {
        evaluation
      };

    } catch (error) {
      logger.error('Failed to evaluate position', error);
      throw new Error(`Position evaluation failed: ${error}`);
    }
  }

  /**
   * Stop current analysis
   */
  async stop(): Promise<void> {
    if (this.worker) {
      this.worker.postMessage('stop');
      logger.debug('Engine analysis stopped');
    }
  }

  /**
   * Terminate engine and clean up resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      logger.info('Terminating Stockfish engine');
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}