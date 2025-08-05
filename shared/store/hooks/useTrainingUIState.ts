/**
 * @file Training UI state hook
 * @module store/hooks/useTrainingUIState
 *
 * @description
 * Task-oriented hook providing UI-specific state for training
 * components including error dialogs, panels, and UI preferences.
 * Uses useShallow for optimal re-render performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Hook for training UI state
 *
 * @description
 * Provides UI state specific to training components including
 * error dialogs, analysis panel visibility, and other UI elements.
 * Focused on presentation layer concerns.
 *
 * @returns {Object} UI state
 * @returns {Object} moveErrorDialog - Move error dialog state
 * @returns {Object} analysisPanel - Analysis panel visibility state
 * @returns {boolean} isSidebarOpen - Sidebar visibility
 * @returns {number} mistakeCount - Current mistake counter
 *
 * @example
 * ```tsx
 * const { moveErrorDialog, analysisPanel, mistakeCount } = useTrainingUIState();
 *
 * return (
 *   <>
 *     {moveErrorDialog?.isOpen && (
 *       <MoveErrorDialog {...moveErrorDialog} />
 *     )}
 *     <MistakeCounter count={mistakeCount} />
 *   </>
 * );
 * ```
 */
export const useTrainingUIState = () =>
  useStore(
    useShallow((state) => ({
      // Dialog states
      moveErrorDialog: state.moveErrorDialog,

      // Panel visibility
      analysisPanel: state.analysisPanel,
      isSidebarOpen: state.sidebarOpen,

      // Training feedback
      mistakeCount: state.mistakeCount || 0,

      // Loading states
      isLoadingNavigation: state.isLoadingNavigation,
    })),
  );
