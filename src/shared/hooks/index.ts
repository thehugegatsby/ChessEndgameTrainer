// Export all custom hooks for easy importing

// Main hooks - use these
export { useTrainingSession } from "./useTrainingSession";
export { usePositionAnalysis } from "./usePositionAnalysis";
export { useLocalStorage, useLocalStorageWithState } from "./useLocalStorage";
export { useDebounce } from "./useDebounce";

// Re-export existing hooks if any
export { useAnalysisData } from "./useAnalysisData";

// Hydration hook for Zustand v5
export { useHydration, useStoreHydration } from "./useHydration";

// Component hooks for TrainingBoard refactoring
export { useMoveHandlers } from "./useMoveHandlers";
export { useDialogHandlers } from "./useDialogHandlers";
export { useMoveValidation } from "./useMoveValidation";
export { useGameNavigation } from "./useGameNavigation";
