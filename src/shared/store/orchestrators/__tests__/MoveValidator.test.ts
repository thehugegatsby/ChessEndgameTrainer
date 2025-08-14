import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * @file Tests for MoveValidator
 * @module tests/unit/orchestrators/MoveValidator
 */

import { MoveValidator } from "@shared/store/orchestrators/handlePlayerMove/MoveValidator";
import type { TrainingState } from "@shared/store/slices/types";

// Mock ChessService
vi.mock("@shared/services/ChessService", () => ({
  chessService: {
    validateMove: vi.fn(),
  },
}));

// Import after mock
import { chessService } from "@shared/services/ChessService";

describe("MoveValidator", () => {
  let validator: MoveValidator;
  
  beforeEach(() => {
    validator = new MoveValidator();
    vi.clearAllMocks();
    // Reset mock implementation
    (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  describe("validateTurn", () => {
    it("should return true when it's player turn and opponent not thinking", () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: true,
        isOpponentThinking: false,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(true);
    });

    it("should return false when it's not player turn", () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: false,
        isOpponentThinking: false,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(false);
    });

    it("should return false when opponent is thinking", () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: true,
        isOpponentThinking: true,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(false);
    });

    it("should return false when not player turn AND opponent thinking", () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: false,
        isOpponentThinking: true,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(false);
    });
  });

  describe("validateMove", () => {
    it("should return valid result for legal move", () => {
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = validator.validateMove("e4");

      expect(result).toEqual({
        isValid: true,
      });
      expect(chessService.validateMove).toHaveBeenCalledWith("e4");
    });

    it("should return invalid result for illegal move", () => {
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = validator.validateMove("invalid");

      expect(result).toEqual({
        isValid: false,
        errorMessage: "Invalid move",
      });
    });

    it("should handle ChessJS move object", () => {
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      
      const move = { from: "e2", to: "e4", promotion: "q" };
      const result = validator.validateMove(move);

      expect(result.isValid).toBe(true);
      expect(chessService.validateMove).toHaveBeenCalledWith(move);
    });

    it("should handle move object with from/to", () => {
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      
      const move = { from: "e2", to: "e4" };
      const result = validator.validateMove(move);

      expect(result.isValid).toBe(true);
      expect(chessService.validateMove).toHaveBeenCalledWith(move);
    });

    it("should return error message when ChessService throws", () => {
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Position is checkmate");
      });

      const result = validator.validateMove("e4");

      expect(result).toEqual({
        isValid: false,
        errorMessage: "Position is checkmate",
      });
    });

    it("should handle non-Error exceptions", () => {
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw "String error";
      });

      const result = validator.validateMove("e4");

      expect(result).toEqual({
        isValid: false,
        errorMessage: "Invalid move",
      });
    });
  });
});