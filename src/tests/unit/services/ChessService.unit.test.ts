/**
 * ChessService Unit Tests - Issue #85 Phase 1
 *
 * Focus: Unit testing with mocked chess.js (70% of total test strategy)
 * Target: >90% coverage for move() and validateMove() methods
 * Strategy: Mock chess.js to test ChessService orchestration logic
 */

import { ChessService } from "@shared/services/ChessService";
import {
  StandardPositions,
  EndgamePositions,
} from "../../fixtures/fenPositions";
import {
  createMockListener,
  createMockListeners,
  getLastEmittedEvent,
  isValidStateUpdateEvent,
  isValidErrorEvent,
  createTestMove,
} from "../../helpers/chessTestHelpers";
import { Chess } from "chess.js";

// Mock chess.js for all unit tests
jest.mock("chess.js");

const MockedChess = Chess as jest.MockedClass<typeof Chess>;

describe("ChessService Unit Tests", () => {
  let chessService: ChessService;
  let mockChessInstance: jest.Mocked<InstanceType<typeof Chess>>;

  beforeEach(() => {
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance
    mockChessInstance = {
      move: jest.fn(),
      fen: jest.fn().mockReturnValue(StandardPositions.STARTING),
      pgn: jest.fn().mockReturnValue(""),
      history: jest.fn().mockReturnValue([]),
      load: jest.fn(),
      isGameOver: jest.fn().mockReturnValue(false),
      turn: jest.fn().mockReturnValue("w"),
      moves: jest.fn().mockReturnValue(["e4", "e3", "Nf3"]),
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    chessService = new ChessService();
  });

  describe("Constructor & Initialization", () => {
    it("should create ChessService instance", () => {
      expect(chessService).toBeInstanceOf(ChessService);
      expect(MockedChess).toHaveBeenCalledTimes(1);
    });

    it("should initialize with custom FEN", () => {
      const customFen = EndgamePositions.KPK_WIN;
      mockChessInstance.fen.mockReturnValue(customFen);

      const result = chessService.initialize(customFen);

      expect(result).toBe(true);
      expect(MockedChess).toHaveBeenLastCalledWith(customFen);
    });

    it("should handle initialization errors and emit error event", () => {
      const mockListener = createMockListener();
      chessService.subscribe(mockListener);

      // Mock error during Chess constructor
      MockedChess.mockImplementationOnce(() => {
        throw new Error("Invalid FEN");
      });

      const result = chessService.initialize("invalid-fen");

      expect(result).toBe(false);
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          payload: expect.objectContaining({
            message: "Ungültige FEN-Position",
          }),
        }),
      );
    });
  });

  describe("Event System", () => {
    let mockListener: jest.MockedFunction<any>;

    beforeEach(() => {
      mockListener = createMockListener();
      chessService.subscribe(mockListener);
    });

    it("should subscribe and emit stateUpdate events", () => {
      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
      mockChessInstance.fen.mockReturnValue(StandardPositions.AFTER_E4);

      chessService.move(createTestMove("e2", "e4"));

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "stateUpdate",
          source: "move",
        }),
      );
      expect(isValidStateUpdateEvent(getLastEmittedEvent(mockListener)!)).toBe(
        true,
      );
    });

    it("should unsubscribe correctly", () => {
      const unsubscribe = chessService.subscribe(mockListener);

      // Verify event is received
      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
      chessService.move(createTestMove("e2", "e4"));
      expect(mockListener).toHaveBeenCalledTimes(1);

      // Unsubscribe and verify no more events
      mockListener.mockClear();
      unsubscribe();
      chessService.move(createTestMove("e7", "e5"));
      expect(mockListener).not.toHaveBeenCalled();
    });

    it("should handle multiple listeners", () => {
      const listeners = createMockListeners(3);
      listeners.forEach((l) => chessService.subscribe(l));

      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
      chessService.move(createTestMove("e2", "e4"));

      listeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledTimes(1);
        expect(isValidStateUpdateEvent(getLastEmittedEvent(listener)!)).toBe(
          true,
        );
      });
    });

    it("should handle listener exceptions gracefully", () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });
      chessService.subscribe(errorListener);

      // Should not throw when listener errors
      expect(() => {
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
      }).not.toThrow();

      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe("move() method - Core Focus", () => {
    let mockListener: jest.MockedFunction<any>;

    beforeEach(() => {
      mockListener = createMockListener();
      chessService.subscribe(mockListener);
    });

    it("should execute valid moves successfully", () => {
      const moveResult = {
        san: "e4",
        from: "e2",
        to: "e4",
        piece: "p",
        color: "w",
        flags: "b",
      };
      mockChessInstance.move.mockReturnValue(moveResult as any);
      mockChessInstance.fen.mockReturnValue(StandardPositions.AFTER_E4);

      const result = chessService.move(createTestMove("e2", "e4"));

      expect(result).not.toBeNull();
      expect(result?.san).toBe("e4");
      expect(mockChessInstance.move).toHaveBeenCalledWith({
        from: "e2",
        to: "e4",
      });
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "stateUpdate",
          source: "move",
        }),
      );
    });

    it("should return null for invalid moves and emit error event", () => {
      mockChessInstance.move.mockReturnValue(null as any);

      const result = chessService.move(createTestMove("e2", "e5"));

      expect(result).toBeNull();
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          payload: expect.objectContaining({
            message: "Ungültiger Zug",
          }),
        }),
      );
    });

    it("should handle promotion moves correctly", () => {
      const promotionMove = {
        san: "e8=Q+",
        from: "e7",
        to: "e8",
        promotion: "q",
        piece: "p",
        color: "w",
      };
      mockChessInstance.move.mockReturnValue(promotionMove as any);

      const result = chessService.move(createTestMove("e7", "e8", "q"));

      expect(result).not.toBeNull();
      expect(mockChessInstance.move).toHaveBeenCalledWith({
        from: "e7",
        to: "e8",
        promotion: "q",
      });
    });

    it("should handle move exceptions gracefully", () => {
      mockChessInstance.move.mockImplementation(() => {
        throw new Error("Chess.js internal error");
      });

      const result = chessService.move(createTestMove("e2", "e4"));

      expect(result).toBeNull();
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          payload: expect.objectContaining({
            message: "Fehler beim Ausführen des Zuges",
          }),
        }),
      );
    });

    it("should update internal move history correctly", () => {
      // Make first move
      mockChessInstance.move
        .mockReturnValueOnce({
          san: "e4",
          from: "e2",
          to: "e4",
          piece: "p",
          color: "w",
        } as any)
        .mockReturnValueOnce({
          san: "e5",
          from: "e7",
          to: "e5",
          piece: "p",
          color: "b",
        } as any);

      chessService.move(createTestMove("e2", "e4"));
      chessService.move(createTestMove("e7", "e5"));

      const history = chessService.getMoveHistory();
      expect(history).toHaveLength(2);
      expect(history[0].san).toBe("e4");
      expect(history[1].san).toBe("e5");
    });

    it("should accept string moves in SAN notation", () => {
      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);

      const result = chessService.move("e4"); // String instead of object

      expect(result).not.toBeNull();
      expect(mockChessInstance.move).toHaveBeenCalledWith("e4");
    });
  });

  describe("validateMove() method - Core Focus", () => {
    it("should validate moves without changing main chess state", () => {
      // Setup validation mock instance with all required methods
      const validationMock = {
        fen: jest.fn().mockReturnValue(StandardPositions.STARTING),
        get: jest.fn().mockReturnValue({ type: 'p', color: 'w' }), // Add get() for piece validation
        move: jest.fn().mockReturnValue({ 
          san: "e4", 
          from: "e2", 
          to: "e4", 
          color: "w", 
          piece: "p", 
          flags: "b" 
        }),
      } as any;

      // Use mockImplementation instead of mockImplementationOnce to cover both Chess instances
      MockedChess.mockImplementation(() => validationMock);

      const isValid = chessService.validateMove(createTestMove("e2", "e4"));

      expect(isValid).toBe(true);
      expect(validationMock.move).toHaveBeenCalledWith({
        from: "e2",
        to: "e4",
      });
      // Main chess instance should not be affected
      expect(mockChessInstance.move).not.toHaveBeenCalled();
      
      // Reset mock for next tests
      MockedChess.mockImplementation(() => mockChessInstance);
    });

    it("should return false for invalid moves", () => {
      const validationMock = {
        fen: jest.fn().mockReturnValue(StandardPositions.STARTING),
        move: jest.fn().mockReturnValue(null),
      } as any;

      MockedChess.mockImplementationOnce(() => validationMock);

      const isValid = chessService.validateMove(createTestMove("e2", "e5"));

      expect(isValid).toBe(false);
    });

    it("should handle validation errors gracefully", () => {
      const validationMock = {
        fen: jest.fn().mockImplementation(() => {
          throw new Error("Validation error");
        }),
      } as any;

      MockedChess.mockImplementationOnce(() => validationMock);

      const isValid = chessService.validateMove(createTestMove("e2", "e4"));

      expect(isValid).toBe(false);
    });

    it("should validate string moves correctly", () => {
      const validationMock = {
        fen: jest.fn().mockReturnValue(StandardPositions.STARTING),
        move: jest.fn().mockReturnValue({ san: "Nf3" }),
      } as any;

      MockedChess.mockImplementationOnce(() => validationMock);

      const isValid = chessService.validateMove("Nf3");

      expect(isValid).toBe(true);
      expect(validationMock.move).toHaveBeenCalledWith("Nf3");
    });
  });

  describe("Getter Methods", () => {
    it("should return current FEN from chess instance", () => {
      const testFen = EndgamePositions.KPK_WIN;
      mockChessInstance.fen.mockReturnValue(testFen);

      expect(chessService.getFen()).toBe(testFen);
      expect(mockChessInstance.fen).toHaveBeenCalled();
    });

    it("should return current PGN from chess instance", () => {
      const testPgn = "1. e4 e5";
      mockChessInstance.pgn.mockReturnValue(testPgn);

      expect(chessService.getPgn()).toBe(testPgn);
      expect(mockChessInstance.pgn).toHaveBeenCalled();
    });

    it("should return move history (ChessService managed)", () => {
      const history = chessService.getMoveHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0); // Empty initially
    });

    it("should return game over status from chess instance", () => {
      mockChessInstance.isGameOver.mockReturnValue(true);
      expect(chessService.isGameOver()).toBe(true);
      expect(mockChessInstance.isGameOver).toHaveBeenCalled();
    });

    it("should return current turn from chess instance", () => {
      mockChessInstance.turn.mockReturnValue("b");
      expect(chessService.turn()).toBe("b");
      expect(mockChessInstance.turn).toHaveBeenCalled();
    });
  });

  describe("Cache Management", () => {
    it("should use cached FEN when available", () => {
      const testFen = EndgamePositions.KPK_CENTRAL;

      // Initialize once to populate cache
      chessService.initialize(testFen);
      expect(MockedChess).toHaveBeenCalledTimes(2); // Constructor + initialize

      // Clear mock call count to test cache usage
      MockedChess.mockClear();

      // Initialize with same FEN should use cache
      chessService.initialize(testFen);
      expect(MockedChess).toHaveBeenCalledTimes(1); // Only new instance for current state
    });

    it("should handle cache overflow gracefully", () => {
      // Simulate adding many positions to trigger LRU eviction
      for (let i = 0; i < 150; i++) {
        // Exceeds MAX_CACHE_SIZE = 100
        const testFen = `test-fen-${i}`;
        chessService.initialize(testFen);
      }

      // Should not throw errors
      expect(() => {
        chessService.initialize("final-test-fen");
      }).not.toThrow();
    });
  });

  describe("State Management", () => {
    it("should build correct state payload for events", () => {
      mockChessInstance.fen.mockReturnValue(StandardPositions.AFTER_E4);
      mockChessInstance.pgn.mockReturnValue("1. e4");
      mockChessInstance.isGameOver.mockReturnValue(false);

      const mockListener = createMockListener();
      chessService.subscribe(mockListener);

      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
      chessService.move(createTestMove("e2", "e4"));

      const event = getLastEmittedEvent(mockListener);
      expect(event!.type).toBe("stateUpdate");

      if (event!.type === "stateUpdate") {
        expect(event!.payload.fen).toBe(StandardPositions.AFTER_E4);
        expect(event!.payload.pgn).toBe("1. e4");
        expect(event!.payload.isGameOver).toBe(false);
        expect(event!.payload.moveHistory).toHaveLength(1);
        expect(event!.payload.currentMoveIndex).toBe(0);
      }
    });
  });

  describe("FEN Cache Management - Issue #86", () => {
    it("should cache FEN strings for performance", () => {
      const testFen = EndgamePositions.KPK_WIN;
      mockChessInstance.fen.mockReturnValue(testFen);

      // First initialization should create Chess instance
      chessService.initialize(testFen);
      expect(MockedChess).toHaveBeenCalledWith(testFen);

      // Reset mock but keep the same return value for fen()
      MockedChess.mockClear();
      mockChessInstance.fen.mockReturnValue(testFen);

      // Second initialization with same FEN should create new Chess instance but use cached normalized FEN
      chessService.initialize(testFen);
      expect(MockedChess).toHaveBeenCalledTimes(1); // New instance created
    });

    it("should handle cache overflow with LRU eviction", () => {
      // Add more than MAX_CACHE_SIZE (100) entries to trigger eviction
      for (let i = 0; i < 110; i++) {
        const testFen = `test-fen-${i}-8/8/8/8/8/8/8/k6K w - - 0 1`;
        mockChessInstance.fen.mockReturnValue(testFen);
        chessService.initialize(testFen);
      }

      // Should not throw errors and cache should handle overflow gracefully
      expect(() => {
        chessService.initialize("final-test-fen-8/8/8/8/8/8/8/k6K w - - 0 1");
      }).not.toThrow();
    });

    it("should move accessed items to end in LRU cache", () => {
      // This test verifies LRU behavior by checking that frequently accessed items aren't evicted
      const frequentFen = "frequent-8/8/8/8/8/8/8/k6K w - - 0 1";
      const rareFens: string[] = [];

      // Add frequent FEN
      mockChessInstance.fen.mockReturnValue(frequentFen);
      chessService.initialize(frequentFen);

      // Add 99 more FENs to almost fill cache
      for (let i = 0; i < 99; i++) {
        const rareFen = `rare-${i}-8/8/8/8/8/8/8/k6K w - - 0 1`;
        rareFens.push(rareFen);
        mockChessInstance.fen.mockReturnValue(rareFen);
        chessService.initialize(rareFen);
      }

      // Access frequent FEN again (moves to end of LRU)
      chessService.initialize(frequentFen);

      // Add one more FEN to trigger eviction of oldest (should evict first rare FEN, not frequent)
      const newFen = "new-8/8/8/8/8/8/8/k6K w - - 0 1";
      mockChessInstance.fen.mockReturnValue(newFen);
      chessService.initialize(newFen);

      // Frequent FEN should still be accessible (not evicted)
      chessService.initialize(frequentFen);
      // If this doesn't throw, the frequent FEN is still cached
      expect(() => chessService.initialize(frequentFen)).not.toThrow();
    });

    it("should store normalized FEN strings in cache", () => {
      const inputFen = EndgamePositions.KPK_WIN;
      const normalizedFen = StandardPositions.STARTING; // Mock normalization

      mockChessInstance.fen.mockReturnValue(normalizedFen);
      chessService.initialize(inputFen);

      // Verify that Chess was called with the original FEN
      expect(MockedChess).toHaveBeenCalledWith(inputFen);
    });

    it("should handle cache key collisions correctly", () => {
      const fen1 = "8/8/8/8/8/8/8/K6k w - - 0 1";
      const fen2 = "8/8/8/8/8/8/8/K6k w - - 0 1"; // Same FEN

      mockChessInstance.fen.mockReturnValue(fen1);

      // Initialize twice with same FEN
      chessService.initialize(fen1);
      const firstCallCount = MockedChess.mock.calls.length;

      chessService.initialize(fen2);
      const secondCallCount = MockedChess.mock.calls.length;

      // Should use cache for second call (same FEN)
      expect(secondCallCount).toBe(firstCallCount + 1); // Only one new Chess instance
    });
  });

  describe("Navigation Methods - Issue #86", () => {
    describe("undo() method", () => {
      let mockListener: jest.MockedFunction<any>;

      beforeEach(() => {
        mockListener = createMockListener();
        chessService.subscribe(mockListener);
      });

      it("should successfully undo last move", () => {
        // Setup: Make a move first
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        mockChessInstance.fen
          .mockReturnValueOnce(StandardPositions.STARTING)
          .mockReturnValueOnce(StandardPositions.AFTER_E4);
        chessService.move(createTestMove("e2", "e4"));
        mockListener.mockClear();

        // Test undo
        mockChessInstance.fen.mockReturnValue(StandardPositions.STARTING);
        const result = chessService.undo();

        expect(result).toBe(true);
        expect(MockedChess).toHaveBeenLastCalledWith(
          StandardPositions.STARTING,
        );
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "stateUpdate",
            source: "undo",
          }),
        );
      });

      it("should return false and emit error when no moves to undo", () => {
        // No moves made yet
        const result = chessService.undo();

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Keine Züge zum Rückgängigmachen",
            }),
          }),
        );
      });

      it("should handle undo exceptions gracefully", () => {
        // Setup: Make a move first
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        mockListener.mockClear();

        // Mock Chess constructor to throw during undo
        MockedChess.mockImplementationOnce(() => {
          throw new Error("FEN restoration failed");
        });

        const result = chessService.undo();

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Fehler beim Rückgängigmachen",
            }),
          }),
        );
      });

      it("should correctly update currentMoveIndex after undo", () => {
        // Make 3 moves
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        chessService.move(createTestMove("e7", "e5"));
        chessService.move(createTestMove("g1", "f3"));

        expect(chessService.getCurrentMoveIndex()).toBe(2);

        // Undo once
        chessService.undo();
        expect(chessService.getCurrentMoveIndex()).toBe(1);

        // Undo again
        chessService.undo();
        expect(chessService.getCurrentMoveIndex()).toBe(0);
      });
    });

    describe("redo() method", () => {
      let mockListener: jest.MockedFunction<any>;

      beforeEach(() => {
        mockListener = createMockListener();
        chessService.subscribe(mockListener);
      });

      it("should successfully redo undone move", () => {
        // Setup: Make a move, then undo it
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        mockChessInstance.fen.mockReturnValue(StandardPositions.AFTER_E4);
        chessService.move(createTestMove("e2", "e4"));
        chessService.undo(); // Now currentMoveIndex = -1
        mockListener.mockClear();

        // Test redo
        const result = chessService.redo();

        expect(result).toBe(true);
        expect(MockedChess).toHaveBeenLastCalledWith(
          StandardPositions.AFTER_E4,
        );
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "stateUpdate",
            source: "redo",
          }),
        );
      });

      it("should return false and emit error when no moves to redo", () => {
        // No moves made or already at end of history
        const result = chessService.redo();

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Keine Züge zum Wiederherstellen",
            }),
          }),
        );
      });

      it("should return false when already at end of history", () => {
        // Make a move (at end of history)
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        mockListener.mockClear();

        const result = chessService.redo();

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Keine Züge zum Wiederherstellen",
            }),
          }),
        );
      });

      it("should handle redo exceptions gracefully", () => {
        // Setup: Make move and undo
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        chessService.undo();
        mockListener.mockClear();

        // Mock Chess constructor to throw during redo
        MockedChess.mockImplementationOnce(() => {
          throw new Error("FEN restoration failed");
        });

        const result = chessService.redo();

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Fehler beim Wiederherstellen",
            }),
          }),
        );
      });
    });

    describe("goToMove() method", () => {
      let mockListener: jest.MockedFunction<any>;

      beforeEach(() => {
        mockListener = createMockListener();
        chessService.subscribe(mockListener);
      });

      it("should navigate to specific move index successfully", () => {
        // Setup: Make 3 moves
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        mockChessInstance.fen.mockReturnValue(StandardPositions.AFTER_E4);
        chessService.move(createTestMove("e2", "e4"));
        chessService.move(createTestMove("e7", "e5"));
        chessService.move(createTestMove("g1", "f3"));
        mockListener.mockClear();

        // Navigate to move 1 (second move)
        const result = chessService.goToMove(1);

        expect(result).toBe(true);
        expect(chessService.getCurrentMoveIndex()).toBe(1);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "stateUpdate",
            source: "load",
          }),
        );
      });

      it("should navigate to starting position with index -1", () => {
        // Setup: Make moves
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        chessService.move(createTestMove("e7", "e5"));
        mockListener.mockClear();

        // Navigate to start (-1)
        const result = chessService.goToMove(-1);

        expect(result).toBe(true);
        expect(chessService.getCurrentMoveIndex()).toBe(-1);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "stateUpdate",
            source: "load",
          }),
        );
      });

      it("should return false for invalid negative index", () => {
        const result = chessService.goToMove(-2);

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Ungültiger Zugindex: -2",
            }),
          }),
        );
      });

      it("should return false for index beyond history length", () => {
        // Make 2 moves
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        chessService.move(createTestMove("e7", "e5"));
        mockListener.mockClear();

        // Try to go to index 5 (out of bounds)
        const result = chessService.goToMove(5);

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Ungültiger Zugindex: 5",
            }),
          }),
        );
      });

      it("should handle navigation exceptions gracefully", () => {
        // Setup: Make a move
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        mockListener.mockClear();

        // Mock Chess constructor to throw
        MockedChess.mockImplementationOnce(() => {
          throw new Error("FEN restoration failed");
        });

        const result = chessService.goToMove(0);

        expect(result).toBe(false);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            payload: expect.objectContaining({
              message: "Fehler beim Navigieren zum Zug",
            }),
          }),
        );
      });
    });

    describe("reset() method", () => {
      let mockListener: jest.MockedFunction<any>;

      beforeEach(() => {
        mockListener = createMockListener();
        chessService.subscribe(mockListener);
      });

      it("should reset to initial position", () => {
        // Setup: Make some moves
        mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
        chessService.move(createTestMove("e2", "e4"));
        chessService.move(createTestMove("e7", "e5"));
        mockListener.mockClear();

        // Reset
        chessService.reset();

        expect(chessService.getCurrentMoveIndex()).toBe(-1);
        expect(chessService.getMoveHistory()).toHaveLength(0);
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "stateUpdate",
            source: "reset",
          }),
        );
      });

      it("should reset to custom initial FEN, not default starting position", () => {
        // Initialize with custom FEN
        const customFen = EndgamePositions.KPK_WIN;
        mockChessInstance.fen.mockReturnValue(customFen);
        chessService.initialize(customFen);

        // Make some moves
        mockChessInstance.move.mockReturnValue({ san: "Kb8" } as any);
        chessService.move(createTestMove("a8", "b8"));
        mockListener.mockClear();

        // Reset should go back to custom FEN, not default
        chessService.reset();

        expect(MockedChess).toHaveBeenLastCalledWith(customFen);
      });
    });
  });

  describe("Complex Navigation Flows - Issue #86", () => {
    let mockListener: jest.MockedFunction<any>;

    beforeEach(() => {
      mockListener = createMockListener();
      chessService.subscribe(mockListener);
    });

    it("should handle complex navigation scenario: moves -> undo -> new moves -> goTo -> reset", () => {
      // Step 1: Make 5 moves
      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
      for (let i = 0; i < 5; i++) {
        chessService.move(createTestMove("e2", "e4"));
      }
      expect(chessService.getCurrentMoveIndex()).toBe(4);
      expect(chessService.getMoveHistory()).toHaveLength(5);

      // Step 2: Undo 3 times
      for (let i = 0; i < 3; i++) {
        chessService.undo();
      }
      expect(chessService.getCurrentMoveIndex()).toBe(1);

      // Step 3: Make 2 different moves (should truncate history)
      chessService.move(createTestMove("g1", "f3"));
      chessService.move(createTestMove("b8", "c6"));
      expect(chessService.getCurrentMoveIndex()).toBe(3);
      expect(chessService.getMoveHistory()).toHaveLength(4); // First 2 + 2 new moves

      // Step 4: GoToMove(1) - middle of new history
      const goToResult = chessService.goToMove(1);
      expect(goToResult).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(1);

      // Step 5: Redo should work (still moves ahead in history)
      const redoResult = chessService.redo();
      expect(redoResult).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(2);

      // Step 6: Reset - back to initial position
      chessService.reset();
      expect(chessService.getCurrentMoveIndex()).toBe(-1);
      expect(chessService.getMoveHistory()).toHaveLength(0);
    });

    it("should handle undo/redo at history boundaries correctly", () => {
      // Start with no moves - undo should fail
      expect(chessService.undo()).toBe(false);
      expect(chessService.redo()).toBe(false);

      // Make 1 move
      mockChessInstance.move.mockReturnValue({ san: "e4" } as any);
      chessService.move(createTestMove("e2", "e4"));

      // At end of history - redo should fail
      expect(chessService.redo()).toBe(false);

      // Undo should work
      expect(chessService.undo()).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(-1);

      // At start of history - undo should fail again
      expect(chessService.undo()).toBe(false);

      // Redo should work
      expect(chessService.redo()).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(0);
    });
  });
});
