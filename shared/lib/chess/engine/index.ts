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
 * - Event-driven initialization: Emits 'ready' and 'init:failed' events
 * - Clean separation of concerns for maintainability
 */

import { Move as ChessJsMove } from 'chess.js';
import type { EngineEvaluation, EnhancedEngineEvaluation, EngineRequest, EngineResponse, EngineConfig } from './types';
import type { IWorkerFactory, WorkerConfig } from './interfaces';
import { StockfishWorkerManager } from './workerManager';
import { RequestManager } from './requestManager';
import { Logger } from '@shared/services/logging/Logger';

const logger = new Logger();

// Simple event emitter for engine events
type EngineEventListener = (...args: any[]) => void;

interface EngineEvents {
  'ready': () => void;
  'init:failed': (error: Error) => void;
}

class SimpleEventEmitter {
  private listeners: Map<string, EngineEventListener[]> = new Map();

  on(event: string, listener: EngineEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: EngineEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Import singleton for getInstance compatibility
// Lazy import to avoid circular dependency
let singletonEngine: Engine | null = null;

/**
 * Main Chess Engine class with modular architecture
 * Mobile-optimized with proper error handling and performance monitoring
 * 
 * ARCHITECTURE:
 * - workerManager: Handles Stockfish Web Worker lifecycle
 * - requestManager: Tracks pending requests with timeouts
 * - requestQueue: FIFO queue for sequential processing
 * 
 * USAGE:
 * - Production: import { engine } from './singleton'
 * - Tests: import { Engine } from './index' and create new instances
 * 
 * KNOWN ISSUES:
 * - Worker initialization can fail silently on iOS Safari
 * - Memory pressure on Android devices with <2GB RAM
 */
export class Engine {
  private workerManager: StockfishWorkerManager;
  private requestManager: RequestManager;
  private requestQueue: Array<EngineRequest> = [];
  private isProcessingQueue = false;
  
  // Event-driven initialization tracking
  private eventEmitter: SimpleEventEmitter = new SimpleEventEmitter();
  private initializationPromise: Promise<void>;
  private resolveInitialization!: () => void;
  private rejectInitialization!: (error: Error) => void;

  /**
   * Public constructor for flexible instantiation
   * @param engineConfig - Optional engine configuration
   * @param workerConfig - Optional worker configuration for dependency injection
   */
  public constructor(engineConfig?: EngineConfig, workerConfig?: WorkerConfig) {
    // Simple validation for engineConfig
    if (engineConfig) {
      if (engineConfig.maxDepth !== undefined && engineConfig.maxDepth <= 0) {
        throw new TypeError('maxDepth must be positive');
      }
      if (engineConfig.maxTime !== undefined && engineConfig.maxTime <= 0) {
        throw new TypeError('maxTime must be positive');
      }
      if (engineConfig.maxNodes !== undefined && engineConfig.maxNodes <= 0) {
        throw new TypeError('maxNodes must be positive');
      }
      if (engineConfig.useThreads !== undefined && engineConfig.useThreads !== 1) {
        throw new TypeError('useThreads must be 1 for mobile');
      }
      if (engineConfig.hashSize !== undefined && (engineConfig.hashSize <= 0 || engineConfig.hashSize > 128)) {
        throw new TypeError('hashSize must be between 1 and 128 MB');
      }
      if (engineConfig.skillLevel !== undefined && (engineConfig.skillLevel < 0 || engineConfig.skillLevel > 20)) {
        throw new TypeError('skillLevel must be between 0 and 20');
      }
    }
    
    // Simple validation for workerConfig
    if (workerConfig) {
      if (workerConfig.workerPath && workerConfig.workerPath.includes('../')) {
        throw new TypeError('workerPath cannot contain "../"');
      }
    }
    
    // Now we just pass the objects through. Much cleaner.
    this.workerManager = new StockfishWorkerManager(engineConfig, workerConfig);
    this.requestManager = new RequestManager();
    
    // Initialize the promise for async initialization tracking
    this.initializationPromise = new Promise<void>((resolve, reject) => {
      this.resolveInitialization = resolve;
      this.rejectInitialization = reject;
    });
    
    // Start async initialization but don't wait
    this.initializeEngine().catch((error) => {
      this.rejectInitialization(error);
    });
  }

  /**
   * @deprecated Use import { engine } from './singleton' for production
   * This method is kept for backward compatibility during migration
   */
  static getInstance(config?: EngineConfig): Engine {
    logger.warn('Engine.getInstance() is deprecated. Use import { engine } from "./singleton" instead.');
    
    // Return the singleton instance to ensure only one instance exists
    if (!singletonEngine) {
      // Lazy import to avoid circular dependency at module load time
      const { engine } = require('./singleton');
      singletonEngine = engine;
    }
    
    if (config) {
      logger.warn('Config parameter ignored - singleton already initialized');
    }
    
    return singletonEngine!;
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
      
      // Set up error handler
      this.workerManager.setErrorCallback((error) => {
        this.handleWorkerError(error);
      });
      
      const success = await this.workerManager.initialize();
      
      if (success) {
        this.processQueue();
        // Signal successful initialization
        this.resolveInitialization();
        this.eventEmitter.emit('ready');
      } else {
        const error = new Error('Engine initialization failed: Worker manager returned false');
        this.rejectInitialization(error);
        this.eventEmitter.emit('init:failed', error);
        throw error;
      }
    } catch (error) {
      const initError = error instanceof Error ? error : new Error(String(error));
      this.rejectInitialization(initError);
      this.eventEmitter.emit('init:failed', initError);
      throw initError;
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
   * Handles worker errors (crashes)
   */
  private handleWorkerError(error: Error): void {
    logger.error('Worker crashed, cancelling all pending requests:', error);
    
    // Cancel all pending requests
    this.requestManager.cancelAllRequests(`Worker error: ${error.message}`);
    
    // Clear the request queue
    this.requestQueue = [];
    this.isProcessingQueue = false;
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
   * Evaluates a position with enhanced data including Principal Variation
   * PHASE 2.1: Enhanced evaluation with PV for UI display
   * @param fen - Position to evaluate
   * @param includeMultiPV - Whether to include Multi-PV analysis (default: false)
   */
  async evaluatePositionEnhanced(fen: string, includeMultiPV: boolean = false): Promise<EnhancedEngineEvaluation> {
    // Lazy initialization for SSR -> Browser transition
    if (!this.workerManager.isWorkerReady() && typeof window !== 'undefined') {
      await this.workerManager.initialize();
    }
    
    if (!this.workerManager.isWorkerReady()) {
      return { score: 0, mate: null };
    }

    return new Promise<EnhancedEngineEvaluation>((resolve, reject) => {
      const id = this.requestManager.generateRequestId('evaluation');
      const timeLimit = 5000; // 5 seconds for enhanced evaluation
      
      // Enhanced request resolver that includes UCI evaluation data
      const enhancedResolver = (basicEvaluation: EngineEvaluation) => {
        try {
          // Get enhanced evaluation data from message handler
          const messageHandler = this.workerManager.getMessageHandler();
          const enhancedData = messageHandler.getEnhancedEvaluation();
          
          if (enhancedData) {
            // Merge basic evaluation with enhanced UCI data
            const enhancedEvaluation: EnhancedEngineEvaluation = {
              // Basic evaluation fields
              score: basicEvaluation.score,
              mate: basicEvaluation.mate,
              depth: basicEvaluation.depth,
              nodes: basicEvaluation.nodes,
              time: basicEvaluation.time,
              
              // Enhanced UCI fields from parser
              pv: enhancedData.pv,
              pvString: enhancedData.pvString,
              nps: enhancedData.nps,
              hashfull: enhancedData.hashfull,
              seldepth: enhancedData.seldepth,
              multipv: enhancedData.multipv,
              currmove: enhancedData.currmove,
              currmovenumber: enhancedData.currmovenumber
            };
            
            resolve(enhancedEvaluation);
          } else {
            // Fallback to basic evaluation if enhanced data unavailable
            logger.warn('Enhanced evaluation data not available, falling back to basic evaluation');
            resolve(basicEvaluation as EnhancedEngineEvaluation);
          }
        } catch (error) {
          logger.error('Error processing enhanced evaluation:', error);
          // Fallback to basic evaluation on error
          resolve(basicEvaluation as EnhancedEngineEvaluation);
        }
      };
      
      // Register the request with enhanced resolver
      this.requestManager.registerRequest(id, 'evaluation', enhancedResolver, reject, timeLimit);
      
      const request: EngineRequest = {
        type: 'evaluation',
        id,
        fen,
        timeLimit
      };
      
      // Configure Multi-PV if requested
      if (includeMultiPV) {
        try {
          this.workerManager.sendCommand('setoption name MultiPV value 3');
        } catch (error) {
          logger.warn('Failed to set MultiPV option:', error);
        }
      }
      
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
   * Returns a promise that resolves when the engine is fully initialized,
   * or rejects if initialization fails.
   * @returns Promise that resolves when engine is ready
   */
  waitForReady(): Promise<void> {
    return this.initializationPromise;
  }

  /**
   * Adds an event listener for engine events
   * @param event - Event name ('ready' or 'init:failed')
   * @param listener - Event listener function
   */
  on<K extends keyof EngineEvents>(event: K, listener: EngineEvents[K]): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Removes an event listener for engine events
   * @param event - Event name ('ready' or 'init:failed')
   * @param listener - Event listener function
   */
  off<K extends keyof EngineEvents>(event: K, listener: EngineEvents[K]): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Creates a promise that resolves when engine is ready or rejects when initialization fails
   * This is the event-driven alternative to timeout-based waiting
   * @returns Promise that resolves when ready or rejects on failure
   */
  waitForReadyEvent(): Promise<void> {
    // If already ready, resolve immediately
    if (this.isReady()) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const onReady = () => {
        this.eventEmitter.off('ready', onReady);
        this.eventEmitter.off('init:failed', onFailed);
        resolve();
      };

      const onFailed = (error: Error) => {
        this.eventEmitter.off('ready', onReady);
        this.eventEmitter.off('init:failed', onFailed);
        reject(error);
      };

      this.eventEmitter.on('ready', onReady);
      this.eventEmitter.on('init:failed', onFailed);
    });
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
      // Clean up event listeners
      this.eventEmitter.removeAllListeners();
      
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
   * Gets the current enhanced evaluation data (if available)
   * PHASE 2.1: Direct access to enhanced evaluation without new request
   * @returns Enhanced evaluation data or null if not available
   */
  getCurrentEnhancedEvaluation(): EnhancedEngineEvaluation | null {
    try {
      if (!this.workerManager.isWorkerReady()) {
        return null;
      }
      
      const messageHandler = this.workerManager.getMessageHandler();
      const enhancedData = messageHandler.getEnhancedEvaluation();
      
      if (enhancedData) {
        // Convert UCI evaluation to enhanced engine evaluation format
        return {
          score: enhancedData.score,
          mate: enhancedData.mate,
          depth: enhancedData.depth,
          nodes: enhancedData.nodes,
          time: enhancedData.time,
          
          // Enhanced fields
          pv: enhancedData.pv,
          pvString: enhancedData.pvString,
          nps: enhancedData.nps,
          hashfull: enhancedData.hashfull,
          seldepth: enhancedData.seldepth,
          multipv: enhancedData.multipv,
          currmove: enhancedData.currmove,
          currmovenumber: enhancedData.currmovenumber
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting current enhanced evaluation:', error);
      return null;
    }
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
    hasEnhancedEvaluation: boolean;
  } {
    return {
      isReady: this.isReady(),
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      requestStats: this.requestManager.getStats(),
      workerStats: this.workerManager.getStats(),
      config: this.workerManager.getConfig(),
      hasEnhancedEvaluation: this.getCurrentEnhancedEvaluation() !== null
    };
  }
}

// Re-export types for convenience
export type { EngineEvaluation, EnhancedEngineEvaluation, EngineConfig } from './types';
export type { IWorker, IWorkerFactory, WorkerConfig } from './interfaces';
export { DefaultWorkerFactory } from './interfaces';
export type { EngineState, EngineAction } from './state';
export { EngineActions, createInitialEngineState } from './state';
export { engineReducer, EngineSelectors } from './reducer';
export { EngineStateManager } from './stateManager';
export type { StateListener, Unsubscribe } from './stateManager'; 