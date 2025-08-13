/**
 * @fileoverview Unit tests for chess game status utilities
 * @description Tests game status detection, objective determination, and turn management
 */

import { describe, it, test, expect } from 'vitest';
import { describe, test, expect } from "@jest/globals";
import { getGameStatus } from "../../../shared/utils/chess/gameStatus";
import { TEST_FENS } from "../../../shared/testing/TestFixtures";

describe("Chess Game Status", () => {
  describe("getGameStatus", () => {
    describe("Turn Detection", () => {
      test("should_detect_white_to_move_from_starting_position", () => {
        const status = getGameStatus(TEST_FENS.STARTING_POSITION);

        expect(status.sideToMove).toBe("white");
        expect(status.sideToMoveDisplay).toBe("Weiß am Zug");
        expect(status.icon).toBe("🟢");
      });

      test("should_detect_black_to_move_from_after_e4", () => {
        const afterE4 =
          "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
        const status = getGameStatus(afterE4);

        expect(status.sideToMove).toBe("black");
        expect(status.sideToMoveDisplay).toBe("Schwarz am Zug");
        expect(status.icon).toBe("⚫");
      });
    });

    describe("Objective Detection", () => {
      test("should_detect_win_objective_for_material_advantage", () => {
        // Queen vs King - clear winning advantage
        const status = getGameStatus(TEST_FENS.KQK_TABLEBASE_WIN);

        expect(status.objective).toBe("win");
        expect(status.objectiveDisplay).toBe("Ziel: Gewinn");
      });

      test("should_detect_win_objective_for_pawn_endgame_advantage", () => {
        const status = getGameStatus(TEST_FENS.KPK_WINNING);

        expect(status.objective).toBe("win");
        expect(status.objectiveDisplay).toBe("Ziel: Gewinn");
      });

      test("should_detect_draw_objective_for_equal_material", () => {
        const status = getGameStatus(TEST_FENS.EQUAL_POSITION);

        expect(status.objective).toBe("draw");
        expect(status.objectiveDisplay).toBe("Ziel: Remis");
      });

      test("should_use_provided_goal_over_auto_detection", () => {
        const status = getGameStatus(TEST_FENS.KQK_TABLEBASE_WIN, "defend");

        expect(status.objective).toBe("defend");
        expect(status.objectiveDisplay).toBe("Ziel: Verteidigen");
      });
    });

    describe("Error Handling", () => {
      test("should_handle_invalid_fen_gracefully", () => {
        const status = getGameStatus(TEST_FENS.INVALID_FEN);

        expect(status.sideToMove).toBe("white");
        expect(status.sideToMoveDisplay).toBe("Weiß am Zug");
        expect(status.objective).toBe("win");
        expect(status.objectiveDisplay).toBe("Ziel: Gewinn");
        expect(status.icon).toBe("🟢");
      });

      test("should_handle_empty_fen_gracefully", () => {
        const status = getGameStatus(TEST_FENS.EMPTY_FEN);

        expect(status.sideToMove).toBe("white");
        expect(status.objective).toBe("win");
      });

      test("should_handle_malformed_fen_gracefully", () => {
        const status = getGameStatus(TEST_FENS.MALFORMED_FEN);

        expect(status.sideToMove).toBe("white");
        expect(status.objective).toBe("win");
      });

      test("should_handle_null_fen_gracefully", () => {
        const status = getGameStatus(null as any);

        expect(status.sideToMove).toBe("white");
        expect(status.objective).toBe("win");
      });

      test("should_handle_undefined_fen_gracefully", () => {
        const status = getGameStatus(undefined as any);

        expect(status.sideToMove).toBe("white");
        expect(status.objective).toBe("win");
      });
    });

    describe("Material Analysis Edge Cases", () => {
      test("should_detect_win_for_significant_material_advantage", () => {
        // White has queen, black has nothing
        const queenVsEmpty = "8/8/8/8/8/8/4K3/4k2Q w - - 0 1";
        const status = getGameStatus(queenVsEmpty);

        expect(status.objective).toBe("win");
      });

      test("should_detect_win_for_king_pawn_vs_king", () => {
        const status = getGameStatus(TEST_FENS.KPK_WINNING);

        expect(status.objective).toBe("win");
      });

      test("should_detect_draw_for_equal_material_complex", () => {
        // Both sides have rook
        const rooksEqual = "8/8/8/8/8/4r3/4K3/4k2R w - - 0 1";
        const status = getGameStatus(rooksEqual);

        expect(status.objective).toBe("draw");
      });
    });
  });

  describe("Integration with Advantage Positions", () => {
    test("should_handle_white_advantage_position_correctly", () => {
      const status = getGameStatus(TEST_FENS.WHITE_ADVANTAGE);

      expect(status.sideToMove).toBe("black");
      expect(status.objective).toBe("win"); // White has material advantage
    });

    test("should_handle_black_advantage_position_correctly", () => {
      const status = getGameStatus(TEST_FENS.BLACK_ADVANTAGE);

      expect(status.sideToMove).toBe("black");
      expect(["win", "draw"]).toContain(status.objective);
    });

    test("should_handle_equal_position_correctly", () => {
      const status = getGameStatus(TEST_FENS.EQUAL_POSITION);

      expect(status.sideToMove).toBe("white");
      expect(status.objective).toBe("draw"); // Equal material rook endgame
    });
  });
});
