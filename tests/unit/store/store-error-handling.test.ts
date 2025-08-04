/**
 * @file Error Handling Tests for Zustand Store
 * @description Tests error handling paths, invalid inputs, and edge cases
 */

// Mock the logger first before any imports
jest.mock("../../../shared/services/logging", () => {
  const { getMockLoggerDefinition } = require("../../shared/logger-utils");
  return getMockLoggerDefinition()();
});

import { act, renderHook } from "@testing-library/react";
import { useStore } from "../../../shared/store/rootStore";
import { EndgamePosition } from "../../../shared/types/endgame";
import { Move } from "../../../shared/types";
import { getLogger } from "../../../shared/services/logging";

// Get mocked logger for assertions
const mockLogger = getLogger() as jest.Mocked<ReturnType<typeof getLogger>>;

// Mock FEN validation
jest.mock("../../../shared/utils/fenValidator", () => ({
  validateAndSanitizeFen: jest.fn((fen) => {
    if (fen === "invalid-fen") {
      return {
        isValid: false,
        errors: ["Invalid FEN format"],
        sanitized: fen,
      };
    }
    return {
      isValid: true,
      errors: [],
      sanitized: fen,
    };
  }),
}));

describe("Store Error Handling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useStore.getState().reset();
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("FEN Validation Error Handling", () => {
    it("should handle invalid FEN in setPosition", () => {
      const { result } = renderHook(() => useStore());

      const invalidPosition: EndgamePosition = {
        id: 1,
        title: "Invalid Position",
        fen: "invalid-fen",
        description: "Test",
        category: "pawn",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 4,
      };

      act(() => {
        result.current.setPosition(invalidPosition);
      });

      // Should log error
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid FEN in position",
        expect.objectContaining({
          positionId: 1,
          errors: ["Invalid FEN format"],
        }),
      );

      // Toast is shown via get().showToast which is called within the action
      // No direct state update to ui.toasts in the error path

      // Should not set position
      expect(result.current.training.currentPosition).toBeUndefined();
    });

    it("should use sanitized FEN when validation passes", () => {
      const { result } = renderHook(() => useStore());

      const position: EndgamePosition = {
        id: 1,
        title: "Valid Position",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        description: "Test",
        category: "opening",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 10,
      };

      act(() => {
        result.current.setPosition(position);
      });

      // Should set position successfully
      expect(result.current.training.currentPosition).toEqual(position);
      expect(mockLogger.info).toHaveBeenCalledWith("Position set", {
        positionId: 1,
      });
    });
  });

  describe("Move Error Handling", () => {
    it("should handle invalid move attempts", () => {
      const { result } = renderHook(() => useStore());

      // Setup valid position first
      const position: EndgamePosition = {
        id: 1,
        title: "Test Position",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        description: "Test",
        category: "opening",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 10,
      };

      act(() => {
        result.current.setPosition(position);
      });

      const initialMoveCount = result.current.training.moveHistory.length;

      // Attempt invalid move - chess.js throws on invalid moves
      expect(() => {
        act(() => {
          result.current._internalApplyMove({ from: "e2", to: "e5" } as Move); // Invalid pawn move
        });
      }).toThrow("Invalid move");

      // Move should have been attempted but failed
      expect(mockLogger.error).not.toHaveBeenCalled(); // Error is thrown, not logged in this case

      // Move history should not change
      expect(result.current.training.moveHistory.length).toBe(initialMoveCount);
    });

    it("should handle move attempts without game instance", () => {
      const { result } = renderHook(() => useStore());

      // Force game to be null
      act(() => {
        useStore.setState((state) => ({
          training: { ...state.training, game: null },
        }));
      });

      act(() => {
        result.current._internalApplyMove({ from: "e2", to: "e4" } as Move);
      });

      // Should log error
      expect(mockLogger.error).toHaveBeenCalledWith(
        "No game instance available for move",
      );
    });

    it("should handle ChessAdapterError in makeMove", () => {
      const { result } = renderHook(() => useStore());

      // Mock chess.js to throw when making a move
      const mockChess = {
        move: jest.fn(() => {
          throw new Error("ChessAdapterError: Invalid move format");
        }),
        fen: jest.fn(
          () => "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        ),
        load: jest.fn(),
        pgn: jest.fn(() => ""),
      };

      act(() => {
        useStore.setState((state) => ({
          training: { ...state.training, game: mockChess as any },
        }));
      });

      // Should throw non-ChessAdapterError
      expect(() => {
        act(() => {
          result.current._internalApplyMove({ from: "e2", to: "e4" } as Move);
        });
      }).toThrow("ChessAdapterError: Invalid move format");
    });
  });

  describe("setEvaluation and setEvaluations", () => {
    it("should set current evaluation", () => {
      const { result } = renderHook(() => useStore());

      const evaluation = {
        evaluation: 0.5,
        score: 0.5,
        mate: null,
        bestMove: "e2e4",
        pv: ["e2e4", "e7e5"],
        depth: 20,
      };

      act(() => {
        result.current.setEvaluation(evaluation);
      });

      expect(result.current.training.currentEvaluation).toEqual(evaluation);
      expect(mockLogger.debug).toHaveBeenCalledWith("Evaluation updated", {
        evaluation,
      });
    });

    it("should set evaluations array", () => {
      const { result } = renderHook(() => useStore());

      const evaluations = [
        { evaluation: 0.3, score: 0.3, bestMove: "e2e4" },
        { evaluation: 0.2, score: 0.2, bestMove: "e7e5" },
        { evaluation: 0.4, score: 0.4, bestMove: "g1f3" },
      ];

      act(() => {
        result.current.setEvaluations(evaluations);
      });

      expect(result.current.training.evaluations).toEqual(evaluations);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Evaluations array updated",
        { count: 3 },
      );
    });
  });

  describe("toggleFavorite", () => {
    it("should add position to favorites", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.progress.favoritePositions).toContain(1);
      expect(mockLogger.debug).toHaveBeenCalledWith("Favorite toggled", {
        positionId: 1,
      });
    });

    it("should remove position from favorites when toggled again", () => {
      const { result } = renderHook(() => useStore());

      // Add first
      act(() => {
        result.current.toggleFavorite(1);
      });

      // Then remove
      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.progress.favoritePositions).not.toContain(1);
      expect(mockLogger.debug).toHaveBeenLastCalledWith("Favorite toggled", {
        positionId: 1,
      });
    });

    it("should handle multiple favorites", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.toggleFavorite(1);
        result.current.toggleFavorite(2);
        result.current.toggleFavorite(3);
      });

      expect(result.current.progress.favoritePositions).toEqual([1, 2, 3]);

      act(() => {
        result.current.toggleFavorite(2); // Remove middle one
      });

      expect(result.current.progress.favoritePositions).toEqual([1, 3]);
    });
  });

  describe("UI Actions Edge Cases", () => {
    it("should handle modal state correctly", () => {
      const { result } = renderHook(() => useStore());

      // Open modal
      act(() => {
        result.current.openModal("settings");
      });

      expect(result.current.ui.modalOpen).toBe("settings");

      // Open different modal (should replace)
      act(() => {
        result.current.openModal("help");
      });

      expect(result.current.ui.modalOpen).toBe("help");

      // Close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.ui.modalOpen).toBe(null);
    });

    it("should handle multiple toasts with unique IDs", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.showToast("First message", "info", 5000);
      });

      // Advance time to ensure unique timestamps for toast IDs
      act(() => {
        jest.advanceTimersByTime(1);
        result.current.showToast("Second message", "warning", 5000);
      });

      act(() => {
        jest.advanceTimersByTime(1);
        result.current.showToast("Third message", "error", 5000);
      });

      expect(result.current.ui.toasts).toHaveLength(3);

      // Each toast should have unique ID
      const ids = result.current.ui.toasts.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);

      // Verify toast content and types
      expect(result.current.ui.toasts[0].message).toBe("First message");
      expect(result.current.ui.toasts[0].type).toBe("info");
      expect(result.current.ui.toasts[1].message).toBe("Second message");
      expect(result.current.ui.toasts[1].type).toBe("warning");
      expect(result.current.ui.toasts[2].message).toBe("Third message");
      expect(result.current.ui.toasts[2].type).toBe("error");
    });

    it("should handle clearing all toasts", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.showToast("Message 1", "info");
        result.current.showToast("Message 2", "info");
      });

      const toastIds = result.current.ui.toasts.map((t) => t.id);

      // Clear all toasts one by one
      act(() => {
        toastIds.forEach((id) => result.current.removeToast(id));
      });

      expect(result.current.ui.toasts).toHaveLength(0);
    });
  });

  describe("Edge Case: Game State Corruption", () => {
    it("should handle corrupted game state gracefully", () => {
      const { result } = renderHook(() => useStore());

      // Setup position
      const position: EndgamePosition = {
        id: 1,
        title: "Test Position",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        description: "Test",
        category: "opening",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 10,
      };

      act(() => {
        result.current.setPosition(position);
      });

      // Corrupt the game state
      act(() => {
        useStore.setState((state) => ({
          training: {
            ...state.training,
            game: {
              ...state.training.game,
              /**
               *
               */
              move: () => null, // Always return null
              /**
               *
               */
              fen: () => "corrupted",
              /**
               *
               */
              pgn: () => "corrupted",
            } as any,
          },
        }));
      });

      // Attempt move - should handle gracefully
      act(() => {
        result.current._internalApplyMove({ from: "e2", to: "e4" } as Move);
      });

      // Should log error but not crash
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
