/**
 * @file Move Service Implementation
 * @module domains/game/services/MoveService
 * @description Stateless move service following "Fat Service, Thin Slice" pattern
 */

import type { ChessGameLogicInterface, MoveInput as EngineMoveInput } from '@domains/game/engine/types';
import type { MoveServiceInterface, MakeMoveResult, MoveInput as ServiceMoveInput, ValidMove, MoveValidationResult } from './MoveServiceInterface';
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
  private chessGameLogic: ChessGameLogicInterface;

  constructor(chessGameLogic: ChessGameLogicInterface) {
    this.chessGameLogic = chessGameLogic;
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
    const isCheckmate = this.chessGameLogic.isCheckmate();
    const isStalemate = this.chessGameLogic.isStalemate();
    const isCheck = this.chessGameLogic.isCheck();
    const isDraw = this.chessGameLogic.isDraw();
    
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
      this.chessGameLogic.loadFen(currentFen);
      
      // Attempt to make the SAN move
      const moveResult = this.chessGameLogic.makeMove(sanMove);
      
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
      const newFen = this.chessGameLogic.getFen();
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
      this.chessGameLogic.loadFen(currentFen);
      
      // Convert MoveInput to EngineMoveInput (both use from/to/promotion)
      // Type assertion needed due to conflicting MoveInput types in codebase
      const moveInput = move as { from: Square; to: Square; promotion?: string };
      const engineMove: EngineMoveInput = {
        from: moveInput.from,
        to: moveInput.to,
        ...(moveInput.promotion && { promotion: moveInput.promotion })
      };
      
      // Attempt to make the move
      const moveResult = this.chessGameLogic.makeMove(engineMove);
      
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
      const newFen = this.chessGameLogic.getFen();
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

  /**
   * Gets all valid moves for current position
   * 
   * @param currentFen - Current position FEN
   * @param square - Optional specific square to get moves for
   * @returns Array of valid moves
   */
  getValidMoves(currentFen: string, square?: string): ValidMove[] {
    try {
      // Load the position
      this.chessGameLogic.loadFen(currentFen);
      
      // Get moves from engine - either for specific square or all moves
      const engineMoves = square 
        ? this.chessGameLogic.getValidMoves(square as Square)
        : this.chessGameLogic.getValidMoves();
      
      // Transform engine moves to service format
      return engineMoves.map((move: ChessJsMove) => ({
        from: move.from,
        to: move.to,
        san: move.san,
        piece: move.piece,
        ...(move.captured && { captured: move.captured }),
        ...(move.promotion && { promotion: move.promotion }),
        flags: move.flags
      }));
      
    } catch {
      // Return empty array on error
      return [];
    }
  }

  /**
   * Validates if a move is legal in the current position
   * 
   * @param currentFen - Current position FEN
   * @param move - Move to validate
   * @returns Validation result with legal status and error if invalid
   */
  isMoveLegal(currentFen: string, move: ServiceMoveInput): MoveValidationResult {
    try {
      // Load the position
      this.chessGameLogic.loadFen(currentFen);
      
      // Try to validate the move through the engine
      const engineMove: EngineMoveInput = {
        from: move.from as Square,
        to: move.to as Square,
        ...(move.promotion && { promotion: move.promotion })
      };
      
      const isValid = this.chessGameLogic.isMoveLegal(engineMove);
      
      if (isValid) {
        // Get the SAN notation by actually making the move temporarily
        const moveResult = this.chessGameLogic.makeMove(engineMove);
        const san = moveResult?.san;
        
        // Restore the original position
        this.chessGameLogic.loadFen(currentFen);
        
        return {
          isLegal: true,
          san: san || `${move.from}-${move.to}`
        };
      } else {
        return {
          isLegal: false,
          error: 'Ungültiger Zug'
        };
      }
      
    } catch (error) {
      return {
        isLegal: false,
        error: error instanceof Error ? error.message : 'Fehler bei Zugvalidierung'
      };
    }
  }

  /**
   * Validates a move with comprehensive validation including game state
   * 
   * @param currentFen - Current position FEN
   * @param move - Move to validate
   * @returns Detailed validation result with rich validation information
   */
  validateMove(currentFen: string, move: ServiceMoveInput): MoveValidationResult {
    try {
      // Load the position
      this.chessGameLogic.loadFen(currentFen);
      
      // Convert to engine move format
      const engineMove: EngineMoveInput = {
        from: move.from as Square,
        to: move.to as Square,
        ...(move.promotion && { promotion: move.promotion })
      };
      
      // First check basic legality
      const isBasicallyLegal = this.chessGameLogic.isMoveLegal(engineMove);
      
      if (!isBasicallyLegal) {
        return {
          isLegal: false,
          error: 'Ungültiger Zug'
        };
      }
      
      // Get more detailed validation by attempting the move
      const moveResult = this.chessGameLogic.makeMove(engineMove);
      if (!moveResult) {
        return {
          isLegal: false,
          error: 'Zug konnte nicht ausgeführt werden'
        };
      }
      
      // Get SAN notation and restore position
      const san = moveResult.san;
      this.chessGameLogic.loadFen(currentFen);
      
      return {
        isLegal: true,
        san: san
      };
      
    } catch (error) {
      return {
        isLegal: false,
        error: error instanceof Error ? error.message : 'Fehler bei erweiterter Zugvalidierung'
      };
    }
  }

  /**
   * Undoes the last move and returns the previous position
   * 
   * @param currentFen - Current position FEN
   * @returns Result with previous position or error if undo not possible
   */
  undoMove(currentFen: string): { success: boolean; previousFen?: string; error?: string } {
    try {
      // Load the current position
      this.chessGameLogic.loadFen(currentFen);
      
      // Attempt to undo the move
      const success = this.chessGameLogic.undo();
      
      if (!success) {
        return {
          success: false,
          error: 'Kein Zug zum Rückgängigmachen verfügbar'
        };
      }
      
      // Get the previous position
      const previousFen = this.chessGameLogic.getFen();
      
      return {
        success: true,
        previousFen: previousFen
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Rückgängigmachen des Zugs'
      };
    }
  }
}