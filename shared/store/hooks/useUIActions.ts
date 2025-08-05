/**
 * @file UI slice action hooks
 * @module store/hooks/useUIActions
 *
 * @description
 * Provides access to UI-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for UI-related actions
 *
 * @description
 * Provides all actions related to UI state management including
 * toasts, modals, sidebars, and error dialogs.
 *
 * @returns {Object} UI actions
 *
 * @example
 * ```tsx
 * const { showToast, setMoveErrorDialog, toggleSidebar } = useUIActions();
 *
 * // Show success toast
 * showToast('Move successful!', 'success');
 *
 * // Show move error dialog
 * setMoveErrorDialog({
 *   isOpen: true,
 *   wdlBefore: 0,
 *   wdlAfter: -1,
 *   bestMove: 'Nf3'
 * });
 *
 * // Toggle sidebar
 * toggleSidebar();
 * ```
 */
export const useUIActions = () =>
  useStore((state) => ({
    // Toast notifications
    showToast: state.showToast,

    // Modal management
    openModal: state.openModal,
    closeModal: state.closeModal,

    // Sidebar controls
    toggleSidebar: state.toggleSidebar,
    setSidebarOpen: state.setSidebarOpen,

    // Analysis panel
    updateAnalysisPanel: state.updateAnalysisPanel,

    // Error dialogs
    setMoveErrorDialog: state.setMoveErrorDialog,

    // Loading states
    setLoading: state.setLoading,
  }));
