/**
 * @file Unit tests for Training state slice
 * @module tests/store/slices/trainingSlice
 * @description Comprehensive test suite for the training slice including state, actions, and selectors.
 * Tests cover training session management, navigation, progress tracking, and error handling.
 */

import { createStore } from "zustand/vanilla";
import {
  createTrainingSlice,
  trainingSelectors,
  createInitialTrainingState,
} from "@shared/store/slices/trainingSlice";
import type { TrainingSlice } from "@shared/store/slices/types";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";

/**
 * Creates a test store instance with only the training slice
 * @returns Store instance with getState and setState methods
 */
const createTestStore = () => {
  return createStore<TrainingSlice>()(createTrainingSlice);
};

/**
 * Mock training positions for testing
 */
const mockPosition: TrainingPosition = {
  id: 1,
  title: "King and Rook vs King",
  description: "Basic checkmate pattern",
  fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
  category: "basic-checkmates",
  difficulty: "beginner",
  targetMoves: 10,
  hints: [
    "Push the enemy king to the edge",
    "Use your rook to cut off the king",
  ],
  solution: ["Ra8", "Ra7", "Ra6"],
  colorToTrain: "white",
  targetOutcome: "1-0",
  sideToMove: "white",
  goal: "win",
  chapterId: "chapter-1",
};

const mockNextPosition: TrainingPosition = {
  ...mockPosition,
  id: 2,
  title: "Queen vs King",
  fen: "8/8/8/8/8/8/1Q6/K3k3 w - - 0 1",
};

const mockPrevPosition: TrainingPosition = {
  ...mockPosition,
  id: 0,
  title: "Two Rooks vs King",
  fen: "8/8/8/8/8/R7/R7/K3k3 w - - 0 1",
};

describe("TrainingSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    /**
     * Tests that the initial state matches expected defaults
     */
    it("should have correct initial state", () => {
      const state = store.getState();
      const expectedState = createInitialTrainingState();

      expect(state.currentPosition).toBe(expectedState.currentPosition);
      expect(state.nextPosition).toBe(expectedState.nextPosition);
      expect(state.previousPosition).toBe(expectedState.previousPosition);
      expect(state.isLoadingNavigation).toBe(expectedState.isLoadingNavigation);
      expect(state.navigationError).toBe(expectedState.navigationError);
      expect(state.chapterProgress).toBe(expectedState.chapterProgress);
      expect(state.isPlayerTurn).toBe(expectedState.isPlayerTurn);
      expect(state.isSuccess).toBe(expectedState.isSuccess);
      expect(state.hintsUsed).toBe(expectedState.hintsUsed);
      expect(state.mistakeCount).toBe(expectedState.mistakeCount);
      expect(state.moveErrorDialog).toBe(expectedState.moveErrorDialog);
    });

    /**
     * Tests the initial state factory function
     */
    it("should create fresh initial state on each call", () => {
      const state1 = createInitialTrainingState();
      const state2 = createInitialTrainingState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe("setPosition", () => {
    /**
     * Tests setting a training position
     */
    it("should set position and reset session state", () => {
      const beforeTime = Date.now();
      store.getState().setPosition(mockPosition);
      const afterTime = Date.now();

      const state = store.getState();
      expect(state.currentPosition).toBe(mockPosition);
      expect(state.isSuccess).toBe(false);
      expect(state.sessionStartTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.sessionStartTime).toBeLessThanOrEqual(afterTime);
      expect(state.sessionEndTime).toBeUndefined();
      expect(state.hintsUsed).toBe(0);
      expect(state.mistakeCount).toBe(0);
      expect(state.moveErrorDialog).toBeNull();
    });

    /**
     * Tests initial turn setting based on position
     */
    it("should set initial turn correctly", () => {
      // Player's turn (white to move, training white)
      store.getState().setPosition(mockPosition);
      expect(store.getState().isPlayerTurn).toBe(true);

      // Not player's turn (white to move, training black)
      const blackTrainingPos: TrainingPosition = {
        ...mockPosition,
        colorToTrain: "black",
      };
      store.getState().setPosition(blackTrainingPos);
      expect(store.getState().isPlayerTurn).toBe(false);
    });

    /**
     * Tests that setting position resets error dialog
     */
    it("should clear move error dialog", () => {
      // Set error dialog first
      store.getState().setMoveErrorDialog({
        isOpen: true,
        wdlBefore: 1000,
        wdlAfter: 0,
        bestMove: "Ra8#",
      });
      expect(store.getState().moveErrorDialog).not.toBeNull();

      // Set position should clear it
      store.getState().setPosition(mockPosition);
      expect(store.getState().moveErrorDialog).toBeNull();
    });
  });

  describe("setNavigationPositions", () => {
    /**
     * Tests setting both navigation positions
     */
    it("should set both next and previous positions", () => {
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);

      const state = store.getState();
      expect(state.nextPosition).toBe(mockNextPosition);
      expect(state.previousPosition).toBe(mockPrevPosition);
    });

    /**
     * Tests setting only next position
     */
    it("should set only next position when previous undefined", () => {
      // Set initial values
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);

      // Update only next
      const newNext = { ...mockNextPosition, id: 3 };
      store.getState().setNavigationPositions(newNext);

      const state = store.getState();
      expect(state.nextPosition).toBe(newNext);
      expect(state.previousPosition).toBe(mockPrevPosition); // Unchanged
    });

    /**
     * Tests setting only previous position
     */
    it("should set only previous position when next undefined", () => {
      // Set initial values
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);

      // Update only previous
      const newPrev = { ...mockPrevPosition, id: -1 };
      store.getState().setNavigationPositions(undefined, newPrev);

      const state = store.getState();
      expect(state.nextPosition).toBe(mockNextPosition); // Unchanged
      expect(state.previousPosition).toBe(newPrev);
    });

    /**
     * Tests clearing navigation positions
     */
    it("should clear navigation positions with null", () => {
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);
      store.getState().setNavigationPositions(null, null);

      const state = store.getState();
      expect(state.nextPosition).toBeNull();
      expect(state.previousPosition).toBeNull();
    });
  });

  describe("Navigation State", () => {
    /**
     * Tests navigation loading state
     */
    it("should set navigation loading state", () => {
      expect(store.getState().isLoadingNavigation).toBe(false);

      store.getState().setNavigationLoading(true);
      expect(store.getState().isLoadingNavigation).toBe(true);

      store.getState().setNavigationLoading(false);
      expect(store.getState().isLoadingNavigation).toBe(false);
    });

    /**
     * Tests navigation error state
     */
    it("should set navigation error message", () => {
      expect(store.getState().navigationError).toBeNull();

      store.getState().setNavigationError("Position nicht gefunden");
      expect(store.getState().navigationError).toBe("Position nicht gefunden");

      store.getState().setNavigationError(null);
      expect(store.getState().navigationError).toBeNull();
    });
  });

  describe("Chapter Progress", () => {
    /**
     * Tests setting chapter progress
     */
    it("should set chapter progress", () => {
      const progress = { completed: 3, total: 10 };
      store.getState().setChapterProgress(progress);

      expect(store.getState().chapterProgress).toEqual(progress);
    });

    /**
     * Tests clearing chapter progress
     */
    it("should clear chapter progress with null", () => {
      store.getState().setChapterProgress({ completed: 5, total: 10 });
      store.getState().setChapterProgress(null);

      expect(store.getState().chapterProgress).toBeNull();
    });
  });

  describe("Game Flow", () => {
    /**
     * Tests player turn management
     */
    it("should toggle player turn", () => {
      expect(store.getState().isPlayerTurn).toBe(true);

      store.getState().setPlayerTurn(false);
      expect(store.getState().isPlayerTurn).toBe(false);

      store.getState().setPlayerTurn(true);
      expect(store.getState().isPlayerTurn).toBe(true);
    });

    /**
     * Tests training completion
     */
    it("should complete training successfully", () => {
      store.getState().setPosition(mockPosition);
      const startTime = store.getState().sessionStartTime;

      // Small delay to ensure end time is after start time
      const delay = new Promise((resolve) => setTimeout(resolve, 1));
      return delay.then(() => {
        const beforeComplete = Date.now();
        store.getState().completeTraining(true);
        const afterComplete = Date.now();

        const state = store.getState();
        expect(state.isSuccess).toBe(true);
        expect(state.sessionEndTime).toBeGreaterThanOrEqual(beforeComplete);
        expect(state.sessionEndTime).toBeLessThanOrEqual(afterComplete);
        expect(state.sessionEndTime).toBeGreaterThanOrEqual(startTime!);
      });
    });

    /**
     * Tests failed training completion
     */
    it("should complete training with failure", () => {
      store.getState().setPosition(mockPosition);
      store.getState().completeTraining(false);

      const state = store.getState();
      expect(state.isSuccess).toBe(false);
      expect(state.sessionEndTime).toBeDefined();
    });
  });

  describe("Performance Tracking", () => {
    /**
     * Tests hint usage
     */
    it("should increment hint counter", () => {
      expect(store.getState().hintsUsed).toBe(0);

      store.getState().useHint();
      expect(store.getState().hintsUsed).toBe(1);

      store.getState().useHint();
      store.getState().useHint();
      expect(store.getState().hintsUsed).toBe(3);
    });

    /**
     * Tests mistake counting
     */
    it("should increment mistake counter", () => {
      expect(store.getState().mistakeCount).toBe(0);

      store.getState().incrementMistake();
      expect(store.getState().mistakeCount).toBe(1);

      store.getState().incrementMistake();
      store.getState().incrementMistake();
      expect(store.getState().mistakeCount).toBe(3);
    });
  });

  describe("Move Error Dialog", () => {
    /**
     * Tests setting error dialog
     */
    it("should set move error dialog", () => {
      const dialog = {
        isOpen: true,
        wdlBefore: 1000,
        wdlAfter: 0,
        bestMove: "Ra8#",
      };

      store.getState().setMoveErrorDialog(dialog);
      expect(store.getState().moveErrorDialog).toEqual(dialog);
    });

    /**
     * Tests clearing error dialog
     */
    it("should clear move error dialog with null", () => {
      store.getState().setMoveErrorDialog({
        isOpen: true,
        wdlBefore: 500,
      });

      store.getState().setMoveErrorDialog(null);
      expect(store.getState().moveErrorDialog).toBeNull();
    });

    /**
     * Tests partial error dialog data
     */
    it("should handle partial dialog data", () => {
      const dialog = {
        isOpen: true,
        // No WDL or best move
      };

      store.getState().setMoveErrorDialog(dialog);

      const state = store.getState();
      expect(state.moveErrorDialog?.isOpen).toBe(true);
      expect(state.moveErrorDialog?.wdlBefore).toBeUndefined();
      expect(state.moveErrorDialog?.wdlAfter).toBeUndefined();
      expect(state.moveErrorDialog?.bestMove).toBeUndefined();
    });
  });

  describe("resetTraining", () => {
    /**
     * Tests complete state reset
     */
    it("should reset all state to initial values", () => {
      // Modify all state
      store.getState().setPosition(mockPosition);
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);
      store.getState().setNavigationLoading(true);
      store.getState().setNavigationError("Error");
      store.getState().setChapterProgress({ completed: 5, total: 10 });
      store.getState().setPlayerTurn(false);
      store.getState().useHint();
      store.getState().incrementMistake();
      store.getState().setMoveErrorDialog({ isOpen: true });

      // Reset
      store.getState().resetTraining();

      // Verify reset by checking individual fields
      const state = store.getState();
      const initialState = createInitialTrainingState();

      expect(state.currentPosition).toBe(initialState.currentPosition);
      expect(state.nextPosition).toBe(initialState.nextPosition);
      expect(state.previousPosition).toBe(initialState.previousPosition);
      expect(state.isLoadingNavigation).toBe(initialState.isLoadingNavigation);
      expect(state.navigationError).toBe(initialState.navigationError);
      expect(state.chapterProgress).toBe(initialState.chapterProgress);
      expect(state.isPlayerTurn).toBe(initialState.isPlayerTurn);
      expect(state.isSuccess).toBe(initialState.isSuccess);
      expect(state.sessionStartTime).toBe(initialState.sessionStartTime);
      expect(state.sessionEndTime).toBe(initialState.sessionEndTime);
      expect(state.hintsUsed).toBe(initialState.hintsUsed);
      expect(state.mistakeCount).toBe(initialState.mistakeCount);
      expect(state.moveErrorDialog).toBe(initialState.moveErrorDialog);
    });
  });

  describe("Selectors", () => {
    beforeEach(() => {
      store.getState().setPosition(mockPosition);
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);
    });

    /**
     * Tests basic state selectors
     */
    it("should select correct state values", () => {
      const state = store.getState();

      expect(trainingSelectors.selectCurrentPosition(state)).toBe(mockPosition);
      expect(trainingSelectors.selectNextPosition(state)).toBe(
        mockNextPosition,
      );
      expect(trainingSelectors.selectPreviousPosition(state)).toBe(
        mockPrevPosition,
      );
      expect(trainingSelectors.selectIsLoadingNavigation(state)).toBe(false);
      expect(trainingSelectors.selectNavigationError(state)).toBeNull();
      expect(trainingSelectors.selectChapterProgress(state)).toBeNull();
      expect(trainingSelectors.selectIsPlayerTurn(state)).toBe(true);
      expect(trainingSelectors.selectIsSuccess(state)).toBe(false);
      expect(trainingSelectors.selectHintsUsed(state)).toBe(0);
      expect(trainingSelectors.selectMistakeCount(state)).toBe(0);
      expect(trainingSelectors.selectMoveErrorDialog(state)).toBeNull();
    });

    /**
     * Tests navigation availability selectors
     */
    it("should correctly determine navigation availability", () => {
      const state1 = store.getState();
      expect(trainingSelectors.selectCanNavigateNext(state1)).toBe(true);
      expect(trainingSelectors.selectCanNavigatePrevious(state1)).toBe(true);

      // Clear navigation
      store.getState().setNavigationPositions(null, null);
      const state2 = store.getState();
      expect(trainingSelectors.selectCanNavigateNext(state2)).toBe(false);
      expect(trainingSelectors.selectCanNavigatePrevious(state2)).toBe(false);

      // Undefined navigation
      store.getState().setNavigationPositions(undefined, undefined);
      const state3 = store.getState();
      expect(trainingSelectors.selectCanNavigateNext(state3)).toBe(false);
      expect(trainingSelectors.selectCanNavigatePrevious(state3)).toBe(false);
    });

    /**
     * Tests training active selector
     */
    it("should detect active training session", () => {
      // Before setting position
      const state1 = createTestStore().getState();
      expect(trainingSelectors.selectIsTrainingActive(state1)).toBe(false);

      // After setting position (session started)
      const state2 = store.getState();
      expect(trainingSelectors.selectIsTrainingActive(state2)).toBe(true);

      // After completion
      store.getState().completeTraining(true);
      const state3 = store.getState();
      expect(trainingSelectors.selectIsTrainingActive(state3)).toBe(false);
    });

    /**
     * Tests session duration selector
     */
    it("should calculate session duration", () => {
      // No session started
      const emptyStore = createTestStore();
      expect(
        trainingSelectors.selectSessionDuration(emptyStore.getState()),
      ).toBeNull();

      // Session in progress
      const startTime = store.getState().sessionStartTime!;
      const mockNow = startTime + 5000;
      jest.spyOn(Date, "now").mockReturnValue(mockNow);

      expect(trainingSelectors.selectSessionDuration(store.getState())).toBe(
        5000,
      );

      // Session completed
      store.getState().completeTraining(true);
      const endTime = store.getState().sessionEndTime!;
      const duration = endTime - startTime;

      expect(trainingSelectors.selectSessionDuration(store.getState())).toBe(
        duration,
      );
    });

    /**
     * Tests accuracy calculation
     */
    it("should calculate accuracy based on mistakes and hints", () => {
      const state1 = store.getState();
      expect(trainingSelectors.selectAccuracy(state1)).toBe(100);

      // One mistake = -10%
      store.getState().incrementMistake();
      const state2 = store.getState();
      expect(trainingSelectors.selectAccuracy(state2)).toBe(90);

      // One hint = -5%
      store.getState().useHint();
      const state3 = store.getState();
      expect(trainingSelectors.selectAccuracy(state3)).toBe(85);

      // Multiple mistakes and hints
      store.getState().incrementMistake();
      store.getState().incrementMistake();
      store.getState().useHint();
      const state4 = store.getState();
      // 3 mistakes (-30%) + 2 hints (-10%) = 60%
      expect(trainingSelectors.selectAccuracy(state4)).toBe(60);

      // Floor at 0%
      for (let i = 0; i < 10; i++) {
        store.getState().incrementMistake();
      }
      const state5 = store.getState();
      expect(trainingSelectors.selectAccuracy(state5)).toBe(0);
    });
  });

  describe("Integration Scenarios", () => {
    /**
     * Tests typical training session flow
     */
    it("should handle typical training session flow", () => {
      // Start training
      store.getState().setPosition(mockPosition);
      store.getState().setNavigationPositions(mockNextPosition, null);
      store.getState().setChapterProgress({ completed: 0, total: 3 });

      // Make some moves (with mistakes and hints)
      store.getState().incrementMistake();
      store.getState().setMoveErrorDialog({
        isOpen: true,
        wdlBefore: 1000,
        wdlAfter: 500,
        bestMove: "Ra7",
      });

      // Use a hint
      store.getState().useHint();

      // Close error dialog
      store.getState().setMoveErrorDialog(null);

      // Complete training
      store.getState().completeTraining(true);

      // Verify final state
      const state = store.getState();
      expect(state.isSuccess).toBe(true);
      expect(state.mistakeCount).toBe(1);
      expect(state.hintsUsed).toBe(1);
      expect(trainingSelectors.selectAccuracy(state)).toBe(85);
    });

    /**
     * Tests navigation between positions
     */
    it("should handle position navigation", () => {
      // Set up initial position with navigation
      store.getState().setPosition(mockPosition);
      store
        .getState()
        .setNavigationPositions(mockNextPosition, mockPrevPosition);

      // Simulate navigation request
      store.getState().setNavigationLoading(true);

      // Navigate to next position
      store.getState().setPosition(mockNextPosition);
      store.getState().setNavigationPositions(null, mockPosition); // Current becomes previous
      store.getState().setNavigationLoading(false);
      store.getState().setChapterProgress({ completed: 2, total: 3 });

      // Verify state
      const state = store.getState();
      expect(state.currentPosition).toBe(mockNextPosition);
      expect(state.previousPosition).toBe(mockPosition);
      expect(state.nextPosition).toBeNull();
      expect(state.hintsUsed).toBe(0); // Reset for new position
      expect(state.mistakeCount).toBe(0); // Reset for new position
    });
  });
});
