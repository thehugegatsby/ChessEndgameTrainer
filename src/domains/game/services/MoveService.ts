/**
 * @file Move Service Implementation
 * @module domains/game/services/MoveService
 * @description Stateless move service following "Fat Service, Thin Slice" pattern
 */

import type { ChessEngineInterface, MoveInput as EngineMoveInput } from '@domains/game/engine/types';
import type { IMoveService, MakeMoveResult, MoveInput } from './MoveServiceInterface';
import { createValidatedMove } from '@shared/types/chess';

/**
 * STATELESS Move Service implementation
 * 
 * Follows "Fat Service, Thin Slice" pattern:
 * - Service handles complex chess logic and returns rich data
 * - TrainingSlice only manages state updates from service results
 * - No internal state - all data flows through method parameters
 */
export class MoveService implements IMoveService {
  private chessEngine: ChessEngineInterface;

  constructor(chessEngine: ChessEngineInterface) {
    this.chessEngine = chessEngine;
  }

  /**
   * Makes a user move with comprehensive result data
   * 
   * Following "Fat Service, Thin Slice" pattern:
   * - Service handles all complex chess logic and validation
   * - Returns rich result with all derived state
   * - TrainingSlice only needs to update state from result
   * 
   * @param currentFen - Current position FEN
   * @param move - Move to make
   * @returns Rich result with newFen, move object, game state flags, and metadata
   */
  makeUserMove(currentFen: string, move: MoveInput): MakeMoveResult {
    try {
      // Store FEN before move for ValidatedMove creation
      const fenBefore = currentFen;
      
      // Load current position
      this.chessEngine.loadFen(currentFen);
      
      // Convert MoveInput to EngineMoveInput (both use from/to/promotion)
      const engineMove: EngineMoveInput = {
        from: move.from as any, // Type assertion for Square conversion
        to: move.to as any,     // Type assertion for Square conversion
        ...(move.promotion && { promotion: move.promotion })
      };
      
      // Attempt to make the move
      const moveResult = this.chessEngine.makeMove(engineMove);
      
      // If move failed, return error result
      if (!moveResult) {
        return {
          newFen: null,
          move: null,
          pgn: '', // No PGN method available, use empty string
          isCheckmate: false,
          isStalemate: false,
          isCheck: false,
          isDraw: false,
          isCapture: false,
          isPromotion: false,
          isCastling: false,
          error: 'Ungültiger Zug' // German error message per project standards
        };
      }
      
      // Move succeeded - gather all derived state
      const newFen = this.chessEngine.getFen();
      
      // Create ValidatedMove using the factory function
      const validatedMove = createValidatedMove(moveResult, fenBefore, newFen);
      
      // Game state checks
      const isCheckmate = this.chessEngine.isCheckmate();
      const isStalemate = this.chessEngine.isStalemate();
      const isCheck = this.chessEngine.isCheck();
      const isDraw = this.chessEngine.isDraw();
      
      // Move metadata
      const isCapture = moveResult.captured !== undefined;
      const isPromotion = moveResult.promotion !== undefined;
      const isCastling = moveResult.flags.includes('k') || moveResult.flags.includes('q');
      
      return {
        newFen,
        move: validatedMove,
        pgn: '', // No PGN method available, placeholder for now
        isCheckmate,
        isStalemate,
        isCheck,
        isDraw,
        isCapture,
        isPromotion,
        isCastling
      };
      
    } catch (error) {
      // Handle any unexpected errors
      return {
        newFen: null,
        move: null,
        pgn: '',
        isCheckmate: false,
        isStalemate: false,
        isCheck: false,
        isDraw: false,
        isCapture: false,
        isPromotion: false,
        isCastling: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  }
}