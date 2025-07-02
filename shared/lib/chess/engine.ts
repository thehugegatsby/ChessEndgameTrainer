import { Chess } from 'chess.js';
import type { Move } from '../../types/chess';

type ResolveBestMove = (move: Move | null) => void;
type ResolveEvaluation = (result: { score: number; mate: number | null }) => void;

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
  private isReady = false;
  private requestQueue: Request[] = [];
  private currentRequest: Request | null = null;
  private currentEvaluation: { score: number; mate: number | null } | null = null;
  private initializationAttempts = 0; // Track initialization attempts
  private hasLoggedWorkerStatus = false; // Prevent spam logging

  private constructor() {
    this.chess = new Chess();
    
    // Only initialize worker in browser environment (not during SSR)
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      console.log('[Engine] 🚀 Starting worker initialization...');
      this.initializeWorker();
    } else {
      console.warn('[Engine] ⚠️ Worker not available (SSR environment)');
    }
  }

  private initializeWorker() {
    try {
      if (typeof window === 'undefined') return;
      
      this.initializationAttempts++;
      if (this.initializationAttempts > 3) {
        console.error('[Engine] ❌ Too many initialization attempts, stopping');
        return;
      }
      
      console.log(`[Engine] 🔧 Creating worker (attempt ${this.initializationAttempts})`);
      this.worker = new Worker('/stockfish.js');
      
      this.worker.onerror = (e) => {
        console.error('[Engine] 💥 Worker error:', e.message);
        this.worker = null;
        this.isReady = false;
      };
      
      this.worker.onmessage = (e) => {
        this.handleMessage(e.data);
      };
      
      console.log('[Engine] 🎯 Sending UCI command to worker...');
      this.worker.postMessage('uci');
      
    } catch (error) {
      console.error('[Engine] 🔥 Failed to initialize worker:', error);
      this.worker = null;
      this.isReady = false;
    }
  }

  static getInstance(): Engine {
    // Force new instance if we're in browser but current instance has no worker
    if (Engine.instance && typeof window !== 'undefined' && !Engine.instance.worker) {
      console.log('[Engine] 🔄 Forcing new instance (no worker in browser)');
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
        console.log('[Engine] ✅ UCI ready - worker is now operational!');
        this.isReady = true;
        this.hasLoggedWorkerStatus = true;
        this.processQueue();
      } else if (message === 'readyok') {
        console.log('[Engine] ✅ Engine ready (via readyok)');
        this.isReady = true;
        this.hasLoggedWorkerStatus = true;
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
      console.error('[Engine] 💥 Error handling message:', error);
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
        console.warn('[Engine] 💥 Failed to parse move:', moveStr, error);
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
    if (!this.isReady || this.currentRequest || this.requestQueue.length === 0) {
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

  async getBestMove(fen: string, timeLimit: number = 1000): Promise<Move | null> {
    // Try to initialize worker if not available (SSR -> Browser transition)
    if (!this.worker && typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      console.log('[Engine] 🔄 Lazy worker initialization for getBestMove');
      this.initializeWorker();
      // Wait longer for worker to be ready - Stockfish needs time to compile
      await this.waitForWorkerReady(2000); // 2 seconds max
    }
    
    if (!this.worker || !this.isReady) {
      console.warn('[Engine] ⚠️ Worker not ready for getBestMove');
      return null;
    }
    
    return new Promise((resolve) => {
      this.requestQueue.push({
        type: 'bestmove',
        fen,
        resolve: resolve as ResolveBestMove,
        timeLimit
      });
      this.processQueue();
    });
  }

  async evaluatePosition(fen: string): Promise<{ score: number; mate: number | null }> {
    // Try to initialize worker if not available (SSR -> Browser transition)
    if (!this.worker && typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      console.log('[Engine] 🔄 Lazy worker initialization for evaluatePosition');
      this.initializeWorker();
      // Wait longer for worker to be ready - Stockfish needs time to compile
      await this.waitForWorkerReady(2000); // 2 seconds max
    }
    
    // If worker still not available, fallback mock (default 0)
    if (!this.worker || !this.isReady) {
      if (!this.hasLoggedWorkerStatus) {
        console.warn('[Engine] ⚠️ Worker not ready for evaluatePosition, using fallback');
      }
      return { score: 0, mate: null };
    }
    
    return new Promise((resolve) => {
      this.requestQueue.push({
        type: 'evaluation',
        fen,
        resolve: resolve as ResolveEvaluation,
        timeLimit: 5000
      });
      this.processQueue();
    });
  }

  /**
   * Wait for worker to become ready with timeout
   */
  private async waitForWorkerReady(maxWaitMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (!this.isReady && (Date.now() - startTime) < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Check every 50ms
    }
    
    if (!this.isReady) {
      console.warn(`[Engine] ⏰ Worker still not ready after ${maxWaitMs}ms`);
    } else {
      console.log(`[Engine] ✅ Worker became ready after ${Date.now() - startTime}ms`);
    }
  }

  reset() {
    this.requestQueue = [];
    this.currentRequest = null;
    this.worker?.postMessage('ucinewgame');
  }

  quit() {
    this.worker?.postMessage('quit');
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
} 