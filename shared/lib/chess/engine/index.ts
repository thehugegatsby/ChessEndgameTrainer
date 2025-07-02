/**
 * @fileoverview Modular Chess Engine
 * @version 2.0.0
 * @description Refactored chess engine with separated concerns
 * Optimized for mobile performance and Android compatibility
 * 
 * ARCHITECTURE:
 * - StockfishWorkerManager: Handles worker lifecycle
 * - StockfishMessageHandler: Processes worker messages
 * - RequestQueue: Manages request queuing and timeouts
 * - Clean separation of concerns for maintainability
 */

import type { Move } from '../../../types/chess';
import type { EngineEvaluation, BestMoveRequest, EvaluationRequest, EngineConfig } from './types';
import { StockfishWorkerManager } from './workerManager';

/**
 * Main Chess Engine class with modular architecture
 * Mobile-optimized with proper error handling and performance monitoring
 */
export class Engine {
  private static instance: Engine | null = null;
  private workerManager: StockfishWorkerManager;
  private requestQueue: Array<BestMoveRequest | EvaluationRequest> = [];
  private isProcessingQueue = false;
  private requestCounter = 0; // For unique request IDs

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config?: EngineConfig) {
    this.workerManager = new StockfishWorkerManager(config);
    this.initializeEngine();
  }

  /**
   * Gets singleton instance (mobile-optimized)
   */
  static getInstance(config?: EngineConfig): Engine {
    // Force new instance if we're in browser but current instance has no worker
    if (Engine.instance && typeof window !== 'undefined' && !Engine.instance.isReady()) {
      console.log('[Engine] 🔄 Forcing new instance (worker not ready)');
      Engine.instance = null;
    }
    
    if (!Engine.instance) {
      Engine.instance = new Engine(config);
    }
    
    return Engine.instance;
  }

  /**
   * Initializes the engine worker
   */
  private async initializeEngine(): Promise<void> {
    try {
      const success = await this.workerManager.initialize();
      
      if (success) {
        console.log('[Engine] ✅ Engine ready for requests');
        this.processQueue();
      } else {
        console.warn('[Engine] ⚠️ Engine initialization failed');
      }
    } catch (error) {
      console.error('[Engine] 💥 Engine initialization error:', error);
    }
  }

  /**
   * Gets the best move for a position
   * @param fen - Position to analyze
   * @param timeLimit - Time limit in milliseconds (mobile optimized)
   */
  async getBestMove(fen: string, timeLimit: number = 1000): Promise<Move | null> {
    // Lazy initialization for SSR -> Browser transition
    if (!this.workerManager.isWorkerReady() && typeof window !== 'undefined') {
      console.log('[Engine] 🔄 Lazy initialization for getBestMove');
      await this.workerManager.initialize();
    }
    
    if (!this.workerManager.isWorkerReady()) {
      console.warn('[Engine] ⚠️ Worker not ready for getBestMove');
      return null;
    }

    return new Promise<Move | null>((resolve) => {
      const request: BestMoveRequest = {
        type: 'bestmove',
        fen,
        timeLimit,
        id: `bestmove-${++this.requestCounter}`,
        resolve
      };
      
      this.queueRequest(request);
    });
  }

  /**
   * Evaluates a position
   * @param fen - Position to evaluate
   */
  async evaluatePosition(fen: string): Promise<EngineEvaluation> {
    // Lazy initialization for SSR -> Browser transition
    if (!this.workerManager.isWorkerReady() && typeof window !== 'undefined') {
      console.log('[Engine] 🔄 Lazy initialization for evaluation');
      await this.workerManager.initialize();
    }
    
    if (!this.workerManager.isWorkerReady()) {
      console.warn('[Engine] ⚠️ Worker not ready for evaluation');
      return { score: 0, mate: null };
    }

    return new Promise<EngineEvaluation>((resolve) => {
      const request: EvaluationRequest = {
        type: 'evaluation',
        fen,
        timeLimit: 3000, // 3 seconds for evaluation
        id: `eval-${++this.requestCounter}`,
        resolve
      };
      
      this.queueRequest(request);
    });
  }

  /**
   * Queues a request for processing
   */
  private queueRequest(request: BestMoveRequest | EvaluationRequest): void {
    this.requestQueue.push(request);
    this.processQueue();
  }

  /**
   * Processes the request queue
   * Mobile-optimized with proper error handling
   */
  private processQueue(): void {
    if (this.isProcessingQueue || 
        !this.workerManager.isWorkerReady() || 
        this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    const request = this.requestQueue.shift()!;
    
    try {
      // Set current request in message handler
      this.workerManager.getMessageHandler().setCurrentRequest(request);
      
      // Send commands to Stockfish
      this.workerManager.sendCommand(`position fen ${request.fen}`);
      
      if (request.type === 'bestmove') {
        this.workerManager.sendCommand(`go movetime ${request.timeLimit}`);
      } else {
        this.workerManager.sendCommand(`go depth 15`);
      }
      
      // Set timeout for mobile performance
      setTimeout(() => {
        if (this.isProcessingQueue) {
          console.warn('[Engine] ⏰ Request timeout:', request.id);
          this.handleRequestTimeout(request);
        }
      }, request.timeLimit + 1000); // Add 1 second buffer
      
    } catch (error) {
      console.error('[Engine] 💥 Error processing request:', error);
      this.handleRequestError(request, error);
    }
  }

  /**
   * Handles request completion
   */
  onRequestComplete(): void {
    this.isProcessingQueue = false;
    this.processQueue(); // Process next request
  }

  /**
   * Handles request timeout
   */
  private handleRequestTimeout(request: BestMoveRequest | EvaluationRequest): void {
    console.warn('[Engine] Request timed out:', request.id);
    
    if (request.type === 'bestmove') {
      (request as BestMoveRequest).resolve(null);
    } else {
      (request as EvaluationRequest).resolve({ score: 0, mate: null });
    }
    
    this.workerManager.getMessageHandler().clearCurrentRequest();
    this.onRequestComplete();
  }

  /**
   * Handles request error
   */
  private handleRequestError(request: BestMoveRequest | EvaluationRequest, error: any): void {
    console.error('[Engine] Request error:', error);
    
    if (request.type === 'bestmove') {
      (request as BestMoveRequest).resolve(null);
    } else {
      (request as EvaluationRequest).resolve({ score: 0, mate: null });
    }
    
    this.onRequestComplete();
  }

  /**
   * Checks if engine is ready
   */
  isReady(): boolean {
    return this.workerManager.isWorkerReady();
  }

  /**
   * Resets the engine (clears queue)
   */
  reset(): void {
    try {
      this.requestQueue = [];
      this.isProcessingQueue = false;
      this.workerManager.getMessageHandler().clearCurrentRequest();
      
      console.log('[Engine] 🔄 Engine reset');
    } catch (error) {
      console.warn('[Engine] Reset error:', error);
    }
  }

  /**
   * Shuts down the engine (mobile cleanup)
   */
  quit(): void {
    try {
      this.reset();
      this.workerManager.cleanup();
      Engine.instance = null;
      
      console.log('[Engine] 🛑 Engine shut down');
    } catch (error) {
      console.warn('[Engine] Shutdown error:', error);
    }
  }

  /**
   * Restarts the engine (mobile recovery)
   */
  async restart(): Promise<boolean> {
    console.log('[Engine] 🔄 Restarting engine...');
    
    this.reset();
    return await this.workerManager.restart();
  }

  /**
   * Updates engine configuration
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.workerManager.updateConfig(config);
  }

  /**
   * Gets engine statistics for debugging
   */
  getStats(): {
    isReady: boolean;
    queueLength: number;
    isProcessing: boolean;
    requestCounter: number;
    workerStats: any;
    config: EngineConfig;
  } {
    return {
      isReady: this.isReady(),
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      requestCounter: this.requestCounter,
      workerStats: this.workerManager.getStats(),
      config: this.workerManager.getConfig()
    };
  }
}

// Re-export types for convenience
export type { EngineEvaluation, EngineConfig } from './types'; 