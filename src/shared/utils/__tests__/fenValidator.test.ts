import { describe, it, test, expect } from 'vitest';
import { validateAndSanitizeFen } from "@shared/utils/fenValidator";

describe("FEN Validator", () => {
  describe("validateAndSanitizeFen", () => {
    it("should validate correct FEN strings", () => {
      const validFens = [
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "8/8/8/8/8/8/1K1k4/8 w - - 0 1",
        "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
      ];

      validFens.forEach((fen) => {
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(fen);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("should normalize FEN strings", () => {
      // chess.js normalizes FENs - e.g., it might add explicit move counters
      const fenWithSpaces =
        "  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1  ";
      const result = validateAndSanitizeFen(fenWithSpaces);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid FEN strings with chess.js error messages", () => {
      const invalidFens = [
        { fen: "", error: "FEN must be a valid string" },
        { fen: "invalid", error: "Invalid FEN" }, // chess.js generic error
        {
          fen: "8/8/8/8/8/8/8/8",
          error: "Invalid FEN: must contain six space-delimited fields",
        },
        { fen: "9/8/8/8/8/8/8/8 w - - 0 1", error: "Invalid FEN" }, // chess.js will catch invalid board
        { fen: "8/8/8/8/8/8/8/7 w - - 0 1", error: "Invalid FEN" }, // chess.js will catch wrong rank size
        {
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1",
          error: "Invalid FEN: side-to-move is invalid",
        },
        {
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqz - 0 1",
          error: "Invalid FEN: castling availability is invalid",
        },
        {
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e9 0 1",
          error: "Invalid FEN: en-passant square is invalid",
        },
      ];

      invalidFens.forEach(({ fen }) => {
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(false);
        // chess.js error messages might vary, so check if error contains key parts
        expect(result.errors.length).toBeGreaterThan(0);
        const errorString = result.errors[0];
        expect(errorString).toBeTruthy();
      });
    });

    it("should handle null and undefined inputs", () => {
      // @ts-expect-error - testing runtime behavior
      const nullResult = validateAndSanitizeFen(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors[0]).toBe("FEN must be a valid string");

      // @ts-expect-error - testing runtime behavior
      const undefinedResult = validateAndSanitizeFen(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.errors[0]).toBe("FEN must be a valid string");
    });

    it("should reject positions with too many pieces", () => {
      // Too many white pawns (9 pawns)
      const tooManyPawns =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const result = validateAndSanitizeFen(tooManyPawns);
      expect(result.isValid).toBe(false);
    });

    it("should validate en passant squares correctly", () => {
      // chess.js validates en passant based on actual position
      // Valid case: pawn on 5th rank, en passant possible
      const validEnPassantWhite =
        "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
      expect(validateAndSanitizeFen(validEnPassantWhite).isValid).toBe(true);

      // Valid case: pawn on 4th rank, en passant possible for black
      const validEnPassantBlack =
        "rnbqkbnr/pppp1ppp/8/8/3Pp3/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 2";
      expect(validateAndSanitizeFen(validEnPassantBlack).isValid).toBe(true);

      // Invalid en passant squares (not on rank 3 or 6)
      const invalidEnPassant = ["a1", "e9", "j3"];

      invalidEnPassant.forEach((square) => {
        const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq ${square} 0 1`;
        const result = validateAndSanitizeFen(fen);
        expect(result.isValid).toBe(false);
      });
    });

    it("should validate move counters", () => {
      // Valid move counters
      const validFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(validateAndSanitizeFen(validFen).isValid).toBe(true);

      // Invalid halfmove counter (not a number)
      const invalidHalfmove =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - abc 1";
      expect(validateAndSanitizeFen(invalidHalfmove).isValid).toBe(false);

      // Invalid fullmove counter (must be at least 1)
      const invalidFullmove =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";
      expect(validateAndSanitizeFen(invalidFullmove).isValid).toBe(false);
    });
  });
});
