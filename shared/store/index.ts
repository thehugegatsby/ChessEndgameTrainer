/**
 * Store exports
 * Central export point for state management
 */

// Export from new root store
export { useStore, store } from "./rootStore";

// Export specific types from old types file (avoid conflicts)
export type {
  UserState,
  UserPreferences,
  EndgameSessionState,
  ProgressState,
  PositionProgress,
  DailyStats,
  Achievement,
  UIState,
  LoadingState,
  AnalysisPanelState,
  Toast,
  ModalType,
  SettingsState,
  ExperimentalFeatures,
  DataSyncState,
  AnalysisStatus,
  CompleteEndgameSessionState,
  EndgameTrainingState,
  TablebaseAnalysisState,
} from "./types";

// Re-export types that are used widely
export type {
  ValidatedMove,
  ChessInstance,
  PositionAnalysis,
} from "@shared/types";

// Export all from new slice types (these have the updated interfaces)
export * from "./slices/types";

// Export selectors for components that need them
export { userSelectors } from "./slices/userSlice";
export { gameSelectors } from "./slices/gameSlice";
export { tablebaseSelectors } from "./slices/tablebaseSlice";
export { trainingSelectors } from "./slices/trainingSlice";
export { progressSelectors } from "./slices/progressSlice";
export { uiSelectors } from "./slices/uiSlice";
export { settingsSelectors } from "./slices/settingsSlice";
