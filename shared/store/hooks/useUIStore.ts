/**
 * @file Consolidated UI store hook
 * @module store/hooks/useUIStore
 *
 * @description
 * Provides unified access to UI-related state and actions from the Zustand store.
 * This consolidated hook manages all UI elements including toasts, modals,
 * sidebars, and loading states. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive UI state and actions
 *
 * @description
 * Central hook for UI state management including notifications,
 * dialogs, panels, and loading indicators. Provides both state
 * queries and mutation actions for UI elements.
 *
 * @returns {Object} UI state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   analysisPanel,
 *   isSidebarOpen,
 *   moveErrorDialog,
 *
 *   // Actions
 *   showToast,
 *   toggleSidebar,
 *   updateAnalysisPanel,
 * } = useUIStore();
 *
 * // Show success notification
 * const handleSuccess = () => {
 *   showToast('Operation completed!', 'success');
 * };
 *
 * // Toggle analysis panel
 * const toggleAnalysis = () => {
 *   updateAnalysisPanel({ isOpen: !analysisPanel.isOpen });
 * };
 *
 * // Check sidebar state
 * if (isSidebarOpen) {
 *   // Sidebar is open
 * }
 * ```
 */
export const useUIStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === UI State ===
      toasts: state.toasts,
      currentModal: state.currentModal,
      isSidebarOpen: state.isSidebarOpen,
      loading: state.loading,
      analysisPanel: state.analysisPanel,
      moveErrorDialog: state.moveErrorDialog,

      // === Toast Actions ===
      showToast: state.showToast,

      // === Modal Actions ===
      openModal: state.openModal,
      closeModal: state.closeModal,

      // === Sidebar Actions ===
      toggleSidebar: state.toggleSidebar,
      setIsSidebarOpen: state.setIsSidebarOpen,

      // === Loading Actions ===
      setLoading: state.setLoading,

      // === Panel Actions ===
      updateAnalysisPanel: state.updateAnalysisPanel,

      // === Dialog Actions ===
      setMoveErrorDialog: state.setMoveErrorDialog,
    })),
  );
};
