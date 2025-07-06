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
 * 
 * AI_NOTE: SINGLETON PATTERN with lazy initialization!
 * - Only ONE Engine instance exists globally (static instance)
 * - Worker is expensive on mobile (~20MB memory)
 * - getInstance() handles SSR→Browser transition gracefully
 * 
 * ARCHITECTURE:
 * - workerManager: Handles Stockfish Web Worker lifecycle
 * - requestManager: Tracks pending requests with timeouts
 * - requestQueue: FIFO queue for sequential processing
 * 
 * KNOWN ISSUES:
 * - Line 44: Force new instance if worker not ready (browser-only hack)
 * - Worker initialization can fail silently on iOS Safari
 * - Memory pressure on Android devices with <2GB RAM
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
   * 
   * AI_NOTE: Complex initialization logic here!
   * - Line 60: Checks if we're in browser (not SSR) AND worker is dead
   * - This handles Next.js SSR→Browser hydration issues
   * - Also recovers from iOS Safari worker termination
   * 
   * USAGE: Always use Engine.getInstance(), never `new Engine()`
   * CLEANUP: Call Engine.getInstance().quit() when done (mobile memory)
   */
  static getInstance(config?: EngineConfig): Engine {
    // Force new instance if we're in browser but current instance has no worker
    if (Engine.instance && typeof window !== 'undefined' && !Engine.instance.isReady()) {
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
        this.processQueue();
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * Handles responses from the worker
   */
  private handleWorkerResponse(response: EngineResponse): void {
    
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
      await this.workerManager.initialize();
    }
    
    if (!this.workerManager.isWorkerReady()) {
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
      await this.workerManager.initialize();
    }
    
    if (!this.workerManager.isWorkerReady()) {
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
   * 
   * AI_NOTE: CRITICAL QUEUE PROCESSING LOGIC
   * - Only ONE request processed at a time (isProcessingQueue flag)
   * - Stockfish is single-threaded, can't handle parallel requests
   * - Line 219: `go movetime` for quick analysis (mobile battery)
   * - Line 221: `go depth 15` for position evaluation (deeper = slower)
   * 
   * PERFORMANCE: Average request takes 100-1000ms on mobile
   * QUEUE BEHAVIOR: FIFO - first request in, first processed
   * 
   * KNOWN ISSUE: If worker crashes during processing, queue gets stuck
   * TODO: Add recovery mechanism for stuck queue
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
      
      // Only clear if handlers are available
      const messageHandler = this.workerManager.getMessageHandler();
      if (messageHandler?.clearCurrentRequest) {
        messageHandler.clearCurrentRequest();
      }
      
      if (this.requestManager?.cancelAllRequests) {
        this.requestManager.cancelAllRequests('Engine reset');
      }
      
    } catch (error) {
    }
  }

  /**
   * Shuts down the engine (mobile cleanup)
   * 
   * AI_NOTE: MUST BE CALLED on mobile to prevent memory leaks!
   * - Terminates the Web Worker (frees ~20MB)
   * - Clears singleton instance
   * - Cancels all pending requests
   * 
   * WHEN TO CALL:
   * - Component unmount (useEffect cleanup)
   * - Page navigation away from training
   * - App going to background (mobile)
   * - Memory pressure events
   * 
   * SAFE TO CALL: Multiple times, idempotent operation
   */
  quit(): void {
    try {
      // Only reset if we have a request manager initialized
      if (this.requestManager) {
        this.reset();
      }
      this.workerManager.cleanup();
      Engine.instance = null;
      
    } catch (error) {
    }
  }

  /**
   * Restarts the engine (mobile recovery)
   */
  async restart(): Promise<boolean> {
    
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