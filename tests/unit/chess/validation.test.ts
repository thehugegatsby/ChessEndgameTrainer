/**
 * @fileoverview Unit tests for chess validation utilities
 * @description Tests FEN validation, move validation, and chess position parsing
 */

import { describe, test, expect } from "@jest/globals";
import { isValidFen, validateFen } from "../../../shared/lib/chess/validation";
import { TEST_FENS } from "../../../shared/testing/TestFixtures";

describe("Chess Validation", () => {
  describe("isValidFen", () => {
    describe("Valid FEN Strings", () => {
      test("should_accept_starting_position", () => {
        const result = isValidFen(TEST_FENS.STARTING_POSITION);
        expect(result).toBe(true);
      });

      test("should_accept_simple_endgame_positions", () => {
        expect(isValidFen(TEST_FENS.KQK_TABLEBASE_WIN)).toBe(true);
        expect(isValidFen(TEST_FENS.KRK_TABLEBASE_DRAW)).toBe(true);
        expect(isValidFen(TEST_FENS.KPK_WINNING)).toBe(true);
        expect(isValidFen(TEST_FENS.KPK_DRAWING)).toBe(true);
      });

      test("should_accept_advantage_positions", () => {
        expect(isValidFen(TEST_FENS.WHITE_ADVANTAGE)).toBe(true);
        expect(isValidFen(TEST_FENS.BLACK_ADVANTAGE)).toBe(true);
        expect(isValidFen(TEST_FENS.EQUAL_POSITION)).toBe(true);
      });

      test("should_accept_position_with_en_passant", () => {
        const enPassantFen =
          "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3";
        expect(isValidFen(enPassantFen)).toBe(true);
      });

      test("should_accept_position_with_castling_rights", () => {
        const castlingFen =
          "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1";
        expect(isValidFen(castlingFen)).toBe(true);
      });

      test("should_accept_position_with_no_castling_rights", () => {
        const noCastlingFen = "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1";
        expect(isValidFen(noCastlingFen)).toBe(true);
      });

      test("should_accept_position_with_high_move_counters", () => {
        const highCounterFen =
          "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 99 150";
        expect(isValidFen(highCounterFen)).toBe(true);
      });
    });

    describe("Invalid FEN Strings", () => {
      test("should_reject_null_and_undefined", () => {
        expect(isValidFen(null as any)).toBe(false);
        expect(isValidFen(undefined as any)).toBe(false);
      });

      test("should_reject_empty_and_whitespace", () => {
        expect(isValidFen("")).toBe(false);
        expect(isValidFen("   ")).toBe(false);
        expect(isValidFen("\t\n")).toBe(false);
      });

      test("should_reject_non_string_types", () => {
        expect(isValidFen(123 as any)).toBe(false);
        expect(isValidFen({} as any)).toBe(false);
        expect(isValidFen([] as any)).toBe(false);
        expect(isValidFen(true as any)).toBe(false);
      });

      test("should_reject_malformed_fen_parts", () => {
        expect(isValidFen(TEST_FENS.MALFORMED_FEN)).toBe(false);
        expect(isValidFen("invalid fen string")).toBe(false);
      });

      test("should_reject_wrong_number_of_parts", () => {
        // Too few parts
        expect(
          isValidFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq"),
        ).toBe(false);

        // Too many parts
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 extra",
          ),
        ).toBe(false);
      });

      test("should_reject_extra_spaces", () => {
        // Double spaces
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR  w KQkq - 0 1",
          ),
        ).toBe(false);

        // Leading/trailing spaces
        expect(
          isValidFen(
            " rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          ),
        ).toBe(false);
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 ",
          ),
        ).toBe(false);
      });

      test("should_reject_invalid_castling_rights", () => {
        // Invalid characters in castling
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqX - 0 1",
          ),
        ).toBe(false);

        // Duplicate castling rights
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KKQkq - 0 1",
          ),
        ).toBe(false);
        expect(
          isValidFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w Kqq - 0 1"),
        ).toBe(false);
      });

      test("should_reject_special_characters", () => {
        // Non-ASCII characters
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1€",
          ),
        ).toBe(false);

        // Special symbols
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq@ - 0 1",
          ),
        ).toBe(false);
      });

      test("should_reject_invalid_board_representation", () => {
        // Invalid piece characters
        expect(
          isValidFen(
            "rnbqkbnx/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          ),
        ).toBe(false);

        // Invalid numbers
        expect(
          isValidFen(
            "rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          ),
        ).toBe(false);
      });
    });

    describe("Edge Cases", () => {
      test("should_handle_minimal_valid_fen", () => {
        // King vs King (minimal valid position)
        const minimalFen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
        expect(isValidFen(minimalFen)).toBe(true);
      });

      test("should_handle_complex_castling_combinations", () => {
        expect(isValidFen("r3k2r/8/8/8/8/8/8/R3K2R w Kq - 0 1")).toBe(true);
        expect(isValidFen("r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1")).toBe(true);
        expect(isValidFen("r3k2r/8/8/8/8/8/8/R3K2R w k - 0 1")).toBe(true);
      });

      test("should_handle_various_en_passant_squares", () => {
        expect(
          isValidFen(
            "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
          ),
        ).toBe(true);
        expect(
          isValidFen(
            "rnbqkbnr/pppppp1p/8/6p1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq g6 0 2",
          ),
        ).toBe(true);
      });
    });
  });

  describe("validateFen", () => {
    describe("Valid FEN Results", () => {
      test("should_return_valid_for_starting_position", () => {
        const result = validateFen(TEST_FENS.STARTING_POSITION);

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test("should_return_valid_for_endgame_positions", () => {
        const result1 = validateFen(TEST_FENS.KQK_TABLEBASE_WIN);
        const result2 = validateFen(TEST_FENS.ROOK_ENDGAME);

        expect(result1.isValid).toBe(true);
        expect(result1.error).toBeUndefined();
        expect(result2.isValid).toBe(true);
        expect(result2.error).toBeUndefined();
      });
    });

    describe("Invalid FEN Results", () => {
      test("should_return_error_for_invalid_fen", () => {
        const result = validateFen(TEST_FENS.INVALID_FEN);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Ungültiger FEN-String");
      });

      test("should_return_error_for_empty_fen", () => {
        const result = validateFen(TEST_FENS.EMPTY_FEN);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Ungültiger FEN-String");
      });

      test("should_return_error_for_malformed_fen", () => {
        const result = validateFen(TEST_FENS.MALFORMED_FEN);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Ungültiger FEN-String");
      });

      test("should_return_error_for_null_fen", () => {
        const result = validateFen(null as any);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Ungültiger FEN-String");
      });
    });

    describe("Error Message Handling", () => {
      test("should_handle_chess_js_error_messages", () => {
        // This will trigger chess.js internal validation
        const invalidBoardFen =
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN w KQkq - 0 1"; // Missing piece
        const result = validateFen(invalidBoardFen);

        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      test("should_provide_generic_error_for_unknown_errors", () => {
        // Mock a scenario where chess.js throws a non-Error object
        const result = validateFen("clearly invalid");

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Ungültiger FEN-String");
      });
    });
  });

  describe("Performance and Stress Tests", () => {
    test("should_handle_large_batch_validation_efficiently", () => {
      const positions = [
        TEST_FENS.STARTING_POSITION,
        TEST_FENS.KQK_TABLEBASE_WIN,
        TEST_FENS.EQUAL_POSITION,
        TEST_FENS.WHITE_ADVANTAGE,
        TEST_FENS.BLACK_ADVANTAGE,
      ];

      const startTime = Date.now();

      const results = positions.map((pos) => isValidFen(pos));

      const endTime = Date.now();

      expect(results.every((result) => result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test("should_handle_repeated_validation_calls", () => {
      const fen = TEST_FENS.STARTING_POSITION;

      // Validate the same FEN multiple times
      for (let i = 0; i < 10; i++) {
        expect(isValidFen(fen)).toBe(true);
      }
    });
  });
});
