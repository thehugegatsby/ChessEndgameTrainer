/**
 * @file Consolidated progress store hook
 * @module store/hooks/useProgressStore
 *
 * @description
 * Provides unified access to progress-related state and actions from the Zustand store.
 * This consolidated hook manages user progress tracking, achievements, statistics,
 * and spaced repetition functionality. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive progress state and actions
 *
 * @description
 * Central hook for progress tracking functionality including position
 * progress, daily statistics, achievements, and spaced repetition.
 * Provides both state queries and mutation actions for progress data.
 *
 * @returns {Object} Progress state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   positionProgress,
 *   dailyStats,
 *   achievements,
 *   totalPoints,
 *   currentStreak,
 *
 *   // Actions
 *   updatePositionProgress,
 *   unlockAchievement,
 *   addDailyStats,
 * } = useProgressStore();
 *
 * // Update progress after completing position
 * const handlePositionComplete = (positionId: number, success: boolean) => {
 *   updatePositionProgress(positionId, {
 *     attempts: attempts + 1,
 *     successes: success ? successes + 1 : successes
 *   });
 * };
 * ```
 */
export const useProgressStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === Progress State ===
      positionProgress: state.positionProgress,
      dailyStats: state.dailyStats,
      achievements: state.achievements,
      favoritePositions: state.favoritePositions,
      totalPoints: state.totalPoints,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActivityDate: state.lastActivityDate,
      weeklyGoals: state.weeklyGoals,
      monthlyStats: state.monthlyStats,
      totalSolvedPositions: state.totalSolvedPositions,
      averageAccuracy: state.averageAccuracy,

      // === Progress Actions ===
      updatePositionProgress: state.updatePositionProgress,
      addDailyStats: state.addDailyStats,
      unlockAchievement: state.unlockAchievement,
      toggleFavorite: state.toggleFavorite,
      calculateNextReview: state.calculateNextReview,
      initializeAchievements: state.initializeAchievements,
      updateWeeklyGoals: state.updateWeeklyGoals,
      updateMonthlyStats: state.updateMonthlyStats,
      updateStreak: state.updateStreak,
      resetProgress: state.resetProgress,
    })),
  );
};
