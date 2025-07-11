/**
 * @fileoverview Worker Interfaces for Chess Engine
 * @description Abstractions for Worker implementation to enable testing and flexibility
 */

/**
 * IWorker Interface - Abstracts Web Worker functionality
 * Enables dependency injection for testing and alternative implementations
 */
export interface IWorker {
  /**
   * Sends a message to the worker
   * @param message The message to send
   */
  postMessage(message: any): void;

  /**
   * Terminates the worker
   */
  terminate(): void;

  /**
   * Message event handler
   * Called when worker sends a message back
   */
  onmessage: ((event: MessageEvent) => void) | null;

  /**
   * Error event handler
   * Called when worker encounters an error
   */
  onerror: ((event: ErrorEvent) => void) | null;

  /**
   * Message error event handler
   * Called when worker message fails to deserialize
   */
  onmessageerror?: ((event: MessageEvent) => void) | null;
}

/**
 * IWorkerFactory Interface - Creates IWorker instances
 * Enables different worker creation strategies
 */
export interface IWorkerFactory {
  /**
   * Creates a new worker instance
   * @param scriptURL The URL of the worker script
   * @returns A new IWorker instance
   */
  createWorker(scriptURL: string | URL): IWorker;
}

/**
 * Default Worker Factory - Creates standard Web Workers
 */
export class DefaultWorkerFactory implements IWorkerFactory {
  createWorker(scriptURL: string | URL): IWorker {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers not supported in this environment');
    }
    return new Worker(scriptURL) as IWorker;
  }
}

/**
 * Worker Configuration for Engine
 */
export interface WorkerConfig {
  /**
   * Factory for creating workers
   * Defaults to DefaultWorkerFactory if not provided
   */
  workerFactory?: IWorkerFactory;

  /**
   * Path to the worker script
   * Defaults to '/stockfish.js'
   */
  workerPath?: string;

  /**
   * Allowed worker paths for security validation
   * Defaults to ['/stockfish.js', '/worker/stockfish.js']
   */
  allowedPaths?: string[];
}