/**
 * @file UI state slice for Zustand store
 * @module store/slices/uiSlice
 * @description Manages all UI-related state including modals, toasts, loading states, and sidebar visibility.
 * This slice is responsible for transient UI state that doesn't need to be persisted.
 *
 * @example
 * ```typescript
 * // Using the UI slice in a component
 * import { useStore } from '@/store';
 * import { uiSelectors } from '@/store/slices/uiSlice';
 *
 * function MyComponent() {
 *   const toasts = useStore(uiSelectors.selectToasts);
 *   const showToast = useStore(state => state.showToast);
 *
 *   const handleSuccess = () => {
 *     showToast('Operation successful!', 'success');
 *   };
 * }
 * ```
 */

import { ImmerStateCreator, UISlice } from "./types";
import { nanoid } from "nanoid";
import { Toast, ModalType, LoadingState, AnalysisPanelState } from "../types";

/**
 * Creates the initial UI state with default values
 *
 * @returns {Object} Initial UI state
 * @returns {boolean} returns.isSidebarOpen - Sidebar visibility (default: true)
 * @returns {ModalType|null} returns.currentModal - Currently open modal type or null
 * @returns {Toast[]} returns.toasts - Array of active toast notifications
 * @returns {LoadingState} returns.loading - Loading states for different operations
 * @returns {AnalysisPanelState} returns.analysisPanel - Analysis panel configuration
 *
 * @example
 * ```typescript
 * const initialState = createInitialUIState();
 * console.log(initialState.isSidebarOpen); // true
 * console.log(initialState.toasts); // []
 * ```
 */
export const createInitialUIState = () => ({
  isSidebarOpen: true,
  currentModal: null as ModalType | null,
  toasts: [] as Toast[],
  loading: {
    global: false,
    tablebase: false,
    position: false,
    analysis: false,
  } as LoadingState,
  analysisPanel: {
    isOpen: false,
    activeTab: "moves" as const,
    showTablebase: true,
  } as AnalysisPanelState,
  moveErrorDialog: null as {
    isOpen: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    bestMove?: string;
  } | null,
});

/**
 * Creates the UI slice for the Zustand store
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {UISlice} Complete UI slice with state and actions
 *
 * @remarks
 * This slice follows the Zustand slice pattern and is designed to be combined
 * with other slices in the root store. All actions are synchronous and side-effect free,
 * except for the auto-removal timer in showToast.
 *
 * @example
 * ```typescript
 * // In your root store
 * import { create } from 'zustand';
 * import { createUISlice } from './slices/uiSlice';
 *
 * const useStore = create<RootState>()((...args) => ({
 *   ...createUISlice(...args),
 *   ...createGameSlice(...args),
 *   // ... other slices
 * }));
 * ```
 */
export const createUISlice: ImmerStateCreator<UISlice> = (set, get) => ({
  // Initial state
  ...createInitialUIState(),

  // Actions
  /**
   * Toggles the sidebar visibility state
   *
   * @fires stateChange - When sidebar state changes
   *
   * @example
   * ```typescript
   * // Toggle sidebar from open to closed or vice versa
   * store.getState().toggleSidebar();
   * ```
   */
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  /**
   * Sets the sidebar visibility state explicitly
   *
   * @param {boolean} isOpen - Whether the sidebar should be open
   * @fires stateChange - When sidebar state changes
   *
   * @example
   * ```typescript
   * // Open sidebar
   * store.getState().setSidebarOpen(true);
   *
   * // Close sidebar
   * store.getState().setSidebarOpen(false);
   * ```
   */
  setSidebarOpen: (isOpen: boolean) =>
    set({
      isSidebarOpen: isOpen,
    }),

  /**
   * Opens a modal by type, closing any currently open modal
   *
   * @param {ModalType} type - The type of modal to open
   * @fires stateChange - When modal state changes
   *
   * @remarks
   * Only one modal can be open at a time. Opening a new modal will close
   * any currently open modal.
   *
   * @example
   * ```typescript
   * // Open settings modal
   * store.getState().openModal('settings');
   *
   * // Open achievements modal
   * store.getState().openModal('achievements');
   * ```
   */
  openModal: (type: ModalType) =>
    set({
      currentModal: type,
    }),

  /**
   * Closes the currently open modal
   *
   * @fires stateChange - When modal is closed
   *
   * @example
   * ```typescript
   * // Close any open modal
   * store.getState().closeModal();
   * ```
   */
  closeModal: () =>
    set({
      currentModal: null,
    }),

  /**
   * Shows a toast notification with auto-removal
   *
   * @param {string} message - The message to display in the toast
   * @param {Toast["type"]} type - Toast type determining appearance and icon
   * @param {number} [duration=3000] - Duration in milliseconds before auto-removal (0 = no auto-removal)
   * @returns {void}
   *
   * @fires stateChange - When toast is added
   * @fires stateChange - When toast is auto-removed after duration
   *
   * @remarks
   * - Each toast gets a unique ID using nanoid
   * - Toasts are automatically removed after the specified duration
   * - Set duration to 0 or negative to disable auto-removal
   * - Multiple toasts can be shown simultaneously
   *
   * @example
   * ```typescript
   * // Show success toast (auto-removes after 3 seconds)
   * store.getState().showToast('File saved successfully!', 'success');
   *
   * // Show error toast with custom duration
   * store.getState().showToast('Network error occurred', 'error', 5000);
   *
   * // Show permanent toast (no auto-removal)
   * store.getState().showToast('Important message', 'info', 0);
   * ```
   */
  showToast: (message: string, type: Toast["type"], duration = 3000) => {
    const id = nanoid();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove toast after duration
    if (duration && duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  /**
   * Removes a specific toast notification by ID
   *
   * @param {string} id - The unique ID of the toast to remove
   * @fires stateChange - When toast is removed
   *
   * @remarks
   * This is typically called automatically by the showToast timer,
   * but can be called manually for user-dismissible toasts.
   *
   * @example
   * ```typescript
   * // Remove a specific toast
   * store.getState().removeToast('toast-id-123');
   *
   * // Remove all toasts
   * const state = store.getState();
   * state.toasts.forEach(toast => state.removeToast(toast.id));
   * ```
   */
  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  /**
   * Sets the loading state for a specific operation
   *
   * @param {keyof LoadingState} key - The loading state key to update
   * @param {boolean} value - The loading state value (true = loading, false = not loading)
   * @fires stateChange - When loading state changes
   *
   * @remarks
   * Loading states are used to show spinners or disable UI elements
   * during async operations. Each key represents a different operation type.
   *
   * @example
   * ```typescript
   * // Start global loading
   * store.getState().setLoading('global', true);
   *
   * // Start tablebase loading
   * store.getState().setLoading('tablebase', true);
   *
   * // Stop position loading
   * store.getState().setLoading('position', false);
   * ```
   */
  setLoading: (key: keyof LoadingState, value: boolean) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value,
      },
    })),

  /**
   * Updates the analysis panel configuration
   *
   * @param {Partial<AnalysisPanelState>} update - Partial update to merge with current state
   * @fires stateChange - When analysis panel state changes
   *
   * @remarks
   * This method performs a shallow merge of the update object with
   * the current analysis panel state. Use this to update one or more
   * properties without affecting others.
   *
   * @example
   * ```typescript
   * // Open analysis panel
   * store.getState().updateAnalysisPanel({ isOpen: true });
   *
   * // Change active tab
   * store.getState().updateAnalysisPanel({ activeTab: 'evaluation' });
   *
   * // Update multiple properties
   * store.getState().updateAnalysisPanel({
   *   isOpen: true,
   *   activeTab: 'variations',
   *   showTablebase: false
   * });
   * ```
   */
  updateAnalysisPanel: (update: Partial<AnalysisPanelState>) =>
    set((state) => ({
      analysisPanel: {
        ...state.analysisPanel,
        ...update,
      },
    })),

  /**
   * Sets the move error dialog state
   *
   * @param {Object|null} dialog - Dialog configuration or null to close
   * @param {boolean} dialog.isOpen - Whether dialog is open
   * @param {number} [dialog.wdlBefore] - WDL evaluation before move
   * @param {number} [dialog.wdlAfter] - WDL evaluation after move
   * @param {string} [dialog.bestMove] - Best move that should have been played
   *
   * @fires stateChange - When dialog state changes
   *
   * @remarks
   * Controls the display of move feedback dialogs that show
   * when a user makes a mistake. The dialog can display the
   * evaluation change and suggest the best move.
   *
   * @example
   * ```typescript
   * // Show error dialog
   * store.getState().setMoveErrorDialog({
   *   isOpen: true,
   *   wdlBefore: 1000,  // Winning
   *   wdlAfter: 0,      // Now draw
   *   bestMove: "Ra8#"
   * });
   *
   * // Close dialog
   * store.getState().setMoveErrorDialog(null);
   * ```
   */
  setMoveErrorDialog: (
    dialog: {
      isOpen: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      bestMove?: string;
    } | null,
  ) => {
    set({ moveErrorDialog: dialog });
  },
});

/**
 * Selector functions for efficient state access
 *
 * @remarks
 * These selectors provide a consistent API for accessing UI state
 * and can be used with Zustand's subscribe mechanism for optimal
 * re-renders. Use these instead of inline selectors when possible.
 *
 * @example
 * ```typescript
 * import { useStore } from '@/store';
 * import { uiSelectors } from '@/store/slices/uiSlice';
 *
 * // In a component
 * const toasts = useStore(uiSelectors.selectToasts);
 * const isSettingsOpen = useStore(uiSelectors.selectIsModalOpen('settings'));
 * const isLoading = useStore(uiSelectors.selectGlobalLoading);
 * ```
 */
export const uiSelectors = {
  /**
   * Selects the sidebar open state
   * @param {UISlice} state - The UI slice of the store
   * @returns {boolean} Whether the sidebar is open
   */
  selectSidebarOpen: (state: UISlice) => state.isSidebarOpen,

  /**
   * Selects the currently open modal type
   * @param {UISlice} state - The UI slice of the store
   * @returns {ModalType | null} The open modal type or null if no modal is open
   */
  selectCurrentModal: (state: UISlice) => state.currentModal,

  /**
   * Selects all active toasts
   * @param {UISlice} state - The UI slice of the store
   * @returns {Toast[]} Array of active toast notifications
   */
  selectToasts: (state: UISlice) => state.toasts,

  /**
   * Selects the entire loading state object
   * @param {UISlice} state - The UI slice of the store
   * @returns {LoadingState} Object containing all loading states
   */
  selectLoading: (state: UISlice) => state.loading,

  /**
   * Selects the global loading state
   * @param {UISlice} state - The UI slice of the store
   * @returns {boolean} Whether global loading is active
   */
  selectGlobalLoading: (state: UISlice) => state.loading.global,

  /**
   * Selects the tablebase loading state
   * @param {UISlice} state - The UI slice of the store
   * @returns {boolean} Whether tablebase loading is active
   */
  selectTablebaseLoading: (state: UISlice) => state.loading.tablebase,

  /**
   * Selects the analysis panel state
   * @param {UISlice} state - The UI slice of the store
   * @returns {AnalysisPanelState} The analysis panel configuration
   */
  selectAnalysisPanel: (state: UISlice) => state.analysisPanel,

  /**
   * Creates a selector to check if a specific modal is open
   * @param {ModalType} type - The modal type to check
   * @returns {Function} Selector function that returns true if the specified modal is open
   *
   * @example
   * ```typescript
   * const isSettingsOpen = useStore(uiSelectors.selectIsModalOpen('settings'));
   * ```
   */
  selectIsModalOpen: (type: ModalType) => (state: UISlice) =>
    state.currentModal === type,

  /**
   * Selects the move error dialog state
   * @param {UISlice} state - The UI slice of the store
   * @returns {Object|null} The move error dialog configuration or null
   */
  selectMoveErrorDialog: (state: UISlice) => state.moveErrorDialog,
};
