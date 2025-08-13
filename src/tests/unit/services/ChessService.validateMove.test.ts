import { vi } from 'vitest';
/**
 * @file ChessService validateMove Edge Cases Tests
 * @description Coverage tests for validateMove edge cases (Lines 431-432, 439-440, 406)
 * Target: Remaining coverage gaps for 100% completion
 */

import { ChessService } from "@shared/services/ChessService";
import { Chess } from "chess.js";

// Mock chess.js following existing pattern
vi.mock("chess.js");

const MockedChess = Chess as any;

describe("ChessService validateMove Edge Cases", () => {
  let chessService: ChessService;
  let mockChessInstance: any;

  beforeEach(() => {
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance
    mockChessInstance = {
      move: vi.fn(),
      fen: vi.fn().mockReturnValue("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
      pgn: vi.fn().mockReturnValue(""),
      history: vi.fn().mockReturnValue([]),
      load: vi.fn(),
      loadPgn: vi.fn(),
      isGameOver: vi.fn().mockReturnValue(false),
      turn: vi.fn().mockReturnValue("w"),
      moves: vi.fn().mockReturnValue(["e4", "e3", "Nf3"] as any),
      isCheck: vi.fn().mockReturnValue(false),
      isCheckmate: vi.fn().mockReturnValue(false),
      isStalemate: vi.fn().mockReturnValue(false),
      isDraw: vi.fn().mockReturnValue(false),
      get: vi.fn(), // For piece checking in validateMove
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    chessService = new ChessService();
    chessService.initialize("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  });

  describe("validateMove() Edge Cases - Lines 431-432, 439-440", () => {
    it("should handle invalid square format in move object - Line 431-432", () => {
      // Test invalid 'from' square format (Line 431)
      const invalidFromMove = { from: "z9", to: "e4" }; // Invalid square format
      
      const result = chessService.validateMove(invalidFromMove);
      
      expect(result).toBe(false);
      // Should not call temp chess instance since format validation fails first
    });

    it("should handle invalid 'to' square format in move object - Line 431-432", () => {
      // Test invalid 'to' square format (Line 431)
      const invalidToMove = { from: "e2", to: "x0" }; // Invalid square format
      
      const result = chessService.validateMove(invalidToMove);
      
      expect(result).toBe(false);
    });

    it("should handle both invalid square formats - Line 431-432", () => {
      // Test both invalid formats
      const invalidMove = { from: "zz", to: "yy" };
      
      const result = chessService.validateMove(invalidMove);
      
      expect(result).toBe(false);
    });

    it("should handle no piece on source square - Line 439-440", () => {
      // Create temp chess instance that returns null for get()
      const tempChessInstance = {
        get: vi.fn().mockReturnValue(null),
        move: vi.fn(),
      };
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const moveWithNoPiece = { from: "d4", to: "d5" }; // Valid format but no piece on d4
      
      const result = chessService.validateMove(moveWithNoPiece);
      
      expect(result).toBe(false);
      expect(tempChessInstance.get).toHaveBeenCalledWith("d4");
    });

    it("should handle valid square format with piece present", () => {
      // Mock get() to return a piece (this will be called on the temp instance)
      const tempChessInstance = {
        move: vi.fn().mockReturnValue({ from: "e2", to: "e4", san: "e4" }),
        get: vi.fn().mockReturnValue({ type: "p", color: "w" }),
      };
      
      // Mock Chess constructor to return temp instance for validation
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const validMove = { from: "e2", to: "e4" };
      
      const result = chessService.validateMove(validMove);
      
      expect(result).toBe(true);
      expect(tempChessInstance.get).toHaveBeenCalledWith("e2");
      expect(tempChessInstance.move).toHaveBeenCalledWith(validMove);
    });

    it("should handle promotion move validation", () => {
      const tempChessInstance = {
        move: vi.fn().mockReturnValue({ from: "e7", to: "e8", san: "e8=Q", promotion: "q" }),
        get: vi.fn().mockReturnValue({ type: "p", color: "w" }),
      };
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const promotionMove = { from: "e7", to: "e8", promotion: "q" };
      
      const result = chessService.validateMove(promotionMove);
      
      expect(result).toBe(true);
      expect(tempChessInstance.move).toHaveBeenCalledWith(promotionMove);
    });

    it("should handle string moves (not object format)", () => {
      const tempChessInstance = {
        move: vi.fn().mockReturnValue({ from: "e2", to: "e4", san: "e4" }),
      };
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const stringMove = "e4";
      
      const result = chessService.validateMove(stringMove);
      
      expect(result).toBe(true);
      expect(tempChessInstance.move).toHaveBeenCalledWith(stringMove);
      // Should not call get() for string moves (different validation path)
      expect(mockChessInstance.get).not.toHaveBeenCalled();
    });

    it("should handle chess.js move objects", () => {
      const tempChessInstance = {
        move: vi.fn().mockReturnValue({ from: "e2", to: "e4", san: "e4" }),
        get: vi.fn().mockReturnValue({ type: "p", color: "w" }),
      };
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const chessJsMove = { from: "e2", to: "e4", san: "e4", piece: "p", color: "w" };
      
      const result = chessService.validateMove(chessJsMove);
      
      expect(result).toBe(true);
      expect(tempChessInstance.move).toHaveBeenCalledWith(chessJsMove);
    });

    it("should handle validation error exceptions", () => {
      // Mock exception during validation
      const tempChessInstance = {
        move: vi.fn().mockImplementation(() => {
          throw new Error("Validation failed");
        }),
      };
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const move = { from: "e2", to: "e4" };
      mockChessInstance.get.mockReturnValue({ type: "p", color: "w" });
      
      const result = chessService.validateMove(move);
      
      expect(result).toBe(false);
    });
  });

  describe("moves() method - Line 406", () => {
    it("should call chess.js moves() method without options", () => {
      mockChessInstance.moves.mockReturnValue(["e4", "e3", "Nf3"] as any);
      
      const result = chessService.moves() as string[];
      
      expect(result).toEqual(["e4", "e3", "Nf3"]);
      expect(mockChessInstance.moves).toHaveBeenCalledWith();
    });

    it("should call chess.js moves() method with square option", () => {
      mockChessInstance.moves.mockReturnValue(["e3", "e4"] as any);
      
      const result = chessService.moves({ square: "e2" }) as string[];
      
      expect(result).toEqual(["e3", "e4"]);
      expect(mockChessInstance.moves).toHaveBeenCalledWith({ square: "e2" });
    });

    it("should call chess.js moves() method with verbose option", () => {
      const verboseMoves = [
        { from: "e2", to: "e3", san: "e3" },
        { from: "e2", to: "e4", san: "e4" },
      ];
      mockChessInstance.moves.mockReturnValue(verboseMoves as any);
      
      const result = chessService.moves({ verbose: true });
      
      expect(result).toEqual(verboseMoves);
      expect(mockChessInstance.moves).toHaveBeenCalledWith({ verbose: true });
    });

    it("should call chess.js moves() method with both square and verbose options", () => {
      const verboseMoves = [
        { from: "e2", to: "e3", san: "e3" },
        { from: "e2", to: "e4", san: "e4" },
      ];
      mockChessInstance.moves.mockReturnValue(verboseMoves as any);
      
      const result = chessService.moves({ square: "e2", verbose: true });
      
      expect(result).toEqual(verboseMoves);
      expect(mockChessInstance.moves).toHaveBeenCalledWith({ square: "e2", verbose: true });
    });
  });

  describe("Integration with existing validation", () => {
    it("should maintain consistency with move() method validation", () => {
      // Setup valid move scenario
      mockChessInstance.get.mockReturnValue({ type: "p", color: "w" });
      
      const tempChessInstance = {
        move: vi.fn().mockReturnValue({ from: "e2", to: "e4", san: "e4" }),
      };
      MockedChess.mockImplementation(() => tempChessInstance as any);
      
      const move = { from: "e2", to: "e4" };
      
      // validateMove should return true  
      // Need to reset mock for validation call
      const tempValidationInstance = {
        move: vi.fn().mockReturnValue({ from: "e2", to: "e4", san: "e4" }),
        get: vi.fn().mockReturnValue({ type: "p", color: "w" }),
      };
      MockedChess.mockImplementation(() => tempValidationInstance as any);
      
      expect(chessService.validateMove(move)).toBe(true);
      
      // Reset mocks for actual move
      MockedChess.mockImplementation(() => mockChessInstance);
      mockChessInstance.move.mockReturnValue({ from: "e2", to: "e4", san: "e4" } as any);
      
      // Actual move should also succeed
      const moveResult = chessService.move(move);
      expect(moveResult).not.toBeNull();
    });
  });
});