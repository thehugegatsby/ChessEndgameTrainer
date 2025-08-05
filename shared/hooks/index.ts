// Export all custom hooks for easy importing

// Main hooks - use these
export { useTrainingSession } from "./useTrainingSession";
export { usePositionAnalysis } from "./usePositionAnalysis";
export {
  useLocalStorage,
  useLocalStorageWithState,
  useLocalStorageSync,
} from "./useLocalStorage";
export { useDebounce } from "./useDebounce";

// Re-export existing hooks if any
export { useAnalysisData } from "./useAnalysisData";

// Hydration hook for Zustand v5
export { useHydration, useStoreHydration } from "./useHydration";
