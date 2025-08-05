/**
 * @file User slice action hooks
 * @module store/hooks/useUserActions
 *
 * @description
 * Provides access to user-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for user-related actions
 *
 * @description
 * Provides all actions related to user authentication, profile
 * management, and user preferences.
 *
 * @returns {Object} User actions
 *
 * @example
 * ```tsx
 * const { setUser, updatePreferences, incrementStreak } = useUserActions();
 *
 * // Set user after login
 * setUser({
 *   id: 'user123',
 *   email: 'user@example.com',
 *   displayName: 'Chess Master'
 * });
 *
 * // Update preferences
 * updatePreferences({
 *   theme: 'dark',
 *   language: 'de'
 * });
 *
 * // Track daily streak
 * incrementStreak();
 * ```
 */
export const useUserActions = () =>
  useStore((state) => ({
    // User management
    setUser: state.setUser,
    clearUser: state.clearUser,

    // Preferences
    updatePreferences: state.updatePreferences,

    // Progress tracking
    incrementStreak: state.incrementStreak,
    resetStreak: state.resetStreak,
    addCompletedPosition: state.addCompletedPosition,

    // Activity tracking
    updateLastActive: state.updateLastActive,
  }));
