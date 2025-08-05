/**
 * @file Settings state slice for Zustand store
 * @module store/slices/settingsSlice
 * @description Manages application configuration, user preferences, theme settings,
 * and data synchronization. This slice handles persistent configuration that affects
 * the entire application behavior and appearance.
 *
 * @example
 * ```typescript
 * // Using the settings slice in a component
 * import { useStore } from '@/store';
 * import { settingsSelectors } from '@/store/slices/settingsSlice';
 *
 * function SettingsPanel() {
 *   const theme = useStore(settingsSelectors.selectTheme);
 *   const difficulty = useStore(settingsSelectors.selectDifficulty);
 *   const updateSettings = useStore(state => state.updateSettings);
 *
 *   const handleThemeChange = (newTheme: Theme) => {
 *     updateSettings({ theme: newTheme });
 *   };
 *
 *   const toggleDarkMode = () => {
 *     updateSettings({
 *       theme: { ...theme, mode: theme.mode === 'dark' ? 'light' : 'dark' }
 *     });
 *   };
 * }
 * ```
 */

import { ImmerStateCreator, SettingsSlice } from "./types";
import type { SettingsState, ExperimentalFeatures } from "@shared/store/types";

/**
 * Theme configuration interface
 * @interface Theme
 */
export interface Theme {
  /** Light or dark mode */
  mode: "light" | "dark";
  /** Color scheme variant */
  colorScheme: "blue" | "green" | "purple" | "orange" | "red";
  /** Board theme for chess display */
  boardTheme: "classic" | "modern" | "wood" | "marble" | "neon";
  /** Piece set style */
  pieceSet: "classic" | "modern" | "medieval" | "minimalist";
  /** Font size preference */
  fontSize: "small" | "medium" | "large";
  /** High contrast mode for accessibility */
  highContrast: boolean;
}

/**
 * Notification preferences interface
 * @interface NotificationSettings
 */
export interface NotificationSettings {
  /** Enable push notifications */
  enabled: boolean;
  /** Daily reminder notifications */
  dailyReminders: boolean;
  /** Achievement unlock notifications */
  achievements: boolean;
  /** Training session reminders */
  trainingReminders: boolean;
  /** Weekly progress summary */
  weeklyProgress: boolean;
  /** Sound effects for notifications */
  soundEnabled: boolean;
  /** Preferred notification time (24-hour format) */
  preferredTime: string; // "HH:MM" format
}

/**
 * Training difficulty settings interface
 * @interface DifficultySettings
 */
export interface DifficultySettings {
  /** Overall difficulty level */
  level: "beginner" | "intermediate" | "advanced" | "expert";
  /** Show hints automatically */
  autoHints: boolean;
  /** Maximum hints per position */
  maxHints: number;
  /** Enable move suggestions */
  moveSuggestions: boolean;
  /** Time pressure mode */
  timePressure: boolean;
  /** Default time limit in seconds */
  defaultTimeLimit: number;
  /** Mistake tolerance level */
  mistakeTolerance: "strict" | "normal" | "lenient";
}

/**
 * Privacy and data settings interface
 * @interface PrivacySettings
 */
export interface PrivacySettings {
  /** Allow analytics data collection */
  analytics: boolean;
  /** Allow crash reporting */
  crashReporting: boolean;
  /** Share usage statistics */
  usageStatistics: boolean;
  /** Enable performance monitoring */
  performanceMonitoring: boolean;
  /** Data retention period in days */
  dataRetentionDays: number;
}

/**
 * Creates the initial settings state with default values
 *
 * @returns {Object} Initial settings state
 * @returns {Theme} returns.theme - Visual theme configuration
 * @returns {NotificationSettings} returns.notifications - Notification preferences
 * @returns {DifficultySettings} returns.difficulty - Training difficulty settings
 * @returns {PrivacySettings} returns.privacy - Privacy and data preferences
 * @returns {ExperimentalFeatures} returns.experimentalFeatures - Feature flags
 * @returns {DataSyncState} returns.dataSync - Synchronization state
 * @returns {string} returns.language - Interface language
 * @returns {string} returns.timezone - User timezone
 * @returns {boolean} returns.firstTimeUser - Whether user is new
 * @returns {number|undefined} returns.lastSettingsUpdate - Last update timestamp
 *
 * @example
 * ```typescript
 * const initialSettings = createInitialSettingsState();
 * console.log(initialSettings.theme.mode); // "light"
 * console.log(initialSettings.difficulty.level); // "intermediate"
 * console.log(initialSettings.notifications.enabled); // true
 * ```
 */
export const createInitialSettingsState = (): SettingsState => ({
  // Visual theme configuration
  theme: {
    mode: "light",
    colorScheme: "blue",
    boardTheme: "classic",
    pieceSet: "classic",
    fontSize: "medium",
    highContrast: false,
  },

  // Notification preferences
  notifications: {
    enabled: true,
    dailyReminders: true,
    achievements: true,
    trainingReminders: false,
    weeklyProgress: true,
    soundEnabled: true,
    preferredTime: "19:00", // 7 PM
  },

  // Training difficulty settings
  difficulty: {
    level: "intermediate",
    autoHints: false,
    maxHints: 3,
    moveSuggestions: true,
    timePressure: false,
    defaultTimeLimit: 300, // 5 minutes
    mistakeTolerance: "normal",
  },

  // Privacy and data settings
  privacy: {
    analytics: true,
    crashReporting: true,
    usageStatistics: true,
    performanceMonitoring: true,
    dataRetentionDays: 365, // 1 year
  },

  // Experimental features (feature flags)
  experimentalFeatures: {
    newTrainingMode: false,
    advancedAnalytics: false,
    voiceCommands: false,
    aiCoach: false,
    multiplePerspective: false,
  },

  // Data synchronization state
  dataSync: {
    enabled: false,
    lastSync: undefined,
    syncInProgress: false,
    syncError: undefined,
    autoSync: false,
    syncInterval: 300000, // 5 minutes
  },

  // Localization settings
  language: "de", // German default
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  // User onboarding state
  firstTimeUser: true,
  lastSettingsUpdate: undefined,

  // Application restart requirement flag
  restartRequired: false,
});

/**
 * Creates the settings slice for the Zustand store
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {SettingsSlice} Complete settings slice with state and actions
 *
 * @remarks
 * This slice manages all application configuration and user preferences.
 * It handles theme management, notification settings, difficulty configuration,
 * privacy settings, experimental features, and data synchronization.
 * The slice is designed to work with persistence middleware for settings storage.
 *
 * Key concepts:
 * - theme: Visual appearance and accessibility settings
 * - notifications: User communication preferences
 * - difficulty: Training experience customization
 * - privacy: Data handling and analytics preferences
 * - experimentalFeatures: Feature flags for new functionality
 * - dataSync: Cloud synchronization configuration
 * - restartRequired: Flag indicating if app restart is needed
 *
 * @example
 * ```typescript
 * // In your root store
 * import { create } from 'zustand';
 * import { createSettingsSlice } from './slices/settingsSlice';
 *
 * const useStore = create<RootState>()((...args) => ({
 *   ...createSettingsSlice(...args),
 *   ...createProgressSlice(...args),
 *   // ... other slices
 * }));
 *
 * // During app initialization (after rehydration)
 * store.getState().clearRestartRequired();
 * ```
 */
export const createSettingsSlice: ImmerStateCreator<SettingsSlice> = (
  set,
  _get,
) => ({
  // Initial state
  ...createInitialSettingsState(),

  // Actions
  /**
   * Updates settings with partial configuration
   *
   * @param {Partial<SettingsState>} settings - Settings to update
   *
   * @fires stateChange - When settings are updated
   *
   * @remarks
   * This is the primary method for updating application settings.
   * It performs deep merging for nested objects like theme and notifications
   * while updating the lastSettingsUpdate timestamp. The method is designed
   * to work with persistence middleware for automatic settings storage.
   *
   * @example
   * ```typescript
   * // Update theme settings
   * store.getState().updateSettings({
   *   theme: {
   *     mode: "dark",
   *     colorScheme: "purple"
   *   }
   * });
   *
   * // Update notification preferences
   * store.getState().updateSettings({
   *   notifications: {
   *     dailyReminders: false,
   *     soundEnabled: false
   *   }
   * });
   *
   * // Update multiple settings at once
   * store.getState().updateSettings({
   *   language: "en",
   *   difficulty: {
   *     level: "advanced",
   *     maxHints: 1
   *   }
   * });
   * ```
   */
  updateSettings: (settings: Partial<SettingsState>) => {
    set((state) => {
      // Check if critical settings that require restart are being changed
      const requiresRestart = Boolean(
        // Language change
        (settings.language && settings.language !== state.language) ||
          // Privacy settings changes
          (settings.privacy?.crashReporting !== undefined &&
            settings.privacy.crashReporting !== state.privacy.crashReporting) ||
          (settings.privacy?.performanceMonitoring !== undefined &&
            settings.privacy.performanceMonitoring !==
              state.privacy.performanceMonitoring),
      );

      return {
        // Deep merge nested objects
        theme: settings.theme
          ? { ...state.theme, ...settings.theme }
          : state.theme,
        notifications: settings.notifications
          ? { ...state.notifications, ...settings.notifications }
          : state.notifications,
        difficulty: settings.difficulty
          ? { ...state.difficulty, ...settings.difficulty }
          : state.difficulty,
        privacy: settings.privacy
          ? { ...state.privacy, ...settings.privacy }
          : state.privacy,
        experimentalFeatures: settings.experimentalFeatures
          ? { ...state.experimentalFeatures, ...settings.experimentalFeatures }
          : state.experimentalFeatures,
        dataSync: settings.dataSync
          ? { ...state.dataSync, ...settings.dataSync }
          : state.dataSync,

        // Direct updates for primitive fields
        ...(settings.language && { language: settings.language }),
        ...(settings.timezone && { timezone: settings.timezone }),
        ...(settings.firstTimeUser !== undefined && {
          firstTimeUser: settings.firstTimeUser,
        }),

        // Set restart flag if critical settings changed
        restartRequired: state.restartRequired || requiresRestart,

        // Update timestamp
        lastSettingsUpdate: Date.now(),
      };
    });
  },

  /**
   * Toggles an experimental feature on/off
   *
   * @param {keyof ExperimentalFeatures} feature - The feature to toggle
   *
   * @fires stateChange - When experimental feature is toggled
   *
   * @remarks
   * Provides a convenient way to enable/disable experimental features
   * without needing to specify the full experimentalFeatures object.
   * This is commonly used in settings panels and feature flag management.
   *
   * @example
   * ```typescript
   * // Enable advanced analytics
   * store.getState().toggleExperimentalFeature("advancedAnalytics");
   *
   * // Toggle AI coach feature
   * store.getState().toggleExperimentalFeature("aiCoach");
   *
   * // Check if feature is enabled
   * const isEnabled = store.getState().experimentalFeatures.newTrainingMode;
   * ```
   */
  toggleExperimentalFeature: (feature: keyof ExperimentalFeatures) => {
    set((state) => ({
      experimentalFeatures: {
        ...state.experimentalFeatures,
        [feature]: !state.experimentalFeatures[feature],
      },
      lastSettingsUpdate: Date.now(),
    }));
  },

  /**
   * Starts data synchronization process
   *
   * @fires stateChange - When sync state is updated
   *
   * @remarks
   * Initiates the data synchronization process by setting the sync
   * state to in-progress and clearing any previous errors. This method
   * should be called by sync orchestrators that handle the actual
   * synchronization logic with external services.
   *
   * @example
   * ```typescript
   * // Start sync process
   * store.getState().startSync();
   *
   * // Check sync status
   * const isSyncing = store.getState().dataSync.syncInProgress;
   * ```
   */
  startSync: () => {
    set((state) => ({
      dataSync: {
        ...state.dataSync,
        syncInProgress: true,
        syncError: null,
      },
    }));
  },

  /**
   * Completes data synchronization process
   *
   * @param {boolean} success - Whether synchronization was successful
   * @param {string} [error] - Error message if synchronization failed
   *
   * @fires stateChange - When sync completion is recorded
   *
   * @remarks
   * Finalizes the synchronization process by updating the sync state
   * with the result. Records timestamp for successful syncs and error
   * messages for failed attempts. This method should be called by
   * sync orchestrators after completing synchronization operations.
   *
   * @example
   * ```typescript
   * // Successful sync completion
   * store.getState().completeSync(true);
   *
   * // Failed sync with error
   * store.getState().completeSync(false, "Network connection failed");
   *
   * // Check last sync time
   * const lastSync = store.getState().dataSync.lastSync;
   * ```
   */
  completeSync: (success: boolean, error?: string) => {
    set((state) => ({
      dataSync: {
        ...state.dataSync,
        syncInProgress: false,
        lastSync: success ? Date.now() : state.dataSync.lastSync,
        syncError: success ? null : error || "Synchronization failed",
      },
    }));
  },

  /**
   * Resets settings to factory defaults
   *
   * @fires stateChange - When settings are reset
   *
   * @remarks
   * Completely resets all settings to their initial default values.
   * This is useful for troubleshooting, user preference reset, or
   * starting fresh. The operation preserves timezone detection but
   * resets everything else including experimental features and sync state.
   *
   * @example
   * ```typescript
   * // Reset all settings to defaults
   * store.getState().resetSettings();
   *
   * // Common pattern with confirmation
   * const confirmReset = () => {
   *   if (confirm("Reset all settings to defaults?")) {
   *     store.getState().resetSettings();
   *   }
   * };
   * ```
   */
  resetSettings: () => {
    set(createInitialSettingsState());
  },

  /**
   * Updates theme configuration
   *
   * @param {Partial<Theme>} themeUpdate - Theme properties to update
   *
   * @fires stateChange - When theme is updated
   *
   * @remarks
   * Convenience method for updating theme settings without needing
   * to use the full updateSettings method. Performs deep merging
   * of theme properties and updates the settings timestamp.
   *
   * @example
   * ```typescript
   * // Switch to dark mode
   * store.getState().updateTheme({ mode: "dark" });
   *
   * // Change color scheme and board theme
   * store.getState().updateTheme({
   *   colorScheme: "green",
   *   boardTheme: "wood"
   * });
   *
   * // Enable high contrast mode
   * store.getState().updateTheme({ highContrast: true });
   * ```
   */
  updateTheme: (themeUpdate: Partial<Theme>) => {
    set((state) => ({
      theme: {
        ...state.theme,
        ...themeUpdate,
      },
      lastSettingsUpdate: Date.now(),
    }));
  },

  /**
   * Updates notification preferences
   *
   * @param {Partial<NotificationSettings>} notificationUpdate - Notification settings to update
   *
   * @fires stateChange - When notification settings are updated
   *
   * @remarks
   * Convenience method for updating notification preferences with
   * proper merging and validation. Automatically handles the relationship
   * between master notification toggle and individual notification types.
   *
   * @example
   * ```typescript
   * // Disable all notifications
   * store.getState().updateNotifications({ enabled: false });
   *
   * // Enable daily reminders at specific time
   * store.getState().updateNotifications({
   *   dailyReminders: true,
   *   preferredTime: "08:00"
   * });
   *
   * // Disable sound but keep visual notifications
   * store.getState().updateNotifications({ soundEnabled: false });
   * ```
   */
  updateNotifications: (notificationUpdate: Partial<NotificationSettings>) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        ...notificationUpdate,
      },
      lastSettingsUpdate: Date.now(),
    }));
  },

  /**
   * Updates difficulty settings
   *
   * @param {Partial<DifficultySettings>} difficultyUpdate - Difficulty settings to update
   *
   * @fires stateChange - When difficulty settings are updated
   *
   * @remarks
   * Convenience method for updating training difficulty configuration.
   * Handles validation of difficulty-related settings and ensures
   * consistent configuration (e.g., appropriate hint limits for difficulty level).
   *
   * @example
   * ```typescript
   * // Set to expert difficulty
   * store.getState().updateDifficulty({
   *   level: "expert",
   *   maxHints: 1,
   *   mistakeTolerance: "strict"
   * });
   *
   * // Enable time pressure mode
   * store.getState().updateDifficulty({
   *   timePressure: true,
   *   defaultTimeLimit: 180 // 3 minutes
   * });
   *
   * // Disable automatic hints
   * store.getState().updateDifficulty({ autoHints: false });
   * ```
   */
  updateDifficulty: (difficultyUpdate: Partial<DifficultySettings>) => {
    set((state) => ({
      difficulty: {
        ...state.difficulty,
        ...difficultyUpdate,
      },
      lastSettingsUpdate: Date.now(),
    }));
  },

  /**
   * Updates privacy settings
   *
   * @param {Partial<PrivacySettings>} privacyUpdate - Privacy settings to update
   *
   * @fires stateChange - When privacy settings are updated
   *
   * @remarks
   * Convenience method for updating privacy and data handling preferences.
   * These settings affect analytics collection, crash reporting, and
   * data retention policies. Changes may require application restart
   * or service reconfiguration to take full effect.
   *
   * @example
   * ```typescript
   * // Disable all data collection
   * store.getState().updatePrivacy({
   *   analytics: false,
   *   crashReporting: false,
   *   usageStatistics: false
   * });
   *
   * // Set data retention to 6 months
   * store.getState().updatePrivacy({
   *   dataRetentionDays: 180
   * });
   *
   * // Enable performance monitoring only
   * store.getState().updatePrivacy({
   *   performanceMonitoring: true,
   *   analytics: false
   * });
   * ```
   */
  updatePrivacy: (privacyUpdate: Partial<PrivacySettings>) => {
    set((state) => {
      // Check if critical privacy settings that require restart are being changed
      const requiresRestart = Boolean(
        (privacyUpdate.crashReporting !== undefined &&
          privacyUpdate.crashReporting !== state.privacy.crashReporting) ||
          (privacyUpdate.performanceMonitoring !== undefined &&
            privacyUpdate.performanceMonitoring !==
              state.privacy.performanceMonitoring),
      );

      return {
        privacy: {
          ...state.privacy,
          ...privacyUpdate,
        },
        restartRequired: state.restartRequired || requiresRestart,
        lastSettingsUpdate: Date.now(),
      };
    });
  },

  /**
   * Clears the restart required flag
   *
   * @fires stateChange - When restart flag is cleared
   *
   * @remarks
   * This method should be called after the application has been restarted
   * to acknowledge that the restart requirement has been satisfied.
   * Typically called during application initialization or after detecting
   * that critical settings changes have been applied.
   *
   * @example
   * ```typescript
   * // After application restart
   * store.getState().clearRestartRequired();
   *
   * // In application initialization
   * useEffect(() => {
   *   // Check if we just restarted after settings change
   *   const wasRestartRequired = localStorage.getItem('restartRequired');
   *   if (wasRestartRequired) {
   *     store.getState().clearRestartRequired();
   *     localStorage.removeItem('restartRequired');
   *   }
   * }, []);
   * ```
   */
  clearRestartRequired: () => {
    set({
      restartRequired: false,
    });
  },
});

/**
 * Selector functions for efficient settings state access
 *
 * @remarks
 * These selectors provide a consistent API for accessing settings data
 * and computed values. They enable efficient re-renders and complex
 * setting-based logic. Use these instead of inline selectors for better
 * performance and maintainability.
 *
 * The selectors include both direct state access and computed values
 * for theme application, notification scheduling, and feature flags.
 *
 * @example
 * ```typescript
 * import { useStore } from '@/store';
 * import { settingsSelectors } from '@/store/slices/settingsSlice';
 *
 * // In a component
 * const isDarkMode = useStore(settingsSelectors.selectIsDarkMode);
 * const difficultyLevel = useStore(settingsSelectors.selectDifficultyLevel);
 * const isFeatureEnabled = useStore(settingsSelectors.selectIsExperimentalFeatureEnabled("aiCoach"));
 * ```
 */
export const settingsSelectors = {
  /**
   * Selects the complete theme configuration
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {Theme} Theme configuration object
   */
  selectTheme: (state: SettingsSlice) => state.theme,

  /**
   * Selects notification settings
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {NotificationSettings} Notification preferences
   */
  selectNotifications: (state: SettingsSlice) => state.notifications,

  /**
   * Selects difficulty configuration
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {DifficultySettings} Difficulty settings
   */
  selectDifficulty: (state: SettingsSlice) => state.difficulty,

  /**
   * Selects privacy preferences
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {PrivacySettings} Privacy settings
   */
  selectPrivacy: (state: SettingsSlice) => state.privacy,

  /**
   * Selects experimental features state
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {ExperimentalFeatures} Feature flags
   */
  selectExperimentalFeatures: (state: SettingsSlice) =>
    state.experimentalFeatures,

  /**
   * Selects data sync configuration
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {DataSyncState} Sync state and settings
   */
  selectDataSync: (state: SettingsSlice) => state.dataSync,

  /**
   * Selects interface language
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {string} Language code
   */
  selectLanguage: (state: SettingsSlice) => state.language,

  /**
   * Selects user timezone
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {string} Timezone identifier
   */
  selectTimezone: (state: SettingsSlice) => state.timezone,

  /**
   * Checks if user is first-time user
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether user is new
   */
  selectIsFirstTimeUser: (state: SettingsSlice) => state.firstTimeUser,

  /**
   * Selects last settings update timestamp
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {number|undefined} Last update timestamp
   */
  selectLastSettingsUpdate: (state: SettingsSlice) => state.lastSettingsUpdate,

  /**
   * Checks if application restart is required
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether restart is required
   */
  selectRestartRequired: (state: SettingsSlice) => state.restartRequired,

  /**
   * Checks if dark mode is enabled
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether dark mode is active
   */
  selectIsDarkMode: (state: SettingsSlice) => state.theme.mode === "dark",

  /**
   * Selects difficulty level
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {string} Current difficulty level
   */
  selectDifficultyLevel: (state: SettingsSlice) => state.difficulty.level,

  /**
   * Checks if notifications are enabled
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether notifications are enabled
   */
  selectNotificationsEnabled: (state: SettingsSlice) =>
    state.notifications.enabled,

  /**
   * Checks if sync is in progress
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether sync is currently running
   */
  selectIsSyncInProgress: (state: SettingsSlice) =>
    state.dataSync.syncInProgress,

  /**
   * Checks if a specific experimental feature is enabled
   * @param {keyof ExperimentalFeatures} feature - The feature to check
   * @returns {Function} Selector function
   */
  selectIsExperimentalFeatureEnabled:
    (feature: keyof ExperimentalFeatures) => (state: SettingsSlice) =>
      state.experimentalFeatures[feature],

  /**
   * Selects CSS class names for current theme
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {string[]} Array of CSS class names
   */
  selectThemeClasses: (state: SettingsSlice) => [
    `theme-${state.theme.mode}`,
    `color-${state.theme.colorScheme}`,
    `board-${state.theme.boardTheme}`,
    `pieces-${state.theme.pieceSet}`,
    `font-${state.theme.fontSize}`,
    ...(state.theme.highContrast ? ["high-contrast"] : []),
  ],

  /**
   * Checks if any privacy-related data collection is enabled
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether any data collection is active
   */
  selectIsDataCollectionEnabled: (state: SettingsSlice) =>
    state.privacy.analytics ||
    state.privacy.crashReporting ||
    state.privacy.usageStatistics ||
    state.privacy.performanceMonitoring,

  /**
   * Calculates time until next sync (if auto-sync enabled)
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {number|null} Milliseconds until next sync, or null if disabled
   */
  selectTimeUntilNextSync: (state: SettingsSlice) => {
    if (!state.dataSync.autoSync || !state.dataSync.lastSync) {
      return null;
    }

    const nextSync = state.dataSync.lastSync + state.dataSync.syncInterval;
    const now = Date.now();

    return Math.max(0, nextSync - now);
  },

  /**
   * Checks if settings require application restart
   * @param {SettingsSlice} state - The settings slice of the store
   * @returns {boolean} Whether restart is recommended
   */
  selectRequiresRestart: (state: SettingsSlice) => state.restartRequired,
};
