import { EventEmitter } from 'events';
import { parseUciInfo } from './SimpleUCIParser';
import { validateAndSanitizeFen } from './fenValidator';
import { Logger } from '@shared/services/logging/Logger';
import { ENGINE, EVALUATION } from '@shared/constants';

const logger = new Logger();

interface EvaluationResult {
  score: { type: 'cp' | 'mate'; value: number };
  depth: number;
  pv?: string;
  nodes?: number;
  nps?: number;
  time?: number;
}

// Multi-PV specific types
interface MultiPvLine {
  multipv: number;  // Line number (1, 2, 3, ...)
  score: { type: 'cp' | 'mate'; value: number };
  depth: number;
  pv: string;       // Space-separated UCI moves
  nodes?: number;
  nps?: number;
  time?: number;
  seldepth?: number;
}

interface MultiPvResult {
  lines: MultiPvLine[];
  totalDepth: number;  // Max depth reached
}

interface EngineConfig {
  threads?: number;
  depth?: number;
  timeout?: number;
  multiPv?: number;  // Number of lines to analyze (default: 1)
}

interface UciInfo {
  multipv?: number;   // Multi-PV line number
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
  private multiPvLines: Map<number, MultiPvLine> = new Map();
  private currentMultiPv: number = 1;
  
  constructor(workerPath: string, config: EngineConfig = {}) {
    super();
    this.validateWorkerPath(workerPath);
    
    // Set configuration with defaults
    this.config = {
      threads: config.threads ?? 4,
      depth: config.depth ?? ENGINE.DEFAULT_SEARCH_DEPTH,
      timeout: config.timeout ?? 10000,
      multiPv: config.multiPv ?? 1
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
    
    // Set Multi-PV if greater than 1
    if (this.config.multiPv > 1) {
      logger.info('[SimpleEngine] Setting MultiPV', { multiPv: this.config.multiPv });
      await this.sendCommand(`setoption name MultiPV value ${this.config.multiPv}`);
    }
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

  // Multi-PV evaluation method
  async evaluatePositionMultiPV(fen: string, lines?: number): Promise<MultiPvResult> {
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

    // Clear previous multi-PV data
    this.multiPvLines.clear();
    
    // Set desired number of lines if different from config
    const desiredLines = lines ?? this.config.multiPv;
    if (desiredLines !== this.currentMultiPv) {
      await this.sendCommand(`setoption name MultiPV value ${desiredLines}`);
      this.currentMultiPv = desiredLines;
    }

    // Send position and go command
    await this.sendCommand(`position fen ${sanitizedFen}`);
    await this.sendCommand(`go depth ${this.config.depth}`);

    // Return promise that resolves when all lines are complete
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Clean up listeners before rejecting
        this.removeListener('multipv-complete', onComplete);
        this.removeListener('error', onError);
        reject(new Error('Multi-PV evaluation timeout'));
      }, this.config.timeout) as NodeJS.Timeout;

      const onComplete = () => {
        clearTimeout(timeout);
        this.removeListener('multipv-complete', onComplete);
        this.removeListener('error', onError);
        
        // Convert map to sorted array
        const lines = Array.from(this.multiPvLines.values())
          .sort((a, b) => a.multipv - b.multipv);
        
        const totalDepth = Math.max(...lines.map(l => l.depth), 0);
        
        resolve({ lines, totalDepth });
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.removeListener('multipv-complete', onComplete);
        this.removeListener('error', onError);
        reject(error);
      };

      this.once('multipv-complete', onComplete);
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
        
        // Handle Multi-PV lines
        if (info.multipv && info.score && info.depth && info.pv) {
          const multiPvLine: MultiPvLine = {
            multipv: info.multipv,
            score: info.score,
            depth: info.depth,
            pv: info.pv,
            nodes: info.nodes,
            nps: info.nps,
            time: info.time,
            seldepth: info.seldepth
          };
          this.multiPvLines.set(info.multipv, multiPvLine);
          logger.debug('[SimpleEngine] Multi-PV line stored', { multipv: info.multipv, score: info.score });
        }
        
        // For single PV evaluation (backward compatibility)
        if (!info.multipv && info.score && info.depth) {
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
      
      // For Multi-PV, emit complete event when bestmove is received
      if (this.multiPvLines.size > 0) {
        this.emit('multipv-complete');
      }
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
    
    // Always use MULTI_PV_COUNT from constants for consistent behavior
    const engineConfig: EngineConfig = {
      ...config,
      multiPv: EVALUATION.MULTI_PV_COUNT // Always use 3 for multi-PV analysis
    };
    
    logger.info('[SimpleEngine] Browser context confirmed, creating engine with config', engineConfig);
    simpleEngineInstance = new SimpleEngine('/stockfish.js', engineConfig);
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
export type { EvaluationResult, UciInfo, EngineConfig, MultiPvLine, MultiPvResult };