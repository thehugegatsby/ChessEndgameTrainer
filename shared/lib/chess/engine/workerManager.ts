/**
 * @fileoverview Stockfish Worker Manager
 * @version 1.0.0
 * @description Manages Stockfish worker lifecycle and communication
 * Optimized for mobile performance with proper error handling
 */

import { StockfishMessageHandler } from './messageHandler';
import type { EngineConfig, EngineResponse } from './types';
import type { IWorker, IWorkerFactory, WorkerConfig } from './interfaces';
import { DefaultWorkerFactory } from './interfaces';
import { getLogger } from '../../../services/logging';
import { ENGINE } from '@shared/constants';

const logger = getLogger();

/**
 * Manages the Stockfish Web Worker
 * Mobile-optimized with retry logic and error handling
 */
export class StockfishWorkerManager {
  private worker: IWorker | null = null;
  private messageHandler: StockfishMessageHandler;
  private isReady = false;
  private initializationAttempts = 0;
  private readonly maxInitAttempts = ENGINE.MAX_INIT_ATTEMPTS;
  private readyCallbacks: (() => void)[] = [];
  private responseCallback: ((response: EngineResponse) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private workerFactory: IWorkerFactory;
  private workerPath: string;
  private allowedPaths: string[];

  constructor(
    private engineConfig: EngineConfig = this.getDefaultConfig(),
    workerConfig: WorkerConfig = {}
  ) {
    // Use destructuring with default values for clean, robust handling
    const {
      workerFactory = new DefaultWorkerFactory(),
      workerPath = '/stockfish.js',
      allowedPaths = ['/stockfish.js', '/worker/stockfish.js']
    } = workerConfig;

    this.messageHandler = new StockfishMessageHandler();
    this.workerFactory = workerFactory;
    this.workerPath = workerPath;
    this.allowedPaths = allowedPaths;
  }

  /**
   * Initializes the Stockfish worker
   * Mobile-safe with SSR detection
   */
  async initialize(): Promise<boolean> {
    // Skip initialization in SSR environment
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return false;
    }

    this.initializationAttempts++;
    
    if (this.initializationAttempts > this.maxInitAttempts) {
      return false;
    }

    try {
      // Validate worker path to prevent script injection attacks
      if (!this.allowedPaths.includes(this.workerPath) || 
          this.workerPath.includes('../') || 
          this.workerPath.includes('..\\')) {
        throw new Error('Invalid worker path - potential security risk');
      }
      
      this.worker = this.workerFactory.createWorker(this.workerPath);
      this.setupWorkerEventHandlers();
      
      // UCI Protocol Step 1: Send 'uci' command
      this.worker.postMessage('uci');
      
      // Wait for 'uciok' response to confirm UCI mode
      // TODO: Implement waitForMessage helper for proper uciok handling
      // For now, use a small delay to allow uciok processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // UCI Protocol Step 2: Send 'isready' to check if engine is ready
      this.worker.postMessage('isready');
      
      // Wait for 'readyok' response
      return await this.waitForReady(ENGINE.WORKER_READY_TIMEOUT);
      
    } catch (error) {
      logger.error('Failed to initialize worker:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Sets up worker event handlers
   */
  private setupWorkerEventHandlers(): void {
    if (!this.worker) return;

    this.worker.onmessage = (e) => {
      const response = this.messageHandler.handleMessage(e.data);
      
      if (response) {
        if (response.type === 'ready' && !this.isReady) {
          this.isReady = true;
          this.notifyReady();
        } else if (response.type !== 'ready' && this.responseCallback) {
          // Forward engine responses to the callback
          this.responseCallback(response as EngineResponse);
        }
      }
    };

    this.worker.onerror = (e) => {
      logger.error('Worker error:', e);
      
      // Notify the error callback if set
      if (this.errorCallback) {
        const errorMessage = e.message || 'Worker crashed';
        this.errorCallback(new Error(errorMessage));
      }
      
      this.cleanup();
    };

    this.worker.onmessageerror = (e) => {
      logger.warn('Worker message error:', e);
      // Don't cleanup on message errors - the worker might still be functional
    };
  }

  /**
   * Waits for worker to be ready
   */
  private async waitForReady(timeoutMs: number): Promise<boolean> {
    if (this.isReady) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      this.readyCallbacks.push(() => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  /**
   * Notifies all waiting callbacks that worker is ready
   */
  private notifyReady(): void {
    this.readyCallbacks.forEach(callback => callback());
    this.readyCallbacks = [];
  }

  /**
   * Sends a command to the worker
   */
  sendCommand(command: string): void {
    if (!this.worker || !this.isReady) {
      return;
    }

    try {
      this.worker.postMessage(command);
    } catch (error) {
      logger.error('Failed to send command to worker:', error);
    }
  }

  /**
   * Checks if worker is ready
   */
  isWorkerReady(): boolean {
    return this.isReady && this.worker !== null;
  }

  /**
   * Gets the message handler for request processing
   */
  getMessageHandler(): StockfishMessageHandler {
    return this.messageHandler;
  }

  /**
   * Cleanup worker resources
   */
  cleanup(): void {
    // Always reset state, regardless of termination success
    this.isReady = false;
    this.readyCallbacks = [];
    
    try {
      if (this.worker) {
        this.worker.terminate();
      }
    } catch (error) {
      logger.warn('Error during worker termination:', error);
    } finally {
      // Always clear the worker reference
      this.worker = null;
    }
  }

  /**
   * Restarts the worker (mobile recovery)
   */
  async restart(): Promise<boolean> {
    
    this.cleanup();
    this.initializationAttempts = 0; // Reset attempt counter
    
    return await this.initialize();
  }

  /**
   * Gets default configuration for mobile devices
   */
  private getDefaultConfig(): EngineConfig {
    return {
      maxDepth: ENGINE.DEFAULT_SEARCH_DEPTH,
      maxTime: ENGINE.MAX_ENGINE_TIME,
      maxNodes: ENGINE.MAX_NODES,
      useThreads: 1,       // Single thread for mobile
      hashSize: ENGINE.HASH_SIZE,
      skillLevel: ENGINE.SKILL_LEVEL,
    };
  }

  /**
   * Updates engine configuration
   */
  updateConfig(newConfig: Partial<EngineConfig>): void {
    this.engineConfig = { ...this.engineConfig, ...newConfig };
    
    // Send configuration to engine if ready
    if (this.isWorkerReady()) {
      this.sendCommand(`setoption name Hash value ${this.engineConfig.hashSize}`);
      this.sendCommand(`setoption name Threads value ${this.engineConfig.useThreads}`);
      
      if (this.engineConfig.skillLevel !== undefined) {
        this.sendCommand(`setoption name Skill Level value ${this.engineConfig.skillLevel}`);
      }
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): EngineConfig {
    return { ...this.engineConfig };
  }

  /**
   * Sets the response callback for engine responses
   */
  setResponseCallback(callback: (response: EngineResponse) => void): void {
    this.responseCallback = callback;
  }

  /**
   * Sets the error callback for worker errors
   */
  setErrorCallback(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Gets worker statistics for debugging
   */
  getStats(): {
    isReady: boolean;
    attempts: number;
    hasWorker: boolean;
    messageStats: { messagesProcessed: number; hasCurrentRequest: boolean };
  } {
    return {
      isReady: this.isReady,
      attempts: this.initializationAttempts,
      hasWorker: this.worker !== null,
      messageStats: this.messageHandler.getStats()
    };
  }
} 