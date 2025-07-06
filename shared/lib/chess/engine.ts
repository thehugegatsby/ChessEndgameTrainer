import { Chess, Move as ChessJsMove } from 'chess.js';
import { validateAndSanitizeFen, isValidFenQuick } from '../../utils/fenValidator';

type ResolveBestMove = (move: ChessJsMove | null) => void;
type ResolveEvaluation = (result: { score: number; mate: number | null }) => void;

enum EngineState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING', 
  READY = 'READY',
  ERROR = 'ERROR'
}

interface Request {
  type: 'bestmove' | 'evaluation';
  fen: string;
  resolve: ResolveBestMove | ResolveEvaluation;
  timeLimit: number;
}

export class Engine {
  private chess: Chess;
  private static instance: Engine | null = null;
  private worker: Worker | null = null;
  private state: EngineState = EngineState.IDLE;
  private readyPromise: Promise<Engine> | null = null;
  private readyResolve: ((engine: Engine) => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private requestQueue: Request[] = [];
  private currentRequest: Request | null = null;
  private currentEvaluation: { score: number; mate: number | null } | null = null;
  private initializationAttempts = 0; // Track initialization attempts
  private hasLoggedWorkerStatus = false; // Prevent spam logging

  /**
   * Validate worker path to prevent script injection attacks
   */
  private isValidWorkerPath(path: string): boolean {
    // Allow only specific whitelisted worker paths
    const allowedPaths = ['/stockfish.js', '/worker/stockfish.js'];
    return allowedPaths.includes(path) && !path.includes('../') && !path.includes('..\\');
  }

  private constructor() {
    this.chess = new Chess();
    
    // Only initialize worker in browser environment (not during SSR)
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      // Don't auto-initialize - wait for first request
    } else {
      this.state = EngineState.ERROR;
    }
  }

  /**
   * Get a promise that resolves when the engine is ready
   */
  getReadyEngine(): Promise<Engine> {
    if (this.state === EngineState.READY) {
      return Promise.resolve(this);
    }
    
    if (this.state === EngineState.ERROR) {
      return Promise.reject(new Error('Engine is in error state'));
    }
    
    if (this.state === EngineState.IDLE) {
      this.initializeWorker();
    }
    
    // Return existing promise if already initializing
    return this.readyPromise!;
  }

  private initializeWorker(): Promise<Engine> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.state = EngineState.INITIALIZING;
    
    this.readyPromise = new Promise<Engine>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    try {
      if (typeof window === 'undefined') {
        this.state = EngineState.ERROR;
        this.readyReject?.(new Error('Window not available'));
        return this.readyPromise;
      }
      
      this.initializationAttempts++;
      if (this.initializationAttempts > 3) {
        this.state = EngineState.ERROR;
        this.readyReject?.(new Error('Too many initialization attempts'));
        return this.readyPromise;
      }
      
      
      // Validate worker path to prevent injection attacks
      const workerPath = '/stockfish.js';
      if (!this.isValidWorkerPath(workerPath)) {
        throw new Error('Invalid worker path');
      }
      
      this.worker = new Worker(workerPath);
      
      this.worker.onerror = (e) => {
        this.state = EngineState.ERROR;
        this.worker = null;
        this.readyReject?.(new Error(`Worker error: ${e.message}`));
      };
      
      this.worker.onmessage = (e) => {
        this.handleMessage(e.data);
      };
      
      this.worker.postMessage('uci');
      
      // Set timeout for initialization
      setTimeout(() => {
        if (this.state === EngineState.INITIALIZING) {
          this.state = EngineState.ERROR;
          this.readyReject?.(new Error('Initialization timeout'));
        }
      }, 5000);
      
    } catch (error) {
      this.state = EngineState.ERROR;
      this.worker = null;
      this.readyReject?.(error as Error);
    }

    return this.readyPromise;
  }

  static getInstance(): Engine {
    // Force new instance if we're in browser but current instance has no worker
    if (Engine.instance && typeof window !== 'undefined' && !Engine.instance.worker) {
      Engine.instance = null;
    }
    
    if (!Engine.instance) {
      Engine.instance = new Engine();
    }
    
    return Engine.instance;
  }

  private handleMessage(message: string) {
    try {
      if (message === 'uciok' || message.trim() === 'uciok') {
        this.state = EngineState.READY;
        this.hasLoggedWorkerStatus = true;
        this.readyResolve?.(this);
        this.processQueue();
      } else if (message === 'readyok') {
        this.state = EngineState.READY;
        this.hasLoggedWorkerStatus = true;
        this.readyResolve?.(this);
        this.processQueue();
      } else if (message.startsWith('bestmove')) {
        if (this.currentRequest?.type === 'bestmove') {
          this.handleBestMoveResponse(message);
        } else if (this.currentRequest?.type === 'evaluation') {
          this.handleEvaluationResponse(message);
        }
      } else if (message.includes('score')) {
        this.handleEvaluationResponse(message);
      } else if (message.includes('info')) {
        // Silently process info messages
        return;
      }
    } catch (error) {
    }
  }

  private handleBestMoveResponse(message: string) {
    if (!this.currentRequest || this.currentRequest.type !== 'bestmove') return;
    
    const parts = message.split(' ');
    const moveStr = parts[1];
    
    if (moveStr === '(none)' || !moveStr) {
      (this.currentRequest.resolve as ResolveBestMove)(null);
    } else {
      try {
        this.chess.load(this.currentRequest.fen);
        const move = this.chess.move(moveStr);
        (this.currentRequest.resolve as ResolveBestMove)(move);
      } catch (error) {
        (this.currentRequest.resolve as ResolveBestMove)(null);
      }
    }
    
    this.currentRequest = null;
    this.processQueue();
  }

  private handleEvaluationResponse(message: string) {
    if (!this.currentRequest || this.currentRequest.type !== 'evaluation') return;
    
    // Don't process if this is a bestmove message - that signals the end
    if (message.startsWith('bestmove')) {
      // If we haven't set any evaluation yet, use default
      if (!this.currentEvaluation) {
        this.currentEvaluation = { score: 0, mate: null };
      }
      (this.currentRequest.resolve as ResolveEvaluation)(this.currentEvaluation);
      this.currentRequest = null;
      this.currentEvaluation = null;
      this.processQueue();
      return;
    }
    
    // Continue processing info messages with scores
    const scoreMatch = message.match(/score cp (-?\d+)/);
    const mateMatch = message.match(/score mate (-?\d+)/);
    
    if (mateMatch || scoreMatch) {
      let score = 0;
      let mate = null;
      
      if (mateMatch) {
        mate = parseInt(mateMatch[1]);
        score = mate > 0 ? 10000 : -10000;
      } else if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
      }
      
      // Store the latest evaluation (this will be updated as analysis progresses)
      this.currentEvaluation = { score, mate };
    }
  }

  private processQueue() {
    if (this.state !== EngineState.READY || this.currentRequest || this.requestQueue.length === 0) {
      return;
    }
    
    this.currentRequest = this.requestQueue.shift()!;
    
    if (this.currentRequest.type === 'bestmove') {
      this.worker?.postMessage(`position fen ${this.currentRequest.fen}`);
      this.worker?.postMessage(`go movetime ${this.currentRequest.timeLimit}`);
    } else if (this.currentRequest.type === 'evaluation') {
      this.worker?.postMessage(`position fen ${this.currentRequest.fen}`);
      this.worker?.postMessage(`go depth 15`);
    }
  }

  async getBestMove(fen: string, timeLimit: number = 1000): Promise<ChessJsMove | null> {
    // Validate and sanitize FEN input
    if (!isValidFenQuick(fen)) {
      return null;
    }
    
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return null;
    }
    
    try {
      // Wait for engine to be ready
      await this.getReadyEngine();
    } catch (error) {
      return null;
    }
    
    return new Promise((resolve) => {
      this.requestQueue.push({
        type: 'bestmove',
        fen: validation.sanitized,
        resolve: resolve as ResolveBestMove,
        timeLimit
      });
      this.processQueue();
    });
  }

  async getMultiPV(fen: string, lines: number = 3): Promise<Array<{ move: string; score: number; mate?: number }>> {
    // Validate and sanitize FEN input
    if (!isValidFenQuick(fen)) {
      return [];
    }
    
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return [];
    }
    
    try {
      // Wait for engine to be ready
      await this.getReadyEngine();
    } catch (error) {
      return [];
    }
    
    return new Promise((resolve) => {
      const multiPvMoves: Array<{ move: string; score: number; mate?: number }> = [];
      let pvCount = 0;
      
      const handleMessage = (e: MessageEvent) => {
        const message = e.data;
        if (typeof message === 'string') {
          // Parse multi-PV info lines
          if (message.includes('multipv')) {
            const pvMatch = message.match(/multipv (\d+)/);
            const moveMatch = message.match(/pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
            const scoreMatch = message.match(/score cp (-?\d+)/);
            const mateMatch = message.match(/score mate (-?\d+)/);
            
            if (pvMatch && moveMatch) {
              const pvIndex = parseInt(pvMatch[1]) - 1;
              const move = moveMatch[1];
              
              if (!multiPvMoves[pvIndex]) {
                multiPvMoves[pvIndex] = { move, score: 0 };
              }
              
              if (mateMatch) {
                multiPvMoves[pvIndex].mate = parseInt(mateMatch[1]);
              } else if (scoreMatch) {
                multiPvMoves[pvIndex].score = parseInt(scoreMatch[1]);
              }
            }
          }
          
          // Check if we received bestmove (search complete)
          if (message.startsWith('bestmove')) {
            this.worker?.removeEventListener('message', handleMessage);
            resolve(multiPvMoves.filter(m => m !== undefined).slice(0, lines));
          }
        }
      };
      
      if (this.worker) {
        this.worker.addEventListener('message', handleMessage);
        
        // Configure multi-PV
        this.worker.postMessage(`setoption name MultiPV value ${lines}`);
        this.worker.postMessage(`position fen ${validation.sanitized}`);
        this.worker.postMessage('go movetime 1000');
        
        // Timeout fallback
        setTimeout(() => {
          this.worker?.removeEventListener('message', handleMessage);
          resolve(multiPvMoves.filter(m => m !== undefined).slice(0, lines));
        }, 1500);
      } else {
        resolve([]);
      }
    });
  }

  async evaluatePosition(fen: string): Promise<{ score: number; mate: number | null }> {
    // Validate and sanitize FEN input
    if (!isValidFenQuick(fen)) {
      return { score: 0, mate: null };
    }
    
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return { score: 0, mate: null };
    }
    
    try {
      // Wait for engine to be ready
      await this.getReadyEngine();
    } catch (error) {
      return { score: 0, mate: null };
    }
    
    return new Promise((resolve) => {
      this.requestQueue.push({
        type: 'evaluation',
        fen: validation.sanitized,
        resolve: resolve as ResolveEvaluation,
        timeLimit: 5000
      });
      this.processQueue();
    });
  }


  reset() {
    this.requestQueue = [];
    this.currentRequest = null;
    this.worker?.postMessage('ucinewgame');
  }

  quit() {
    try {
      // Clear any pending requests
      this.requestQueue = [];
      this.currentRequest = null;
      this.currentEvaluation = null;
      
      // Reset state
      this.state = EngineState.IDLE;
      this.readyPromise = null;
      this.readyResolve = null;
      this.readyReject = null;
      
      // Properly terminate worker
      if (this.worker) {
        this.worker.postMessage('quit');
        
        // Set timeout for graceful termination
        setTimeout(() => {
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
        }, 1000);
        
        this.worker.terminate();
        this.worker = null;
      }
      
      this.initializationAttempts = 0;
      this.hasLoggedWorkerStatus = false;
      
    } catch (error) {
      // Force cleanup even if error occurs
      this.worker = null;
      this.state = EngineState.ERROR;
    }
  }
} 