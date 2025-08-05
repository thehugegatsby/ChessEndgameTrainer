/**
 * @file Tablebase slice action hooks
 * @module store/hooks/useTablebaseActions
 *
 * @description
 * Provides access to tablebase-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for tablebase-related actions
 *
 * @description
 * Provides all actions related to tablebase analysis and evaluation
 * management including status updates and evaluation storage.
 *
 * @returns {Object} Tablebase actions
 *
 * @example
 * ```tsx
 * const { setAnalysisStatus, addEvaluation } = useTablebaseActions();
 *
 * // Update analysis status
 * setAnalysisStatus('loading');
 *
 * // Add position evaluation
 * addEvaluation(positionAnalysis);
 * ```
 */
export const useTablebaseActions = () =>
  useStore((state) => ({
    // Tablebase moves
    setTablebaseMove: state.setTablebaseMove,

    // Analysis status
    setAnalysisStatus: state.setAnalysisStatus,

    // Evaluations
    addEvaluation: state.addEvaluation,
    setEvaluations: state.setEvaluations,
    setCurrentEvaluation: state.setCurrentEvaluation,
  }));
