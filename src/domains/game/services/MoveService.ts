/**
 * @file Move Service Implementation
 * @module domains/game/services/MoveService
 * @description Stateless move service following "Fat Service, Thin Slice" pattern
 */

import type { ChessEngineInterface, MoveInput as EngineMoveInput } from '@domains/game/engine/types';
import type { MoveServiceInterface, MakeMoveResult, MoveInput as ServiceMoveInput } from './MoveServiceInterface';
import { createValidatedMove } from '@shared/types/chess';
import type { Move as ChessJsMove, Square } from 'chess.js';

/**
 * STATELESS Move Service implementation
 * 
 * Follows "Fat Service, Thin Slice" pattern:
 * - Service handles complex chess logic and returns rich data
 * - TrainingSlice only manages state updates from service results
 * - No internal state - all data flows through method parameters
 */
export class MoveService implements MoveServiceInterface {
  private chessEngine: ChessEngineInterface;

  constructor(chessEngine: ChessEngineInterface) {
    this.chessEngine = chessEngine;
  }

  /**
   * Builds successful move result with all derived state
   * 
   * @param moveResult - ChessJs move result from successful move
   * @param fenBefore - FEN position before move
   * @param fenAfter - FEN position after move  
   * @returns Rich MakeMoveResult with all derived game state
   * 
   * @private
   */
  private _buildMoveResult(
    moveResult: ChessJsMove,
    fenBefore: string,
    fenAfter: string
  ): MakeMoveResult {
    // Create ValidatedMove using the factory function
    const validatedMove = createValidatedMove(moveResult, fenBefore, fenAfter);
    
    // Game state checks
    const isCheckmate = this.chessEngine.isCheckmate();
    const isStalemate = this.chessEngine.isStalemate();
    const isCheck = this.chessEngine.isCheck();
    const isDraw = this.chessEngine.isDraw();
    
    // Move metadata
    const isCapture = moveResult.captured !== undefined;
    const isPromotion = moveResult.promotion !== undefined;
    const isCastling = moveResult.flags.includes('k') || moveResult.flags.includes('q');
    
    // Enhanced metadata (pragmatic fields only)
    const pieceType = moveResult.piece;
    const capturedPiece = moveResult.captured;
    const isEnPassant = moveResult.flags.includes('e');
    const castleSide = isCastling 
      ? (moveResult.flags.includes('k') ? 'king' as const : 'queen' as const)
      : undefined;

    // Parse FEN for move number and half-move clock
    const fenParts = fenAfter.split(' ');
    const moveNumber = parseInt(fenParts[5] || '1', 10);
    const halfMoveClock = parseInt(fenParts[4] || '0', 10);
    
    // Build result object with conditional property assignment for optional fields
    const result: MakeMoveResult = {
      newFen: fenAfter,
      move: validatedMove,
      pgn: '', // No PGN method available, placeholder for now
      isCheckmate,
      isStalemate,
      isCheck,
      isDraw,
      isCapture,
      isPromotion,
      isCastling,
      // Enhanced metadata
      pieceType,
      isEnPassant,
      moveNumber,
      halfMoveClock
    };

    // Add optional properties only if they have values (exactOptionalPropertyTypes compliance)
    if (capturedPiece) {
      result.capturedPiece = capturedPiece;
    }
    if (castleSide) {
      result.castleSide = castleSide;
    }

    return result;
  }

  /**
   * Makes an engine move using SAN notation with comprehensive result data
   * 
   * @param currentFen - Current position FEN
   * @param sanMove - Move in SAN notation (e.g., "Nf3", "O-O", "exd8=Q")
   * @returns Rich result with newFen, move object, game state flags, and metadata
   */
  makeEngineMove(currentFen: string, sanMove: string): MakeMoveResult {
    try {
      // Store FEN before move for ValidatedMove creation
      const fenBefore = currentFen;
      
      // Load current position
      this.chessEngine.loadFen(currentFen);
      
      // Attempt to make the SAN move
      const moveResult = this.chessEngine.makeMove(sanMove);
      
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
          // Enhanced metadata defaults for error case
          pieceType: '',
          isEnPassant: false,
          moveNumber: 0,
          halfMoveClock: 0,
          error: `Ungültiger SAN-Zug: ${sanMove}` // German error message per project standards
        };
      }
      
      // Move succeeded - get new FEN and delegate to shared helper
      const newFen = this.chessEngine.getFen();
      return this._buildMoveResult(moveResult, fenBefore, newFen);
      
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
        // Enhanced metadata defaults for error case
        pieceType: '',
        isEnPassant: false,
        moveNumber: 0,
        halfMoveClock: 0,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler bei SAN-Zug'
      };
    }
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
  makeUserMove(currentFen: string, move: ServiceMoveInput): MakeMoveResult {
    try {
      // Store FEN before move for ValidatedMove creation
      const fenBefore = currentFen;
      
      // Load current position
      this.chessEngine.loadFen(currentFen);
      
      // Convert MoveInput to EngineMoveInput (both use from/to/promotion)
      // Type assertion needed due to conflicting MoveInput types in codebase
      const moveInput = move as { from: Square; to: Square; promotion?: string };
      const engineMove: EngineMoveInput = {
        from: moveInput.from,
        to: moveInput.to,
        ...(moveInput.promotion && { promotion: moveInput.promotion })
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
          // Enhanced metadata defaults for error case
          pieceType: '',
          isEnPassant: false,
          moveNumber: 0,
          halfMoveClock: 0,
          error: 'Ungültiger Zug' // German error message per project standards
        };
      }
      
      // Move succeeded - get new FEN and delegate to shared helper
      const newFen = this.chessEngine.getFen();
      return this._buildMoveResult(moveResult, fenBefore, newFen);
      
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
        // Enhanced metadata defaults for error case
        pieceType: '',
        isEnPassant: false,
        moveNumber: 0,
        halfMoveClock: 0,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  }
}