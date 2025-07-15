import { EventEmitter } from 'events';
import { parseUciInfo } from './SimpleUCIParser';
import { validateAndSanitizeFen } from './fenValidator';
import { Logger } from '@shared/services/logging/Logger';

const logger = new Logger();

interface EvaluationResult {
  score: { type: 'cp' | 'mate'; value: number };
  depth: number;
  pv?: string;
  nodes?: number;
  nps?: number;
  time?: number;
}

interface EngineConfig {
  threads?: number;
  depth?: number;
  timeout?: number;
}

interface UciInfo {
  depth?: number;
  seldepth?: number;
  score?: { type: 'cp' | 'mate'; value: number };
  pv?: string;
  nodes?: number;
  nps?: number;
  time?: number;
}

class SimpleEngine extends EventEmitter {
  private worker: Worker | null = null;
  private isReady = false;
  private readonly config: Required<EngineConfig>;
  private initPromise: Promise<void> | null = null;
  
  constructor(workerPath: string, config: EngineConfig = {}) {
    super();
    this.validateWorkerPath(workerPath);
    
    // Set configuration with defaults
    this.config = {
      threads: config.threads ?? 4,
      depth: config.depth ?? 15,
      timeout: config.timeout ?? 10000
    };
    
    this.initPromise = this.initWorker(workerPath);
  }

  private validateWorkerPath(workerPath: string): void {
    if (!workerPath || typeof workerPath !== 'string') {
      throw new Error('Worker path must be a non-empty string');
    }
    
    if (!workerPath.endsWith('.wasm') && !workerPath.endsWith('.js')) {
      throw new Error('Worker path must end with .wasm or .js');
    }
    
    // Check for path traversal attempts
    if (workerPath.includes('..') || workerPath.includes('~')) {
      throw new Error('Worker path contains invalid characters');
    }
    
    // Ensure path starts with / or is relative
    if (!workerPath.startsWith('/') && !workerPath.startsWith('./')) {
      throw new Error('Worker path must be absolute or relative');
    }
  }

  private async initWorker(workerPath: string): Promise<void> {
    logger.info('[SimpleEngine] Starting worker initialization', { workerPath });
    try {
      logger.debug('[SimpleEngine] Creating new Worker...', { workerPath });
      this.worker = new Worker(workerPath);
      logger.info('[SimpleEngine] Worker created successfully');
      
      this.worker.onmessage = this.handleEngineMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      logger.debug('[SimpleEngine] Starting engine init...');
      // Initialize the engine
      await this.init();
      logger.info('[SimpleEngine] Engine init completed');
    } catch (error) {
      logger.error('[SimpleEngine] Worker initialization failed', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async init() {
    if (!this.worker) throw new Error('Worker not initialized');
    
    await this.sendCommand('uci');
    await this.whenReady();
    await this.sendCommand(`setoption name Threads value ${this.config.threads}`);
  }

  // Core UCI Methods
  async evaluatePosition(fen: string): Promise<EvaluationResult> {
    // Wait for initialization to complete
    await this.waitForInit();

    // Validate FEN to prevent command injection
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      throw new Error(`Invalid FEN: ${validation.errors.join(', ')}`);
    }
    const sanitizedFen = validation.sanitized!;

    // Direct evaluation without caching
    return this._evaluatePosition(sanitizedFen);
  }

  private async _evaluatePosition(sanitizedFen: string): Promise<EvaluationResult> {
    if (!this.worker) {
      throw new Error('Engine not initialized');
    }

    // Send position and go command with sanitized FEN
    await this.sendCommand(`position fen ${sanitizedFen}`);
    await this.sendCommand(`go depth ${this.config.depth}`);

    // Return promise that resolves when evaluation is complete
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Clean up listeners before rejecting
        this.removeListener('evaluation', onEvaluation);
        this.removeListener('error', onError);
        reject(new Error('Evaluation timeout'));
      }, this.config.timeout) as NodeJS.Timeout;

      const onEvaluation = (result: EvaluationResult) => {
        clearTimeout(timeout);
        this.removeListener('evaluation', onEvaluation);
        this.removeListener('error', onError);
        resolve(result);
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.removeListener('evaluation', onEvaluation);
        this.removeListener('error', onError);
        reject(error);
      };

      this.once('evaluation', onEvaluation);
      this.once('error', onError);
    });
  }

  async findBestMove(fen: string, movetime?: number): Promise<string> {
    // Wait for initialization to complete
    await this.waitForInit();

    // Validate FEN to prevent command injection
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      throw new Error(`Invalid FEN: ${validation.errors.join(', ')}`);
    }
    const sanitizedFen = validation.sanitized!;

    if (!this.worker) {
      throw new Error('Engine not initialized');
    }

    await this.sendCommand(`position fen ${sanitizedFen}`);
    
    const goCommand = movetime ? `go movetime ${movetime}` : `go depth ${this.config.depth}`;
    await this.sendCommand(goCommand);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Clean up listeners before rejecting
        this.removeListener('bestmove', onBestMove);
        this.removeListener('error', onError);
        reject(new Error('Best move timeout'));
      }, this.config.timeout) as NodeJS.Timeout;

      const onBestMove = (move: string) => {
        clearTimeout(timeout);
        this.removeListener('bestmove', onBestMove);
        this.removeListener('error', onError);
        resolve(move);
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.removeListener('bestmove', onBestMove);
        this.removeListener('error', onError);
        reject(error);
      };

      this.once('bestmove', onBestMove);
      this.once('error', onError);
    });
  }

  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  async whenReady(): Promise<void> {
    if (this.isReady) return Promise.resolve();
    
    if (!this.worker) {
      throw new Error('Engine not initialized');
    }

    this.sendCommand('isready');
    
    return new Promise((resolve) => {
      this.once('ready', resolve);
    });
  }

  private sendCommand(command: string): void {
    if (!this.worker) {
      throw new Error('Engine not initialized');
    }
    this.worker.postMessage(command);
  }

  private handleEngineMessage(event: MessageEvent<string>): void {
    const line = event.data;
    
    if (line.startsWith('info')) {
      const info = parseUciInfo(line);
      if (info) {
        this.emit('info', info);
        // Convert to EvaluationResult for final evaluation
        if (info.score && info.depth) {
          const result: EvaluationResult = {
            score: info.score,
            depth: info.depth,
            pv: info.pv,
            nodes: info.nodes,
            nps: info.nps,
            time: info.time
          };
          this.emit('evaluation', result);
        }
      }
    } else if (line.startsWith('bestmove')) {
      const bestMove = line.split(' ')[1];
      this.emit('bestmove', bestMove);
    } else if (line === 'uciok') {
      this.emit('uciok');
    } else if (line === 'readyok') {
      this.isReady = true;
      this.emit('ready');
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    this.emit('error', new Error(`Worker error: ${error.message}`));
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.removeAllListeners();
  }
}

// Singleton instance
let simpleEngineInstance: SimpleEngine | null = null;

export function getSimpleEngine(config?: EngineConfig): SimpleEngine {
  if (!simpleEngineInstance) {
    logger.info('[SimpleEngine] Creating singleton instance');
    if (typeof window === 'undefined') {
      logger.error('[SimpleEngine] Attempted to initialize in non-browser context');
      throw new Error('SimpleEngine can only be initialized in browser context');
    }
    logger.info('[SimpleEngine] Browser context confirmed, creating engine with path: /stockfish.js');
    simpleEngineInstance = new SimpleEngine('/stockfish.js', config);
  } else {
    logger.debug('[SimpleEngine] Returning existing singleton instance');
  }
  return simpleEngineInstance;
}

// Test helper to reset singleton
export function resetSimpleEngineInstance() {
  if (simpleEngineInstance) {
    simpleEngineInstance.terminate();
  }
  simpleEngineInstance = null;
}

export { SimpleEngine };
export type { EvaluationResult, UciInfo, EngineConfig };