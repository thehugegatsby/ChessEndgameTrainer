/**
 * @file UI store hooks with state/action separation
 * @module store/hooks/useUIStore
 *
 * @description
 * Provides optimized hooks for UI-related state and actions with proper separation.
 * This pattern prevents unnecessary re-renders in action-only components while
 * maintaining excellent developer experience.
 *
 * Three hooks are exported:
 * - useUIState(): For components that need reactive state
 * - useUIActions(): For components that only dispatch actions (no re-renders)
 * - useUIStore(): Convenience hook returning [state, actions] tuple
 */

import { useMemo } from "react";
import { useStore, useStoreApi } from "../StoreContext";
import { useShallow } from "zustand/react/shallow";
import type { RootState, UIActions as UIActionsType } from "../slices/types";
import type { UIState } from "../types";

/**
 * Hook for reactive UI state properties
 *
 * @description
 * Subscribes components to UI state changes. Use this in components
 * that need to display or react to UI data. Will re-render when any
 * selected UI state changes.
 *
 * @returns {UIState} UI state properties
 *
 * @example
 * ```tsx
 * const { toasts, currentModal, isSidebarOpen } = useUIState();
 *
 * // Component will re-render when these values change
 * return (
 *   <>
 *     {toasts.map(toast => <Toast key={toast.id} {...toast} />)}
 *     {currentModal && <Modal type={currentModal} />}
 *   </>
 * );
 * ```
 */
export const useUIState = (): UIState => {
  return useStore(
    useShallow((state: RootState) => ({
      // UI state from nested structure
      isSidebarOpen: state.ui.isSidebarOpen,
      currentModal: state.ui.currentModal,
      toasts: state.ui.toasts,
      loading: state.ui.loading,
      analysisPanel: state.ui.analysisPanel,
    })),
  );
};

/**
 * Hook for UI action functions
 *
 * @description
 * Returns stable action functions that never cause re-renders.
 * Use this in components that only need to trigger UI actions
 * without subscribing to state changes.
 *
 * @returns {UIActionsType} UI action functions
 *
 * @example
 * ```tsx
 * const { showToast, toggleSidebar, openModal } = useUIActions();
 *
 * // This component will never re-render due to UI state changes
 * return (
 *   <>
 *     <button onClick={toggleSidebar}>Toggle Menu</button>
 *     <button onClick={() => showToast('Success!', 'success')}>Show Toast</button>
 *     <button onClick={() => openModal('settings')}>Settings</button>
 *   </>
 * );
 * ```
 */
export const useUIActions = (): UIActionsType => {
  // Non-reactive access to avoid SSR issues
  const storeApi = useStoreApi();
  const state = storeApi.getState();
  const actions = state.ui;

  // Memoize the actions object to ensure stable reference
  return useMemo(
    () => ({
      // UI actions
      toggleSidebar: actions.toggleSidebar,
      setIsSidebarOpen: actions.setIsSidebarOpen,
      openModal: actions.openModal,
      closeModal: actions.closeModal,
      showToast: actions.showToast,
      removeToast: actions.removeToast,
      setLoading: actions.setLoading,
      updateAnalysisPanel: actions.updateAnalysisPanel,
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
 * @returns {[UIState, UIActionsType]} Tuple of UI state and actions
 *
 * @example
 * ```tsx
 * const [uiState, uiActions] = useUIStore();
 *
 * const handleAnalysisToggle = () => {
 *   uiActions.updateAnalysisPanel({
 *     isOpen: !uiState.analysisPanel.isOpen
 *   });
 * };
 *
 * if (uiState.loading.global) {
 *   return <GlobalSpinner />;
 * }
 * ```
 */
export const useUIStore = (): [UIState, UIActionsType] => {
  return [useUIState(), useUIActions()];
};
