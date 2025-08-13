import { vi } from 'vitest';
/**
 * ChessService Integration Tests - Issue #85 Phase 1
 *
 * Focus: Integration testing with real chess.js (30% of total test strategy)
 * Target: Verify real chess rules work correctly with ChessService
 * Strategy: Use real chess.js to test actual chess logic integration
 */

import { ChessService } from "@shared/services/ChessService";
import { COMMON_FENS, StandardPositions, EndgamePositions, SpecialPositions } from "../../fixtures/commonFens";
import {
  createMockListener,
  getLastEmittedEvent,
  isValidStateUpdateEvent,
  createTestMove,
  expectFenToEqual,
} from "../../helpers/chessTestHelpers";

// NO vi.mock('chess.js') here - we want the real chess.js

describe("ChessService Integration Tests", () => {
  let chessService: ChessService;

  beforeEach(() => {
    chessService = new ChessService(); // Uses real Chess.js
  });

  describe("Real Chess Rules", () => {
    it("should execute standard opening moves correctly", () => {
      const result = chessService.move(createTestMove("e2", "e4"));

      expect(result).not.toBeNull();
      expect(result?.san).toBe("e4");
      // chess.js correctly returns - for en passant after e4 (no en passant possible)
      const currentFen = chessService.getFen();
      expect(currentFen).toContain("4P3"); // Pawn on e4
      expect(currentFen).toContain("b KQkq -"); // No en passant available
    });

    it("should handle castling moves correctly", () => {
      chessService.initialize(StandardPositions.CASTLING_AVAILABLE);

      // Test kingside castling for white
      const result = chessService.move(createTestMove("e1", "g1"));

      expect(result).not.toBeNull();
      expect(result?.san).toBe("O-O");
      expect(chessService.getFen()).toContain("R4RK1"); // King on g1, Rook on f1 after castling
    });

    it("should handle en passant captures correctly", () => {
      chessService.initialize(StandardPositions.EN_PASSANT);

      const result = chessService.move(createTestMove("e5", "d6"));

      expect(result).not.toBeNull();
      expect(result?.san).toBe("exd6");
      expect(result?.flags).toContain("e"); // en passant flag
      // The captured pawn should be gone from d5
      expect(chessService.getFen()).not.toContain("3pP3");
    });

    it("should handle pawn promotion correctly", () => {
      chessService.initialize(SpecialPositions.PROMOTION);

      // chess.js expects promotion in the move format: "e8=Q+"
      const result = chessService.move("e8=Q+");

      expect(result).not.toBeNull();
      expect(result?.promotion).toBe("q");
      expect(chessService.getFen()).toContain("Q"); // Queen on e8
    });

    it("should detect checkmate correctly", () => {
      chessService.initialize(SpecialPositions.CHECKMATE);

      expect(chessService.isGameOver()).toBe(true);
    });

    it("should detect stalemate correctly", () => {
      chessService.initialize(SpecialPositions.STALEMATE);

      expect(chessService.isGameOver()).toBe(true);
      // Note: The SpecialPositions.STALEMATE should be a real stalemate position
    });

    it("should reject illegal moves", () => {
      chessService.initialize(StandardPositions.STARTING);
      const initialFen = chessService.getFen();

      const result = chessService.move(createTestMove("e2", "e5")); // Illegal pawn jump

      expect(result).toBeNull();
      expect(chessService.getFen()).toBe(initialFen); // Position unchanged
    });

    it("should handle complex move sequences", () => {
      // Play a short opening sequence
      const moves = [
        createTestMove("e2", "e4"), // 1. e4
        createTestMove("e7", "e5"), // 1... e5
        createTestMove("g1", "f3"), // 2. Nf3
        createTestMove("b8", "c6"), // 2... Nc6
      ];

      let expectedMoveCount = 0;
      moves.forEach((move) => {
        const result = chessService.move(move);
        expect(result).not.toBeNull();
        expectedMoveCount++;
        expect(chessService.getMoveHistory()).toHaveLength(expectedMoveCount);
      });

      // Final position should be after Italian/Spanish opening setup
      expect(chessService.getFen()).toContain(
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R",
      );
    });
  });

  describe("Move Validation Integration", () => {
    it("should validate moves without changing state", () => {
      chessService.initialize(StandardPositions.STARTING);
      const initialFen = chessService.getFen();
      const initialHistory = chessService.getMoveHistory();

      const validGood = chessService.validateMove(createTestMove("e2", "e4"));
      const validBad = chessService.validateMove(createTestMove("e2", "e5"));

      expect(validGood).toBe(true);
      expect(validBad).toBe(false);

      // State should be completely unchanged
      expect(chessService.getFen()).toBe(initialFen);
      expect(chessService.getMoveHistory()).toEqual(initialHistory);
    });

    it("should validate promotion moves correctly", () => {
      chessService.initialize(SpecialPositions.PROMOTION);

      const validPromotion = chessService.validateMove("e8=Q+"); // chess.js format
      const invalidNoPromotion = chessService.validateMove("e8"); // Missing promotion

      expect(validPromotion).toBe(true);
      expect(invalidNoPromotion).toBe(false);
    });

    it("should validate string moves in SAN notation", () => {
      chessService.initialize(StandardPositions.STARTING);

      const validSAN = chessService.validateMove("e4");
      const invalidSAN = chessService.validateMove("e5"); // Illegal as opening move for white

      expect(validSAN).toBe(true);
      expect(invalidSAN).toBe(false);
    });
  });

  describe("Event System Integration", () => {
    it("should emit correct events for real moves", () => {
      const mockListener = createMockListener();
      chessService.subscribe(mockListener);

      const result = chessService.move(createTestMove("e2", "e4"));

      expect(result).not.toBeNull();

      const event = getLastEmittedEvent(mockListener);
      expect(event).toBeDefined();
      expect(event!.type).toBe("stateUpdate");
      expect(isValidStateUpdateEvent(event!)).toBe(true);

      if (event!.type === "stateUpdate") {
        expect(event!.payload.fen).toContain("4P3"); // Pawn on e4
        expect(event!.payload.moveHistory).toHaveLength(1);
        expect(event!.payload.currentMoveIndex).toBe(0);
        expect(event!.payload.pgn).toContain("e4");
        expect(event!.source).toBe("move");
      }
    });

    it("should emit error events for invalid moves", () => {
      const mockListener = createMockListener();
      chessService.subscribe(mockListener);

      const result = chessService.move(createTestMove("e1", "e2")); // Invalid move - king can't move into own pawn

      expect(result).toBeNull();

      const event = getLastEmittedEvent(mockListener);
      expect(event?.type).toBe("error");

      if (event?.type === "error") {
        expect(event.payload.message).toBe("Fehler beim Ausführen des Zuges"); // ChessService returns this for exceptions
        expect(event.payload.error).toBeInstanceOf(Error);
      }
    });

    it("should emit state updates on initialization", () => {
      const mockListener = createMockListener();
      chessService.subscribe(mockListener);

      const result = chessService.initialize(EndgamePositions.KPK_WIN);

      expect(result).toBe(true);

      const event = getLastEmittedEvent(mockListener);
      expect(event!.type).toBe("stateUpdate");

      if (event!.type === "stateUpdate") {
        expect(event!.source).toBe("load");
        expect(event!.payload.fen).toBe(EndgamePositions.KPK_WIN);
        expect(event!.payload.moveHistory).toHaveLength(0);
        expect(event!.payload.currentMoveIndex).toBe(-1);
      }
    });
  });

  describe("Endgame Scenarios", () => {
    it("should handle KPK (King + Pawn vs King) endgame correctly", () => {
      chessService.initialize(EndgamePositions.KPK_WIN);

      // Test a typical winning move in KPK
      const result = chessService.move(createTestMove("a8", "b8")); // King move

      expect(result).not.toBeNull();
      expect(result?.san).toBe("Kb8");
      expect(chessService.getFen()).toContain("1K6/P7/k7"); // King moved to b8
    });

    it("should handle KQK (King + Queen vs King) endgame correctly", () => {
      chessService.initialize(EndgamePositions.KQK_WIN);

      // Queen should have many legal moves in this position
      const fenBefore = chessService.getFen();
      expect(fenBefore).toContain("Q"); // Queen present
      expect(chessService.isGameOver()).toBe(false); // Not mate yet

      // Make a queen move
      const result = chessService.move(createTestMove("h1", "h8")); // Example queen move

      if (result) {
        expect(result.piece).toBe("q");
        expect(chessService.getFen()).toContain("Q"); // Queen still present
      }
    });

    it("should detect insufficient material correctly", () => {
      chessService.initialize(SpecialPositions.INSUFFICIENT_MATERIAL);

      expect(chessService.isGameOver()).toBe(true);
    });
  });

  describe("Position Validation", () => {
    it("should accept valid FEN positions", () => {
      const validPositions = [
        StandardPositions.STARTING,
        StandardPositions.AFTER_E4,
        EndgamePositions.KPK_WIN,
        EndgamePositions.KQK_WIN,
      ];

      validPositions.forEach((fen) => {
        const result = chessService.initialize(fen);
        expect(result).toBe(true);
        // For AFTER_E4, chess.js correctly shows no en passant
        if (fen === StandardPositions.AFTER_E4) {
          expect(chessService.getFen()).toContain("4P3");
          expect(chessService.getFen()).toContain("b KQkq -");
        } else {
          expect(chessService.getFen()).toBe(fen);
        }
      });
    });

    it("should reject invalid FEN positions", () => {
      const mockListener = createMockListener();
      chessService.subscribe(mockListener);

      const invalidFen = "invalid-fen-string";
      const result = chessService.initialize(invalidFen);

      expect(result).toBe(false);

      const event = getLastEmittedEvent(mockListener);
      expect(event?.type).toBe("error");
    });
  });

  describe("Real Chess Logic Edge Cases", () => {
    it("should handle castling restrictions correctly", () => {
      // Start with castling available position
      chessService.initialize(StandardPositions.CASTLING_AVAILABLE);

      // Move the king first
      chessService.move(createTestMove("e1", "f1")); // King move
      chessService.move(createTestMove("e8", "d8")); // Black king move
      chessService.move(createTestMove("f1", "e1")); // King back

      // Now castling should be invalid (king has moved)
      const castlingResult = chessService.move(createTestMove("e1", "g1"));
      expect(castlingResult).toBeNull(); // Should be invalid
    });

    it("should handle check restrictions correctly", () => {
      // Set up a position where black king is in check from white queen on g5
      chessService.initialize(SpecialPositions.CHECK);

      // First verify king is actually in check
      expect(chessService.isCheck()).toBe(true);

      // Validate that moves that don't address check are invalid
      const isIllegalMoveValid = chessService.validateMove(createTestMove("a7", "a6"));
      expect(isIllegalMoveValid).toBe(false);

      // Legal move that blocks check should be valid (f6 blocks the diagonal)
      const isLegalMoveValid = chessService.validateMove(createTestMove("f7", "f6")); // Block check
      expect(isLegalMoveValid).toBe(true);
    });
  });

  describe("Navigation Integration - Issue #86", () => {
    it("should handle real navigation with actual chess moves", () => {
      // Make a real opening sequence
      chessService.move({ from: "e2", to: "e4" });
      chessService.move({ from: "e7", to: "e5" });
      chessService.move({ from: "g1", to: "f3" });

      expect(chessService.getCurrentMoveIndex()).toBe(2);
      expect(chessService.getMoveHistory()).toHaveLength(3);

      // Undo to middle of sequence
      expect(chessService.undo()).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(1);

      // Make different move (history truncation) - it's white's turn after undoing Nf3
      const differentMove = chessService.move({ from: "f1", to: "c4" }); // Bc4 instead of Nf3
      expect(differentMove).not.toBeNull();
      expect(chessService.getCurrentMoveIndex()).toBe(2);
      expect(chessService.getMoveHistory()).toHaveLength(3); // e4, e5, Bc4

      // Navigate to start
      expect(chessService.goToMove(-1)).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(-1);
      expect(chessService.getFen()).toBe(StandardPositions.STARTING);

      // Navigate to middle
      expect(chessService.goToMove(1)).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(1);
      expect(chessService.getFen()).toBe(StandardPositions.AFTER_E4_E5);
    });

    it("should maintain FEN accuracy throughout navigation", () => {
      // Create a specific position sequence
      const moves = [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
        { from: "b8", to: "c6" },
      ];

      // Capture FENs at each step
      const fenHistory: string[] = [chessService.getFen()]; // Starting position

      moves.forEach((move) => {
        chessService.move(move);
        fenHistory.push(chessService.getFen());
      });

      // Navigate backwards and verify each FEN matches
      for (let i = moves.length - 1; i >= -1; i--) {
        expect(chessService.goToMove(i)).toBe(true);
        expect(chessService.getCurrentMoveIndex()).toBe(i);
        expect(chessService.getFen()).toBe(fenHistory[i + 1]); // +1 because fenHistory includes starting pos
      }

      // Navigate forwards and verify again
      for (let i = 0; i < moves.length; i++) {
        expect(chessService.goToMove(i)).toBe(true);
        expect(chessService.getCurrentMoveIndex()).toBe(i);
        expect(chessService.getFen()).toBe(fenHistory[i + 1]);
      }
    });

    it("should handle reset to custom starting position", () => {
      // Initialize with KPK endgame
      chessService.initialize(EndgamePositions.KPK_WIN);
      const initialFen = chessService.getFen();

      // Make some moves
      chessService.move({ from: "a8", to: "b8" });
      chessService.move({ from: "a6", to: "a5" });

      expect(chessService.getCurrentMoveIndex()).toBe(1);
      expect(chessService.getMoveHistory()).toHaveLength(2);

      // Reset should go back to KPK position, not default starting position
      chessService.reset();

      expect(chessService.getCurrentMoveIndex()).toBe(-1);
      expect(chessService.getMoveHistory()).toHaveLength(0);
      expect(chessService.getFen()).toBe(initialFen);
    });

    it("should handle navigation error boundaries with real positions", () => {
      // Make 2 moves
      chessService.move({ from: "e2", to: "e4" });
      chessService.move({ from: "e7", to: "e5" });

      // Test invalid indices
      expect(chessService.goToMove(-2)).toBe(false);
      expect(chessService.goToMove(5)).toBe(false);

      // Valid indices should still work
      expect(chessService.goToMove(0)).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(0);

      expect(chessService.goToMove(-1)).toBe(true);
      expect(chessService.getCurrentMoveIndex()).toBe(-1);
    });
  });
});
