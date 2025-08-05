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
import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type {
  RootState,
  TablebaseState as TablebaseStateType,
  TablebaseActions as TablebaseActionsType,
} from "../slices/types";
import type { AsyncActions } from "../slices/types";

// Extend tablebase actions with relevant async action
type ExtendedTablebaseActions = TablebaseActionsType &
  Pick<AsyncActions, "requestPositionEvaluation">;

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
      // Tablebase state
      tablebaseMove: state.tablebaseMove,
      analysisStatus: state.analysisStatus,
      evaluations: state.evaluations,
      currentEvaluation: state.currentEvaluation,
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
 * @returns {ExtendedTablebaseActions} Tablebase action functions
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
export const useTablebaseActions = (): ExtendedTablebaseActions => {
  // Non-reactive access to avoid SSR issues
  const actions = useStore.getState();

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

      // Orchestrated action
      requestPositionEvaluation: actions.requestPositionEvaluation,
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
  ExtendedTablebaseActions,
] => {
  return [useTablebaseState(), useTablebaseActions()];
};
