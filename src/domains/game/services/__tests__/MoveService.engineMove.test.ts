/**
 * @file MoveService.engineMove.test.ts
 * @description Unit tests for MoveService.makeEngineMove method
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

describe('MoveService.makeEngineMove', () => {
  let moveService: MoveService;

  beforeEach(() => {
    moveService = new MoveService(mockChessGameLogic);
    vi.clearAllMocks();
  });

  describe('Valid SAN moves', () => {
    it('should execute simple pawn move (e4)', () => {
      // Arrange
      const currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const sanMove = 'e4';
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e2',
        to: 'e4',
        flags: 'n',
        piece: 'p',
        san: 'e4'
      };
      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(newFen);
      mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(mockChessGameLogic.loadFen).toHaveBeenCalledWith(currentFen);
      expect(mockChessGameLogic.makeMove).toHaveBeenCalledWith(sanMove);
      expect(result.newFen).toBe(newFen);
      expect(result.move).toBeDefined();
      expect(result.move?.san).toBe('e4');
      expect(result.error).toBeUndefined();
    });

    it('should execute knight move (Nf3)', () => {
      // Arrange
      const currentFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const sanMove = 'Nf3';
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'g1',
        to: 'f3',
        flags: 'n',
        piece: 'n',
        san: 'Nf3'
      };
      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 1';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(newFen);
      mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.newFen).toBe(newFen);
      expect(result.move?.san).toBe('Nf3');
      expect(result.error).toBeUndefined();
    });

    it('should execute castling move (O-O)', () => {
      // Arrange  
      const currentFen = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const sanMove = 'O-O';
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e1',
        to: 'g1',
        flags: 'k',
        piece: 'k',
        san: 'O-O'
      };
      const newFen = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(newFen);
      mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.newFen).toBe(newFen);
      expect(result.move?.san).toBe('O-O');
      expect(result.isCastling).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should execute promotion move (e8=Q)', () => {
      // Arrange
      const currentFen = '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1';
      const sanMove = 'e8=Q';
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'e7',
        to: 'e8',
        flags: 'np',
        piece: 'p',
        promotion: 'q',
        san: 'e8=Q'
      };
      const newFen = '4Q3/8/8/8/8/8/8/4K3 b - - 0 1';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(newFen);
      mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.newFen).toBe(newFen);
      expect(result.move?.san).toBe('e8=Q');
      expect(result.isPromotion).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Invalid moves', () => {
    it('should return error for invalid SAN move', () => {
      // Arrange
      const currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const sanMove = 'Xe9'; // Invalid move

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(null); // Move failed

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.newFen).toBeNull();
      expect(result.move).toBeNull();
      expect(result.error).toBe('Ungültiger SAN-Zug: Xe9');
      expect(result.isCheckmate).toBe(false);
    });

    it('should handle engine exceptions gracefully', () => {
      // Arrange
      const currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const sanMove = 'e4';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockImplementation(() => {
        throw new Error('Engine crashed');
      });

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.newFen).toBeNull();
      expect(result.move).toBeNull();
      expect(result.error).toBe('Engine crashed');
    });
  });

  describe('Game state detection', () => {
    it('should detect checkmate', () => {
      // Arrange
      const currentFen = '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1';
      const sanMove = 'Ra8#';
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'a1',
        to: 'a8',
        flags: 'n',
        piece: 'r',
        san: 'Ra8#'
      };
      const newFen = 'R3k3/8/8/8/8/8/8/4K2R b K - 1 1';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(newFen);
      mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
      mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isCheck = vi.fn().mockReturnValue(true);
      mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.isCheckmate).toBe(true);
      expect(result.isCheck).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should detect stalemate', () => {
      // Arrange
      const currentFen = '8/8/8/8/8/8/8/k1K5 w - - 0 1';
      const sanMove = 'Kc2';
      const mockMoveResult: ChessJsMove = {
        color: 'w',
        from: 'c1',
        to: 'c2',
        flags: 'n',
        piece: 'k',
        san: 'Kc2'
      };
      const newFen = '8/8/8/8/8/8/2K5/k7 b - - 1 1';

      mockChessGameLogic.loadFen = vi.fn().mockReturnValue(true);
      mockChessGameLogic.makeMove = vi.fn().mockReturnValue(mockMoveResult);
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(newFen);
      mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(true);
      mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
      mockChessGameLogic.isDraw = vi.fn().mockReturnValue(true);

      // Act
      const result = moveService.makeEngineMove(currentFen, sanMove);

      // Assert
      expect(result.isStalemate).toBe(true);
      expect(result.isDraw).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});