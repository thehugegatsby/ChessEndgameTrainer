/**
 * @file GameStateService.test.ts
 * @description Unit tests for GameStateService implementation
 * @module domains/game/services/GameStateService.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateService } from './GameStateService';
import type { ChessGameLogicInterface } from '@domains/game/engine/types';
const TEST_POSITIONS = {
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  KPK_WHITE_WINS: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  KPK_BLACK_TO_MOVE: '8/8/8/4k3/4P3/4K3/8/8 b - - 0 1'
};

describe('GameStateService', () => {
  let gameStateService: GameStateService;
  let mockChessGameLogic: ChessGameLogicInterface;

  beforeEach(() => {
    mockChessGameLogic = {
      getFen: vi.fn(),
      loadFen: vi.fn(),
      makeMove: vi.fn(),
      validateMove: vi.fn(),
      getValidMoves: vi.fn(),
      isMoveLegal: vi.fn(),
      isGameOver: vi.fn(),
      isCheck: vi.fn(),
      isCheckmate: vi.fn(),
      isStalemate: vi.fn(),
      isDraw: vi.fn(),
      getTurn: vi.fn(),
      undo: vi.fn(),
      getHistory: vi.fn()
    };
    
    gameStateService = new GameStateService(mockChessGameLogic);
  });

  describe('getTurn()', () => {
    it('should return "white" when it is white\'s turn', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
      
      const result = gameStateService.getTurn();
      
      expect(result).toBe('white');
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
    });

    it('should return "black" when it is black\'s turn', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.AFTER_E4);
      
      const result = gameStateService.getTurn();
      
      expect(result).toBe('black');
      expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
    });

    it('should handle endgame positions correctly - white to move', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.KPK_WHITE_WINS);
      
      const result = gameStateService.getTurn();
      
      expect(result).toBe('white');
    });

    it('should handle endgame positions correctly - black to move', () => {
      mockChessGameLogic.getFen = vi.fn().mockReturnValue(TEST_POSITIONS.KPK_BLACK_TO_MOVE);
      
      const result = gameStateService.getTurn();
      
      expect(result).toBe('black');
    });
  });

  describe('getTurnFromFen() - static method', () => {
    it('should return "w" for white\'s turn from FEN', () => {
      const result = GameStateService.getTurnFromFen(TEST_POSITIONS.STARTING_POSITION);
      expect(result).toBe('w');
    });

    it('should return "b" for black\'s turn from FEN', () => {
      const result = GameStateService.getTurnFromFen(TEST_POSITIONS.AFTER_E4);
      expect(result).toBe('b');
    });

    it('should handle complex endgame positions', () => {
      const whiteToMoveResult = GameStateService.getTurnFromFen(TEST_POSITIONS.KPK_WHITE_WINS);
      const blackToMoveResult = GameStateService.getTurnFromFen(TEST_POSITIONS.KPK_BLACK_TO_MOVE);
      
      expect(whiteToMoveResult).toBe('w');
      expect(blackToMoveResult).toBe('b');
    });
  });

  describe('Block B1: Basic Game State', () => {
    describe('isCheck()', () => {
      it('should delegate to chess engine and return true when in check', () => {
        mockChessGameLogic.isCheck = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.isCheck();
        
        expect(result).toBe(true);
        expect(mockChessGameLogic.isCheck).toHaveBeenCalledOnce();
      });

      it('should delegate to chess engine and return false when not in check', () => {
        mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.isCheck();
        
        expect(result).toBe(false);
        expect(mockChessGameLogic.isCheck).toHaveBeenCalledOnce();
      });
    });

    describe('isCheckmate()', () => {
      it('should delegate to chess engine and return true when in checkmate', () => {
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.isCheckmate();
        
        expect(result).toBe(true);
        expect(mockChessGameLogic.isCheckmate).toHaveBeenCalledOnce();
      });

      it('should delegate to chess engine and return false when not in checkmate', () => {
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.isCheckmate();
        
        expect(result).toBe(false);
        expect(mockChessGameLogic.isCheckmate).toHaveBeenCalledOnce();
      });
    });

    describe('isStalemate()', () => {
      it('should delegate to chess engine and return true when in stalemate', () => {
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.isStalemate();
        
        expect(result).toBe(true);
        expect(mockChessGameLogic.isStalemate).toHaveBeenCalledOnce();
      });

      it('should delegate to chess engine and return false when not in stalemate', () => {
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.isStalemate();
        
        expect(result).toBe(false);
        expect(mockChessGameLogic.isStalemate).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Block B2: Advanced Game State', () => {
    describe('isDraw()', () => {
      it('should delegate to chess game logic and return true when draw', () => {
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.isDraw();
        
        expect(result).toBe(true);
        expect(mockChessGameLogic.isDraw).toHaveBeenCalledOnce();
      });

      it('should delegate to chess game logic and return false when not draw', () => {
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.isDraw();
        
        expect(result).toBe(false);
        expect(mockChessGameLogic.isDraw).toHaveBeenCalledOnce();
      });
    });

    describe('isGameOver()', () => {
      it('should delegate to chess game logic and return true when game over', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.isGameOver();
        
        expect(result).toBe(true);
        expect(mockChessGameLogic.isGameOver).toHaveBeenCalledOnce();
      });

      it('should delegate to chess game logic and return false when game not over', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.isGameOver();
        
        expect(result).toBe(false);
        expect(mockChessGameLogic.isGameOver).toHaveBeenCalledOnce();
      });
    });

    describe('getTerminationReason()', () => {
      it('should return null when game is ongoing', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getTerminationReason();
        
        expect(result).toBeNull();
        expect(mockChessGameLogic.isGameOver).toHaveBeenCalledOnce();
      });

      it('should return "checkmate" when game ended by checkmate', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getTerminationReason();
        
        expect(result).toBe('checkmate');
      });

      it('should return "stalemate" when game ended by stalemate', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getTerminationReason();
        
        expect(result).toBe('stalemate');
      });

      it('should return "draw" when game ended by draw conditions', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.getTerminationReason();
        
        expect(result).toBe('draw-agreement');
      });

      it('should return null when game is over but no specific reason found', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getTerminationReason();
        
        expect(result).toBeNull();
      });
    });
  });

  describe('Block C1: Integration Layer', () => {
    describe('getGameState()', () => {
      it('should return comprehensive game state information', () => {
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getGameState();
        
        expect(result).toEqual({
          turn: 'white',
          isCheck: false,
          isGameOver: false,
          isCheckmate: false,
          isStalemate: false,
          isDraw: false,
          fullMoveNumber: 1,
          halfMoveClock: 0
        });
      });

      it('should include termination reason when game is over', () => {
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        mockChessGameLogic.isCheck = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getGameState();
        
        expect(result.isGameOver).toBe(true);
        expect(result.terminationReason).toBe('checkmate');
      });
    });

    describe('getGameOutcome()', () => {
      it('should return null when game is ongoing', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getGameOutcome();
        
        expect(result).toBeNull();
      });

      it('should return "0-1" when white is checkmated', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        
        const result = gameStateService.getGameOutcome();
        
        expect(result).toBe('0-1');
      });

      it('should return "1-0" when black is checkmated', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
        
        const result = gameStateService.getGameOutcome();
        
        expect(result).toBe('1-0');
      });

      it('should return "1/2-1/2" for stalemate', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const result = gameStateService.getGameOutcome();
        
        expect(result).toBe('1/2-1/2');
      });

      it('should return "1/2-1/2" for draw', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(true);
        
        const result = gameStateService.getGameOutcome();
        
        expect(result).toBe('1/2-1/2');
      });
    });

    describe('finalizeTrainingSession()', () => {
      it('should return successful result when target outcome is achieved', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
        
        const metrics = { moveCount: 10, mistakes: 1, hintsUsed: 2, accuracy: 90 };
        const result = gameStateService.finalizeTrainingSession('checkmate', '1-0', metrics);
        
        expect(result).toEqual({
          success: true,
          reason: 'checkmate',
          outcome: '1-0',
          targetAchieved: true,
          metrics
        });
      });

      it('should return unsuccessful result when target outcome is not achieved', () => {
        mockChessGameLogic.isGameOver = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isCheckmate = vi.fn().mockReturnValue(false);
        mockChessGameLogic.isStalemate = vi.fn().mockReturnValue(true);
        mockChessGameLogic.isDraw = vi.fn().mockReturnValue(false);
        
        const metrics = { moveCount: 15, mistakes: 3, hintsUsed: 1, accuracy: 75 };
        const result = gameStateService.finalizeTrainingSession('stalemate', '1-0', metrics);
        
        expect(result).toEqual({
          success: false,
          reason: 'stalemate',
          outcome: '1/2-1/2',
          targetAchieved: false,
          metrics
        });
      });
    });
  });

  describe('Block C2: Remaining Operations', () => {
    describe('isPlayerTurn()', () => {
      it('should return true when current turn matches training color', () => {
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        
        const result = gameStateService.isPlayerTurn('white');
        
        expect(result).toBe(true);
      });

      it('should return false when current turn does not match training color', () => {
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        
        const result = gameStateService.isPlayerTurn('black');
        
        expect(result).toBe(false);
      });

      it('should handle black to move correctly', () => {
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
        
        const whiteResult = gameStateService.isPlayerTurn('white');
        const blackResult = gameStateService.isPlayerTurn('black');
        
        expect(whiteResult).toBe(false);
        expect(blackResult).toBe(true);
      });
    });

    describe('reset()', () => {
      it('should complete without error', () => {
        expect(() => gameStateService.reset()).not.toThrow();
      });

      it('should not affect subsequent method calls', () => {
        mockChessGameLogic.getFen = vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        
        gameStateService.reset();
        const result = gameStateService.getTurn();
        
        expect(result).toBe('white');
        expect(mockChessGameLogic.getFen).toHaveBeenCalledOnce();
      });
    });
  });
});