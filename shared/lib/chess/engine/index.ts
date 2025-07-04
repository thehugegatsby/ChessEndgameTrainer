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

import { Move as ChessJsMove } from 'chess.js';
import type { EngineEvaluation, EngineRequest, EngineResponse, EngineConfig } from './types';
import { StockfishWorkerManager } from './workerManager';
import { RequestManager } from './requestManager';

/**
 * Main Chess Engine class with modular architecture
 * Mobile-optimized with proper error handling and performance monitoring
 */
export class Engine {
  private static instance: Engine | null = null;
  private workerManager: StockfishWorkerManager;
  private requestManager: RequestManager;
  private requestQueue: Array<EngineRequest> = [];
  private isProcessingQueue = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config?: EngineConfig) {
    this.workerManager = new StockfishWorkerManager(config);
    this.requestManager = new RequestManager();
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
      // Set up response handler
      this.workerManager.setResponseCallback((response) => {
        this.handleWorkerResponse(response);
      });
      
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
   * Handles responses from the worker
   */
  private handleWorkerResponse(response: EngineResponse): void {
    console.debug('[Engine] Received response:', response.type, response.id);
    
    switch (response.type) {
      case 'bestmove':
        this.requestManager.resolveBestMoveRequest(response.id, response.move);
        break;
      case 'evaluation':
        this.requestManager.resolveEvaluationRequest(response.id, response.evaluation);
        break;
      case 'error':
        this.requestManager.rejectRequest(response.id, response.error);
        break;
    }
    
    // Process complete, continue with queue
    this.onRequestComplete();
  }

  /**
   * Gets the best move for a position
   * @param fen - Position to analyze
   * @param timeLimit - Time limit in milliseconds (mobile optimized)
   */
  async getBestMove(fen: string, timeLimit: number = 1000): Promise<ChessJsMove | null> {
    // Lazy initialization for SSR -> Browser transition
    if (!this.workerManager.isWorkerReady() && typeof window !== 'undefined') {
      console.log('[Engine] 🔄 Lazy initialization for getBestMove');
      await this.workerManager.initialize();
    }
    
    if (!this.workerManager.isWorkerReady()) {
      console.warn('[Engine] ⚠️ Worker not ready for getBestMove');
      return null;
    }

    return new Promise<ChessJsMove | null>((resolve, reject) => {
      const id = this.requestManager.generateRequestId('bestmove');
      
      // Register the request with timeout handling
      this.requestManager.registerRequest(id, 'bestmove', resolve, reject, timeLimit);
      
      const request: EngineRequest = {
        type: 'bestmove',
        id,
        fen,
        timeLimit
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

    return new Promise<EngineEvaluation>((resolve, reject) => {
      const id = this.requestManager.generateRequestId('evaluation');
      const timeLimit = 3000; // 3 seconds for evaluation
      
      // Register the request with timeout handling
      this.requestManager.registerRequest(id, 'evaluation', resolve, reject, timeLimit);
      
      const request: EngineRequest = {
        type: 'evaluation',
        id,
        fen,
        timeLimit
      };
      
      this.queueRequest(request);
    });
  }

  /**
   * Queues a request for processing
   */
  private queueRequest(request: EngineRequest): void {
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
      
      // Note: Timeout is now handled by RequestManager
      
    } catch (error) {
      console.error('[Engine] 💥 Error processing request:', error);
      this.requestManager.rejectRequest(request.id, `Processing error: ${error}`);
      this.onRequestComplete();
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
      this.requestManager.cancelAllRequests('Engine reset');
      
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
    requestStats: any;
    workerStats: any;
    config: EngineConfig;
  } {
    return {
      isReady: this.isReady(),
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      requestStats: this.requestManager.getStats(),
      workerStats: this.workerManager.getStats(),
      config: this.workerManager.getConfig()
    };
  }
}

// Re-export types for convenience
export type { EngineEvaluation, EngineConfig } from './types'; 