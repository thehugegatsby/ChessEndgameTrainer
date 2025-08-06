/**
 * @file Tests for TrainingSlice with nested store structure
 * @module tests/unit/store/slices/trainingSlice.nested
 */

import { useStore } from "@shared/store/rootStore";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";

describe("TrainingSlice - Nested Store Structure", () => {
  const mockPosition: TrainingPosition = {
    id: 1,
    title: "Test Position",
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    colorToTrain: "white",
    targetOutcome: "1-0",
    sideToMove: "white",
    difficulty: "beginner" as const,
    category: "basic",
    description: "Test position for training",
  };

  beforeEach(() => {
    // Reset store to initial state - preserve actions by only updating state properties
    useStore.setState((state) => {
      state.training.currentPosition = undefined;
      state.training.nextPosition = undefined;
      state.training.previousPosition = undefined;
      state.training.isLoadingNavigation = false;
      state.training.navigationError = null;
      state.training.chapterProgress = null;
      state.training.isPlayerTurn = true;
      state.training.isOpponentThinking = false;
      state.training.isSuccess = false;
      state.training.sessionStartTime = undefined;
      state.training.sessionEndTime = undefined;
      state.training.hintsUsed = 0;
      state.training.mistakeCount = 0;
      state.training.moveErrorDialog = null;
    });
  });

  describe("setPosition", () => {
    it("should set current position and reset session state", () => {
      const store = useStore.getState();
      const beforeTime = Date.now();

      store.training.setPosition(mockPosition);

      const state = useStore.getState();
      const afterTime = Date.now();

      expect(state.training.currentPosition).toEqual(mockPosition);
      expect(state.training.isSuccess).toBe(false);
      expect(state.training.hintsUsed).toBe(0);
      expect(state.training.mistakeCount).toBe(0);
      expect(state.training.sessionStartTime).toBeGreaterThanOrEqual(
        beforeTime,
      );
      expect(state.training.sessionStartTime).toBeLessThanOrEqual(afterTime);
      expect(state.training.sessionEndTime).toBeUndefined();
    });

    it("should set player turn based on position color", () => {
      const store = useStore.getState();
      const whitePosition = {
        ...mockPosition,
        colorToTrain: "white" as const,
        sideToMove: "white" as const,
      };
      const blackPosition = {
        ...mockPosition,
        colorToTrain: "black" as const,
        sideToMove: "black" as const,
      };

      store.training.setPosition(whitePosition);
      expect(useStore.getState().training.isPlayerTurn).toBe(true);

      store.training.setPosition(blackPosition);
      expect(useStore.getState().training.isPlayerTurn).toBe(true);
    });
  });

  describe("setNavigationPositions", () => {
    it("should set next position", () => {
      const store = useStore.getState();
      const nextPosition = { ...mockPosition, id: 2, title: "Next Position" };

      store.training.setNavigationPositions(nextPosition);

      const state = useStore.getState();
      expect(state.training.nextPosition).toEqual(nextPosition);
    });

    it("should set previous position", () => {
      const store = useStore.getState();
      const prevPosition = {
        ...mockPosition,
        id: 0,
        title: "Previous Position",
      };

      store.training.setNavigationPositions(undefined, prevPosition);

      const state = useStore.getState();
      expect(state.training.previousPosition).toEqual(prevPosition);
    });

    it("should set both positions", () => {
      const store = useStore.getState();
      const nextPosition = { ...mockPosition, id: 2, title: "Next Position" };
      const prevPosition = {
        ...mockPosition,
        id: 0,
        title: "Previous Position",
      };

      store.training.setNavigationPositions(nextPosition, prevPosition);

      const state = useStore.getState();
      expect(state.training.nextPosition).toEqual(nextPosition);
      expect(state.training.previousPosition).toEqual(prevPosition);
    });

    it("should clear navigation with null values", () => {
      const store = useStore.getState();

      // First set some positions
      store.training.setNavigationPositions(mockPosition, mockPosition);

      // Then clear them
      store.training.setNavigationPositions(null, null);

      const state = useStore.getState();
      expect(state.training.nextPosition).toBeNull();
      expect(state.training.previousPosition).toBeNull();
    });
  });

  describe("setNavigationLoading", () => {
    it("should set navigation loading to true", () => {
      const store = useStore.getState();

      store.training.setNavigationLoading(true);

      const state = useStore.getState();
      expect(state.training.isLoadingNavigation).toBe(true);
    });

    it("should set navigation loading to false", () => {
      const store = useStore.getState();

      store.training.setNavigationLoading(false);

      const state = useStore.getState();
      expect(state.training.isLoadingNavigation).toBe(false);
    });
  });

  describe("setNavigationError", () => {
    it("should set navigation error message", () => {
      const store = useStore.getState();
      const errorMessage = "Position nicht gefunden";

      store.training.setNavigationError(errorMessage);

      const state = useStore.getState();
      expect(state.training.navigationError).toBe(errorMessage);
    });

    it("should clear navigation error", () => {
      const store = useStore.getState();

      // First set an error
      store.training.setNavigationError("Some error");

      // Then clear it
      store.training.setNavigationError(null);

      const state = useStore.getState();
      expect(state.training.navigationError).toBeNull();
    });
  });

  describe("setChapterProgress", () => {
    it("should set chapter progress", () => {
      const store = useStore.getState();
      const progress = { completed: 3, total: 10 };

      store.training.setChapterProgress(progress);

      const state = useStore.getState();
      expect(state.training.chapterProgress).toEqual(progress);
    });

    it("should clear chapter progress", () => {
      const store = useStore.getState();

      // First set progress
      store.training.setChapterProgress({ completed: 5, total: 10 });

      // Then clear it
      store.training.setChapterProgress(null);

      const state = useStore.getState();
      expect(state.training.chapterProgress).toBeNull();
    });
  });

  describe("setPlayerTurn", () => {
    it("should enable player turn", () => {
      const store = useStore.getState();

      store.training.setPlayerTurn(true);

      const state = useStore.getState();
      expect(state.training.isPlayerTurn).toBe(true);
    });

    it("should disable player turn", () => {
      const store = useStore.getState();

      store.training.setPlayerTurn(false);

      const state = useStore.getState();
      expect(state.training.isPlayerTurn).toBe(false);
    });
  });

  describe("completeTraining", () => {
    it("should mark training as successful", () => {
      const store = useStore.getState();
      const beforeTime = Date.now();

      store.training.completeTraining(true);

      const state = useStore.getState();
      const afterTime = Date.now();

      expect(state.training.isSuccess).toBe(true);
      expect(state.training.sessionEndTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.training.sessionEndTime).toBeLessThanOrEqual(afterTime);
    });

    it("should mark training as failed", () => {
      const store = useStore.getState();

      store.training.completeTraining(false);

      const state = useStore.getState();
      expect(state.training.isSuccess).toBe(false);
      expect(state.training.sessionEndTime).toBeDefined();
    });
  });

  describe("incrementHint", () => {
    it("should increment hint counter", () => {
      const store = useStore.getState();

      expect(useStore.getState().training.hintsUsed).toBe(0);

      store.training.incrementHint();
      expect(useStore.getState().training.hintsUsed).toBe(1);

      store.training.incrementHint();
      expect(useStore.getState().training.hintsUsed).toBe(2);
    });
  });

  describe("incrementMistake", () => {
    it("should increment mistake counter", () => {
      const store = useStore.getState();

      expect(useStore.getState().training.mistakeCount).toBe(0);

      store.training.incrementMistake();
      expect(useStore.getState().training.mistakeCount).toBe(1);

      store.training.incrementMistake();
      expect(useStore.getState().training.mistakeCount).toBe(2);
    });
  });

  describe("setMoveErrorDialog", () => {
    it("should show move error dialog", () => {
      const store = useStore.getState();
      const dialog = {
        isOpen: true,
        wdlBefore: 1000,
        wdlAfter: 0,
        bestMove: "Qb7",
      };

      store.training.setMoveErrorDialog(dialog);

      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toEqual(dialog);
    });

    it("should close move error dialog", () => {
      const store = useStore.getState();

      // First open the dialog
      store.training.setMoveErrorDialog({
        isOpen: true,
        wdlBefore: 1000,
        wdlAfter: 0,
      });

      // Then close it
      store.training.setMoveErrorDialog(null);

      const state = useStore.getState();
      expect(state.training.moveErrorDialog).toBeNull();
    });
  });

  describe("resetTraining", () => {
    it("should reset all training state", () => {
      const store = useStore.getState();

      // Set various values first
      store.training.setPosition(mockPosition);
      store.training.incrementHint();
      store.training.incrementMistake();
      store.training.setPlayerTurn(false);
      store.training.completeTraining(true);

      // Reset training
      store.training.resetTraining();

      const state = useStore.getState();
      expect(state.training.currentPosition).toBeUndefined();
      expect(state.training.hintsUsed).toBe(0);
      expect(state.training.mistakeCount).toBe(0);
      expect(state.training.isPlayerTurn).toBe(true);
      expect(state.training.isSuccess).toBe(false);
      expect(state.training.sessionStartTime).toBeUndefined();
      expect(state.training.sessionEndTime).toBeUndefined();
    });
  });

  describe("Integration with nested structure", () => {
    it("should work with other slices in the store", () => {
      const store = useStore.getState();

      // Verify that other slices exist
      expect(store.game).toBeDefined();
      expect(store.tablebase).toBeDefined();
      expect(store.ui).toBeDefined();

      // Set training data
      store.training.setPosition(mockPosition);

      // Verify it doesn't affect other slices
      const state = useStore.getState();
      expect(state.training.currentPosition).toEqual(mockPosition);
      expect(state.game.currentFen).toBeDefined();
      expect(state.tablebase.analysisStatus).toBeDefined();
    });

    it("should maintain proper nesting in state updates", () => {
      const store = useStore.getState();

      // Make multiple updates
      store.training.setPosition(mockPosition);
      store.training.incrementHint();
      store.training.setPlayerTurn(false);

      // Check all updates were applied correctly
      const state = useStore.getState();
      expect(state.training.currentPosition).toEqual(mockPosition);
      expect(state.training.hintsUsed).toBe(1);
      expect(state.training.isPlayerTurn).toBe(false);
    });
  });
});
