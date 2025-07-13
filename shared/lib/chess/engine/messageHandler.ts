/**
 * @fileoverview Stockfish Message Handler
 * @version 2.0.0
 * @description Handles communication with Stockfish worker
 * Refactored to use serializable response pattern
 */

import type { 
  EngineEvaluation, 
  EngineRequest,
  BestMoveResponse,
  EvaluationResponse,
  ErrorResponse
} from './types';
import { Chess, Move as ChessJsMove } from 'chess.js';
import { getLogger } from '../../../services/logging';
import { parseInfo, type UCIEvaluation } from './uciParser';

const logger = getLogger();

/**
 * Internal response type including ready signal
 */
type InternalResponse = 
  | BestMoveResponse 
  | EvaluationResponse 
  | ErrorResponse 
  | { type: 'ready' };

/**
 * Handles all communication with the Stockfish worker
 * Converts UCI protocol messages to structured responses
 */
export class StockfishMessageHandler {
  private chess: Chess;
  private currentRequest: EngineRequest | null = null;
  private currentEvaluation: EngineEvaluation | null = null;
  private enhancedEvaluation: UCIEvaluation | null = null; // PHASE 1.2: Store enhanced data
  private messageCount = 0;
  private uciReady = false;

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Processes incoming messages from Stockfish worker
   * Returns a response object if one is ready, null otherwise
   */
  handleMessage(message: string): InternalResponse | null {
    this.messageCount++;
    
    try {
      const trimmed = message.trim();
      
      // Handle UCI protocol responses
      if (trimmed === 'uciok') {
        this.uciReady = true;
        return null; // Don't signal ready yet, wait for readyok
      }
      
      if (trimmed === 'readyok') {
        return { type: 'ready' };
      }
      
      // Handle move responses
      if (trimmed.startsWith('bestmove')) {
        return this.handleBestMove(trimmed);
      }
      
      // Handle evaluation info
      if (trimmed.includes('score')) {
        this.handleEvaluationInfo(trimmed);
        return null; // Continue accumulating info
      }
      
      // Silently handle other info messages
      return null;
      
    } catch (error) {
      logger.error('Error processing message:', error);
      if (this.currentRequest) {
        return {
          id: this.currentRequest.id,
          type: 'error',
          error: `Failed to process message: ${error}`
        };
      }
      return null;
    }
  }

  /**
   * Handles best move response
   */
  private handleBestMove(message: string): InternalResponse | null {
    if (!this.currentRequest) {
      logger.warn('Received bestmove without active request');
      return null;
    }
    
    const parts = message.split(' ');
    const moveStr = parts[1];
    
    try {
      if (this.currentRequest.type === 'bestmove') {
        return this.createBestMoveResponse(moveStr);
      } else if (this.currentRequest.type === 'evaluation') {
        return this.createEvaluationResponse();
      }
    } finally {
      // Clear the current request
      this.currentRequest = null;
      this.currentEvaluation = null;
    }
    
    return null;
  }

  /**
   * Creates a best move response
   */
  private createBestMoveResponse(moveStr: string): BestMoveResponse {
    const requestId = this.currentRequest!.id;
    
    if (moveStr === '(none)' || !moveStr) {
      return {
        id: requestId,
        type: 'bestmove',
        move: null
      };
    }
    
    try {
      this.chess.load(this.currentRequest!.fen);
      const move = this.chess.move(moveStr);
      
      return {
        id: requestId,
        type: 'bestmove',
        move: move
      };
    } catch (error) {
      logger.warn('Failed to parse move:', { moveStr, error });
      return {
        id: requestId,
        type: 'bestmove',
        move: null
      };
    }
  }

  /**
   * Creates an evaluation response
   */
  private createEvaluationResponse(): EvaluationResponse {
    const requestId = this.currentRequest!.id;
    
    // If we haven't set any evaluation yet, use default
    if (!this.currentEvaluation) {
      this.currentEvaluation = { score: 0, mate: null };
    }
    
    return {
      id: requestId,
      type: 'evaluation',
      evaluation: this.currentEvaluation
    };
  }

  /**
   * Handles evaluation information using enhanced UCI parser
   * PHASE 1.2: Replaced manual parsing with dedicated uciParser module
   * Accumulates evaluation data for later response
   */
  private handleEvaluationInfo(message: string): void {
    if (!this.currentRequest || this.currentRequest.type !== 'evaluation') {
      return;
    }
    
    try {
      // Use enhanced UCI parser for comprehensive evaluation parsing
      const parseResult = this.parseUCIInfo(message);
      
      if (parseResult.isValid && parseResult.evaluation) {
        // Convert enhanced UCI evaluation to legacy format for compatibility
        this.currentEvaluation = {
          score: parseResult.evaluation.score,
          mate: parseResult.evaluation.mate,
          depth: parseResult.evaluation.depth,
          nodes: parseResult.evaluation.nodes,
          time: parseResult.evaluation.time
        };
        
        // Store enhanced data for future use (Phase 2 Principal Variation)
        this.enhancedEvaluation = parseResult.evaluation;
      } else if (parseResult.errors.length > 0) {
        logger.warn('UCI parsing errors:', parseResult.errors);
      }
    } catch (error) {
      logger.warn('Failed to parse evaluation:', error);
      // Fallback to legacy parsing for robustness
      this.handleEvaluationInfoLegacy(message);
    }
  }

  /**
   * Enhanced UCI info parsing using dedicated parser module
   * PHASE 1.2: Integration point for uciParser.ts
   */
  private parseUCIInfo(message: string): { isValid: boolean; evaluation: UCIEvaluation | null; errors: string[] } {
    return parseInfo(message);
  }

  /**
   * Legacy evaluation parsing as fallback
   * Maintains backward compatibility if enhanced parser fails
   */
  private handleEvaluationInfoLegacy(message: string): void {
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
          score = mate > 0 ? 10000 : -10000;
        } else if (scoreMatch) {
          score = parseInt(scoreMatch[1]);
        }
        
        // Update current evaluation with basic info
        this.currentEvaluation = {
          score,
          mate,
          depth: depthMatch ? parseInt(depthMatch[1]) : undefined,
          nodes: nodesMatch ? parseInt(nodesMatch[1]) : undefined,
          time: timeMatch ? parseInt(timeMatch[1]) : undefined
        };
      }
    } catch (error) {
      logger.warn('Legacy evaluation parsing failed:', error);
    }
  }

  /**
   * Sets the current request for processing
   */
  setCurrentRequest(request: EngineRequest): void {
    this.currentRequest = request;
    this.currentEvaluation = null;
    this.enhancedEvaluation = null; // PHASE 1.2: Clear enhanced data too
  }

  /**
   * Clears the current request (timeout/cancellation)
   */
  clearCurrentRequest(): void {
    this.currentRequest = null;
    this.currentEvaluation = null;
    this.enhancedEvaluation = null; // PHASE 1.2: Clear enhanced data too
  }

  /**
   * Gets statistics for debugging
   * PHASE 1.2: Enhanced with parser information
   */
  getStats(): { 
    messagesProcessed: number; 
    hasCurrentRequest: boolean;
    hasEnhancedEvaluation: boolean;
    uciParserAvailable: boolean;
  } {
    return {
      messagesProcessed: this.messageCount,
      hasCurrentRequest: this.currentRequest !== null,
      hasEnhancedEvaluation: this.enhancedEvaluation !== null,
      uciParserAvailable: true // Since we import it directly now
    };
  }

  /**
   * Get enhanced evaluation data for Phase 2 integration
   * PHASE 1.2: Accessor for Principal Variation and advanced metrics
   */
  getEnhancedEvaluation(): UCIEvaluation | null {
    return this.enhancedEvaluation;
  }

  /**
   * Check if UCI is ready
   */
  isUciReady(): boolean {
    return this.uciReady;
  }
}