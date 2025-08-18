/**
 * @file MoveService Unit Tests
 * @description Tests for MoveService makeUserMove method
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MoveService } from '../MoveService';
import type { ChessGameLogicInterface } from '@domains/game/engine/types';
import type { Move as ChessJsMove } from 'chess.js';

// Mock ChessGameLogic
const mockChessGameLogic: ChessGameLogicInterface = {
  loadFen: vi.fn(),
  getFen: vi.fn(),
  makeMove: vi.fn(),
  validateMove: vi.fn(),
  getValidMoves: vi.fn(),
  isMoveLegal: vi.fn(),
  isGameOver: vi.fn(),
  isCheckmate: vi.fn(),
  isStalemate: vi.fn(),
  isDraw: vi.fn(),
  isCheck: vi.fn(),
  getTurn: vi.fn(),
  undo: vi.fn(),
  getHistory: vi.fn(),
};

describe('MoveService', () => {
  let moveService: MoveService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh service instance
    moveService = new MoveService(mockChessGameLogic);
  });

  describe('makeUserMove', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testMove = { from: 'e2', to: 'e4' };

    it('should return success result for valid move', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e2',
        to: 'e4',
        flags: 'n',
        piece: 'p',
        san: 'e4'
      };
      
      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue(newFen);
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.newFen).toBe(newFen);
      expect(result.move).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.isCheckmate).toBe(false);
      expect(result.isStalemate).toBe(false);
      expect(result.isCheck).toBe(false);
      expect(result.isDraw).toBe(false);
      expect(result.isCapture).toBe(false);
      expect(result.isPromotion).toBe(false);
      expect(result.isCastling).toBe(false);
      
      // Enhanced metadata fields
      expect(result.pieceType).toBe('p');
      expect(result.capturedPiece).toBeUndefined();
      expect(result.isEnPassant).toBe(false);
      expect(result.moveNumber).toBe(1);
      expect(result.halfMoveClock).toBe(0);
      expect(result.castleSide).toBeUndefined();
    });

    it('should return error result for invalid move', () => {
      // Arrange
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(null);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.newFen).toBeNull();
      expect(result.move).toBeNull();
      expect(result.error).toBe('Ungültiger Zug');
    });

    it('should detect capture moves', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e4',
        to: 'e5',
        flags: 'c',
        piece: 'p',
        san: 'exd5',
        captured: 'p'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isCapture).toBe(true);
      expect(result.capturedPiece).toBe('p');
      expect(result.pieceType).toBe('p');
    });

    it('should detect promotion moves', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e7',
        to: 'e8',
        flags: 'p',
        piece: 'p',
        san: 'e8=Q',
        promotion: 'q'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isPromotion).toBe(true);
      expect(result.pieceType).toBe('p');
    });

    it('should detect castling moves', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e1',
        to: 'g1',
        flags: 'k',
        piece: 'k',
        san: 'O-O'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isCastling).toBe(true);
      expect(result.pieceType).toBe('k');
      expect(result.castleSide).toBe('king');
    });

    it('should detect checkmate', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e2',
        to: 'e4',
        flags: 'n',
        piece: 'p',
        san: 'e4#'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('checkmate-fen');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isCheckmate).toBe(true);
      expect(result.isCheck).toBe(true);
    });

    it('should handle unexpected errors gracefully', () => {
      // Arrange
      vi.mocked(mockChessGameLogic.loadFen).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.newFen).toBeNull();
      expect(result.move).toBeNull();
      expect(result.error).toBe('Test error');
      
      // Enhanced metadata defaults for error case
      expect(result.pieceType).toBe('');
      expect(result.capturedPiece).toBeUndefined();
      expect(result.isEnPassant).toBe(false);
      expect(result.moveNumber).toBe(0);
      expect(result.halfMoveClock).toBe(0);
      expect(result.castleSide).toBeUndefined();
    });

    it('should detect en passant moves', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e5',
        to: 'd6',
        flags: 'e',
        piece: 'p',
        san: 'exd6',
        captured: 'p'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('rnbqkbnr/ppp1pppp/3p4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isEnPassant).toBe(true);
      expect(result.isCapture).toBe(true);
      expect(result.capturedPiece).toBe('p');
      expect(result.pieceType).toBe('p');
    });

    it('should detect queen-side castling', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e1',
        to: 'c1',
        flags: 'q',
        piece: 'k',
        san: 'O-O-O'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isCastling).toBe(true);
      expect(result.pieceType).toBe('k');
      expect(result.castleSide).toBe('queen');
    });

    it('should parse move number and half-move clock from FEN', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e2',
        to: 'e4',
        flags: 'n',
        piece: 'p',
        san: 'e4'
      };
      
      const fenWithMoveInfo = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 12';
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue(fenWithMoveInfo);
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.moveNumber).toBe(12);
      expect(result.halfMoveClock).toBe(5);
    });

    it('should test all piece types', () => {
      // Test knight move
      const mockKnightMove: ChessJsMove = {
        color: 'w',
        from: 'g1',
        to: 'f3',
        flags: 'n',
        piece: 'n',
        san: 'Nf3'
      };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockKnightMove);
      vi.mocked(mockChessGameLogic.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessGameLogic.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isCheck).mockReturnValue(false);
      vi.mocked(mockChessGameLogic.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.pieceType).toBe('n');
    });
  });

  describe('getValidMoves', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should return valid moves for starting position', () => {
      // Arrange
      const mockMoves: ChessJsMove[] = [
        { color: 'w', from: 'e2', to: 'e4', flags: 'n', piece: 'p', san: 'e4' },
        { color: 'w', from: 'e2', to: 'e3', flags: 'n', piece: 'p', san: 'e3' },
        { color: 'w', from: 'g1', to: 'f3', flags: 'n', piece: 'n', san: 'Nf3' }
      ];
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.getValidMoves).mockReturnValue(mockMoves);

      // Act
      const result = moveService.getValidMoves(testFen);

      // Assert
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(testFen);
      expect(mockChessGameLogic.getValidMoves).toHaveBeenCalledWith();
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        from: 'e2',
        to: 'e4',
        san: 'e4',
        piece: 'p',
        captured: undefined,
        promotion: undefined,
        flags: 'n'
      });
    });

    it('should return moves for specific square', () => {
      // Arrange
      const mockMoves: ChessJsMove[] = [
        { color: 'w', from: 'e2', to: 'e4', flags: 'n', piece: 'p', san: 'e4' },
        { color: 'w', from: 'e2', to: 'e3', flags: 'n', piece: 'p', san: 'e3' }
      ];
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.getValidMoves).mockReturnValue(mockMoves);

      // Act
      const result = moveService.getValidMoves(testFen, 'e2');

      // Assert
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(testFen);
      expect(mockChessGameLogic.getValidMoves).toHaveBeenCalledWith('e2');
      expect(result).toHaveLength(2);
      expect(result[0].from).toBe('e2');
    });

    it('should return empty array on engine error', () => {
      // Arrange
      vi.mocked(mockChessGameLogic.loadFen).mockImplementation(() => {
        throw new Error('Invalid FEN');
      });

      // Act
      const result = moveService.getValidMoves('invalid fen');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle moves with captures', () => {
      // Arrange
      const mockMoves: ChessJsMove[] = [
        { 
          color: 'w', 
          from: 'e5', 
          to: 'd6', 
          flags: 'c', 
          piece: 'p', 
          san: 'exd6',
          captured: 'p'
        }
      ];
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.getValidMoves).mockReturnValue(mockMoves);

      // Act
      const result = moveService.getValidMoves(testFen);

      // Assert
      expect(result[0]).toEqual({
        from: 'e5',
        to: 'd6',
        san: 'exd6',
        piece: 'p',
        captured: 'p',
        promotion: undefined,
        flags: 'c'
      });
    });
  });

  describe('isMoveLegal', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testMove = { from: 'e2', to: 'e4' };

    it('should return true for legal move', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e2',
        to: 'e4',
        flags: 'n',
        piece: 'p',
        san: 'e4'
      };

      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.isMoveLegal).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);

      // Act
      const result = moveService.isMoveLegal(testFen, testMove);

      // Assert
      expect(result.isLegal).toBe(true);
      expect(result.san).toBe('e4');
      expect(result.error).toBeUndefined();
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(testFen);
      expect(mockChessGameLogic.isMoveLegal).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
        promotion: undefined
      });
    });

    it('should return false for illegal move', () => {
      // Arrange
      const illegalMove = { from: 'e2', to: 'e5' };
      
      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.isMoveLegal).mockReturnValue(false);

      // Act
      const result = moveService.isMoveLegal(testFen, illegalMove);

      // Assert
      expect(result.isLegal).toBe(false);
      expect(result.error).toBe('Ungültiger Zug');
      expect(result.san).toBeUndefined();
    });

    it('should handle engine errors gracefully', () => {
      // Arrange
      vi.mocked(mockChessGameLogic.loadFen).mockImplementation(() => {
        throw new Error('Engine error');
      });

      // Act
      const result = moveService.isMoveLegal('invalid fen', testMove);

      // Assert
      expect(result.isLegal).toBe(false);
      expect(result.error).toBe('Engine error');
    });

    it('should handle promotion moves', () => {
      // Arrange
      const promotionMove = { from: 'e7', to: 'e8', promotion: 'q' };
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e7',
        to: 'e8',
        flags: 'p',
        piece: 'p',
        san: 'e8=Q',
        promotion: 'q'
      };

      vi.mocked(mockChessGameLogic.loadFen).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.isMoveLegal).mockReturnValue(true);
      vi.mocked(mockChessGameLogic.makeMove).mockReturnValue(mockMoveResult);

      // Act
      const result = moveService.isMoveLegal(testFen, promotionMove);

      // Assert
      expect(result.isLegal).toBe(true);
      expect(result.san).toBe('e8=Q');
      expect(mockChessGameLogic.isMoveLegal).toHaveBeenCalledWith({
        from: 'e7',
        to: 'e8',
        promotion: 'q'
      });
    });
  });

  describe('validateMove', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testMove = { from: 'e2', to: 'e4' };

    it('should return valid result for legal move', () => {
      // Arrange
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e2',
        to: 'e4',
        flags: 'n',
        piece: 'p',
        san: 'e4'
      };

      mockChessGameLogic.loadFen = vi.fn();
      mockChessGameLogic.isMoveLegal = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);

      // Act
      const result = moveService.validateMove(testFen, testMove);

      // Assert
      expect(result.isLegal).toBe(true);
      expect(result.san).toBe('e4');
      expect(result.error).toBeUndefined();
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(testFen);
      expect(mockChessGameLogic.isMoveLegal).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4'
      });
    });

    it('should return invalid result for illegal move', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn();
      mockChessGameLogic.isMoveLegal = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.validateMove(testFen, testMove);

      // Assert
      expect(result.isLegal).toBe(false);
      expect(result.error).toBe('Ungültiger Zug');
      expect(result.san).toBeUndefined();
    });

    it('should handle move execution failure', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn();
      mockChessGameLogic.isMoveLegal = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(null);

      // Act
      const result = moveService.validateMove(testFen, testMove);

      // Assert
      expect(result.isLegal).toBe(false);
      expect(result.error).toBe('Zug konnte nicht ausgeführt werden');
    });

    it('should handle errors gracefully', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn().mockImplementation(() => {
        throw new Error('Invalid FEN');
      });

      // Act
      const result = moveService.validateMove(testFen, testMove);

      // Assert
      expect(result.isLegal).toBe(false);
      expect(result.error).toBe('Invalid FEN');
    });
  });

  describe('undoMove', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const previousFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should return success result for successful undo', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn();
      mockChessGameLogic.undo = vi.fn().mockReturnValue(true);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(previousFen);

      // Act
      const result = moveService.undoMove(testFen);

      // Assert
      expect(result.success).toBe(true);
      expect(result.previousFen).toBe(previousFen);
      expect(result.error).toBeUndefined();
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(testFen);
      expect(mockChessGameLogic.undo).toHaveBeenCalledOnce();
    });

    it('should return failure result when undo is not possible', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn();
      mockChessGameLogic.undo = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.undoMove(testFen);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Kein Zug zum Rückgängigmachen verfügbar');
      expect(result.previousFen).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn().mockImplementation(() => {
        throw new Error('Invalid FEN');
      });

      // Act
      const result = moveService.undoMove(testFen);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid FEN');
      expect(result.previousFen).toBeUndefined();
    });

    it('should handle undo with exception', () => {
      // Arrange
      mockChessGameLogic.loadFen = vi.fn();
      mockChessGameLogic.undo = vi.fn().mockImplementation(() => {
        throw new Error('Undo failed');
      });

      // Act
      const result = moveService.undoMove(testFen);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Undo failed');
    });
  });
});