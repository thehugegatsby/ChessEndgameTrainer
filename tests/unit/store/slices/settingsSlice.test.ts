/**
 * @file Unit tests for Settings state slice
 * @module tests/store/slices/settingsSlice
 * @description Comprehensive test suite for the settings slice including theme management,
 * notification preferences, difficulty settings, privacy controls, and experimental features.
 */

import { createStore } from "zustand/vanilla";
import {
  createSettingsSlice,
  settingsSelectors,
  createInitialSettingsState,
  type Theme,
  type NotificationSettings,
  type DifficultySettings,
  type PrivacySettings,
} from "@shared/store/slices/settingsSlice";
import type { SettingsSlice } from "@shared/store/slices/types";
import type { ExperimentalFeatures } from "@shared/store/types";

/**
 * Creates a test store instance with only the settings slice
 * @returns Store instance with getState and setState methods
 */
const createTestStore = () => {
  return createStore<SettingsSlice>()(createSettingsSlice);
};

/**
 * Mock theme configuration for testing
 */
const mockTheme: Theme = {
  mode: "dark",
  colorScheme: "purple",
  boardTheme: "wood",
  pieceSet: "modern",
  fontSize: "large",
  highContrast: true,
};

const mockNotifications: NotificationSettings = {
  enabled: false,
  dailyReminders: false,
  achievements: true,
  trainingReminders: true,
  weeklyProgress: false,
  soundEnabled: false,
  preferredTime: "08:00",
};

const mockDifficulty: DifficultySettings = {
  level: "expert",
  autoHints: false,
  maxHints: 1,
  moveSuggestions: false,
  timePressure: true,
  defaultTimeLimit: 180,
  mistakeTolerance: "strict",
};

const mockPrivacy: PrivacySettings = {
  analytics: false,
  crashReporting: false,
  usageStatistics: false,
  performanceMonitoring: true,
  dataRetentionDays: 90,
};

describe("SettingsSlice", () => {
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
      const expectedState = createInitialSettingsState();

      expect(state.theme).toEqual(expectedState.theme);
      expect(state.notifications).toEqual(expectedState.notifications);
      expect(state.difficulty).toEqual(expectedState.difficulty);
      expect(state.privacy).toEqual(expectedState.privacy);
      expect(state.experimentalFeatures).toEqual(
        expectedState.experimentalFeatures,
      );
      expect(state.dataSync).toEqual(expectedState.dataSync);
      expect(state.language).toBe(expectedState.language);
      expect(state.timezone).toBe(expectedState.timezone);
      expect(state.firstTimeUser).toBe(expectedState.firstTimeUser);
      expect(state.lastSettingsUpdate).toBe(expectedState.lastSettingsUpdate);
    });

    /**
     * Tests the initial state factory function
     */
    it("should create fresh initial state on each call", () => {
      const state1 = createInitialSettingsState();
      const state2 = createInitialSettingsState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.theme).not.toBe(state2.theme);
      expect(state1.notifications).not.toBe(state2.notifications);
    });

    /**
     * Tests default theme settings
     */
    it("should have sensible theme defaults", () => {
      const state = store.getState();

      expect(state.theme.mode).toBe("light");
      expect(state.theme.colorScheme).toBe("blue");
      expect(state.theme.boardTheme).toBe("classic");
      expect(state.theme.pieceSet).toBe("classic");
      expect(state.theme.fontSize).toBe("medium");
      expect(state.theme.highContrast).toBe(false);
    });

    /**
     * Tests default difficulty settings
     */
    it("should have appropriate difficulty defaults", () => {
      const state = store.getState();

      expect(state.difficulty.level).toBe("intermediate");
      expect(state.difficulty.autoHints).toBe(false);
      expect(state.difficulty.maxHints).toBe(3);
      expect(state.difficulty.moveSuggestions).toBe(true);
      expect(state.difficulty.timePressure).toBe(false);
      expect(state.difficulty.defaultTimeLimit).toBe(300);
      expect(state.difficulty.mistakeTolerance).toBe("normal");
    });
  });

  describe("updateSettings", () => {
    /**
     * Tests updating nested theme settings
     */
    it("should update theme settings with deep merge", () => {
      const beforeTime = Date.now();

      store.getState().updateSettings({
        theme: {
          mode: "dark",
          colorScheme: "green",
        },
      });

      const afterTime = Date.now();
      const state = store.getState();

      // Theme properties should be updated
      expect(state.theme.mode).toBe("dark");
      expect(state.theme.colorScheme).toBe("green");

      // Other theme properties should remain unchanged
      expect(state.theme.boardTheme).toBe("classic");
      expect(state.theme.pieceSet).toBe("classic");
      expect(state.theme.fontSize).toBe("medium");

      // Timestamp should be updated
      expect(state.lastSettingsUpdate).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastSettingsUpdate).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Tests updating multiple settings sections
     */
    it("should update multiple sections simultaneously", () => {
      store.getState().updateSettings({
        language: "en",
        theme: {
          mode: "dark",
        },
        difficulty: {
          level: "expert",
          maxHints: 1,
        },
        notifications: {
          enabled: false,
        },
      });

      const state = store.getState();
      expect(state.language).toBe("en");
      expect(state.theme.mode).toBe("dark");
      expect(state.difficulty.level).toBe("expert");
      expect(state.difficulty.maxHints).toBe(1);
      expect(state.notifications.enabled).toBe(false);
      expect(state.lastSettingsUpdate).toBeDefined();
    });

    /**
     * Tests primitive field updates
     */
    it("should update primitive fields correctly", () => {
      store.getState().updateSettings({
        language: "en",
        timezone: "America/New_York",
        firstTimeUser: false,
      });

      const state = store.getState();
      expect(state.language).toBe("en");
      expect(state.timezone).toBe("America/New_York");
      expect(state.firstTimeUser).toBe(false);
    });

    /**
     * Tests that unchanged sections are preserved
     */
    it("should preserve unchanged settings sections", () => {
      const initialState = store.getState();
      const initialTheme = initialState.theme;
      const initialPrivacy = initialState.privacy;

      store.getState().updateSettings({
        language: "en",
        notifications: {
          enabled: false,
        },
      });

      const state = store.getState();
      expect(state.theme).toEqual(initialTheme);
      expect(state.privacy).toEqual(initialPrivacy);
      expect(state.notifications.enabled).toBe(false);
    });
  });

  describe("Theme Management", () => {
    /**
     * Tests theme update method
     */
    it("should update theme with updateTheme method", () => {
      store.getState().updateTheme({
        mode: "dark",
        boardTheme: "wood",
        highContrast: true,
      });

      const state = store.getState();
      expect(state.theme.mode).toBe("dark");
      expect(state.theme.boardTheme).toBe("wood");
      expect(state.theme.highContrast).toBe(true);

      // Other theme properties should remain unchanged
      expect(state.theme.colorScheme).toBe("blue");
      expect(state.theme.pieceSet).toBe("classic");
    });

    /**
     * Tests theme class generation
     */
    it("should generate correct theme classes", () => {
      store.getState().updateTheme({
        mode: "dark",
        colorScheme: "purple",
        boardTheme: "modern",
        pieceSet: "medieval",
        fontSize: "large",
        highContrast: true,
      });

      const state = store.getState();
      const classes = settingsSelectors.selectThemeClasses(state);

      expect(classes).toContain("theme-dark");
      expect(classes).toContain("color-purple");
      expect(classes).toContain("board-modern");
      expect(classes).toContain("pieces-medieval");
      expect(classes).toContain("font-large");
      expect(classes).toContain("high-contrast");
    });

    /**
     * Tests theme classes without high contrast
     */
    it("should generate theme classes without high contrast", () => {
      const state = store.getState(); // Default theme
      const classes = settingsSelectors.selectThemeClasses(state);

      expect(classes).toContain("theme-light");
      expect(classes).toContain("color-blue");
      expect(classes).not.toContain("high-contrast");
    });
  });

  describe("Notification Settings", () => {
    /**
     * Tests notification update method
     */
    it("should update notifications with updateNotifications method", () => {
      store.getState().updateNotifications({
        enabled: false,
        dailyReminders: false,
        preferredTime: "06:00",
        soundEnabled: false,
      });

      const state = store.getState();
      expect(state.notifications.enabled).toBe(false);
      expect(state.notifications.dailyReminders).toBe(false);
      expect(state.notifications.preferredTime).toBe("06:00");
      expect(state.notifications.soundEnabled).toBe(false);

      // Other notification settings should remain unchanged
      expect(state.notifications.achievements).toBe(true);
      expect(state.notifications.weeklyProgress).toBe(true);
    });

    /**
     * Tests notification enabled selector
     */
    it("should correctly identify notification status", () => {
      let state = store.getState();
      expect(settingsSelectors.selectNotificationsEnabled(state)).toBe(true);

      store.getState().updateNotifications({ enabled: false });
      state = store.getState();
      expect(settingsSelectors.selectNotificationsEnabled(state)).toBe(false);
    });
  });

  describe("Difficulty Settings", () => {
    /**
     * Tests difficulty update method
     */
    it("should update difficulty with updateDifficulty method", () => {
      store.getState().updateDifficulty({
        level: "expert",
        maxHints: 1,
        timePressure: true,
        defaultTimeLimit: 120,
        mistakeTolerance: "strict",
      });

      const state = store.getState();
      expect(state.difficulty.level).toBe("expert");
      expect(state.difficulty.maxHints).toBe(1);
      expect(state.difficulty.timePressure).toBe(true);
      expect(state.difficulty.defaultTimeLimit).toBe(120);
      expect(state.difficulty.mistakeTolerance).toBe("strict");
    });

    /**
     * Tests difficulty level selector
     */
    it("should select difficulty level correctly", () => {
      let state = store.getState();
      expect(settingsSelectors.selectDifficultyLevel(state)).toBe(
        "intermediate",
      );

      store.getState().updateDifficulty({ level: "expert" });
      state = store.getState();
      expect(settingsSelectors.selectDifficultyLevel(state)).toBe("expert");
    });
  });

  describe("Privacy Settings", () => {
    /**
     * Tests privacy update method
     */
    it("should update privacy with updatePrivacy method", () => {
      store.getState().updatePrivacy({
        analytics: false,
        crashReporting: false,
        usageStatistics: false,
        dataRetentionDays: 90,
      });

      const state = store.getState();
      expect(state.privacy.analytics).toBe(false);
      expect(state.privacy.crashReporting).toBe(false);
      expect(state.privacy.usageStatistics).toBe(false);
      expect(state.privacy.dataRetentionDays).toBe(90);

      // Performance monitoring should remain unchanged
      expect(state.privacy.performanceMonitoring).toBe(true);
    });

    /**
     * Tests data collection status selector
     */
    it("should detect data collection status", () => {
      let state = store.getState();
      expect(settingsSelectors.selectIsDataCollectionEnabled(state)).toBe(true);

      // Disable all data collection
      store.getState().updatePrivacy({
        analytics: false,
        crashReporting: false,
        usageStatistics: false,
        performanceMonitoring: false,
      });

      state = store.getState();
      expect(settingsSelectors.selectIsDataCollectionEnabled(state)).toBe(
        false,
      );

      // Enable only analytics
      store.getState().updatePrivacy({ analytics: true });
      state = store.getState();
      expect(settingsSelectors.selectIsDataCollectionEnabled(state)).toBe(true);
    });
  });

  describe("Experimental Features", () => {
    /**
     * Tests experimental feature toggle
     */
    it("should toggle experimental features", () => {
      let state = store.getState();
      expect(state.experimentalFeatures.advancedAnalytics).toBe(false);

      store.getState().toggleExperimentalFeature("advancedAnalytics");
      state = store.getState();
      expect(state.experimentalFeatures.advancedAnalytics).toBe(true);

      // Toggle again
      store.getState().toggleExperimentalFeature("advancedAnalytics");
      state = store.getState();
      expect(state.experimentalFeatures.advancedAnalytics).toBe(false);
    });

    /**
     * Tests experimental feature selector
     */
    it("should select experimental feature status", () => {
      const state = store.getState();

      const aiCoachEnabled =
        settingsSelectors.selectIsExperimentalFeatureEnabled("aiCoach")(state);
      expect(aiCoachEnabled).toBe(false);

      store.getState().toggleExperimentalFeature("aiCoach");
      const updatedState = store.getState();

      const aiCoachEnabledAfter =
        settingsSelectors.selectIsExperimentalFeatureEnabled("aiCoach")(
          updatedState,
        );
      expect(aiCoachEnabledAfter).toBe(true);
    });

    /**
     * Tests multiple experimental features
     */
    it("should handle multiple experimental features", () => {
      store.getState().toggleExperimentalFeature("newTrainingMode");
      store.getState().toggleExperimentalFeature("voiceCommands");
      store.getState().toggleExperimentalFeature("aiCoach");

      const state = store.getState();
      expect(state.experimentalFeatures.newTrainingMode).toBe(true);
      expect(state.experimentalFeatures.voiceCommands).toBe(true);
      expect(state.experimentalFeatures.aiCoach).toBe(true);
      expect(state.experimentalFeatures.advancedAnalytics).toBe(false);
      expect(state.experimentalFeatures.multiplePerspective).toBe(false);
    });
  });

  describe("Data Synchronization", () => {
    /**
     * Tests sync start process
     */
    it("should start sync process", () => {
      store.getState().startSync();

      const state = store.getState();
      expect(state.dataSync.syncInProgress).toBe(true);
      expect(state.dataSync.syncError).toBeNull();
    });

    /**
     * Tests successful sync completion
     */
    it("should complete sync successfully", () => {
      const beforeTime = Date.now();

      store.getState().startSync();
      store.getState().completeSync(true);

      const afterTime = Date.now();
      const state = store.getState();

      expect(state.dataSync.syncInProgress).toBe(false);
      expect(state.dataSync.syncError).toBeNull();
      expect(state.dataSync.lastSync).toBeGreaterThanOrEqual(beforeTime);
      expect(state.dataSync.lastSync).toBeLessThanOrEqual(afterTime);
    });

    /**
     * Tests failed sync completion
     */
    it("should handle sync failure", () => {
      const originalLastSync = store.getState().dataSync.lastSync;

      store.getState().startSync();
      store.getState().completeSync(false, "Network error");

      const state = store.getState();
      expect(state.dataSync.syncInProgress).toBe(false);
      expect(state.dataSync.syncError).toBe("Network error");
      expect(state.dataSync.lastSync).toBe(originalLastSync); // Should not update on failure
    });

    /**
     * Tests sync status selectors
     */
    it("should detect sync status correctly", () => {
      let state = store.getState();
      expect(settingsSelectors.selectIsSyncInProgress(state)).toBe(false);

      store.getState().startSync();
      state = store.getState();
      expect(settingsSelectors.selectIsSyncInProgress(state)).toBe(true);

      store.getState().completeSync(true);
      state = store.getState();
      expect(settingsSelectors.selectIsSyncInProgress(state)).toBe(false);
    });

    /**
     * Tests time until next sync calculation
     */
    it("should calculate time until next sync", () => {
      let state = store.getState();
      expect(settingsSelectors.selectTimeUntilNextSync(state)).toBeNull();

      // Enable auto-sync and set last sync
      store.getState().updateSettings({
        dataSync: {
          autoSync: true,
          lastSync: Date.now() - 60000, // 1 minute ago
          syncInterval: 300000, // 5 minutes
        },
      });

      state = store.getState();
      const timeUntilNext = settingsSelectors.selectTimeUntilNextSync(state);
      expect(timeUntilNext).toBeGreaterThan(0);
      expect(timeUntilNext).toBeLessThan(300000); // Less than full interval
    });
  });

  describe("resetSettings", () => {
    /**
     * Tests complete settings reset
     */
    it("should reset all settings to defaults", () => {
      // Modify various settings
      store.getState().updateSettings({
        theme: mockTheme,
        notifications: mockNotifications,
        difficulty: mockDifficulty,
        privacy: mockPrivacy,
        language: "en",
        firstTimeUser: false,
      });

      store.getState().toggleExperimentalFeature("aiCoach");
      store.getState().startSync();

      // Reset all settings
      store.getState().resetSettings();

      // Verify reset to defaults
      const state = store.getState();
      const expectedState = createInitialSettingsState();

      expect(state.theme).toEqual(expectedState.theme);
      expect(state.notifications).toEqual(expectedState.notifications);
      expect(state.difficulty).toEqual(expectedState.difficulty);
      expect(state.privacy).toEqual(expectedState.privacy);
      expect(state.experimentalFeatures).toEqual(
        expectedState.experimentalFeatures,
      );
      expect(state.dataSync).toEqual(expectedState.dataSync);
      expect(state.language).toBe(expectedState.language);
      expect(state.firstTimeUser).toBe(expectedState.firstTimeUser);
      expect(state.lastSettingsUpdate).toBe(expectedState.lastSettingsUpdate);
    });
  });

  describe("Selectors", () => {
    beforeEach(() => {
      // Set up test data
      store.getState().updateSettings({
        theme: {
          mode: "dark",
          colorScheme: "purple",
        },
        notifications: {
          enabled: false,
        },
        difficulty: {
          level: "expert",
        },
        language: "en",
        firstTimeUser: false,
      });

      store.getState().toggleExperimentalFeature("aiCoach");
    });

    /**
     * Tests basic state selectors
     */
    it("should select correct state values", () => {
      const state = store.getState();

      expect(settingsSelectors.selectTheme(state).mode).toBe("dark");
      expect(settingsSelectors.selectTheme(state).colorScheme).toBe("purple");
      expect(settingsSelectors.selectNotifications(state).enabled).toBe(false);
      expect(settingsSelectors.selectDifficulty(state).level).toBe("expert");
      expect(settingsSelectors.selectLanguage(state)).toBe("en");
      expect(settingsSelectors.selectIsFirstTimeUser(state)).toBe(false);
      expect(settingsSelectors.selectExperimentalFeatures(state).aiCoach).toBe(
        true,
      );
    });

    /**
     * Tests computed selectors
     */
    it("should calculate computed values correctly", () => {
      const state = store.getState();

      expect(settingsSelectors.selectIsDarkMode(state)).toBe(true);
      expect(settingsSelectors.selectDifficultyLevel(state)).toBe("expert");
      expect(settingsSelectors.selectNotificationsEnabled(state)).toBe(false);
      expect(settingsSelectors.selectIsSyncInProgress(state)).toBe(false);
      expect(
        settingsSelectors.selectIsExperimentalFeatureEnabled("aiCoach")(state),
      ).toBe(true);
      expect(
        settingsSelectors.selectIsExperimentalFeatureEnabled("voiceCommands")(
          state,
        ),
      ).toBe(false);
    });

    /**
     * Tests restart requirement detection
     */
    it("should detect restart requirements", () => {
      // Create fresh store without beforeEach modifications
      const freshStore = createTestStore();
      let state = freshStore.getState();

      // Should not require restart initially
      expect(settingsSelectors.selectRequiresRestart(state)).toBe(false);

      // Language change should require restart
      freshStore.getState().updateSettings({ language: "fr" });
      state = freshStore.getState();
      expect(settingsSelectors.selectRequiresRestart(state)).toBe(true);
    });
  });

  describe("Restart Detection Logic", () => {
    let freshStore: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      // Use fresh store for each test to avoid state pollution
      freshStore = createTestStore();
    });

    /**
     * Tests initial state has no restart requirement
     */
    it("should not require restart on initial state", () => {
      const state = freshStore.getState();
      expect(state.restartRequired).toBe(false);
      expect(settingsSelectors.selectRequiresRestart(state)).toBe(false);
    });

    /**
     * Tests non-critical setting changes don't trigger restart
     */
    it("should not require restart for non-critical settings", () => {
      // Theme changes should not require restart
      freshStore.getState().updateSettings({
        theme: { mode: "dark", colorScheme: "purple" },
      });

      let state = freshStore.getState();
      expect(state.restartRequired).toBe(false);

      // Notification changes should not require restart
      freshStore.getState().updateSettings({
        notifications: { enabled: false, soundEnabled: false },
      });

      state = freshStore.getState();
      expect(state.restartRequired).toBe(false);

      // Difficulty changes should not require restart
      freshStore.getState().updateSettings({
        difficulty: { level: "expert", maxHints: 1 },
      });

      state = freshStore.getState();
      expect(state.restartRequired).toBe(false);
    });

    /**
     * Tests language change triggers restart requirement
     */
    it("should require restart when language changes", () => {
      freshStore.getState().updateSettings({ language: "en" });

      const state = freshStore.getState();
      expect(state.restartRequired).toBe(true);
      expect(settingsSelectors.selectRequiresRestart(state)).toBe(true);
    });

    /**
     * Tests crash reporting change triggers restart requirement
     */
    it("should require restart when crash reporting changes", () => {
      freshStore.getState().updateSettings({
        privacy: { crashReporting: false },
      });

      const state = freshStore.getState();
      expect(state.restartRequired).toBe(true);
    });

    /**
     * Tests performance monitoring change triggers restart requirement
     */
    it("should require restart when performance monitoring changes", () => {
      freshStore.getState().updateSettings({
        privacy: { performanceMonitoring: false },
      });

      const state = freshStore.getState();
      expect(state.restartRequired).toBe(true);
    });

    /**
     * Tests updatePrivacy method also triggers restart detection
     */
    it("should require restart when using updatePrivacy method", () => {
      freshStore.getState().updatePrivacy({ crashReporting: false });

      const state = freshStore.getState();
      expect(state.restartRequired).toBe(true);
    });

    /**
     * Tests no-op updates don't trigger restart requirement
     */
    it("should not require restart for no-op updates", () => {
      const initialState = freshStore.getState();

      // Set language to same value (no-op)
      freshStore.getState().updateSettings({ language: initialState.language });

      let state = freshStore.getState();
      expect(state.restartRequired).toBe(false);

      // Set privacy settings to same values (no-op)
      freshStore.getState().updateSettings({
        privacy: {
          crashReporting: initialState.privacy.crashReporting,
          performanceMonitoring: initialState.privacy.performanceMonitoring,
        },
      });

      state = freshStore.getState();
      expect(state.restartRequired).toBe(false);
    });

    /**
     * Tests restart flag stickiness
     */
    it("should keep restart flag true once set", () => {
      // Trigger restart requirement
      freshStore.getState().updateSettings({ language: "en" });
      expect(freshStore.getState().restartRequired).toBe(true);

      // Make non-critical changes
      freshStore.getState().updateSettings({
        theme: { mode: "dark" },
        notifications: { enabled: false },
      });

      // Flag should remain true
      const state = freshStore.getState();
      expect(state.restartRequired).toBe(true);
    });

    /**
     * Tests multiple critical settings changes
     */
    it("should require restart when multiple critical settings change", () => {
      freshStore.getState().updateSettings({
        language: "en",
        privacy: {
          crashReporting: false,
          performanceMonitoring: false,
        },
      });

      const state = freshStore.getState();
      expect(state.restartRequired).toBe(true);
    });

    /**
     * Tests clearRestartRequired action
     */
    it("should clear restart requirement when explicitly cleared", () => {
      // Set restart requirement
      freshStore.getState().updateSettings({ language: "en" });
      expect(freshStore.getState().restartRequired).toBe(true);

      // Clear restart requirement
      freshStore.getState().clearRestartRequired();

      const state = freshStore.getState();
      expect(state.restartRequired).toBe(false);
      expect(settingsSelectors.selectRequiresRestart(state)).toBe(false);
    });

    /**
     * Tests restart detection with partial privacy updates
     */
    it("should handle partial privacy updates correctly", () => {
      // Update only analytics (non-critical)
      freshStore.getState().updateSettings({
        privacy: { analytics: false },
      });
      expect(freshStore.getState().restartRequired).toBe(false);

      // Update crash reporting (critical)
      freshStore.getState().updateSettings({
        privacy: { crashReporting: false },
      });
      expect(freshStore.getState().restartRequired).toBe(true);
    });

    /**
     * Tests restart requirement selector
     */
    it("should have working restart requirement selector", () => {
      const state = freshStore.getState();

      // Initial state
      expect(settingsSelectors.selectRestartRequired(state)).toBe(false);

      // After critical change
      freshStore.getState().updateSettings({ language: "en" });
      const updatedState = freshStore.getState();
      expect(settingsSelectors.selectRestartRequired(updatedState)).toBe(true);
    });
  });

  describe("Integration Scenarios", () => {
    /**
     * Tests complete settings configuration flow
     */
    it("should handle complete settings configuration", () => {
      // Configure theme for dark mode
      store.getState().updateTheme({
        mode: "dark",
        colorScheme: "green",
        boardTheme: "wood",
        highContrast: false,
      });

      // Configure notifications
      store.getState().updateNotifications({
        enabled: true,
        dailyReminders: true,
        preferredTime: "08:00",
        soundEnabled: false,
      });

      // Set expert difficulty
      store.getState().updateDifficulty({
        level: "expert",
        maxHints: 1,
        timePressure: true,
        defaultTimeLimit: 180,
        mistakeTolerance: "strict",
      });

      // Enable privacy-conscious settings
      store.getState().updatePrivacy({
        analytics: false,
        crashReporting: true,
        usageStatistics: false,
        dataRetentionDays: 90,
      });

      // Enable experimental features
      store.getState().toggleExperimentalFeature("advancedAnalytics");
      store.getState().toggleExperimentalFeature("aiCoach");

      // Set language and complete onboarding
      store.getState().updateSettings({
        language: "en",
        firstTimeUser: false,
      });

      // Verify final configuration
      const state = store.getState();
      expect(state.theme.mode).toBe("dark");
      expect(state.theme.colorScheme).toBe("green");
      expect(state.notifications.enabled).toBe(true);
      expect(state.notifications.preferredTime).toBe("08:00");
      expect(state.difficulty.level).toBe("expert");
      expect(state.difficulty.maxHints).toBe(1);
      expect(state.privacy.analytics).toBe(false);
      expect(state.privacy.crashReporting).toBe(true);
      expect(state.experimentalFeatures.advancedAnalytics).toBe(true);
      expect(state.experimentalFeatures.aiCoach).toBe(true);
      expect(state.language).toBe("en");
      expect(state.firstTimeUser).toBe(false);
      expect(state.lastSettingsUpdate).toBeDefined();
    });

    /**
     * Tests sync configuration and execution
     */
    it("should handle sync configuration and execution", () => {
      // Configure sync settings
      store.getState().updateSettings({
        dataSync: {
          enabled: true,
          autoSync: true,
          syncInterval: 600000, // 10 minutes
        },
      });

      // Start sync process
      store.getState().startSync();
      expect(store.getState().dataSync.syncInProgress).toBe(true);

      // Complete sync successfully
      store.getState().completeSync(true);
      const state = store.getState();

      expect(state.dataSync.syncInProgress).toBe(false);
      expect(state.dataSync.lastSync).toBeDefined();
      expect(state.dataSync.syncError).toBeNull();

      // Check time until next sync
      const timeUntilNext = settingsSelectors.selectTimeUntilNextSync(state);
      expect(timeUntilNext).toBeGreaterThan(0);
    });
  });
});
