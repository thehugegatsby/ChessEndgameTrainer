/**
 * @file MoveService Unit Tests
 * @description Tests for MoveService makeUserMove method
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MoveService } from '../MoveService';
import type { ChessEngineInterface } from '@domains/game/engine/types';
import type { Move as ChessJsMove } from 'chess.js';

// Mock ChessEngine
const mockChessEngine: ChessEngineInterface = {
  loadFen: vi.fn(),
  getFen: vi.fn(),
  makeMove: vi.fn(),
  validateMove: vi.fn(),
  getPossibleMoves: vi.fn(),
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
    moveService = new MoveService(mockChessEngine);
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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue(newFen);
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(null);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('checkmate-fen');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(true);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(true);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.isCheckmate).toBe(true);
      expect(result.isCheck).toBe(true);
    });

    it('should handle unexpected errors gracefully', () => {
      // Arrange
      vi.mocked(mockChessEngine.loadFen).mockImplementation(() => {
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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('rnbqkbnr/ppp1pppp/3p4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockMoveResult);
      vi.mocked(mockChessEngine.getFen).mockReturnValue(fenWithMoveInfo);
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

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
      
      vi.mocked(mockChessEngine.loadFen).mockReturnValue(true);
      vi.mocked(mockChessEngine.makeMove).mockReturnValue(mockKnightMove);
      vi.mocked(mockChessEngine.getFen).mockReturnValue('updated-fen');
      vi.mocked(mockChessEngine.isCheckmate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isStalemate).mockReturnValue(false);
      vi.mocked(mockChessEngine.isCheck).mockReturnValue(false);
      vi.mocked(mockChessEngine.isDraw).mockReturnValue(false);

      // Act
      const result = moveService.makeUserMove(testFen, testMove);

      // Assert
      expect(result.pieceType).toBe('n');
    });
  });
});