/**
 * Store exports
 * Central export point for state management
 */

// Export context-based store and provider
export { useStore, useStoreApi, StoreProvider } from './StoreContext';
export { createStore } from './createStore';

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
  TablebaseAnalysisState,
} from './types';

// Re-export types that are used widely
export type { ValidatedMove, ChessInstance, PositionAnalysis } from '@shared/types';

// Export all from new slice types (these have the updated interfaces)
export * from './slices/types';

// Export selectors for components that need them
export { gameSelectors } from './slices/gameSlice';
export { tablebaseSelectors } from './slices/tablebaseSlice';
export { trainingSelectors } from './slices/trainingSlice';
export { uiSelectors } from './slices/uiSlice';
