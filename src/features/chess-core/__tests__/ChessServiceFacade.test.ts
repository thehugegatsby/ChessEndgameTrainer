/**
 * Tests for ChessServiceFacade
 * Tests the orchestrator that coordinates all chess components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  IChessServiceFacade, 
  ChessEventPayload,
  IChessEngine,
  IMoveValidator,
  IMoveHistory,
  IChessEventBus,
  IGermanNotation,
  IFenCache
} from '../types/interfaces';
import ChessServiceFacade from '../facades/ChessServiceFacade';
import { COMMON_FENS } from '../../../tests/fixtures/commonFens';

describe('ChessServiceFacade', () => {
  let facade: IChessServiceFacade;
  let eventHandler: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    facade = new ChessServiceFacade();
    eventHandler = vi.fn();
  });
  
  describe('Component Access', () => {
    it('should provide access to all components', () => {
      expect(facade.getEngine()).toBeDefined();
      expect(facade.getValidator()).toBeDefined();
      expect(facade.getHistory()).toBeDefined();
      expect(facade.getEventBus()).toBeDefined();
      expect(facade.getNotation()).toBeDefined();
      expect(facade.getCache()).toBeDefined();
    });
    
    it('should allow dependency injection', () => {
      const mockEngine = {} as IChessEngine;
      const mockValidator = {} as IMoveValidator;
      const mockHistory = {} as IMoveHistory;
      const mockEventBus = {} as IChessEventBus;
      const mockNotation = {} as IGermanNotation;
      const mockCache = {} as IFenCache;
      
      const customFacade = new ChessServiceFacade({
        engine: mockEngine,
        validator: mockValidator,
        history: mockHistory,
        eventBus: mockEventBus,
        notation: mockNotation,
        cache: mockCache
      });
      
      expect(customFacade.getEngine()).toBe(mockEngine);
      expect(customFacade.getValidator()).toBe(mockValidator);
      expect(customFacade.getHistory()).toBe(mockHistory);
      expect(customFacade.getEventBus()).toBe(mockEventBus);
      expect(customFacade.getNotation()).toBe(mockNotation);
      expect(customFacade.getCache()).toBe(mockCache);
    });
  });
  
  describe('Game Initialization', () => {
    it('should initialize with default starting position', () => {
      const success = facade.initialize();
      
      expect(success).toBe(true);
      expect(facade.getFen()).toBe(COMMON_FENS.STARTING_POSITION);
      expect(facade.getCurrentMoveIndex()).toBe(-1);
      expect(facade.getMoveHistory()).toEqual([]);
    });
    
    it('should initialize with custom FEN', () => {
      const success = facade.initialize(COMMON_FENS.OPENING_AFTER_E4);
      
      expect(success).toBe(true);
      expect(facade.getFen()).toBe(COMMON_FENS.OPENING_AFTER_E4);
    });
    
    it('should emit stateUpdate event on initialization', () => {
      const unsubscribe = facade.subscribe(eventHandler);
      
      facade.initialize();
      
      expect(eventHandler).toHaveBeenCalledWith({
        type: "stateUpdate",
        payload: {
          fen: COMMON_FENS.STARTING_POSITION,
          pgn: expect.stringContaining("[Event"),
          moveHistory: [],
          currentMoveIndex: -1,
          isGameOver: false,
          gameResult: null,
          source: "load"
        }
      });
      
      unsubscribe();
    });
    
    it('should reset game state', () => {
      facade.initialize();
      facade.move("e4");
      
      const unsubscribe = facade.subscribe(eventHandler);
      facade.reset();
      
      expect(facade.getFen()).toBe(COMMON_FENS.STARTING_POSITION);
      expect(facade.getCurrentMoveIndex()).toBe(-1);
      expect(facade.getMoveHistory()).toEqual([]);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "stateUpdate",
          payload: expect.objectContaining({ source: "reset" })
        })
      );
      
      unsubscribe();
    });
  });
  
  describe('Move Operations', () => {
    beforeEach(() => {
      facade.initialize();
    });
    
    it('should execute valid moves', () => {
      const result = facade.move("e4");
      
      expect(result).toBeTruthy();
      expect(result?.from).toBe("e2");
      expect(result?.to).toBe("e4");
      expect(result?.piece).toBe("p");
      expect(result?.san).toBe("e4");
      expect(facade.getFen()).toBe(COMMON_FENS.OPENING_AFTER_E4);
    });
    
    it('should reject invalid moves', () => {
      const result = facade.move("e5"); // Invalid opening move
      
      expect(result).toBeNull();
      expect(facade.getFen()).toBe(COMMON_FENS.STARTING_POSITION);
    });
    
    it('should handle object move format', () => {
      const result = facade.move({ from: "e2", to: "e4" });
      
      expect(result).toBeTruthy();
      expect(facade.getFen()).toBe(COMMON_FENS.OPENING_AFTER_E4);
    });
    
    it('should handle German notation', () => {
      facade.move("e4");
      facade.move("e5");
      facade.move("Bc4");
      facade.move("Nc6");
      
      // Use German notation for Qh5 (Dame = Queen)
      const result = facade.move("Dh5");
      
      expect(result).toBeTruthy();
      expect(result?.piece).toBe("q");
      expect(result?.san).toBe("Qh5");
    });
    
    it('should emit move events', () => {
      const unsubscribe = facade.subscribe(eventHandler);
      
      const move = facade.move("e4");
      
      expect(eventHandler).toHaveBeenCalledWith({
        type: "move",
        payload: {
          move,
          fen: COMMON_FENS.OPENING_AFTER_E4,
          currentMoveIndex: 0,
          source: "move"
        }
      });
      
      unsubscribe();
    });
    
    it('should cache FEN positions', () => {
      facade.move("e4");
      
      const cache = facade.getCache();
      expect(cache.has(COMMON_FENS.OPENING_AFTER_E4)).toBe(true);
      
      const cached = cache.get(COMMON_FENS.OPENING_AFTER_E4);
      expect(cached).toBeDefined();
      
      const cacheData = JSON.parse(cached!);
      expect(cacheData.moveNumber).toBe(1);
    });
  });
  
  describe('Move History Navigation', () => {
    beforeEach(() => {
      facade.initialize();
      facade.move("e4");
      facade.move("e5");
      facade.move("Nf3");
    });
    
    it('should undo moves', () => {
      expect(facade.getCurrentMoveIndex()).toBe(2);
      
      const success = facade.undo();
      
      expect(success).toBe(true);
      expect(facade.getCurrentMoveIndex()).toBe(1);
      expect(facade.getFen()).not.toContain("Nf3");
    });
    
    it('should redo moves', () => {
      facade.undo();
      expect(facade.getCurrentMoveIndex()).toBe(1);
      
      const success = facade.redo();
      
      expect(success).toBe(true);
      expect(facade.getCurrentMoveIndex()).toBe(2);
    });
    
    it('should not undo beyond start', () => {
      facade.undo(); // Index 1
      facade.undo(); // Index 0
      facade.undo(); // Index -1 (start)
      
      const success = facade.undo(); // Should fail
      
      expect(success).toBe(false);
      expect(facade.getCurrentMoveIndex()).toBe(-1);
    });
    
    it('should not redo beyond end', () => {
      const success = facade.redo(); // Already at end
      
      expect(success).toBe(false);
      expect(facade.getCurrentMoveIndex()).toBe(2);
    });
    
    it('should go to specific move index', () => {
      const success = facade.goToMove(1);
      
      expect(success).toBe(true);
      expect(facade.getCurrentMoveIndex()).toBe(1);
    });
    
    it('should go to starting position', () => {
      const success = facade.goToMove(-1);
      
      expect(success).toBe(true);
      expect(facade.getCurrentMoveIndex()).toBe(-1);
      expect(facade.getFen()).toBe(COMMON_FENS.STARTING_POSITION);
    });
    
    it('should reject invalid move indices', () => {
      expect(facade.goToMove(-2)).toBe(false);
      expect(facade.goToMove(10)).toBe(false);
    });
    
    it('should emit events on navigation', () => {
      const unsubscribe = facade.subscribe(eventHandler);
      
      facade.undo();
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "stateUpdate",
          payload: expect.objectContaining({ source: "undo" })
        })
      );
      
      unsubscribe();
    });
  });
  
  describe('Game State', () => {
    beforeEach(() => {
      facade.initialize();
    });
    
    it('should provide game state information', () => {
      expect(facade.isGameOver()).toBe(false);
      expect(facade.isCheck()).toBe(false);
      expect(facade.isCheckmate()).toBe(false);
      expect(facade.isStalemate()).toBe(false);
      expect(facade.isDraw()).toBe(false);
      expect(facade.turn()).toBe("w");
      expect(facade.getGameResult()).toBeNull();
    });
    
    it('should detect checkmate', () => {
      facade.initialize(COMMON_FENS.CHECKMATE_POSITION);
      
      expect(facade.isCheckmate()).toBe(true);
      expect(facade.isGameOver()).toBe(true);
      expect(facade.getGameResult()).toBe("1-0"); // White wins
    });
    
    it('should provide move generation', () => {
      const moves = facade.moves();
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(20); // Starting position has 20 legal moves
    });
    
    it('should provide verbose moves', () => {
      const moves = facade.moves({ verbose: true });
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(20);
      expect(moves[0]).toHaveProperty('from');
      expect(moves[0]).toHaveProperty('to');
    });
    
    it('should provide moves for specific square', () => {
      const moves = facade.moves({ square: "e2" });
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(2); // e3, e4
    });
  });
  
  describe('PGN Operations', () => {
    it('should load PGN', () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6";
      
      const success = facade.loadPgn(pgn);
      
      expect(success).toBe(true);
      expect(facade.getMoveHistory()).toHaveLength(4);
      expect(facade.getCurrentMoveIndex()).toBe(3);
    });
    
    it('should emit event on PGN load', () => {
      const unsubscribe = facade.subscribe(eventHandler);
      
      facade.loadPgn("1. e4 e5");
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "stateUpdate",
          payload: expect.objectContaining({ source: "load" })
        })
      );
      
      unsubscribe();
    });
    
    it('should generate PGN', () => {
      facade.initialize();
      facade.move("e4");
      facade.move("e5");
      
      const pgn = facade.getPgn();
      expect(pgn).toContain("1. e4 e5");
    });
  });
  
  describe('Move Validation', () => {
    beforeEach(() => {
      facade.initialize();
    });
    
    it('should validate legal moves', () => {
      expect(facade.validateMove("e4")).toBe(true);
      expect(facade.validateMove({ from: "e2", to: "e4" })).toBe(true);
    });
    
    it('should reject illegal moves', () => {
      expect(facade.validateMove("e5")).toBe(false);
      expect(facade.validateMove({ from: "e2", to: "e5" })).toBe(false);
    });
    
    it('should validate German notation', () => {
      facade.move("e4");
      facade.move("e5");
      facade.move("Bc4");
      facade.move("Nc6");
      
      expect(facade.validateMove("Dh5")).toBe(true); // German Queen
    });
  });
  
  describe('Event System', () => {
    it('should handle multiple subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      const unsubscribe1 = facade.subscribe(handler1);
      const unsubscribe2 = facade.subscribe(handler2);
      
      facade.move("e4");
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      
      unsubscribe1();
      unsubscribe2();
    });
    
    it('should unsubscribe correctly', () => {
      const unsubscribe = facade.subscribe(eventHandler);
      
      facade.move("e4");
      expect(eventHandler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      facade.move("e5");
      expect(eventHandler).toHaveBeenCalledTimes(1); // No new calls
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid FEN gracefully', () => {
      const success = facade.initialize("invalid-fen");
      expect(success).toBe(false);
    });
    
    it('should handle invalid PGN gracefully', () => {
      const success = facade.loadPgn("invalid pgn");
      expect(success).toBe(false);
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle complex game sequence', () => {
      facade.initialize();
      
      // Play Scholar's Mate
      facade.move("e4");
      facade.move("e5");
      facade.move("Bc4");
      facade.move("Nc6");
      facade.move("Qh5");
      facade.move("Nf6");
      const checkmateMove = facade.move("Qxf7#");
      
      expect(checkmateMove).toBeTruthy();
      expect(facade.isCheckmate()).toBe(true);
      expect(facade.getGameResult()).toBe("1-0");
      expect(facade.getMoveHistory()).toHaveLength(7);
    });
    
    it('should maintain consistency after undo/redo cycles', () => {
      facade.initialize();
      facade.move("e4");
      facade.move("e5");
      facade.move("Nf3");
      
      const originalFen = facade.getFen();
      const originalHistory = facade.getMoveHistory();
      
      // Undo and redo cycle
      facade.undo();
      facade.undo();
      facade.redo();
      facade.redo();
      
      expect(facade.getFen()).toBe(originalFen);
      expect(facade.getMoveHistory()).toEqual(originalHistory);
      expect(facade.getCurrentMoveIndex()).toBe(2);
    });
    
    it('should handle move truncation correctly', () => {
      facade.initialize();
      facade.move("e4");
      facade.move("e5");
      facade.move("Nf3");
      
      // Go back and make different move
      facade.undo();
      facade.move("Bc4"); // This should truncate Nf3
      
      const history = facade.getMoveHistory();
      expect(history).toHaveLength(3); // e4, e5, Bc4
      expect(history[2]?.san).toBe("Bc4");
    });
  });
});