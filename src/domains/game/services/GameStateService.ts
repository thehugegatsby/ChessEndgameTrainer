/**
 * @file Game State Service Implementation
 * @module domains/game/services/GameStateService
 * @description Implementation of game state management and training completion logic
 */

import type { ChessGameLogicInterface } from '@domains/game/engine/types';
import type { 
  GameStateServiceInterface,
  GameStateInfo,
  GameTerminationReason,
  TrainingCompletionResult
} from './GameStateServiceInterface';
import { turn } from '@shared/utils/chess-logic';

/**
 * Game State Service implementation
 * 
 * Handles game state queries, training completion logic, and turn management.
 * Uses ChessEngine for game state information and implements training-specific logic.
 */
export class GameStateService implements GameStateServiceInterface {
  /**
   * Get the active turn from a FEN string (pure chess logic)
   * 
   * @param {string} fen - FEN string to parse
   * @returns {'w' | 'b'} The color whose turn it is to move
   * 
   * @remarks
   * This is a pure function that extracts the turn information from the FEN string.
   * It follows the FEN specification where the second field indicates active turn:
   * - 'w' for white to move
   * - 'b' for black to move
   * 
   * @example
   * ```typescript
   * const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
   * const currentTurn = GameStateService.getTurnFromFen(fen); // Returns 'b'
   * ```
   */
  public static getTurnFromFen(fen: string): 'w' | 'b' {
    return turn(fen);
  }
  private _chessGameLogic: ChessGameLogicInterface;

  constructor(chessGameLogic: ChessGameLogicInterface) {
    this._chessGameLogic = chessGameLogic;
  }

  getGameState(): GameStateInfo {
    const currentTurn = this.getTurn();
    const isCheck = this.isCheck();
    const isGameOver = this.isGameOver();
    const isCheckmate = this.isCheckmate();
    const isStalemate = this.isStalemate();
    const isDraw = this.isDraw();
    const terminationReason = isGameOver ? this.getTerminationReason() : undefined;
    
    // Extract move numbers from FEN string
    const fen = this._chessGameLogic.getFen();
    const fenParts = fen.split(' ');
    const halfMoveClock = fenParts[4] ? parseInt(fenParts[4], 10) : 0;
    const fullMoveNumber = fenParts[5] ? parseInt(fenParts[5], 10) : 1;

    const result: GameStateInfo = {
      turn: currentTurn,
      isCheck,
      isGameOver,
      isCheckmate,
      isStalemate,
      isDraw,
      fullMoveNumber,
      halfMoveClock
    };
    
    if (terminationReason) {
      result.terminationReason = terminationReason;
    }
    
    return result;
  }

  isGameOver(): boolean {
    return this._chessGameLogic.isGameOver();
  }

  isCheckmate(): boolean {
    return this._chessGameLogic.isCheckmate();
  }

  isStalemate(): boolean {
    return this._chessGameLogic.isStalemate();
  }

  isDraw(): boolean {
    return this._chessGameLogic.isDraw();
  }

  isCheck(): boolean {
    return this._chessGameLogic.isCheck();
  }

  getTurn(): 'white' | 'black' {
    const fen = this._chessGameLogic.getFen();
    const currentTurn = GameStateService.getTurnFromFen(fen);
    return currentTurn === 'w' ? 'white' : 'black';
  }

  isPlayerTurn(colorToTrain: 'white' | 'black'): boolean {
    return this.getTurn() === colorToTrain;
  }

  getTerminationReason(): GameTerminationReason | null {
    if (!this.isGameOver()) {
      return null;
    }
    
    if (this.isCheckmate()) {
      return 'checkmate';
    }
    
    if (this.isStalemate()) {
      return 'stalemate';
    }
    
    if (this.isDraw()) {
      return 'draw-agreement';
    }
    
    return null;
  }

  finalizeTrainingSession(
    reason: GameTerminationReason,
    targetOutcome: '1-0' | '0-1' | '1/2-1/2',
    metrics: {
      moveCount: number;
      mistakes: number;
      hintsUsed: number;
      accuracy: number;
    }
  ): TrainingCompletionResult {
    const actualOutcome = this.getGameOutcome();
    const targetAchieved = actualOutcome === targetOutcome;
    const success = targetAchieved && this.isGameOver();

    return {
      success,
      reason,
      outcome: actualOutcome || '1/2-1/2', // Fallback to draw if outcome is null
      targetAchieved,
      metrics
    };
  }

  isTrainingObjectiveMet(targetOutcome: '1-0' | '0-1' | '1/2-1/2'): boolean {
    // TODO: Implement training objective checking
    // - Compare actual game outcome with target
    const actualOutcome = this.getGameOutcome();
    return actualOutcome === targetOutcome;
  }

  getGameOutcome(): '1-0' | '0-1' | '1/2-1/2' | null {
    if (!this.isGameOver()) {
      return null;
    }
    
    if (this.isCheckmate()) {
      // If checkmate, the winner is the opposite of current turn
      const currentTurn = this.getTurn();
      return currentTurn === 'white' ? '0-1' : '1-0';
    }
    
    if (this.isStalemate() || this.isDraw()) {
      return '1/2-1/2';
    }
    
    return null;
  }

  reset(): void {
    // No internal state to reset in this service
    // All state is delegated to the ChessGameLogic instance
    // The ChessGameLogic should be reset externally if needed
  }
}