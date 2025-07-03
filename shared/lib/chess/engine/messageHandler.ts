/**
 * @fileoverview Stockfish Message Handler
 * @version 1.0.0
 * @description Handles communication with Stockfish worker
 * Optimized for mobile performance and Android compatibility
 */

import type { Move } from '../../../types/chess';
import type { EngineEvaluation, BestMoveRequest, EvaluationRequest, WorkerMessage } from './types';
import { Chess } from 'chess.js';

/**
 * Handles all communication with the Stockfish worker
 * Mobile-optimized with proper error handling and logging
 */
export class StockfishMessageHandler {
  private chess: Chess;
  private currentRequest: BestMoveRequest | EvaluationRequest | null = null;
  private currentEvaluation: EngineEvaluation | null = null;
  private messageCount = 0; // For mobile debugging
  private uciReady = false;
  private workerManager: any = null;

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Processes incoming messages from Stockfish worker
   * Mobile-optimized with performance tracking
   */
  handleMessage(message: string): boolean {
    this.messageCount++;
    
    try {
      const trimmed = message.trim();
      
      // Handle UCI protocol responses
      if (trimmed === 'uciok') {
        this.uciReady = true;
        return this.handleUciOk();
      }
      
      if (trimmed === 'readyok') {
        return this.handleReadyOk();
      }
      
      // Handle move responses
      if (trimmed.startsWith('bestmove')) {
        return this.handleBestMove(trimmed);
      }
      
      // Handle evaluation info
      if (trimmed.includes('score')) {
        return this.handleEvaluationInfo(trimmed);
      }
      
      // Silently handle other info messages
      if (trimmed.startsWith('info')) {
        return false; // Continue processing
      }
      
      return false;
      
    } catch (error) {
      console.error('[MessageHandler] Error processing message:', error);
      return false;
    }
  }

  /**
   * Handles UCI OK response
   */
  private handleUciOk(): boolean {
    console.log('[MessageHandler] ✅ UCI protocol ready');
    return true; // Signal engine ready
  }

  /**
   * Handles Ready OK response
   */
  private handleReadyOk(): boolean {
    console.log('[MessageHandler] ✅ Engine ready');
    return true; // Signal engine ready
  }

  /**
   * Handles best move response
   * Mobile-optimized move parsing
   */
  private handleBestMove(message: string): boolean {
    if (!this.currentRequest) return false;
    
    const parts = message.split(' ');
    const moveStr = parts[1];
    
    if (this.currentRequest.type === 'bestmove') {
      this.handleBestMoveForBestMoveRequest(moveStr);
    } else if (this.currentRequest.type === 'evaluation') {
      this.handleBestMoveForEvaluationRequest();
    }
    
    return true;
  }

  /**
   * Handles best move for move request
   */
  private handleBestMoveForBestMoveRequest(moveStr: string): void {
    const request = this.currentRequest as BestMoveRequest;
    
    if (moveStr === '(none)' || !moveStr) {
      request.resolve(null);
    } else {
      try {
        this.chess.load(request.fen);
        const move = this.chess.move(moveStr);
        request.resolve(move);
      } catch (error) {
        console.warn('[MessageHandler] Failed to parse move:', moveStr, error);
        request.resolve(null);
      }
    }
    
    this.currentRequest = null;
  }

  /**
   * Handles best move for evaluation request
   */
  private handleBestMoveForEvaluationRequest(): void {
    const request = this.currentRequest as EvaluationRequest;
    
    // If we haven't set any evaluation yet, use default
    if (!this.currentEvaluation) {
      this.currentEvaluation = { score: 0, mate: null };
    }
    
    request.resolve(this.currentEvaluation);
    this.currentRequest = null;
    this.currentEvaluation = null;
  }

  /**
   * Handles evaluation information
   * Mobile-optimized parsing with error handling
   */
  private handleEvaluationInfo(message: string): boolean {
    if (!this.currentRequest || this.currentRequest.type !== 'evaluation') {
      return false;
    }
    
    try {
      const scoreMatch = message.match(/score cp (-?\d+)/);
      const mateMatch = message.match(/score mate (-?\d+)/);
      const depthMatch = message.match(/depth (\d+)/);
      const nodesMatch = message.match(/nodes (\d+)/);
      const timeMatch = message.match(/time (\d+)/);
      
      if (mateMatch || scoreMatch) {
        let score = 0;
        let mate = null;
        
        if (mateMatch) {
          mate = parseInt(mateMatch[1]);
          score = mate > 0 ? 10000 : -10000; // Large values for mate
        } else if (scoreMatch) {
          score = parseInt(scoreMatch[1]);
        }
        
        // Update current evaluation with additional info
        this.currentEvaluation = {
          score,
          mate,
          depth: depthMatch ? parseInt(depthMatch[1]) : undefined,
          nodes: nodesMatch ? parseInt(nodesMatch[1]) : undefined,
          time: timeMatch ? parseInt(timeMatch[1]) : undefined
        };
      }
      
      return false; // Continue processing more info messages
      
    } catch (error) {
      console.warn('[MessageHandler] Failed to parse evaluation:', error);
      return false;
    }
  }

  /**
   * Sets the current request for processing
   */
  setCurrentRequest(request: BestMoveRequest | EvaluationRequest): void {
    this.currentRequest = request;
    this.currentEvaluation = null; // Reset evaluation for new request
  }

  /**
   * Clears the current request (timeout/cancellation)
   */
  clearCurrentRequest(): void {
    this.currentRequest = null;
    this.currentEvaluation = null;
  }

  /**
   * Gets statistics for mobile debugging
   */
  getStats(): { messagesProcessed: number; hasCurrentRequest: boolean } {
    return {
      messagesProcessed: this.messageCount,
      hasCurrentRequest: this.currentRequest !== null
    };
  }

  /**
   * Check if UCI is ready
   */
  isUciReady(): boolean {
    return this.uciReady;
  }

  /**
   * Set worker manager
   */
  setWorkerManager(manager: any): void {
    this.workerManager = manager;
  }

  /**
   * Get worker manager
   */
  getWorkerManager(): any {
    return this.workerManager;
  }
} 