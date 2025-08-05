/**
 * @file Consolidated user store hook
 * @module store/hooks/useUserStore
 *
 * @description
 * Provides unified access to user-related state and actions from the Zustand store.
 * This consolidated hook manages user authentication, profile data, preferences,
 * and user-specific settings. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive user state and actions
 *
 * @description
 * Central hook for user functionality including authentication,
 * profile management, preferences, and user statistics.
 * Provides both state queries and mutation actions for user data.
 *
 * @returns {Object} User state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   id,
 *   username,
 *   email,
 *   rating,
 *   currentStreak,
 *   preferences,
 *
 *   // Actions
 *   setUser,
 *   updatePreferences,
 *   incrementStreak,
 *   resetStreak,
 *   addCompletedPosition,
 *   updateLastActive,
 *   clearUser,
 * } = useUserStore();
 *
 * // Update user preferences
 * const handlePreferenceChange = (newPrefs: Partial<UserPreferences>) => {
 *   updatePreferences(newPrefs);
 * };
 *
 * // Track position completion
 * const handlePositionComplete = (positionId: number) => {
 *   addCompletedPosition(positionId);
 *   incrementStreak();
 * };
 * ```
 */
export const useUserStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === User State ===
      id: state.id,
      username: state.username,
      email: state.email,
      rating: state.rating,
      completedPositions: state.completedPositions,
      currentStreak: state.currentStreak,
      totalTrainingTime: state.totalTrainingTime,
      lastActiveDate: state.lastActiveDate,
      preferences: state.preferences,

      // === User Actions ===
      setUser: state.setUser,
      updatePreferences: state.updatePreferences,
      incrementStreak: state.incrementStreak,
      resetStreak: state.resetStreak,
      addCompletedPosition: state.addCompletedPosition,
      updateLastActive: state.updateLastActive,
      clearUser: state.clearUser,
    })),
  );
};
