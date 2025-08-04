/**
 * @file Progress state slice for Zustand store
 * @module store/slices/progressSlice
 * @description Manages user progress tracking including statistics, achievements,
 * position completion data, spaced repetition scheduling, and performance analytics.
 * This slice handles the long-term learning progress and gamification features.
 *
 * @example
 * ```typescript
 * // Using the progress slice in a component
 * import { useStore } from '@/store';
 * import { progressSelectors } from '@/store/slices/progressSlice';
 *
 * function ProgressDashboard() {
 *   const totalCompleted = useStore(progressSelectors.selectTotalPositionsCompleted);
 *   const achievements = useStore(progressSelectors.selectUnlockedAchievements);
 *   const streak = useStore(progressSelectors.selectCurrentStreak);
 *   const updateProgress = useStore(state => state.updatePositionProgress);
 *
 *   const handleComplete = (positionId: number, success: boolean) => {
 *     updateProgress(positionId, {
 *       completed: true,
 *       lastAttempt: Date.now(),
 *       success
 *     });
 *   };
 * }
 * ```
 */

import { ImmerStateCreator, ProgressSlice } from "./types";
import type { 
  PositionProgress, 
  DailyStats,
  Achievement as GlobalAchievement 
} from "@shared/store/types";


/**
 * Creates the initial progress state with default values
 *
 * @returns {Object} Initial progress state
 * @returns {Record<number, PositionProgress>} returns.positionProgress - Position completion data
 * @returns {DailyStats[]} returns.dailyStats - Daily statistics array
 * @returns {Achievement[]} returns.achievements - Achievement definitions and status
 * @returns {number[]} returns.favoritePositions - User-favorited position IDs
 * @returns {number} returns.totalPoints - Total achievement points earned
 * @returns {number} returns.currentStreak - Current consecutive day streak
 * @returns {number} returns.longestStreak - Best ever streak
 * @returns {number|undefined} returns.lastActivityDate - Last activity timestamp
 * @returns {Object} returns.weeklyGoals - Weekly goal tracking
 * @returns {Object} returns.monthlyStats - Monthly aggregated statistics
 *
 * @example
 * ```typescript
 * const initialState = createInitialProgressState();
 * console.log(initialState.currentStreak); // 0
 * console.log(initialState.achievements.length); // 0 (will be populated by achievements service)
 * console.log(initialState.positionProgress); // {}
 * ```
 */
export const createInitialProgressState = () => ({
  // Position-specific progress tracking
  positionProgress: {} as Record<number, PositionProgress>,

  // Statistics and analytics
  dailyStats: [] as DailyStats[],

  // Achievement system
  achievements: [] as GlobalAchievement[],
  favoritePositions: [] as number[],
  totalPoints: 0,

  // Streak tracking
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: undefined as number | undefined,

  // Goal tracking
  weeklyGoals: {
    target: 10, // Target positions per week
    completed: 0, // Completed this week
    weekStart: 0, // Week start timestamp
  },

  // Monthly aggregated statistics
  monthlyStats: {
    positionsCompleted: 0,
    totalTime: 0, // Total training time in milliseconds
    averageAccuracy: 0, // Average accuracy percentage
    hintsUsed: 0, // Total hints used
    mistakesMade: 0, // Total mistakes made
    monthStart: 0, // Month start timestamp
  },

  // Missing properties from ProgressState interface
  totalSolvedPositions: 0,
  averageAccuracy: 0,
});

/**
 * Creates the progress slice for the Zustand store
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {ProgressSlice} Complete progress slice with state and actions
 *
 * @remarks
 * This slice manages long-term user progress and learning analytics.
 * It tracks position completion, maintains statistics, handles achievements,
 * and provides spaced repetition scheduling. The slice is designed to work
 * with external services for achievement calculation and goal management.
 *
 * Key concepts:
 * - positionProgress: Per-position learning data with spaced repetition
 * - achievements: Gamification system with categories and rarities
 * - streaks: Daily engagement tracking
 * - goals: Weekly and monthly target setting
 *
 * @example
 * ```typescript
 * // In your root store
 * import { create } from 'zustand';
 * import { createProgressSlice } from './slices/progressSlice';
 *
 * const useStore = create<RootState>()((...args) => ({
 *   ...createProgressSlice(...args),
 *   ...createTrainingSlice(...args),
 *   // ... other slices
 * }));
 * ```
 */
export const createProgressSlice: ImmerStateCreator<ProgressSlice> = (set, _get) => ({
  // Initial state
  ...createInitialProgressState(),

  // Actions
  /**
   * Updates progress for a specific position
   *
   * @param {number} positionId - The position ID to update
   * @param {Partial<PositionProgress>} update - Progress data to merge
   *
   * @fires stateChange - When position progress is updated
   *
   * @remarks
   * This is the primary method for recording learning progress on individual
   * positions. It merges the update with existing progress data and handles
   * spaced repetition scheduling. The method should be called after each
   * training session completion.
   *
   * @example
   * ```typescript
   * // Record successful completion
   * store.getState().updatePositionProgress(123, {
   *   completed: true,
   *   lastAttempt: Date.now(),
   *   attempts: 3,
   *   bestTime: 45000,
   *   accuracy: 95,
   *   success: true
   * });
   *
   * // Record failed attempt
   * store.getState().updatePositionProgress(123, {
   *   lastAttempt: Date.now(),
   *   attempts: 2,
   *   success: false
   * });
   * ```
   */
  updatePositionProgress: (
    positionId: number,
    update: Partial<PositionProgress>,
  ) => {
    set((state) => ({
      positionProgress: {
        ...state.positionProgress,
        [positionId]: {
          // Start with defaults
          ...(state.positionProgress[positionId] || {
            positionId,
            attempts: 0,
            completed: false,
            accuracy: 0,
            bestTime: undefined,
            lastAttempt: undefined,
            nextReview: undefined,
            difficulty: 1,
          }),
          // Apply update
          ...update,
        },
      },
    }));
  },

  /**
   * Adds daily statistics entry
   *
   * @param {Partial<DailyStats>} stats - Statistics data for the day
   *
   * @fires stateChange - When daily stats are updated
   *
   * @remarks
   * Records daily training statistics for analytics and progress tracking.
   * The system automatically handles date normalization and prevents
   * duplicate entries for the same day. This data is used for streaks,
   * weekly goals, and monthly aggregations.
   *
   * @example
   * ```typescript
   * // Add today's training stats
   * store.getState().addDailyStats({
   *   positionsCompleted: 5,
   *   totalTime: 1800000, // 30 minutes
   *   hintsUsed: 2,
   *   mistakesMade: 8,
   *   averageAccuracy: 87
   * });
   * ```
   */
  addDailyStats: (stats: Partial<DailyStats>) => {
    set((state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      // Check if we already have stats for today
      const existingIndex = state.dailyStats.findIndex(
        (stat: DailyStats) => stat.date === todayTimestamp,
      );

      const newStats: DailyStats = {
        date: todayTimestamp,
        positionsCompleted: 0,
        totalTime: 0,
        hintsUsed: 0,
        mistakesMade: 0,
        averageAccuracy: 0,
        ...stats,
      };

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedStats = [...state.dailyStats];
        updatedStats[existingIndex] = {
          ...updatedStats[existingIndex],
          ...stats, // Use original stats, not newStats with defaults
        };
        return { dailyStats: updatedStats };
      } else {
        // Add new entry
        return {
          dailyStats: [...state.dailyStats, newStats],
        };
      }
    });
  },

  /**
   * Unlocks an achievement and updates points
   *
   * @param {string} achievementId - The achievement ID to unlock
   *
   * @fires stateChange - When achievement is unlocked
   *
   * @remarks
   * Marks an achievement as unlocked and awards points. This method should
   * typically be called by an achievement service that evaluates unlock
   * conditions. The method is idempotent - unlocking the same achievement
   * multiple times has no additional effect.
   *
   * @example
   * ```typescript
   * // Unlock first completion achievement
   * store.getState().unlockAchievement("first_completion");
   *
   * // Achievement service would check conditions and call this
   * const progress = store.getState();
   * if (progress.currentStreak >= 7) {
   *   store.getState().unlockAchievement("seven_day_streak");
   * }
   * ```
   */
  unlockAchievement: (achievementId: string) => {
    set((state) => {
      const achievement = state.achievements.find(
        (a) => a.id === achievementId,
      );
      if (!achievement || achievement.unlocked) {
        return state; // Achievement not found or already unlocked
      }

      const updatedAchievements = state.achievements.map((a) =>
        a.id === achievementId
          ? { ...a, unlocked: true, unlockedAt: Date.now(), progress: 1 }
          : a,
      );

      return {
        achievements: updatedAchievements,
        totalPoints: state.totalPoints + achievement.points,
      };
    });
  },

  /**
   * Toggles favorite status for a position
   *
   * @param {number} positionId - The position ID to toggle
   *
   * @fires stateChange - When favorite status changes
   *
   * @remarks
   * Adds or removes a position from the user's favorites list.
   * Favorited positions can be used for quick access or custom
   * training sessions. The operation is idempotent and safe.
   *
   * @example
   * ```typescript
   * // Add to favorites
   * store.getState().toggleFavorite(123);
   *
   * // Remove from favorites (if already favorited)
   * store.getState().toggleFavorite(123);
   *
   * // Check if favorited
   * const isFavorite = store.getState().favoritePositions.includes(123);
   * ```
   */
  toggleFavorite: (positionId: number) => {
    set((state) => ({
      favoritePositions: state.favoritePositions.includes(positionId)
        ? state.favoritePositions.filter((id) => id !== positionId)
        : [...state.favoritePositions, positionId],
    }));
  },

  /**
   * Calculates next review date using spaced repetition
   *
   * @param {number} positionId - The position ID to schedule
   * @param {boolean} success - Whether the last attempt was successful
   *
   * @fires stateChange - When position progress is updated with next review date
   *
   * @remarks
   * Implements a simple spaced repetition algorithm to determine when
   * a position should be reviewed next. Successful attempts increase
   * the interval, while failures reset or decrease it. This helps
   * optimize learning efficiency.
   *
   * Algorithm:
   * - Success: multiply interval by 2.5 (max 30 days)
   * - Failure: reset to 1 day for new positions, or halve interval
   * - First success: 3 days
   * - Minimum interval: 1 day
   *
   * @example
   * ```typescript
   * // Schedule after successful completion
   * store.getState().calculateNextReview(123, true);
   *
   * // Schedule after failed attempt
   * store.getState().calculateNextReview(123, false);
   *
   * // Check when position is due for review
   * const progress = store.getState().positionProgress[123];
   * const isDue = !progress?.nextReview || Date.now() >= progress.nextReview;
   * ```
   */
  calculateNextReview: (positionId: number, success: boolean) => {
    set((state) => {
      const currentProgress = state.positionProgress[positionId];
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      let nextIntervalDays: number;

      if (success) {
        // Successful attempt - increase interval
        const currentInterval = currentProgress?.reviewInterval || 0;
        if (currentInterval === 0) {
          // First success
          nextIntervalDays = 3;
        } else {
          // Multiply by 2.5, max 30 days
          nextIntervalDays = Math.min(currentInterval * 2.5, 30);
        }
      } else {
        // Failed attempt - reset or decrease interval
        if (!currentProgress || currentProgress.attempts === 0) {
          // New position - start with 1 day
          nextIntervalDays = 1;
        } else {
          // Halve the interval, minimum 1 day
          nextIntervalDays = Math.max(
            (currentProgress.reviewInterval || 1) / 2,
            1,
          );
        }
      }

      const nextReview = now + nextIntervalDays * oneDayMs;

      return {
        positionProgress: {
          ...state.positionProgress,
          [positionId]: {
            // Start with existing progress or defaults
            ...(currentProgress || {
              positionId,
              attempts: 0,
              completed: false,
              accuracy: 0,
              bestTime: undefined,
              lastAttempt: undefined,
              nextReview: undefined,
              difficulty: 1,
            }),
            // Apply updates
            reviewInterval: nextIntervalDays,
            nextReview: nextReview,
            lastReview: now,
            attempts: (currentProgress?.attempts || 0) + 1,
            completed: success ? true : (currentProgress?.completed ?? false),
          },
        },
      };
    });
  },

  /**
   * Updates weekly goal progress
   *
   * @param {number} completed - Number of positions completed this week
   * @param {number} [target] - Optional new target (if changing goal)
   *
   * @fires stateChange - When weekly goals are updated
   *
   * @remarks
   * Tracks progress towards weekly training goals. The system automatically
   * resets weekly progress at the start of each week (Monday). This method
   * can be called to update progress or change the target.
   *
   * @example
   * ```typescript
   * // Update progress
   * store.getState().updateWeeklyGoals(7); // 7 positions completed this week
   *
   * // Change target and update progress
   * store.getState().updateWeeklyGoals(5, 15); // 5 completed, new target 15
   *
   * // Check if goal met
   * const { completed, target } = store.getState().weeklyGoals;
   * const goalMet = completed >= target;
   * ```
   */
  updateWeeklyGoals: (completed: number, target?: number) => {
    set((state) => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      return {
        weeklyGoals: {
          target: target ?? state.weeklyGoals.target,
          completed,
          weekStart: weekStart.getTime(),
        },
      };
    });
  },

  /**
   * Updates monthly statistics
   *
   * @param {Partial<typeof createInitialProgressState()['monthlyStats']>} stats - Monthly stats to update
   *
   * @fires stateChange - When monthly statistics are updated
   *
   * @remarks
   * Updates aggregated monthly statistics for analytics and progress tracking.
   * The system automatically resets monthly stats at the start of each month.
   * This method is typically called by background processes that aggregate
   * daily statistics.
   *
   * @example
   * ```typescript
   * // Update monthly totals
   * store.getState().updateMonthlyStats({
   *   positionsCompleted: 45,
   *   totalTime: 72000000, // 20 hours
   *   averageAccuracy: 89,
   *   hintsUsed: 15,
   *   mistakesMade: 67
   * });
   * ```
   */
  updateMonthlyStats: (
    stats: Partial<typeof createInitialProgressState.prototype.monthlyStats>,
  ) => {
    set((state) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        monthlyStats: {
          ...state.monthlyStats,
          ...stats,
          monthStart: monthStart.getTime(),
        },
      };
    });
  },

  /**
   * Updates streak counters
   *
   * @param {number} newStreak - Current streak count
   * @param {number} [lastActivity] - Last activity timestamp
   *
   * @fires stateChange - When streak data is updated
   *
   * @remarks
   * Updates current and longest streak counters. This method should be
   * called by streak calculation logic that determines consecutive
   * training days. The system tracks both current and personal best streaks.
   *
   * @example
   * ```typescript
   * // Update current streak
   * store.getState().updateStreak(7, Date.now());
   *
   * // Break streak (reset to 0)
   * store.getState().updateStreak(0, Date.now());
   * ```
   */
  updateStreak: (newStreak: number, lastActivity?: number) => {
    set((state) => ({
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastActivityDate: lastActivity ?? state.lastActivityDate,
    }));
  },

  /**
   * Initializes achievements list
   *
   * @param {GlobalAchievement[]} achievements - Array of achievement definitions
   *
   * @fires stateChange - When achievements are initialized
   *
   * @remarks
   * Sets up the complete achievements system with predefined achievements.
   * This method is typically called once during app initialization to
   * load achievement definitions from a service or static data.
   *
   * @example
   * ```typescript
   * // Initialize with predefined achievements
   * const achievements: GlobalAchievement[] = [
   *   {
   *     id: "first_completion",
   *     name: "First Steps",
   *     description: "Complete your first position",
   *     category: "completion",
   *     icon: "star",
   *     points: 10,
   *     unlocked: false,
   *     progress: 0,
   *     maxProgress: 1,
   *     rarity: "common"
   *   },
   *   // ... more achievements
   * ];
   *
   * store.getState().initializeAchievements(achievements);
   * ```
   */
  initializeAchievements: (achievements: GlobalAchievement[]) => {
    set({ achievements });
  },

  /**
   * Resets all progress data
   *
   * @fires stateChange - When progress is reset
   *
   * @remarks
   * Completely resets all progress tracking data to initial state.
   * This is primarily used for testing, debugging, or when a user
   * wants to start fresh. Use with caution as this operation
   * cannot be undone.
   *
   * @example
   * ```typescript
   * // Reset all progress (use carefully!)
   * store.getState().resetProgress();
   *
   * // Common pattern for testing
   * beforeEach(() => {
   *   store.getState().resetProgress();
   * });
   * ```
   */
  resetProgress: () => {
    set(createInitialProgressState());
  },
});

/**
 * Selector functions for efficient progress state access
 *
 * @remarks
 * These selectors provide a consistent API for accessing progress data
 * and computed values. They enable efficient re-renders and complex
 * calculations. Use these instead of inline selectors for better
 * performance and maintainability.
 *
 * The selectors include both direct state access and computed values
 * for analytics, goal tracking, and achievement progress.
 *
 * @example
 * ```typescript
 * import { useStore } from '@/store';
 * import { progressSelectors } from '@/store/slices/progressSlice';
 *
 * // In a component
 * const totalCompleted = useStore(progressSelectors.selectTotalPositionsCompleted);
 * const weeklyProgress = useStore(progressSelectors.selectWeeklyProgress);
 * const dueForReview = useStore(progressSelectors.selectPositionsDueForReview);
 * ```
 */
export const progressSelectors = {
  /**
   * Selects position progress for a specific position
   * @param {number} positionId - The position ID to get progress for
   * @returns {Function} Selector function
   */
  selectPositionProgress: (positionId: number) => (state: ProgressSlice) =>
    state.positionProgress[positionId],

  /**
   * Selects all position progress data
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {Record<number, PositionProgress>} All position progress
   */
  selectAllPositionProgress: (state: ProgressSlice) => state.positionProgress,

  /**
   * Selects daily statistics array
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {DailyStats[]} Daily statistics
   */
  selectDailyStats: (state: ProgressSlice) => state.dailyStats,

  /**
   * Selects all achievements
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {Achievement[]} All achievements
   */
  selectAchievements: (state: ProgressSlice) => state.achievements,

  /**
   * Selects only unlocked achievements
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {Achievement[]} Unlocked achievements
   */
  selectUnlockedAchievements: (state: ProgressSlice) =>
    state.achievements.filter((a) => a.unlocked),

  /**
   * Selects favorite position IDs
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number[]} Favorite position IDs
   */
  selectFavoritePositions: (state: ProgressSlice) => state.favoritePositions,

  /**
   * Selects total achievement points
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number} Total points earned
   */
  selectTotalPoints: (state: ProgressSlice) => state.totalPoints,

  /**
   * Selects current streak
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number} Current consecutive day streak
   */
  selectCurrentStreak: (state: ProgressSlice) => state.currentStreak,

  /**
   * Selects longest streak
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number} Best ever streak
   */
  selectLongestStreak: (state: ProgressSlice) => state.longestStreak,

  /**
   * Selects weekly goals
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {Object} Weekly goal progress
   */
  selectWeeklyGoals: (state: ProgressSlice) => state.weeklyGoals,

  /**
   * Selects monthly statistics
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {Object} Monthly aggregated stats
   */
  selectMonthlyStats: (state: ProgressSlice) => state.monthlyStats,

  /**
   * Calculates total positions completed
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number} Total completed positions
   */
  selectTotalPositionsCompleted: (state: ProgressSlice) =>
    Object.values(state.positionProgress).filter((p) => p.completed).length,

  /**
   * Calculates average accuracy across all attempts
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number} Average accuracy percentage
   */
  selectOverallAccuracy: (state: ProgressSlice) => {
    const completedPositions = Object.values(state.positionProgress).filter(
      (p) => p.completed && p.accuracy !== undefined,
    );

    if (completedPositions.length === 0) return 0;

    const totalAccuracy = completedPositions.reduce(
      (sum, p) => sum + (p.accuracy || 0),
      0,
    );
    return Math.round(totalAccuracy / completedPositions.length);
  },

  /**
   * Calculates weekly goal progress percentage
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number} Progress percentage (0-100)
   */
  selectWeeklyProgress: (state: ProgressSlice) => {
    const { completed, target } = state.weeklyGoals;
    return target > 0
      ? Math.min(100, Math.round((completed / target) * 100))
      : 0;
  },

  /**
   * Selects positions due for spaced repetition review
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {number[]} Position IDs due for review
   */
  selectPositionsDueForReview: (state: ProgressSlice) => {
    const now = Date.now();
    return Object.values(state.positionProgress)
      .filter((p) => p.nextReview && p.nextReview <= now)
      .map((p) => p.positionId);
  },

  /**
   * Calculates achievement progress by category
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {Record<string, {unlocked: number, total: number}>} Achievement progress by category
   */
  selectAchievementProgressByCategory: (state: ProgressSlice) => {
    const categories: Record<string, { unlocked: number; total: number }> = {};

    state.achievements.forEach((achievement) => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = { unlocked: 0, total: 0 };
      }
      categories[achievement.category].total++;
      if (achievement.unlocked) {
        categories[achievement.category].unlocked++;
      }
    });

    return categories;
  },

  /**
   * Calculates recent activity (last 7 days)
   * @param {ProgressSlice} state - The progress slice of the store
   * @returns {DailyStats[]} Recent daily statistics
   */
  selectRecentActivity: (state: ProgressSlice) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return state.dailyStats
      .filter((stat) => stat.date >= sevenDaysAgo)
      .sort((a, b) => b.date - a.date);
  },
};
