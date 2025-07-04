/**
 * @fileoverview Stockfish Worker Manager
 * @version 1.0.0
 * @description Manages Stockfish worker lifecycle and communication
 * Optimized for mobile performance with proper error handling
 */

import { StockfishMessageHandler } from './messageHandler';
import type { EngineConfig, EngineResponse } from './types';

/**
 * Manages the Stockfish Web Worker
 * Mobile-optimized with retry logic and error handling
 */
export class StockfishWorkerManager {
  private worker: Worker | null = null;
  private messageHandler: StockfishMessageHandler;
  private isReady = false;
  private initializationAttempts = 0;
  private readonly maxInitAttempts = 3;
  private readyCallbacks: (() => void)[] = [];
  private responseCallback: ((response: EngineResponse) => void) | null = null;

  constructor(private config: EngineConfig = this.getDefaultConfig()) {
    this.messageHandler = new StockfishMessageHandler();
  }

  /**
   * Initializes the Stockfish worker
   * Mobile-safe with SSR detection
   */
  async initialize(): Promise<boolean> {
    // Skip initialization in SSR environment
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      console.warn('[WorkerManager] ⚠️ Worker not available (SSR environment)');
      return false;
    }

    this.initializationAttempts++;
    
    if (this.initializationAttempts > this.maxInitAttempts) {
      console.error('[WorkerManager] ❌ Max initialization attempts reached');
      return false;
    }

    try {
      console.log(`[WorkerManager] 🔧 Creating worker (attempt ${this.initializationAttempts})`);
      
      this.worker = new Worker('/stockfish.js');
      this.setupWorkerEventHandlers();
      
      // Send UCI command to initialize
      this.sendCommand('uci');
      
      // Wait for worker to be ready
      return await this.waitForReady(5000); // 5 second timeout for mobile
      
    } catch (error) {
      console.error('[WorkerManager] 🔥 Failed to initialize worker:', error);
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
      console.error('[WorkerManager] 💥 Worker error:', e.message);
      this.cleanup();
    };

    this.worker.onmessageerror = (e) => {
      console.error('[WorkerManager] 💥 Worker message error:', e);
    };
  }

  /**
   * Waits for worker to be ready
   */
  private async waitForReady(timeoutMs: number): Promise<boolean> {
    if (this.isReady) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[WorkerManager] ⏰ Worker initialization timeout');
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
    console.log('[WorkerManager] ✅ Worker ready - notifying callbacks');
    this.readyCallbacks.forEach(callback => callback());
    this.readyCallbacks = [];
  }

  /**
   * Sends a command to the worker
   */
  sendCommand(command: string): void {
    if (!this.worker || !this.isReady) {
      console.warn('[WorkerManager] ⚠️ Cannot send command - worker not ready');
      return;
    }

    try {
      this.worker.postMessage(command);
    } catch (error) {
      console.error('[WorkerManager] Failed to send command:', error);
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
    try {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      
      this.isReady = false;
      this.readyCallbacks = [];
      
      console.log('[WorkerManager] 🧹 Worker cleaned up');
    } catch (error) {
      console.warn('[WorkerManager] Cleanup error:', error);
    }
  }

  /**
   * Restarts the worker (mobile recovery)
   */
  async restart(): Promise<boolean> {
    console.log('[WorkerManager] 🔄 Restarting worker...');
    
    this.cleanup();
    this.initializationAttempts = 0; // Reset attempt counter
    
    return await this.initialize();
  }

  /**
   * Gets default configuration for mobile devices
   */
  private getDefaultConfig(): EngineConfig {
    return {
      maxDepth: 15,        // Reasonable depth for mobile
      maxTime: 2000,       // 2 seconds max
      maxNodes: 100000,    // Limit nodes for performance
      useThreads: 1,       // Single thread for mobile
      hashSize: 16,        // 16MB hash (mobile friendly)
      skillLevel: 20,      // Full strength by default
    };
  }

  /**
   * Updates engine configuration
   */
  updateConfig(newConfig: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Send configuration to engine if ready
    if (this.isWorkerReady()) {
      this.sendCommand(`setoption name Hash value ${this.config.hashSize}`);
      this.sendCommand(`setoption name Threads value ${this.config.useThreads}`);
      
      if (this.config.skillLevel !== undefined) {
        this.sendCommand(`setoption name Skill Level value ${this.config.skillLevel}`);
      }
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }

  /**
   * Sets the response callback for engine responses
   */
  setResponseCallback(callback: (response: EngineResponse) => void): void {
    this.responseCallback = callback;
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