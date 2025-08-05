/**
 * @file Progress slice action hooks
 * @module store/hooks/useProgressActions
 *
 * @description
 * Provides access to progress-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for progress-related actions
 *
 * @description
 * Provides all actions related to user progress tracking including
 * achievements, statistics, and spaced repetition management.
 *
 * @returns {Object} Progress actions
 *
 * @example
 * ```tsx
 * const { recordAttempt, unlockAchievement, updateDailyStats } = useProgressActions();
 *
 * // Record a training attempt
 * recordAttempt(positionId, true);
 *
 * // Unlock an achievement
 * unlockAchievement('first_checkmate');
 *
 * // Update daily statistics
 * updateDailyStats();
 * ```
 */
export const useProgressActions = () =>
  useStore((state) => ({
    // Progress tracking
    updatePositionProgress: state.updatePositionProgress,

    // Achievement management
    unlockAchievement: state.unlockAchievement,

    // Statistics (if they exist)

    // Progress reset
    resetProgress: state.resetProgress,
  }));
