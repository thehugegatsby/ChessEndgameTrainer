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
      // Setup validation mock instance
      const validationMock = {
        fen: jest.fn().mockReturnValue(StandardPositions.STARTING),
        move: jest.fn().mockReturnValue({ san: "e4" }),
      } as any;

      MockedChess.mockImplementationOnce(() => validationMock);

      const isValid = chessService.validateMove(createTestMove("e2", "e4"));

      expect(isValid).toBe(true);
      expect(validationMock.move).toHaveBeenCalledWith({
        from: "e2",
        to: "e4",
      });
      // Main chess instance should not be affected
      expect(mockChessInstance.move).not.toHaveBeenCalled();
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
});
