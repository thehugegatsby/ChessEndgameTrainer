/**
 * @file Clean Store Integration Tests for Root Store
 * @description Tests core store functionality with modern patterns for the refactored store
 */

import { useStore } from "@shared/store/rootStore";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";

// Mock the logger
jest.mock("@shared/services/logging", () => ({
  /**
   *
   */
  getLogger: () => ({
    setContext: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock chess.js
jest.mock("chess.js", () => {
  return {
    Chess: jest.fn().mockImplementation((fen) => {
      const currentFen =
        fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      return {
        fen: jest.fn(() => currentFen),
        pgn: jest.fn(() => ""),
        move: jest.fn(() => ({
          from: "e2",
          to: "e4",
          san: "e4",
          piece: "p",
          color: "w",
          flags: "b",
        })),
        load: jest.fn(),
        isGameOver: jest.fn(() => false),
        isCheckmate: jest.fn(() => false),
        isDraw: jest.fn(() => false),
        turn: jest.fn(() => currentFen.split(" ")[1] || "w"),
      };
    }),
  };
});

// Mock TablebaseService
jest.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: jest.fn().mockResolvedValue({ isAvailable: false }),
    getTopMoves: jest.fn().mockResolvedValue({ isAvailable: false, moves: [] }),
  },
}));

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => `test-id-${Math.random()}`),
}));

describe("Root Store Integration Tests", () => {
  const mockPosition: TrainingPosition = {
    id: 1,
    title: "Test Position",
    fen: "k7/8/8/8/8/8/P7/K7 w - - 0 1",
    description: "Simple king and pawn endgame",
    category: "pawn",
    difficulty: "beginner",
    goal: "win",
    sideToMove: "white",
    targetMoves: 4,
    colorToTrain: "white",
    targetOutcome: "1-0",
    chapterId: "test-chapter",
  };

  beforeEach(() => {
    useStore.getState().reset();
  });

  describe("Basic Position Management", () => {
    it("should set and retrieve current position", () => {
      const store = useStore.getState();

      store.setPosition(mockPosition);

      expect(useStore.getState().currentPosition).toEqual(mockPosition);
      expect(useStore.getState().mistakeCount).toBe(0);
    });

    it("should reset store to initial state", () => {
      const store = useStore.getState();

      // First set some state
      store.setPosition(mockPosition);

      // Then reset
      store.reset();

      const state = useStore.getState();
      expect(state.currentPosition).toBeUndefined();
      expect(state.mistakeCount).toBe(0);
      expect(state.loading.position).toBe(false);
    });
  });

  describe("Game State Integration", () => {
    it("should handle position changes correctly", () => {
      const store = useStore.getState();

      const newPosition: TrainingPosition = {
        ...mockPosition,
        id: 2,
        title: "Second Position",
        fen: "k7/8/8/8/8/8/1P6/K7 w - - 0 1",
      };

      // Set initial position
      store.setPosition(mockPosition);

      expect(useStore.getState().currentPosition?.id).toBe(1);

      // Change to new position
      store.setPosition(newPosition);

      expect(useStore.getState().currentPosition?.id).toBe(2);
      expect(useStore.getState().currentPosition?.fen).toBe(
        "k7/8/8/8/8/8/1P6/K7 w - - 0 1",
      );
    });
  });

  describe("Store Stability", () => {
    it("should maintain consistent state during updates", () => {
      const store = useStore.getState();

      // Multiple position updates should work consistently
      const positions = [1, 2, 3].map((id) => ({
        ...mockPosition,
        id,
        title: `Position ${id}`,
      }));

      positions.forEach((position) => {
        store.setPosition(position);
        expect(useStore.getState().currentPosition?.id).toBe(position.id);
      });
    });
  });

  describe("Cross-Slice Integration", () => {
    it("should coordinate between training and game slices", async () => {
      const store = useStore.getState();

      // Load training context
      await store.loadTrainingContext(mockPosition);

      const state = useStore.getState();

      // Training slice updated - position has additional fields added by loadTrainingContext
      expect(state.currentPosition?.id).toBe(mockPosition.id);
      expect(state.currentPosition?.title).toBe(mockPosition.title);
      expect(state.currentPosition?.fen).toBe(mockPosition.fen);

      // Game slice initialized
      expect(state.game).toBeTruthy();
      expect(state.currentFen).toBe(mockPosition.fen);

      // UI state updated
      expect(state.loading.position).toBe(false);
    });

    it("should handle user moves across slices", async () => {
      const store = useStore.getState();

      // Setup position
      await store.loadTrainingContext(mockPosition);

      // Make a user move
      const moveResult = await store.makeUserMove({ from: "a2", to: "a4" });

      expect(moveResult).toBe(true);

      const state = useStore.getState();

      // Game slice updated
      expect(state.moveHistory).toHaveLength(1);
      expect(state.currentMoveIndex).toBe(0);

      // Note: Training moves are not tracked in a separate array in the new architecture
      // They are part of the game's moveHistory with metadata handled by orchestrators
    });
  });

  describe("Progress Tracking Integration", () => {
    it("should update progress when position completed", () => {
      const store = useStore.getState();

      // Update position progress
      store.updatePositionProgress(1, {
        positionId: 1,
        attempts: 1,
        completed: true,
        accuracy: 100,
        bestTime: 60,
        difficulty: 1,
      });

      const state = useStore.getState();
      expect(state.positionProgress[1]).toBeDefined();
      expect(state.positionProgress[1].completed).toBe(true);

      // Add to favorites
      store.toggleFavorite(1);
      expect(useStore.getState().favoritePositions).toContain(1);
    });
  });

  describe("UI State Integration", () => {
    it("should coordinate loading states", async () => {
      const store = useStore.getState();

      // Set multiple loading states
      store.setLoading("position", true);
      store.setLoading("tablebase", true);

      let state = useStore.getState();
      expect(state.loading.position).toBe(true);
      expect(state.loading.tablebase).toBe(true);

      // Clear one loading state
      store.setLoading("position", false);

      state = useStore.getState();
      expect(state.loading.position).toBe(false);
      expect(state.loading.tablebase).toBe(true);
    });

    it("should handle toasts and modals", () => {
      const store = useStore.getState();

      // Show toast
      store.showToast("Test message", "success");

      let state = useStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe("Test message");

      // Open modal
      store.openModal("settings");
      expect(useStore.getState().modalOpen).toBe("settings");

      // Close modal
      store.closeModal();
      expect(useStore.getState().modalOpen).toBeNull();
    });
  });

  describe("Settings Integration", () => {
    it("should apply settings across slices", () => {
      const store = useStore.getState();

      // Update theme
      store.updateTheme({ mode: "dark" });
      expect(useStore.getState().theme.mode).toBe("dark");

      // Update user preferences
      store.updatePreferences({ theme: "light" });
      expect(useStore.getState().preferences.theme).toBe("light");

      // Update difficulty
      store.updateDifficulty({ level: "advanced" });
      expect(useStore.getState().difficulty.level).toBe("advanced");
    });
  });
});
