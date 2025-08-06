/**
 * @file Tablebase store hooks with state/action separation
 * @module store/hooks/useTablebaseStore
 *
 * @description
 * Provides optimized hooks for tablebase-related state and actions with proper separation.
 * This pattern prevents unnecessary re-renders in action-only components while
 * maintaining excellent developer experience.
 *
 * Three hooks are exported:
 * - useTablebaseState(): For components that need reactive state
 * - useTablebaseActions(): For components that only dispatch actions (no re-renders)
 * - useTablebaseStore(): Convenience hook returning [state, actions] tuple
 */

import { useMemo } from "react";
import { useStore, useStoreApi } from "../StoreContext";
import { useShallow } from "zustand/react/shallow";
import type {
  RootState,
  TablebaseState as TablebaseStateType,
  TablebaseActions as TablebaseActionsType,
} from "../slices/types";
// Note: requestPositionEvaluation removed - use chessService directly

/**
 * Hook for reactive tablebase state properties
 *
 * @description
 * Subscribes components to tablebase state changes. Use this in components
 * that need to display or react to evaluation data. Will re-render when any
 * selected tablebase state changes.
 *
 * @returns {TablebaseStateType} Tablebase state properties
 *
 * @example
 * ```tsx
 * const { tablebaseMove, analysisStatus, currentEvaluation } = useTablebaseState();
 *
 * // Component will re-render when these values change
 * if (analysisStatus === 'loading') {
 *   return <Spinner />;
 * }
 * ```
 */
export const useTablebaseState = (): TablebaseStateType => {
  return useStore(
    useShallow((state: RootState) => ({
      // Tablebase state from nested structure
      tablebaseMove: state.tablebase.tablebaseMove,
      analysisStatus: state.tablebase.analysisStatus,
      evaluations: state.tablebase.evaluations,
      currentEvaluation: state.tablebase.currentEvaluation,
    })),
  );
};

/**
 * Hook for tablebase action functions
 *
 * @description
 * Returns stable action functions that never cause re-renders.
 * Use this in components that only need to trigger tablebase actions
 * without subscribing to state changes.
 *
 * @returns {TablebaseActionsType} Tablebase action functions
 *
 * @example
 * ```tsx
 * const { setAnalysisStatus, requestPositionEvaluation } = useTablebaseActions();
 *
 * // This component will never re-render due to tablebase state changes
 * const analyzePosition = async () => {
 *   setAnalysisStatus('loading');
 *   await requestPositionEvaluation();
 * };
 * ```
 */
export const useTablebaseActions = (): TablebaseActionsType => {
  // Non-reactive access to avoid SSR issues
  const storeApi = useStoreApi();
  const state = storeApi.getState();
  const actions = state.tablebase;

  // Memoize the actions object to ensure stable reference
  return useMemo(
    () => ({
      // Tablebase actions
      setTablebaseMove: actions.setTablebaseMove,
      setAnalysisStatus: actions.setAnalysisStatus,
      addEvaluation: actions.addEvaluation,
      setEvaluations: actions.setEvaluations,
      setCurrentEvaluation: actions.setCurrentEvaluation,
      clearTablebaseState: actions.clearTablebaseState,

      // Note: requestPositionEvaluation removed - use chessService.fetchEvaluation() directly
    }),
    [actions],
  );
};

/**
 * Convenience hook for components that need both state and actions
 *
 * @description
 * Returns a tuple of [state, actions] for components that need both.
 * This maintains the familiar pattern while benefiting from the
 * optimized separation under the hood.
 *
 * @returns {[TablebaseStateType, ExtendedTablebaseActions]} Tuple of tablebase state and actions
 *
 * @example
 * ```tsx
 * const [tablebaseState, tablebaseActions] = useTablebaseStore();
 *
 * const handleEvaluation = (eval: PositionAnalysis) => {
 *   tablebaseActions.addEvaluation(eval);
 *   if (!tablebaseState.currentEvaluation) {
 *     tablebaseActions.setCurrentEvaluation(eval);
 *   }
 * };
 * ```
 */
export const useTablebaseStore = (): [
  TablebaseStateType,
  TablebaseActionsType,
] => {
  return [useTablebaseState(), useTablebaseActions()];
};
