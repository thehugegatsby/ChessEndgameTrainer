/**
 * @file Settings slice action hooks
 * @module store/hooks/useSettingsActions
 *
 * @description
 * Provides access to settings-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for settings-related actions
 *
 * @description
 * Provides all actions related to user settings and preferences
 * including themes, notifications, and board preferences.
 *
 * @returns {Object} Settings actions
 *
 * @example
 * ```tsx
 * const { updateBoardSettings, toggleNotifications } = useSettingsActions();
 *
 * // Update board appearance
 * updateBoardSettings({
 *   pieceTheme: 'neo',
 *   boardTheme: 'brown'
 * });
 *
 * // Toggle notifications
 * toggleNotifications();
 * ```
 */
export const useSettingsActions = () =>
  useStore((state) => ({
    // Only functional actions from settings slice
    clearRestartRequired: state.clearRestartRequired,
    resetSettings: state.resetSettings,
  }));
