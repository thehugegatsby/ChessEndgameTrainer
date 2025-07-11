/**
 * @fileoverview Mock Worker Implementation for Testing
 * @description Provides deterministic worker behavior for unit tests
 */

import type { IWorker, IWorkerFactory } from '@shared/lib/chess/engine/interfaces';

/**
 * MockWorker - Test implementation of IWorker interface
 * Provides controlled behavior for testing engine functionality
 */
export class MockWorker implements IWorker {
  // Message handlers
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror?: ((event: MessageEvent) => void) | null = null;

  // Test control properties
  private isTerminated = false;
  private messageQueue: string[] = [];
  private autoRespond = true;
  private responseDelay = 0;

  // Predefined responses for common commands
  private responses: Map<string, string[]> = new Map([
    ['uci', ['uciok']],
    ['isready', ['readyok']],
    ['go movetime', ['bestmove e2e4']],
    ['go depth', ['info depth 15 score cp 30', 'bestmove e2e4']],
  ]);

  /**
   * Sends a message to the mock worker
   */
  postMessage(message: any): void {
    if (this.isTerminated) {
      throw new Error('Worker has been terminated');
    }

    this.messageQueue.push(message);

    if (this.autoRespond) {
      // Simulate async worker response
      setTimeout(() => this.processMessage(message), this.responseDelay);
    }
  }

  /**
   * Processes a message and generates appropriate response
   * 
   * TODO: Consider supporting regex or function-based matching for more
   * complex test scenarios. Current implementation uses simple string
   * prefix matching which works well for Stockfish UCI protocol.
   */
  private processMessage(message: string): void {
    if (this.isTerminated || !this.onmessage) return;

    // Check for exact match first (fastest and most specific)
    if (this.responses.has(message)) {
      const responses = this.responses.get(message)!;
      responses.forEach(response => {
        this.sendResponse(response);
      });
      return;
    }

    // For prefix matching, sort keys by length descending.
    // This ensures a more specific prefix like "go movetime" is checked
    // before a generic one like "go".
    const sortedPrefixes = [...this.responses.keys()].sort((a, b) => b.length - a.length);

    for (const prefix of sortedPrefixes) {
      if (message.startsWith(prefix)) {
        const responses = this.responses.get(prefix)!;
        responses.forEach(response => {
          this.sendResponse(response);
        });
        return;
      }
    }

    // Handle position commands
    if (message.startsWith('position fen')) {
      // Store position but don't respond
      return;
    }

    // Default: echo back for debugging
    this.sendResponse(`echo: ${message}`);
  }

  /**
   * Sends a response back via onmessage handler
   */
  private sendResponse(response: string): void {
    if (this.onmessage && !this.isTerminated) {
      const event = new MessageEvent('message', { data: response });
      this.onmessage(event);
    }
  }

  /**
   * Terminates the mock worker
   */
  terminate(): void {
    this.isTerminated = true;
    this.messageQueue = [];
  }

  // Test helper methods

  /**
   * Sets whether the worker should auto-respond to messages
   */
  setAutoRespond(enabled: boolean): void {
    this.autoRespond = enabled;
  }

  /**
   * Sets the response delay in milliseconds
   */
  setResponseDelay(ms: number): void {
    this.responseDelay = ms;
  }

  /**
   * Adds a custom response for a specific command
   */
  addResponse(command: string, responses: string[]): void {
    this.responses.set(command, responses);
  }

  /**
   * Manually triggers a response (for controlled testing)
   */
  triggerResponse(response: string): void {
    this.sendResponse(response);
  }

  /**
   * Triggers an error event
   */
  triggerError(message: string): void {
    if (this.onerror && !this.isTerminated) {
      const error = new ErrorEvent('error', { message });
      this.onerror(error);
    }
  }

  /**
   * Gets the message queue for verification
   */
  getMessageQueue(): string[] {
    return [...this.messageQueue];
  }

  /**
   * Clears the message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Checks if the worker has been terminated
   */
  isWorkerTerminated(): boolean {
    return this.isTerminated;
  }
}

/**
 * MockWorkerFactory - Creates MockWorker instances for testing
 */
export class MockWorkerFactory implements IWorkerFactory {
  private workers: MockWorker[] = [];

  createWorker(scriptURL: string | URL): IWorker {
    const worker = new MockWorker();
    this.workers.push(worker);
    return worker;
  }

  /**
   * Gets all created workers for test verification
   */
  getWorkers(): MockWorker[] {
    return [...this.workers];
  }

  /**
   * Gets the last created worker
   */
  getLastWorker(): MockWorker | null {
    return this.workers[this.workers.length - 1] || null;
  }

  /**
   * Clears all workers
   */
  clear(): void {
    this.workers = [];
  }
}

/**
 * Creates a pre-configured mock worker for common test scenarios
 */
export function createTestWorker(config?: {
  autoRespond?: boolean;
  responseDelay?: number;
  customResponses?: Map<string, string[]>;
}): MockWorker {
  const worker = new MockWorker();
  
  if (config?.autoRespond !== undefined) {
    worker.setAutoRespond(config.autoRespond);
  }
  
  if (config?.responseDelay !== undefined) {
    worker.setResponseDelay(config.responseDelay);
  }
  
  if (config?.customResponses) {
    config.customResponses.forEach((responses, command) => {
      worker.addResponse(command, responses);
    });
  }
  
  return worker;
}

/**
 * Creates a worker that simulates Stockfish initialization
 */
export function createStockfishMockWorker(): MockWorker {
  const worker = new MockWorker();
  
  // Add Stockfish initialization sequence
  worker.addResponse('uci', [
    'id name Stockfish 16',
    'id author the Stockfish developers',
    'option name Hash type spin default 16 min 1 max 33554432',
    'option name Threads type spin default 1 min 1 max 512',
    'uciok'
  ]);
  
  // Ready check
  worker.addResponse('isready', ['readyok']);
  
  // Position evaluation
  worker.addResponse('go depth 15', [
    'info depth 1 seldepth 1 score cp 30 nodes 20 nps 20000 time 1 pv e2e4',
    'info depth 15 seldepth 20 score cp 25 nodes 50000 nps 500000 time 100 pv e2e4 e7e5',
    'bestmove e2e4 ponder e7e5'
  ]);
  
  return worker;
}