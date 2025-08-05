/**
 * @file Consolidated tablebase store hook
 * @module store/hooks/useTablebaseStore
 *
 * @description
 * Provides unified access to tablebase-related state and actions from the Zustand store.
 * This consolidated hook manages tablebase evaluations, analysis status, caching,
 * and API interactions. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive tablebase state and actions
 *
 * @description
 * Central hook for tablebase functionality including position evaluation,
 * best move suggestions, analysis status tracking, and evaluation caching.
 * Provides both state queries and mutation actions for tablebase data.
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
 *   clearTablebaseState,
 * } = useTablebaseStore();
 *
 * // Request tablebase evaluation
 * const handlePositionAnalysis = async (fen: string) => {
 *   setAnalysisStatus('loading');
 *   try {
 *     // Evaluation logic handled by orchestrators
 *     console.log('Analysis status:', analysisStatus);
 *   } catch (error) {
 *     setAnalysisStatus('error');
 *   }
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
