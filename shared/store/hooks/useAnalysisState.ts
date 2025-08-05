/**
 * @file Analysis state hook for tablebase components
 * @module store/hooks/useAnalysisState
 *
 * @description
 * Task-oriented hook providing tablebase analysis state for
 * components that display position evaluations and analysis.
 * Uses useShallow for optimal re-render performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Hook for tablebase analysis state
 *
 * @description
 * Provides all state related to position analysis and tablebase
 * evaluations. Used by components that display analysis results,
 * evaluation scores, and best moves.
 *
 * @returns {Object} Analysis state
 * @returns {string | null} tablebaseMove - Best move from tablebase
 * @returns {AnalysisStatus} analysisStatus - Current analysis status
 * @returns {PositionAnalysis[]} evaluations - Position evaluation history
 * @returns {PositionAnalysis} currentEvaluation - Latest evaluation
 * @returns {boolean} isAnalyzing - Whether analysis is in progress
 *
 * @example
 * ```tsx
 * const { analysisStatus, currentEvaluation, isAnalyzing } = useAnalysisState();
 *
 * if (isAnalyzing) {
 *   return <LoadingSpinner />;
 * }
 *
 * return (
 *   <EvaluationDisplay
 *     evaluation={currentEvaluation}
 *     status={analysisStatus}
 *   />
 * );
 * ```
 */
export const useAnalysisState = () =>
  useStore(
    useShallow((state) => ({
      // Tablebase data
      tablebaseMove: state.tablebaseMove,
      analysisStatus: state.analysisStatus,
      evaluations: state.evaluations,
      currentEvaluation: state.currentEvaluation,

      // Computed states
      isAnalyzing: state.analysisStatus === "loading",
      hasAnalysis:
        state.analysisStatus === "success" && state.currentEvaluation != null,
    })),
  );
