import { renderHook, act } from "@testing-library/react";
import { useStore } from "@shared/store/store";
import { tablebaseService } from "@shared/services/TablebaseService";
import { EndgamePosition } from "@shared/types/endgame";

// Mock tablebase service
jest.mock("@shared/services/TablebaseService");

// Mock the logger
jest.mock(
  "@shared/services/logging",
  require("../../shared/logger-utils").getMockLoggerDefinition(),
);

describe("Move Validation - Game Outcome Changes", () => {
  const mockTablebaseService = tablebaseService as jest.Mocked<
    typeof tablebaseService
  >;

  // Training position 1: K+P vs K
  const trainingPosition1: EndgamePosition = {
    id: 1,
    title: "King and Pawn vs King - Basic Win",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    description: "White to move and win. Basic technique with opposition.",
    category: "pawn-endgames",
    difficulty: "beginner",
    goal: "win",
    targetMoves: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    act(() => {
      useStore.getState().reset();
    });
  });

  describe("Position: K+P vs K (Training Position 1)", () => {
    it("should NOT show error dialog for winning move Kd6 (suboptimal but still wins)", async () => {
      renderHook(() => useStore.getState());

      // Initialize position
      act(() => {
        useStore.getState().setPosition(trainingPosition1);
      });

      // Mock tablebase responses for Kd6
      // Before: Initial position (Win for White)
      mockTablebaseService.getEvaluation.mockResolvedValueOnce({
        isAvailable: true,
        result: {
          wdl: 2, // Win
          dtz: 10,
          dtm: null,
          category: "win",
          precise: true,
          evaluation: "White wins",
        },
      });

      // After Kd6: Still a win for White (but black to move, so WDL is from black's perspective)
      mockTablebaseService.getEvaluation.mockResolvedValueOnce({
        isAvailable: true,
        result: {
          wdl: -2, // Black loses (which means white wins)
          dtz: 12,
          dtm: null,
          category: "win",
          precise: true,
          evaluation: "Black loses",
        },
      });

      // Act
      let moveResult: boolean = false;
      await act(async () => {
        // Access makeUserMove from the store
        const { makeUserMove } = useStore.getState();
        moveResult = await makeUserMove({ from: "e6", to: "d6" });
      });

      // Assert
      expect(moveResult).toBe(true); // Move should be executed
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalledTimes(2);

      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toBeNull(); // No error dialog
      expect(state.training.moveHistory).toHaveLength(1); // Move was made
      expect(state.training.currentFen).toContain("3K"); // King on d6
    });

    it("should show error dialog for Kc5 after Kd6 Kf8 (converts win to draw)", async () => {
      renderHook(() => useStore.getState());

      // Initialize position
      act(() => {
        useStore.getState().setPosition(trainingPosition1);
      });

      // First make the moves: 1.Kd6 Kf8
      // We need to apply these moves to get to the test position
      act(() => {
        // Use internal apply move to bypass validation for setup
        const { _internalApplyMove } = useStore.getState();
        _internalApplyMove({ from: "e6", to: "d6" });
        _internalApplyMove({ from: "e8", to: "f8" });
      });

      // Verify we're in the expected position
      expect(useStore.getState().training.currentFen).toBe(
        "5k2/8/3K4/4P3/8/8/8/8 w - - 2 2",
      );

      // Mock tablebase responses for Kc5
      // Before Kc5: Win for White
      mockTablebaseService.getEvaluation.mockResolvedValueOnce({
        isAvailable: true,
        result: {
          wdl: 2, // Win
          dtz: 8,
          dtm: null,
          category: "win",
          precise: true,
          evaluation: "White wins",
        },
      });

      // After Kc5: Draw!
      mockTablebaseService.getEvaluation.mockResolvedValueOnce({
        isAvailable: true,
        result: {
          wdl: 0, // Draw!
          dtz: 0,
          dtm: null,
          category: "draw",
          precise: true,
          evaluation: "Draw",
        },
      });

      // Mock best move response
      mockTablebaseService.getTopMoves.mockResolvedValueOnce({
        isAvailable: true,
        moves: [
          {
            san: "Kd5",
            uci: "d6d5",
            wdl: 2,
            dtz: 7,
            dtm: null,
            category: "win",
          },
        ],
      });

      // Act
      let moveResult: boolean = true;
      await act(async () => {
        // Access makeUserMove from the store
        const { makeUserMove } = useStore.getState();
        moveResult = await makeUserMove({ from: "d6", to: "c5" });
      });

      // Assert
      expect(moveResult).toBe(false); // Move should NOT be executed
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalledTimes(2);
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledTimes(1);

      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toEqual({
        isOpen: true,
        wdlBefore: 2,
        wdlAfter: expect.any(Number), // Accept both 0 and -0
        bestMove: "Kd5",
      });
      expect(Math.abs(state.training.moveErrorDialog?.wdlAfter || 0)).toBe(0); // Ensure it's actually 0

      // Verify the position hasn't changed (move was prevented)
      expect(state.training.currentFen).toBe("5k2/8/3K4/4P3/8/8/8/8 w - - 2 2");
      expect(state.training.moveHistory).toHaveLength(2); // Only the setup moves
    });

    it("should NOT show error dialog for moves that maintain the game outcome", async () => {
      renderHook(() => useStore.getState());

      // Setup a drawn position (K vs K)
      const drawnPosition: EndgamePosition = {
        ...trainingPosition1,
        fen: "4k3/8/4K3/8/8/8/8/8 w - - 0 1",
        goal: "draw",
      };

      act(() => {
        useStore.getState().setPosition(drawnPosition);
      });

      // Mock tablebase responses - both draw
      mockTablebaseService.getEvaluation.mockResolvedValueOnce({
        isAvailable: true,
        result: {
          wdl: 0, // Draw
          dtz: 0,
          dtm: null,
          category: "draw",
          precise: true,
          evaluation: "Draw",
        },
      });

      mockTablebaseService.getEvaluation.mockResolvedValueOnce({
        isAvailable: true,
        result: {
          wdl: 0, // Still Draw
          dtz: 0,
          dtm: null,
          category: "draw",
          precise: true,
          evaluation: "Draw",
        },
      });

      // Act
      let moveResult: boolean = false;
      await act(async () => {
        // Access makeUserMove from the store
        const { makeUserMove } = useStore.getState();
        moveResult = await makeUserMove({ from: "e6", to: "d6" });
      });

      // Assert
      expect(moveResult).toBe(true); // Move should be executed
      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toBeNull(); // No error dialog
    });
  });

  describe("Edge cases", () => {
    it("should handle tablebase service errors gracefully", async () => {
      renderHook(() => useStore.getState());

      act(() => {
        useStore.getState().setPosition(trainingPosition1);
      });

      // Mock tablebase service to throw error
      mockTablebaseService.getEvaluation.mockRejectedValue(
        new Error("Tablebase unavailable"),
      );

      // Act
      let moveResult: boolean = false;
      await act(async () => {
        // Access makeUserMove from the store
        const { makeUserMove } = useStore.getState();
        moveResult = await makeUserMove({ from: "e6", to: "d6" });
      });

      // Assert
      expect(moveResult).toBe(true); // Move should still be executed (fail open)
      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toBeNull(); // No error dialog on service failure
    });

    it("should handle moves when tablebase evaluation is not available", async () => {
      renderHook(() => useStore.getState());

      act(() => {
        useStore.getState().setPosition(trainingPosition1);
      });

      // Mock tablebase service to return unavailable
      mockTablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: false,
        error: "Position not in tablebase",
      });

      // Act
      let moveResult: boolean = false;
      await act(async () => {
        // Access makeUserMove from the store
        const { makeUserMove } = useStore.getState();
        moveResult = await makeUserMove({ from: "e6", to: "d6" });
      });

      // Assert
      expect(moveResult).toBe(true); // Move should be executed when tablebase unavailable
      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toBeNull();
    });
  });
});
