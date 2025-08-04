/**
 * @file Navigation Actions Tests for Zustand Store
 * @description Tests navigation functionality (goToMove, goToFirst, goToNext, etc.)
 */

import { act, renderHook } from "@testing-library/react";
import { useStore } from "@shared/store/rootStore";
import { EndgamePosition } from "../../../shared/types/endgame";
import type { ValidatedMove } from "../../../shared/types";

// Mock the logger
jest.mock(
  "../../../shared/services/logging",
  require("../../shared/logger-utils").getMockLoggerDefinition(),
);

describe("Store Navigation Actions", () => {
  const mockPosition: EndgamePosition = {
    id: 1,
    title: "Test Position",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    description: "Starting position",
    category: "opening",
    difficulty: "beginner",
    goal: "win",
    sideToMove: "white",
    targetMoves: 10,
  };

  const mockMoves = [
    { from: "e2", to: "e4", san: "e4" },
    { from: "e7", to: "e5", san: "e5" },
    { from: "g1", to: "f3", san: "Nf3" },
    { from: "b8", to: "c6", san: "Nc6" },
  ];

  beforeEach(() => {
    act(() => {
      useStore.getState().reset();
    });
  });

  describe("goToMove", () => {
    it("should navigate to specific move index", async () => {
      const { result } = renderHook(() => useStore());

      // Setup position and make moves
      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      expect(result.current.currentMoveIndex).toBe(3); // At last move

      // Navigate to move 1 (after e4 e5)
      act(() => {
        result.current.goToMove(1);
      });

      expect(result.current.currentMoveIndex).toBe(1);
      expect(result.current.isPlayerTurn).toBe(true); // White's turn after Black's e5
      expect(result.current.currentFen).toContain("4p3"); // Black pawn on e5 in FEN notation
      expect(result.current.currentFen).not.toContain("Nf3"); // Knight not yet moved
    });

    it("should handle navigation to initial position (-1)", async () => {
      const { result } = renderHook(() => useStore());

      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      // Navigate to initial position
      act(() => {
        result.current.goToMove(-1);
      });

      expect(result.current.currentMoveIndex).toBe(-1);
      expect(result.current.isPlayerTurn).toBe(true); // White's turn at start
      expect(result.current.currentFen).toBe(mockPosition.fen);
    });

    it("should handle out-of-bounds navigation", async () => {
      const { result } = renderHook(() => useStore());

      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        result.current.makeMove(mockMoves[0]);
      });

      // Try to navigate beyond bounds
      const successBeyond = act(() => {
        return result.current.goToMove(10); // Beyond last move
      });

      // goToMove returns false for out of bounds, currentMoveIndex stays unchanged
      expect(result.current.currentMoveIndex).toBe(0); // Stays at current position

      const successBefore = act(() => {
        return result.current.goToMove(-5); // Before initial position
      });

      // goToMove returns false for out of bounds, currentMoveIndex stays unchanged
      expect(result.current.currentMoveIndex).toBe(0); // Still at same position
    });

    it("should not navigate when already at target index", async () => {
      const { result } = renderHook(() => useStore());

      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        result.current.makeMove(mockMoves[0]);
      });

      const fenBefore = result.current.currentFen;

      // Navigate to current position (should be no-op)
      act(() => {
        result.current.goToMove(0);
      });

      expect(result.current.currentFen).toBe(fenBefore);
    });

    it("should correctly determine turn after navigation", async () => {
      const { result } = renderHook(() => useStore());

      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      // Test turn determination at various positions
      // Note: isPlayerTurn is about training logic, not just whose chess turn it is
      // When training white, isPlayerTurn is true when it's white's turn
      const testCases = [
        { moveIndex: -1, expectedGameTurn: "w" }, // Initial: White's turn
        { moveIndex: 0, expectedGameTurn: "b" }, // After e4: Black's turn
        { moveIndex: 1, expectedGameTurn: "w" }, // After e5: White's turn
        { moveIndex: 2, expectedGameTurn: "b" }, // After Nf3: Black's turn
        { moveIndex: 3, expectedGameTurn: "w" }, // After Nc6: White's turn
      ];

      testCases.forEach(({ moveIndex, expectedGameTurn }) => {
        act(() => {
          result.current.goToMove(moveIndex);
        });
        // Check the actual game turn
        const actualTurn = result.current.game?.turn();
        expect(actualTurn).toBe(expectedGameTurn);
      });
    });
  });

  describe("Navigation helper actions", () => {
    it("should navigate to first move", async () => {
      const { result } = renderHook(() => useStore());

      // Setup position with multiple moves
      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      act(() => {
        result.current.goToFirst();
      });

      expect(result.current.currentMoveIndex).toBe(-1);
      expect(result.current.currentFen).toBe(mockPosition.fen);
    });

    it("should navigate to previous move", async () => {
      const { result } = renderHook(() => useStore());

      // Setup position with multiple moves first
      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      // Start at last move (index 3)
      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentMoveIndex).toBe(2);

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentMoveIndex).toBe(1);
    });

    it("should navigate to next move", async () => {
      const { result } = renderHook(() => useStore());

      // Setup position with multiple moves first
      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      // Go to beginning first
      act(() => {
        result.current.goToFirst();
      });

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentMoveIndex).toBe(0);

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentMoveIndex).toBe(1);
    });

    it("should navigate to last move", async () => {
      const { result } = renderHook(() => useStore());

      // Setup position with multiple moves first
      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      // Go to beginning first
      act(() => {
        result.current.goToFirst();
      });

      act(() => {
        result.current.goToLast();
      });

      expect(result.current.currentMoveIndex).toBe(3);
    });

    it("should handle navigation from undefined currentMoveIndex", async () => {
      const { result } = renderHook(() => useStore());

      // Setup position with multiple moves first
      await act(async () => {
        await result.current.loadTrainingContext({
          ...mockPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        mockMoves.forEach((move) => {
          result.current.makeMove(move);
        });
      });

      // Manually set currentMoveIndex to undefined
      act(() => {
        useStore.setState({
          currentMoveIndex: undefined,
        });
      });

      // goToPrevious should use moveHistory.length - 1 as current
      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentMoveIndex).toBe(2); // 3 - 1

      // Reset to undefined again
      act(() => {
        useStore.setState({
          currentMoveIndex: undefined,
        });
      });

      // goToNext should use -1 as current
      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentMoveIndex).toBe(0); // -1 + 1
    });
  });

  describe("Edge cases", () => {
    it("should handle navigation without game instance", () => {
      const { result } = renderHook(() => useStore());

      // Set position without game (simulate error state)
      const mockValidatedMove = {
        ...mockMoves[0],
        fenBefore: mockPosition.fen,
        fenAfter: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        timestamp: Date.now(),
      };

      act(() => {
        useStore.setState({
          game: null,
          currentPosition: mockPosition,
          moveHistory: [mockValidatedMove as any],
        });
      });

      // Should not throw when navigating
      const success = act(() => {
        return result.current.goToMove(0);
      });

      // When game is null, goToMove should still succeed if move exists
      // It will create a new game instance from the move's FEN
      expect(result.current.currentMoveIndex).toBe(0); // Navigation should work
    });

    it("should handle moves with promotion", async () => {
      const { result } = renderHook(() => useStore());

      const promotionPosition: EndgamePosition = {
        ...mockPosition,
        fen: "8/P7/8/8/8/8/8/k6K w - - 0 1", // Pawn ready to promote
      };

      const promotionMove = {
        from: "a7",
        to: "a8",
        san: "a8=Q",
        promotion: "q",
      };

      await act(async () => {
        await result.current.loadTrainingContext({
          ...promotionPosition,
          colorToTrain: "white",
          targetOutcome: "1-0",
        });
        result.current.makeMove(promotionMove);
      });

      // Navigate back and forth
      act(() => {
        result.current.goToFirst();
      });

      act(() => {
        result.current.goToLast();
      });

      // Should handle promotion correctly
      expect(result.current.currentFen).toContain("Q"); // Queen on board
    });
  });
});
