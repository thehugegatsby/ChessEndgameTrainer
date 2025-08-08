/**
 * @file ChessService PGN Loading Tests
 * @description Coverage tests for PGN loading and reconstruction (Lines 482-518)
 * Target: loadPgn() method - biggest coverage gain (37 lines)
 */

import { ChessService } from "@shared/services/ChessService";
import { Chess } from "chess.js";
import { createValidatedMove } from "@shared/types/chess";

// Mock chess.js following existing pattern
jest.mock("chess.js");

const MockedChess = Chess as jest.MockedClass<typeof Chess>;

describe("ChessService PGN Loading Tests", () => {
  let chessService: ChessService;
  let mockChessInstance: jest.Mocked<InstanceType<typeof Chess>>;

  // PGN test fixtures for comprehensive testing
  const pgnTestFixtures = {
    valid: "1. e4 e5 2. Nf3 Nc6 3. Bb5", // Simple Spanish Opening
    complex: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6", // Complex with castling
    shortGame: "1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#", // Quick checkmate
    empty: "",
    whitespace: "   \n  \t  ", // Only whitespace
    invalid: "1. xx yy zz", // Malformed moves
    malformed: "this is not pgn at all",
    partialValid: "1. e4 e5 2. Nf3 invalid_move", // Valid start, invalid continuation
  };

  // Mock move objects for history reconstruction
  const mockMoves = [
    { from: "e2", to: "e4", san: "e4", piece: "p", color: "w" },
    { from: "e7", to: "e5", san: "e5", piece: "p", color: "b" },
    { from: "g1", to: "f3", san: "Nf3", piece: "n", color: "w" },
  ];

  beforeEach(() => {
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance
    mockChessInstance = {
      move: jest.fn(),
      fen: jest.fn().mockReturnValue("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
      pgn: jest.fn().mockReturnValue(""),
      history: jest.fn().mockReturnValue([]),
      load: jest.fn(),
      loadPgn: jest.fn(),
      isGameOver: jest.fn().mockReturnValue(false),
      turn: jest.fn().mockReturnValue("w"),
      moves: jest.fn().mockReturnValue(["e4", "e3", "Nf3"]),
      isCheck: jest.fn().mockReturnValue(false),
      isCheckmate: jest.fn().mockReturnValue(false),
      isStalemate: jest.fn().mockReturnValue(false),
      isDraw: jest.fn().mockReturnValue(false),
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    chessService = new ChessService();
  });

  describe("loadPgn() - Lines 482-518", () => {
    it("should load valid PGN and reconstruct move history", () => {
      // Setup mock for successful PGN loading
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue(mockMoves as any);
      
      // Mock the chess position reconstruction
      let fenCounter = 0;
      const fens = [
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", // After 1.e4
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", // After 1...e5
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", // After 2.Nf3
      ];

      mockChessInstance.fen.mockImplementation(() => fens[fenCounter] || fens[0]);
      mockChessInstance.move.mockImplementation(() => {
        fenCounter++;
        return (mockMoves[fenCounter - 1] || null) as any;
      });

      // Mock event listener to track state updates
      const mockListener = jest.fn();
      chessService.subscribe(mockListener);

      // Test PGN loading
      const result = chessService.loadPgn(pgnTestFixtures.valid);

      // Verify success
      expect(result).toBe(true);
      expect(mockChessInstance.loadPgn).toHaveBeenCalledWith(pgnTestFixtures.valid);
      expect(mockChessInstance.history).toHaveBeenCalledWith({ verbose: true });

      // Verify move history reconstruction
      const moveHistory = chessService.getMoveHistory();
      expect(moveHistory).toHaveLength(mockMoves.length);

      // Verify current move index is set correctly
      expect(chessService.getCurrentMoveIndex()).toBe(mockMoves.length - 1);

      // Verify state update event was emitted
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "stateUpdate",
          source: "load",
          payload: expect.objectContaining({
            moveHistory: expect.any(Array),
            currentMoveIndex: mockMoves.length - 1,
          }),
        })
      );
    });

    it("should handle complex PGN with castling", () => {
      // Setup more complex move sequence
      const complexMoves = [
        { from: "e2", to: "e4", san: "e4", piece: "p", color: "w" },
        { from: "e7", to: "e5", san: "e5", piece: "p", color: "b" },
        { from: "g1", to: "f3", san: "Nf3", piece: "n", color: "w" },
        { from: "b8", to: "c6", san: "Nc6", piece: "n", color: "b" },
        { from: "f1", to: "b5", san: "Bb5", piece: "b", color: "w" },
        { from: "e1", to: "g1", san: "O-O", piece: "k", color: "w" }, // Castling
      ];

      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue(complexMoves as any);

      let moveCounter = 0;
      mockChessInstance.move.mockImplementation(() => {
        moveCounter++;
        return (complexMoves[moveCounter - 1] || null) as any;
      });

      const result = chessService.loadPgn(pgnTestFixtures.complex);

      expect(result).toBe(true);
      expect(chessService.getMoveHistory()).toHaveLength(complexMoves.length);
      expect(chessService.getCurrentMoveIndex()).toBe(complexMoves.length - 1);
    });

    it("should handle empty PGN string", () => {
      // Setup for empty PGN
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue([] as any);

      const result = chessService.loadPgn(pgnTestFixtures.empty);

      expect(result).toBe(true);
      expect(mockChessInstance.loadPgn).toHaveBeenCalledWith("");
      expect(chessService.getMoveHistory()).toHaveLength(0);
      expect(chessService.getCurrentMoveIndex()).toBe(-1);
    });

    it("should handle whitespace-only PGN", () => {
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue([] as any);

      const result = chessService.loadPgn(pgnTestFixtures.whitespace);

      expect(result).toBe(true);
      expect(chessService.getMoveHistory()).toHaveLength(0);
    });

    it("should handle invalid PGN and emit error event", () => {
      // Setup mock to throw error for invalid PGN
      const pgnError = new Error("Invalid PGN format");
      mockChessInstance.loadPgn.mockImplementation(() => {
        throw pgnError;
      });

      // Mock event listener to capture error
      const mockListener = jest.fn();
      chessService.subscribe(mockListener);

      const result = chessService.loadPgn(pgnTestFixtures.invalid);

      // Verify failure and error handling
      expect(result).toBe(false);
      expect(mockChessInstance.loadPgn).toHaveBeenCalledWith(pgnTestFixtures.invalid);

      // Verify error event was emitted
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          payload: expect.objectContaining({
            error: expect.any(Error),
            message: "Ungültiges PGN-Format",
          }),
        })
      );
    });

    it("should handle malformed PGN string", () => {
      const malformedError = new Error("Not a valid PGN");
      mockChessInstance.loadPgn.mockImplementation(() => {
        throw malformedError;
      });

      const mockListener = jest.fn();
      chessService.subscribe(mockListener);

      const result = chessService.loadPgn(pgnTestFixtures.malformed);

      expect(result).toBe(false);
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          payload: expect.objectContaining({
            message: "Ungültiges PGN-Format",
          }),
        })
      );
    });

    it("should handle partially valid PGN", () => {
      const partialError = new Error("Invalid move in PGN");
      mockChessInstance.loadPgn.mockImplementation(() => {
        throw partialError;
      });

      const result = chessService.loadPgn(pgnTestFixtures.partialValid);

      expect(result).toBe(false);
      expect(mockChessInstance.loadPgn).toHaveBeenCalledWith(pgnTestFixtures.partialValid);
    });

    it("should reset chess instance and rebuild from scratch", () => {
      // This tests the critical logic in lines 485-496
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue(mockMoves as any);

      const initialCallCount = MockedChess.mock.calls.length;
      
      chessService.loadPgn(pgnTestFixtures.valid);

      // Verify Chess constructor was called for reset (line 487: this.chess = new Chess())
      expect(MockedChess.mock.calls.length).toBeGreaterThan(initialCallCount);
      // Verify moves were replayed (lines 490-496)
      expect(mockChessInstance.move).toHaveBeenCalledTimes(mockMoves.length);
    });

    it("should preserve validated move structure in history", () => {
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue(mockMoves as any);

      // Mock FEN progression for move validation
      let fenIndex = 0;
      const fenProgression = [
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
      ];

      mockChessInstance.fen.mockImplementation(() => fenProgression[fenIndex] || fenProgression[0]);
      mockChessInstance.move.mockImplementation(() => {
        const move = mockMoves[fenIndex];
        fenIndex++;
        return (move || null) as any;
      });

      chessService.loadPgn(pgnTestFixtures.valid);

      const moveHistory = chessService.getMoveHistory();
      
      // Verify each move in history has required ValidatedMove structure
      moveHistory.forEach((move, index) => {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
        expect(move).toHaveProperty('san');
        expect(move).toHaveProperty('fenBefore');
        expect(move).toHaveProperty('fenAfter');
      });
    });

    it("should handle error during move reconstruction", () => {
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue(mockMoves as any);

      // Mock move() to throw error during reconstruction
      mockChessInstance.move.mockImplementation(() => {
        throw new Error("Move reconstruction failed");
      });

      const mockListener = jest.fn();
      chessService.subscribe(mockListener);

      const result = chessService.loadPgn(pgnTestFixtures.valid);

      // Should fail gracefully
      expect(result).toBe(false);
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
        })
      );
    });
  });

  describe("PGN Integration with other methods", () => {
    it("should maintain consistency after PGN load", () => {
      mockChessInstance.loadPgn.mockImplementation(() => true as any);
      mockChessInstance.history.mockReturnValue(mockMoves as any);
      mockChessInstance.pgn.mockReturnValue(pgnTestFixtures.valid);

      chessService.loadPgn(pgnTestFixtures.valid);

      // Verify consistency with other methods
      expect(chessService.getCurrentMoveIndex()).toBe(mockMoves.length - 1);
      expect(chessService.getMoveHistory()).toHaveLength(mockMoves.length);
      expect(chessService.getPgn()).toBe(pgnTestFixtures.valid);
    });
  });
});