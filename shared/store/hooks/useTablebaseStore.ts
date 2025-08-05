/**
 * @file Consolidated Tablebase store hook
 * @module store/hooks/useTablebaseStore
 *
 * @description
 * Provides unified access to tablebase-related state and actions from the Zustand store.
 * This consolidated hook manages tablebase API interactions, evaluations, and analysis status.
 * Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive tablebase state and actions
 *
 * @description
 * Central hook for tablebase API state management including
 * evaluation results, analysis status, and move suggestions.
 * Provides both state queries and mutation actions for tablebase operations.
 *
 * @returns {Object} Tablebase state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   tablebaseMove,
 *   analysisStatus,
 *   evaluations,
 *   currentEvaluation,
 *
 *   // Actions
 *   setTablebaseMove,
 *   setAnalysisStatus,
 *   addEvaluation,
 * } = useTablebaseStore();
 *
 * // Check analysis status
 * if (analysisStatus === 'loading') {
 *   // Show loading spinner
 * }
 *
 * // Display tablebase move
 * if (tablebaseMove) {
 *   console.log(`Best move: ${tablebaseMove}`);
 * }
 *
 * // Add new evaluation
 * const handleEvaluation = (eval: PositionAnalysis) => {
 *   addEvaluation(eval);
 * };
 * ```
 */
export const useTablebaseStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === Tablebase State ===
      tablebaseMove: state.tablebaseMove,
      analysisStatus: state.analysisStatus,
      evaluations: state.evaluations,
      currentEvaluation: state.currentEvaluation,

      // === Tablebase Actions ===
      setTablebaseMove: state.setTablebaseMove,
      setAnalysisStatus: state.setAnalysisStatus,
      addEvaluation: state.addEvaluation,
      setEvaluations: state.setEvaluations,
      setCurrentEvaluation: state.setCurrentEvaluation,
      clearTablebaseState: state.clearTablebaseState,
    })),
  );
};
