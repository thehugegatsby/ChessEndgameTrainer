/**
 * @file Unit tests for Progress state slice
 * @module tests/store/slices/progressSlice
 * @description Comprehensive test suite for the progress slice including statistics,
 * achievements, spaced repetition, and progress tracking functionality.
 */

import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import {
  createProgressSlice,
  progressSelectors,
  createInitialProgressState,
} from "@shared/store/slices/progressSlice";
import type { Achievement } from "@shared/store/types";
import type { ProgressSlice } from "@shared/store/slices/types";
import type { PositionProgress, DailyStats } from "@shared/store/types";

/**
 * Creates a test store instance with only the progress slice
 * @returns Store instance with getState and setState methods
 */
const createTestStore = () => {
  return createStore<ProgressSlice>()(
    immer((set, get, store) =>
      createProgressSlice(set as any, get as any, store as any),
    ),
  );
};

/**
 * Mock position progress data for testing
 */
const mockPositionProgress: PositionProgress = {
  positionId: 1,
  completed: true,
  attempts: 3,
  bestTime: 45000,
  lastAttempt: Date.now() - 86400000, // 1 day ago
  accuracy: 95,
  hintsUsed: 1,
  mistakesMade: 2,
  reviewInterval: 3,
  nextReview: Date.now() + 86400000, // 1 day from now
  lastReview: Date.now() - 86400000,
  success: true,
  difficulty: 1,
};

const mockDailyStats: DailyStats = {
  date: Date.now() - 86400000, // Yesterday
  positionsCompleted: 5,
  totalTime: 1800000, // 30 minutes
  hintsUsed: 3,
  mistakesMade: 8,
  averageAccuracy: 87,
};

const mockAchievement: Achievement = {
  id: "first_completion",
  name: "First Steps",
  description: "Complete your first position",
  category: "completion",
  icon: "star",
  points: 10,
  unlocked: false,
  progress: 0,
  maxProgress: 1,
  rarity: "common",
};

const mockUnlockedAchievement: Achievement = {
  ...mockAchievement,
  id: "streak_7",
  name: "Week Warrior",
  description: "Maintain a 7-day streak",
  category: "streak",
  points: 25,
  unlocked: true,
  unlockedAt: Date.now() - 3600000, // 1 hour ago
  progress: 1,
  maxProgress: 1,
  rarity: "rare",
};

describe("ProgressSlice", () => {
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
      const expectedState = createInitialProgressState();

      expect(state.positionProgress).toEqual(expectedState.positionProgress);
      expect(state.dailyStats).toEqual(expectedState.dailyStats);
      expect(state.achievements).toEqual(expectedState.achievements);
      expect(state.favoritePositions).toEqual(expectedState.favoritePositions);
      expect(state.totalPoints).toBe(expectedState.totalPoints);
      expect(state.currentStreak).toBe(expectedState.currentStreak);
      expect(state.longestStreak).toBe(expectedState.longestStreak);
      expect(state.lastActivityDate).toBe(expectedState.lastActivityDate);
      expect(state.weeklyGoals).toEqual(expectedState.weeklyGoals);
      expect(state.monthlyStats).toEqual(expectedState.monthlyStats);
    });

    /**
     * Tests the initial state factory function
     */
    it("should create fresh initial state on each call", () => {
      const state1 = createInitialProgressState();
      const state2 = createInitialProgressState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.positionProgress).not.toBe(state2.positionProgress);
      expect(state1.dailyStats).not.toBe(state2.dailyStats);
    });
  });

  describe("updatePositionProgress", () => {
    /**
     * Tests updating position progress
     */
    it("should update position progress", () => {
      const update: Partial<PositionProgress> = {
        completed: true,
        attempts: 2,
        bestTime: 60000,
        accuracy: 90,
      };

      store.getState().updatePositionProgress(123, update);

      const state = store.getState();
      const progress = state.positionProgress[123];

      expect(progress.positionId).toBe(123);
      expect(progress.completed).toBe(true);
      expect(progress.attempts).toBe(2);
      expect(progress.bestTime).toBe(60000);
      expect(progress.accuracy).toBe(90);
    });

    /**
     * Tests merging with existing progress
     */
    it("should merge with existing position progress", () => {
      // Set initial progress
      store.getState().updatePositionProgress(123, {
        completed: false,
        attempts: 1,
        bestTime: 90000,
      });

      // Update with new data
      store.getState().updatePositionProgress(123, {
        completed: true,
        attempts: 2,
        accuracy: 85,
      });

      const state = store.getState();
      const progress = state.positionProgress[123];

      expect(progress.completed).toBe(true);
      expect(progress.attempts).toBe(2);
      expect(progress.bestTime).toBe(90000); // Preserved from first update
      expect(progress.accuracy).toBe(85);
    });

    /**
     * Tests default field handling
     */
    it("should provide defaults for required fields", () => {
      store.getState().updatePositionProgress(123, { accuracy: 95 });

      const progress = store.getState().positionProgress[123];
      expect(progress.positionId).toBe(123);
      expect(progress.attempts).toBe(0);
      expect(progress.completed).toBe(false);
      expect(progress.accuracy).toBe(95);
    });
  });

  describe("addDailyStats", () => {
    /**
     * Tests adding daily statistics
     */
    it("should add daily statistics", () => {
      const stats: Partial<DailyStats> = {
        positionsCompleted: 5,
        totalTime: 1800000,
        hintsUsed: 2,
        mistakesMade: 6,
        averageAccuracy: 88,
      };

      store.getState().addDailyStats(stats);

      const state = store.getState();
      expect(state.dailyStats).toHaveLength(1);

      const dailyStat = state.dailyStats[0];
      expect(dailyStat.positionsCompleted).toBe(5);
      expect(dailyStat.totalTime).toBe(1800000);
      expect(dailyStat.hintsUsed).toBe(2);
      expect(dailyStat.mistakesMade).toBe(6);
      expect(dailyStat.averageAccuracy).toBe(88);

      // Check date is normalized to start of day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(dailyStat.date).toBe(today.getTime());
    });

    /**
     * Tests updating existing daily stats
     */
    it("should update existing daily statistics for the same day", () => {
      // Add initial stats
      store.getState().addDailyStats({
        positionsCompleted: 3,
        totalTime: 900000,
      });

      // Update stats for the same day
      store.getState().addDailyStats({
        positionsCompleted: 7,
        hintsUsed: 2,
      });

      const state = store.getState();
      expect(state.dailyStats).toHaveLength(1);

      const dailyStat = state.dailyStats[0];
      expect(dailyStat.positionsCompleted).toBe(7);
      expect(dailyStat.totalTime).toBe(900000); // Preserved
      expect(dailyStat.hintsUsed).toBe(2);
    });

    /**
     * Tests default values for daily stats
     */
    it("should provide defaults for missing fields", () => {
      store.getState().addDailyStats({
        positionsCompleted: 3,
      });

      const dailyStat = store.getState().dailyStats[0];
      expect(dailyStat.totalTime).toBe(0);
      expect(dailyStat.hintsUsed).toBe(0);
      expect(dailyStat.mistakesMade).toBe(0);
      expect(dailyStat.averageAccuracy).toBe(0);
    });
  });

  describe("Achievement System", () => {
    beforeEach(() => {
      // Initialize with test achievements
      store
        .getState()
        .initializeAchievements([mockAchievement, mockUnlockedAchievement]);
    });

    /**
     * Tests achievement initialization
     */
    it("should initialize achievements", () => {
      const state = store.getState();
      expect(state.achievements).toHaveLength(2);
      expect(state.achievements[0]).toEqual(mockAchievement);
      expect(state.achievements[1]).toEqual(mockUnlockedAchievement);
    });

    /**
     * Tests unlocking achievements
     */
    it("should unlock achievement and award points", () => {
      const initialPoints = store.getState().totalPoints;

      store.getState().unlockAchievement("first_completion");

      const state = store.getState();
      const achievement = state.achievements.find(
        (a) => a.id === "first_completion",
      );

      expect(achievement?.unlocked).toBe(true);
      expect(achievement?.progress).toBe(1);
      expect(achievement?.unlockedAt).toBeDefined();
      expect(state.totalPoints).toBe(initialPoints + mockAchievement.points);
    });

    /**
     * Tests unlocking already unlocked achievement
     */
    it("should not unlock already unlocked achievement", () => {
      const initialState = store.getState();
      const initialPoints = initialState.totalPoints;

      store.getState().unlockAchievement("streak_7"); // Already unlocked

      const state = store.getState();
      expect(state.totalPoints).toBe(initialPoints); // No change
    });

    /**
     * Tests unlocking non-existent achievement
     */
    it("should handle non-existent achievement gracefully", () => {
      const initialState = store.getState();

      store.getState().unlockAchievement("nonexistent");

      const state = store.getState();
      expect(state).toEqual(initialState); // No change
    });
  });

  describe("Favorite Positions", () => {
    /**
     * Tests adding favorite position
     */
    it("should add position to favorites", () => {
      store.getState().toggleFavorite(123);

      const state = store.getState();
      expect(state.favoritePositions).toContain(123);
    });

    /**
     * Tests removing favorite position
     */
    it("should remove position from favorites", () => {
      // Add to favorites first
      store.getState().toggleFavorite(123);
      expect(store.getState().favoritePositions).toContain(123);

      // Remove from favorites
      store.getState().toggleFavorite(123);
      expect(store.getState().favoritePositions).not.toContain(123);
    });

    /**
     * Tests multiple favorites
     */
    it("should handle multiple favorite positions", () => {
      store.getState().toggleFavorite(123);
      store.getState().toggleFavorite(456);
      store.getState().toggleFavorite(789);

      const state = store.getState();
      expect(state.favoritePositions).toHaveLength(3);
      expect(state.favoritePositions).toEqual(
        expect.arrayContaining([123, 456, 789]),
      );
    });
  });

  describe("Spaced Repetition", () => {
    /**
     * Tests successful review scheduling
     */
    it("should calculate next review after success", () => {
      const beforeTime = Date.now();
      store.getState().calculateNextReview(123, true);
      const afterTime = Date.now();

      const progress = store.getState().positionProgress[123];
      expect(progress.reviewInterval).toBe(3); // First success = 3 days
      expect(progress.nextReview).toBeGreaterThan(
        beforeTime + 2 * 24 * 60 * 60 * 1000,
      );
      expect(progress.nextReview).toBeLessThan(
        afterTime + 4 * 24 * 60 * 60 * 1000,
      );
      expect(progress.lastReview).toBeGreaterThanOrEqual(beforeTime);
      expect(progress.lastReview).toBeLessThanOrEqual(afterTime);
      expect(progress.attempts).toBe(1);
      expect(progress.completed).toBe(true);
    });

    /**
     * Tests failed review scheduling
     */
    it("should calculate next review after failure", () => {
      store.getState().calculateNextReview(123, false);

      const progress = store.getState().positionProgress[123];
      expect(progress.reviewInterval).toBe(1); // Failed = 1 day
      expect(progress.completed).toBe(false);
    });

    /**
     * Tests interval progression on repeated success
     */
    it("should increase interval on repeated success", () => {
      // First success
      store.getState().calculateNextReview(123, true);
      expect(store.getState().positionProgress[123].reviewInterval).toBe(3);

      // Second success
      store.getState().calculateNextReview(123, true);
      expect(store.getState().positionProgress[123].reviewInterval).toBe(7.5);

      // Third success
      store.getState().calculateNextReview(123, true);
      expect(store.getState().positionProgress[123].reviewInterval).toBe(18.75);
    });

    /**
     * Tests maximum interval cap
     */
    it("should cap interval at 30 days", () => {
      // Set up position with high interval
      store.getState().updatePositionProgress(123, {
        reviewInterval: 20,
        attempts: 5,
      });

      store.getState().calculateNextReview(123, true);

      const progress = store.getState().positionProgress[123];
      expect(progress.reviewInterval).toBe(30); // Capped at 30
    });

    /**
     * Tests interval reduction on failure
     */
    it("should reduce interval on failure after multiple attempts", () => {
      // Set up position with established interval
      store.getState().updatePositionProgress(123, {
        reviewInterval: 10,
        attempts: 3,
      });

      store.getState().calculateNextReview(123, false);

      const progress = store.getState().positionProgress[123];
      expect(progress.reviewInterval).toBe(5); // Halved
    });
  });

  describe("Goals and Statistics", () => {
    /**
     * Tests weekly goal updates
     */
    it("should update weekly goals", () => {
      store.getState().updateWeeklyGoals(7, 15);

      const state = store.getState();
      expect(state.weeklyGoals.completed).toBe(7);
      expect(state.weeklyGoals.target).toBe(15);
      expect(state.weeklyGoals.weekStart).toBeDefined();
    });

    /**
     * Tests weekly goal progress without changing target
     */
    it("should update progress without changing target", () => {
      // Set initial target
      store.getState().updateWeeklyGoals(0, 10);
      const initialTarget = store.getState().weeklyGoals.target;

      // Update progress only
      store.getState().updateWeeklyGoals(5);

      const state = store.getState();
      expect(state.weeklyGoals.completed).toBe(5);
      expect(state.weeklyGoals.target).toBe(initialTarget);
    });

    /**
     * Tests monthly statistics updates
     */
    it("should update monthly statistics", () => {
      const stats = {
        positionsCompleted: 45,
        totalTime: 72000000,
        averageAccuracy: 89,
        hintsUsed: 15,
        mistakesMade: 67,
      };

      store.getState().updateMonthlyStats(stats);

      const state = store.getState();
      expect(state.monthlyStats.positionsCompleted).toBe(45);
      expect(state.monthlyStats.totalTime).toBe(72000000);
      expect(state.monthlyStats.averageAccuracy).toBe(89);
      expect(state.monthlyStats.hintsUsed).toBe(15);
      expect(state.monthlyStats.mistakesMade).toBe(67);
      expect(state.monthlyStats.monthStart).toBeDefined();
    });

    /**
     * Tests streak updates
     */
    it("should update streak counters", () => {
      const now = Date.now();

      store.getState().updateStreak(7, now);

      const state = store.getState();
      expect(state.currentStreak).toBe(7);
      expect(state.longestStreak).toBe(7);
      expect(state.lastActivityDate).toBe(now);
    });

    /**
     * Tests longest streak tracking
     */
    it("should track longest streak correctly", () => {
      // Set initial streak
      store.getState().updateStreak(5);
      expect(store.getState().longestStreak).toBe(5);

      // Higher streak
      store.getState().updateStreak(10);
      expect(store.getState().longestStreak).toBe(10);

      // Lower streak (longest should remain)
      store.getState().updateStreak(3);
      expect(store.getState().currentStreak).toBe(3);
      expect(store.getState().longestStreak).toBe(10);
    });
  });

  describe("resetProgress", () => {
    /**
     * Tests complete progress reset
     */
    it("should reset all progress to initial state", () => {
      // Modify all state
      store.getState().updatePositionProgress(123, mockPositionProgress);
      store.getState().addDailyStats(mockDailyStats);
      store.getState().initializeAchievements([mockAchievement]);
      store.getState().toggleFavorite(456);
      store.getState().updateStreak(5);

      // Reset
      store.getState().resetProgress();

      // Verify reset
      const state = store.getState();
      const initialState = createInitialProgressState();

      expect(state.positionProgress).toEqual(initialState.positionProgress);
      expect(state.dailyStats).toEqual(initialState.dailyStats);
      expect(state.achievements).toEqual(initialState.achievements);
      expect(state.favoritePositions).toEqual(initialState.favoritePositions);
      expect(state.totalPoints).toBe(initialState.totalPoints);
      expect(state.currentStreak).toBe(initialState.currentStreak);
      expect(state.longestStreak).toBe(initialState.longestStreak);
    });
  });

  describe("Selectors", () => {
    beforeEach(() => {
      // Set up test data
      store.getState().updatePositionProgress(123, {
        completed: true,
        accuracy: 90,
        attempts: 2,
      });
      store.getState().updatePositionProgress(456, {
        completed: true,
        accuracy: 85,
        attempts: 3,
      });
      store.getState().updatePositionProgress(789, {
        completed: false,
        accuracy: 70,
        attempts: 1,
      });

      store.getState().addDailyStats({
        positionsCompleted: 5,
        totalTime: 1800000,
        averageAccuracy: 88,
      });

      store.getState().toggleFavorite(123);
      store.getState().toggleFavorite(456);

      store.getState().updateWeeklyGoals(7, 10);

      const achievements = [
        mockAchievement,
        { ...mockUnlockedAchievement, unlocked: false }, // Reset to not unlocked
      ];
      store.getState().initializeAchievements(achievements);
      // Unlock achievement to award points
      store.getState().unlockAchievement("streak_7");
    });

    /**
     * Tests basic state selectors
     */
    it("should select correct state values", () => {
      const state = store.getState();

      expect(
        progressSelectors.selectPositionProgress(123)(state),
      ).toBeDefined();
      expect(progressSelectors.selectAllPositionProgress(state)).toBeDefined();
      expect(progressSelectors.selectDailyStats(state)).toHaveLength(1);
      expect(progressSelectors.selectAchievements(state)).toHaveLength(2);
      expect(progressSelectors.selectFavoritePositions(state)).toEqual([
        123, 456,
      ]);
      expect(progressSelectors.selectTotalPoints(state)).toBe(25); // From unlocked achievement
      expect(progressSelectors.selectCurrentStreak(state)).toBe(0);
      expect(progressSelectors.selectLongestStreak(state)).toBe(0);
      expect(progressSelectors.selectWeeklyGoals(state)).toEqual({
        target: 10,
        completed: 7,
        weekStart: expect.any(Number),
      });
    });

    /**
     * Tests computed selectors
     */
    it("should calculate computed values correctly", () => {
      const state = store.getState();

      // Total completed positions
      expect(progressSelectors.selectTotalPositionsCompleted(state)).toBe(2);

      // Overall accuracy (average of completed positions)
      expect(progressSelectors.selectOverallAccuracy(state)).toBe(88); // (90 + 85) / 2 = 87.5 → 88

      // Weekly progress percentage
      expect(progressSelectors.selectWeeklyProgress(state)).toBe(70); // 7/10 * 100 = 70

      // Unlocked achievements
      const unlockedAchievements =
        progressSelectors.selectUnlockedAchievements(state);
      expect(unlockedAchievements).toHaveLength(1);
      expect(unlockedAchievements[0].id).toBe("streak_7");
    });

    /**
     * Tests achievement progress by category
     */
    it("should calculate achievement progress by category", () => {
      const state = store.getState();
      const categoryProgress =
        progressSelectors.selectAchievementProgressByCategory(state);

      expect(categoryProgress.completion).toEqual({ unlocked: 0, total: 1 });
      expect(categoryProgress.streak).toEqual({ unlocked: 1, total: 1 });
    });

    /**
     * Tests positions due for review
     */
    it("should select positions due for review", () => {
      // Set up position due for review
      const pastTime = Date.now() - 86400000; // 1 day ago
      store.getState().updatePositionProgress(999, {
        nextReview: pastTime,
      });

      const state = store.getState();
      const duePositions = progressSelectors.selectPositionsDueForReview(state);

      expect(duePositions).toContain(999);
    });

    /**
     * Tests recent activity selector
     */
    it("should select recent activity", () => {
      // Add current day stats using the regular store
      const state = store.getState();

      // Test recent activity selector - it should only return last 7 days
      const recentActivity = progressSelectors.selectRecentActivity(state);

      expect(recentActivity).toHaveLength(1); // Only today's stats
      expect(recentActivity[0].positionsCompleted).toBe(5);
    });

    /**
     * Tests edge cases for computed selectors
     */
    it("should handle edge cases in computed selectors", () => {
      // Test with empty state
      const emptyStore = createTestStore();
      const emptyState = emptyStore.getState();

      expect(progressSelectors.selectTotalPositionsCompleted(emptyState)).toBe(
        0,
      );
      expect(progressSelectors.selectOverallAccuracy(emptyState)).toBe(0);
      expect(progressSelectors.selectWeeklyProgress(emptyState)).toBe(0);
      expect(progressSelectors.selectPositionsDueForReview(emptyState)).toEqual(
        [],
      );
      expect(progressSelectors.selectRecentActivity(emptyState)).toEqual([]);
    });
  });

  describe("Integration Scenarios", () => {
    /**
     * Tests typical progress tracking flow
     */
    it("should handle typical progress tracking flow", () => {
      // Initialize achievements
      store.getState().initializeAchievements([
        {
          ...mockAchievement,
          id: "first_completion",
        },
        {
          ...mockAchievement,
          id: "accuracy_master",
          name: "Accuracy Master",
          description: "Achieve 95% accuracy",
          category: "performance",
          points: 20,
        },
      ]);

      // Complete first position
      store.getState().updatePositionProgress(123, {
        completed: true,
        attempts: 1,
        accuracy: 98,
        bestTime: 30000,
        success: true,
      });

      // Schedule next review
      store.getState().calculateNextReview(123, true);

      // Add to favorites
      store.getState().toggleFavorite(123);

      // Update daily stats
      store.getState().addDailyStats({
        positionsCompleted: 1,
        totalTime: 30000,
        averageAccuracy: 98,
      });

      // Unlock achievements
      store.getState().unlockAchievement("first_completion");
      store.getState().unlockAchievement("accuracy_master");

      // Update goals
      store.getState().updateWeeklyGoals(1, 5);

      // Verify final state
      const state = store.getState();
      expect(progressSelectors.selectTotalPositionsCompleted(state)).toBe(1);
      expect(progressSelectors.selectOverallAccuracy(state)).toBe(98);
      expect(progressSelectors.selectUnlockedAchievements(state)).toHaveLength(
        2,
      );
      expect(state.totalPoints).toBe(30); // 10 + 20
      expect(state.favoritePositions).toContain(123);
      expect(state.dailyStats).toHaveLength(1);
      expect(progressSelectors.selectWeeklyProgress(state)).toBe(20); // 1/5 * 100
    });

    /**
     * Tests spaced repetition learning cycle
     */
    it("should handle spaced repetition learning cycle", () => {
      const positionId = 456;

      // First attempt (success)
      store.getState().calculateNextReview(positionId, true);
      let progress = store.getState().positionProgress[positionId];
      expect(progress.reviewInterval).toBe(3);
      expect(progress.completed).toBe(true);

      // Second attempt (success) - interval should increase
      store.getState().calculateNextReview(positionId, true);
      progress = store.getState().positionProgress[positionId];
      expect(progress.reviewInterval).toBe(7.5);
      expect(progress.attempts).toBe(2);

      // Third attempt (failure) - interval should decrease
      store.getState().calculateNextReview(positionId, false);
      progress = store.getState().positionProgress[positionId];
      expect(progress.reviewInterval).toBe(3.75); // 7.5 / 2
      expect(progress.completed).toBe(true); // Stays true from previous success
      expect(progress.attempts).toBe(3);
    });
  });
});
