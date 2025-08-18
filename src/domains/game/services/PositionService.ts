/**
 * @file Position Service Implementation
 * @module domains/game/services/PositionService
 * @description Implementation of position management, FEN handling, and position evaluation
 */

import { getLogger } from '@shared/services/logging/Logger';
import { ErrorService } from '@shared/services/ErrorService';
import type { ChessGameLogicInterface } from '@domains/game/engine/types';
import type { ValidatedMove } from '@shared/types/chess';
import type { 
  PositionServiceInterface, 
  PositionEvaluationResult,
  MoveQualityResult
} from './PositionServiceInterface';

/**
 * Position Service implementation
 * 
 * Handles FEN loading, position evaluation, and move quality assessment.
 * Uses ChessGameLogic for position management and tablebase for evaluation.
 */
export class PositionService implements PositionServiceInterface {
  private _chessGameLogic: ChessGameLogicInterface;
  private logger = getLogger().setContext('PositionService');

  constructor(chessGameLogic: ChessGameLogicInterface) {
    this._chessGameLogic = chessGameLogic;
  }

  loadPosition(fen: string): Promise<boolean> {
    try {
      const result = this._chessGameLogic.loadFen(fen);
      return Promise.resolve(result);
    } catch (error) {
      ErrorService.handleUIError(
        error as Error,
        'PositionService',
        {
          action: 'load-position',
          additionalData: { fen }
        }
      );
      this.logger.error('Failed to load FEN in PositionService', error);
      return Promise.resolve(false);
    }
  }

  getCurrentFen(): string | null {
    return this._chessGameLogic.getFen();
  }

  createEvaluationBaseline(wdl: number, fen: string): { wdl: number; fen: string; timestamp: number } {
    return {
      wdl,
      fen,
      timestamp: Date.now(),
    };
  }

  evaluatePosition(_fen?: string): Promise<PositionEvaluationResult | null> {
    // TODO: Implement position evaluation logic
    // - Use provided FEN or get current FEN
    // - Call tablebase service for evaluation
    // - Transform result to PositionEvaluationResult
    // - Handle evaluation errors
    throw new Error('PositionService.evaluatePosition not implemented');
  }

  evaluateMoveQuality(
    move: ValidatedMove, 
    fenAfterMove: string, 
    baseline: { wdl: number | null } | null
  ): Promise<MoveQualityResult | null> {
    // Placeholder implementation for B4.3 - richer mock result
    // TODO: Integrate with tablebase service for real evaluation
    
    // Constants for mock evaluation variability
    const RANDOM_OFFSET = 0.5;
    const WDL_VARIATION_RANGE = 0.2;
    
    const mockWdlBefore = baseline?.wdl ?? 0;
    const mockWdlAfter = mockWdlBefore + (Math.random() - RANDOM_OFFSET) * WDL_VARIATION_RANGE; // Small variation
    const optimalThreshold = 0.05;
    const wdlDifference = Math.abs(mockWdlAfter - mockWdlBefore);
    
    this.logger.info(`Evaluating move quality for ${move.san} at FEN ${fenAfterMove}`, {
      baseline,
      mockWdlBefore,
      mockWdlAfter
    });
    
    const result: MoveQualityResult = {
      isOptimal: wdlDifference < optimalThreshold,
      wdlBefore: mockWdlBefore,
      wdlAfter: mockWdlAfter,
      category: 'unknown' as const // Required by MoveQualityResult interface
    };
    
    // Only include bestMove if move is not optimal
    if (wdlDifference > optimalThreshold) {
      result.bestMove = 'Ke2'; // Mock best move
    }
    
    return Promise.resolve(result);
  }

  getBestMove(_fen?: string): Promise<string | null> {
    // TODO: Implement best move calculation
    // - Use provided FEN or get current FEN from chessEngine
    // - First, attempt to get move from tablebase
    // - If tablebase doesn't apply (>7 pieces), fall back to chessEngine's analysis
    // - Return the best move in UCI format
    throw new Error('PositionService.getBestMove not implemented');
  }


  exportToFEN(): string {
    return this._chessGameLogic.getFen();
  }

  loadFromFEN(fen: string): boolean {
    if (!this.validatePosition(fen)) {
      return false;
    }
    return this._chessGameLogic.loadFen(fen);
  }

  validatePosition(fen: string): boolean {
    // Basic FEN structure validation (6 space-separated fields)
    const fenParts = fen.trim().split(' ');
    if (fenParts.length !== 6) {
      return false;
    }
    
    // Let chess engine validate chess-specific rules
    try {
      const currentFen = this._chessGameLogic.getFen();
      const isValid = this._chessGameLogic.loadFen(fen);
      // Restore original position
      this._chessGameLogic.loadFen(currentFen);
      return isValid;
    } catch {
      return false;
    }
  }

  setPosition(fen: string): boolean {
    return this.loadFromFEN(fen);
  }

  resetToStarting(): void {
    this._chessGameLogic.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  reset(): void {
    // Reset any cached positions
    this.resetToStarting();
  }
}