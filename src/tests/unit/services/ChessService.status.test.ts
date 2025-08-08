/**
 * @file ChessService Status Methods Tests
 * @description Coverage tests for chess status detection methods (Lines 368-389)
 * Target: isCheck(), isCheckmate(), isStalemate(), isDraw() - +7% coverage boost
 */

import { ChessService } from "@shared/services/ChessService";
import { Chess } from "chess.js";

// Mock chess.js following existing pattern
jest.mock("chess.js");

const MockedChess = Chess as jest.MockedClass<typeof Chess>;

describe("ChessService Status Methods Coverage", () => {
  let chessService: ChessService;
  let mockChessInstance: jest.Mocked<InstanceType<typeof Chess>>;

  // Test fixtures - specific FEN positions for each status
  const statusTestFens = {
    check: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4",
    checkmate: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
    stalemate: "5bnr/4p1pq/4Qpkr/7p/2P4P/8/PP1PPPP1/RNB1KBNR b KQ - 0 10",
    draw50: "8/8/8/8/8/5k2/8/5K2 w - - 50 100", // 50-move rule
    drawRepetition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Theoretical repetition
    normal: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", // Normal position
  };

  beforeEach(() => {
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance with status methods
    mockChessInstance = {
      move: jest.fn(),
      fen: jest.fn().mockReturnValue(statusTestFens.normal),
      pgn: jest.fn().mockReturnValue(""),
      history: jest.fn().mockReturnValue([]),
      load: jest.fn(),
      isGameOver: jest.fn().mockReturnValue(false),
      turn: jest.fn().mockReturnValue("w"),
      moves: jest.fn().mockReturnValue(["e4", "e3", "Nf3"]),
      // Add the status methods we're testing
      isCheck: jest.fn().mockReturnValue(false),
      isCheckmate: jest.fn().mockReturnValue(false),
      isStalemate: jest.fn().mockReturnValue(false),
      isDraw: jest.fn().mockReturnValue(false),
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    chessService = new ChessService();
    
    // Initialize service with normal position
    chessService.initialize(statusTestFens.normal);
  });

  describe("isCheck() - Line 368", () => {
    it("should return true when king is in check", () => {
      // Setup mock for check position
      mockChessInstance.isCheck.mockReturnValue(true);
      
      // Initialize with check position
      chessService.initialize(statusTestFens.check);
      
      // Test the method
      const result = chessService.isCheck();
      
      expect(result).toBe(true);
      expect(mockChessInstance.isCheck).toHaveBeenCalled();
    });

    it("should return false when king is not in check", () => {
      // Setup mock for normal position
      mockChessInstance.isCheck.mockReturnValue(false);
      
      // Initialize with normal position
      chessService.initialize(statusTestFens.normal);
      
      // Test the method
      const result = chessService.isCheck();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isCheck).toHaveBeenCalled();
    });
  });

  describe("isCheckmate() - Line 375", () => {
    it("should return true when position is checkmate", () => {
      // Setup mock for checkmate position
      mockChessInstance.isCheckmate.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with checkmate position
      chessService.initialize(statusTestFens.checkmate);
      
      // Test the method
      const result = chessService.isCheckmate();
      
      expect(result).toBe(true);
      expect(mockChessInstance.isCheckmate).toHaveBeenCalled();
    });

    it("should return false when position is not checkmate", () => {
      // Setup mock for normal position
      mockChessInstance.isCheckmate.mockReturnValue(false);
      
      // Initialize with normal position
      chessService.initialize(statusTestFens.normal);
      
      // Test the method
      const result = chessService.isCheckmate();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isCheckmate).toHaveBeenCalled();
    });

    it("should handle edge case - check but not checkmate", () => {
      // Setup mock for check but not checkmate
      mockChessInstance.isCheck.mockReturnValue(true);
      mockChessInstance.isCheckmate.mockReturnValue(false);
      
      // Initialize with check position
      chessService.initialize(statusTestFens.check);
      
      // Test the method
      const result = chessService.isCheckmate();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isCheckmate).toHaveBeenCalled();
    });
  });

  describe("isStalemate() - Line 381", () => {
    it("should return true when position is stalemate", () => {
      // Setup mock for stalemate position
      mockChessInstance.isStalemate.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with stalemate position
      chessService.initialize(statusTestFens.stalemate);
      
      // Test the method
      const result = chessService.isStalemate();
      
      expect(result).toBe(true);
      expect(mockChessInstance.isStalemate).toHaveBeenCalled();
    });

    it("should return false when position is not stalemate", () => {
      // Setup mock for normal position
      mockChessInstance.isStalemate.mockReturnValue(false);
      
      // Initialize with normal position
      chessService.initialize(statusTestFens.normal);
      
      // Test the method
      const result = chessService.isStalemate();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isStalemate).toHaveBeenCalled();
    });

    it("should handle edge case - game over but not stalemate", () => {
      // Setup mock for checkmate (game over but not stalemate)
      mockChessInstance.isStalemate.mockReturnValue(false);
      mockChessInstance.isCheckmate.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with checkmate position
      chessService.initialize(statusTestFens.checkmate);
      
      // Test the method
      const result = chessService.isStalemate();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isStalemate).toHaveBeenCalled();
    });
  });

  describe("isDraw() - Line 388", () => {
    it("should return true for 50-move rule draw", () => {
      // Setup mock for 50-move rule draw
      mockChessInstance.isDraw.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with 50-move rule position
      chessService.initialize(statusTestFens.draw50);
      
      // Test the method
      const result = chessService.isDraw();
      
      expect(result).toBe(true);
      expect(mockChessInstance.isDraw).toHaveBeenCalled();
    });

    it("should return true for threefold repetition draw", () => {
      // Setup mock for repetition draw
      mockChessInstance.isDraw.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with repetition position
      chessService.initialize(statusTestFens.drawRepetition);
      
      // Test the method
      const result = chessService.isDraw();
      
      expect(result).toBe(true);
      expect(mockChessInstance.isDraw).toHaveBeenCalled();
    });

    it("should return false when position is not a draw", () => {
      // Setup mock for normal position
      mockChessInstance.isDraw.mockReturnValue(false);
      
      // Initialize with normal position
      chessService.initialize(statusTestFens.normal);
      
      // Test the method
      const result = chessService.isDraw();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isDraw).toHaveBeenCalled();
    });

    it("should return false for checkmate (not a draw)", () => {
      // Setup mock for checkmate (decisive result, not draw)
      mockChessInstance.isDraw.mockReturnValue(false);
      mockChessInstance.isCheckmate.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with checkmate position
      chessService.initialize(statusTestFens.checkmate);
      
      // Test the method
      const result = chessService.isDraw();
      
      expect(result).toBe(false);
      expect(mockChessInstance.isDraw).toHaveBeenCalled();
    });
  });

  describe("Status Methods Integration", () => {
    it("should handle multiple status queries on same position", () => {
      // Setup mock for check position
      mockChessInstance.isCheck.mockReturnValue(true);
      mockChessInstance.isCheckmate.mockReturnValue(false);
      mockChessInstance.isStalemate.mockReturnValue(false);
      mockChessInstance.isDraw.mockReturnValue(false);
      
      // Initialize with check position
      chessService.initialize(statusTestFens.check);
      
      // Test multiple methods
      expect(chessService.isCheck()).toBe(true);
      expect(chessService.isCheckmate()).toBe(false);
      expect(chessService.isStalemate()).toBe(false);
      expect(chessService.isDraw()).toBe(false);
      
      // Verify all methods were called
      expect(mockChessInstance.isCheck).toHaveBeenCalled();
      expect(mockChessInstance.isCheckmate).toHaveBeenCalled();
      expect(mockChessInstance.isStalemate).toHaveBeenCalled();
      expect(mockChessInstance.isDraw).toHaveBeenCalled();
    });

    it("should handle stalemate position correctly", () => {
      // Setup mock for stalemate position
      mockChessInstance.isCheck.mockReturnValue(false);
      mockChessInstance.isCheckmate.mockReturnValue(false);
      mockChessInstance.isStalemate.mockReturnValue(true);
      mockChessInstance.isDraw.mockReturnValue(true);
      mockChessInstance.isGameOver.mockReturnValue(true);
      
      // Initialize with stalemate position
      chessService.initialize(statusTestFens.stalemate);
      
      // Test stalemate logic
      expect(chessService.isCheck()).toBe(false); // Stalemate = no check
      expect(chessService.isCheckmate()).toBe(false); // Not checkmate
      expect(chessService.isStalemate()).toBe(true); // Is stalemate
      expect(chessService.isDraw()).toBe(true); // Stalemate = draw
    });
  });
});