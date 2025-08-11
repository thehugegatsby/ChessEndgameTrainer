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

import { type UISlice, type UIState, type UIActions } from "./types";
import { nanoid } from "nanoid";
import { type Toast, type ModalType, type LoadingState, type AnalysisPanelState } from "../types";

// Re-export types for external use
export type { UIState, UIActions } from "./types";

/**
 * Initial state for the UI slice
 * Exported separately to enable proper store reset in tests
 */
export const initialUIState = {
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
};

/**
 * Creates the UI state (data only, no actions)
 *
 * @returns {UIState} UI state properties only
 *
 * @remarks
 * This function creates only the state properties for UI slice.
 * Actions are created separately to avoid Immer middleware stripping functions.
 *
 * @example
 * ```typescript
 * const uiState = createUIState();
 * const uiActions = createUIActions(set, get);
 * ```
 */
export const createUIState = (): UIState => ({ ...initialUIState });

/**
 * Creates the UI actions (functions only, no state)
 *
 * @param {Function} set - Zustand's set function for state updates
 * @param {Function} get - Zustand's get function for accessing current state
 * @returns {UIActions} UI action functions
 *
 * @remarks
 * This function creates only the action functions for UI slice.
 * Actions are kept separate from state to prevent Immer middleware from stripping them.
 *
 * @example
 * ```typescript
 * const uiActions = createUIActions(set, get);
 * ```
 */
export const createUIActions = (
  set: (fn: (state: { ui: UIState }) => void) => void,
  get: () => { ui: UIState & UIActions },
): UIActions => ({
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
    set((state) => {
      state.ui.isSidebarOpen = !state.ui.isSidebarOpen;
    }),

  /**
   * Sets the sidebar visibility state explicitly
   *
   * @param {boolean} isOpen - Whether the sidebar should be open
   * @fires stateChange - When sidebar state changes
   *
   * @example
   * ```typescript
   * // Open sidebar
   * store.getState().setIsSidebarOpen(true);
   *
   * // Close sidebar
   * store.getState().setIsSidebarOpen(false);
   * ```
   */
  setIsSidebarOpen: (isOpen: boolean) =>
    set((state) => {
      state.ui.isSidebarOpen = isOpen;
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
    set((state) => {
      state.ui.currentModal = type;
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
    set((state) => {
      state.ui.currentModal = null;
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

    set((state) => {
      state.ui.toasts.push(toast);
    });

    // Auto-remove toast after duration
    if (duration && duration > 0) {
      setTimeout(() => {
        get().ui.removeToast(id);
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
    set((state) => {
      state.ui.toasts = state.ui.toasts.filter((toast: Toast) => toast.id !== id);
    }),

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
    set((state) => {
      state.ui.loading[key] = value;
    }),

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
    set((state) => {
      Object.assign(state.ui.analysisPanel, update);
    }),
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
};
