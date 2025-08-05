/**
 * @file Consolidated settings store hook
 * @module store/hooks/useSettingsStore
 *
 * @description
 * Provides unified access to settings-related state and actions from the Zustand store.
 * This consolidated hook manages user preferences, theme settings, and application
 * configuration. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive settings state and actions
 *
 * @description
 * Central hook for settings functionality including theme management,
 * user preferences, and application configuration. Provides both
 * state queries and mutation actions for settings data.
 *
 * @returns {Object} Settings state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   theme,
 *   preferences,
 *
 *   // Actions
 *   clearRestartRequired,
 *   resetSettings,
 * } = useSettingsStore();
 *
 * // Update theme preference
 * const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
 *   // Theme updates handled through user preferences
 *   console.log('Current theme:', theme);
 * };
 * ```
 */
export const useSettingsStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === Settings State ===
      restartRequired: state.restartRequired,
      lastSettingsUpdate: state.lastSettingsUpdate,

      // === Settings Actions ===
      clearRestartRequired: state.clearRestartRequired,
      resetSettings: state.resetSettings,
    })),
  );
};
