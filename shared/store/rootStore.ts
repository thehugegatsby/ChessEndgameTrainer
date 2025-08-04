/**
 * @file Root store assembly for refactored Zustand architecture
 * @module store/rootStore
 * @description Combines all domain-specific slices into a unified store with middleware
 * integration. This replaces the monolithic store.ts with a clean, maintainable architecture.
 *
 * @example
 * ```typescript
 * // Using the refactored store
 * import { useStore } from '@/store/rootStore';
 *
 * function MyComponent() {
 *   const theme = useStore(state => state.theme);
 *   const updateTheme = useStore(state => state.updateTheme);
 *   const makeMove = useStore(state => state.makeUserMove);
 *
 *   return (
 *     <div className={theme.mode}>
 *       <button onClick={() => updateTheme({ mode: 'dark' })}>
 *         Toggle Theme
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Import all slice creators
import { createUserSlice } from "./slices/userSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createTablebaseSlice } from "./slices/tablebaseSlice";
import { createTrainingSlice } from "./slices/trainingSlice";
import { createProgressSlice } from "./slices/progressSlice";
import { createUISlice } from "./slices/uiSlice";
import { createSettingsSlice } from "./slices/settingsSlice";

// Import orchestrators
import { requestTablebaseMove as requestTablebaseMoveOrchestrator } from "./orchestrators/requestTablebaseMove";
import { requestPositionEvaluation as requestPositionEvaluationOrchestrator } from "./orchestrators/requestPositionEvaluation";
import { loadTrainingContext as loadTrainingContextOrchestrator } from "./orchestrators/loadTrainingContext";
import { makeUserMove as makeUserMoveOrchestrator } from "./orchestrators/makeUserMove";

// Import types
import type { RootState } from "./slices/types";
import type { Move as ChessJsMove } from "chess.js";

/**
 * Creates the root store with all slices and orchestrators integrated
 *
 * @returns {Object} Zustand store with all slices and middleware
 *
 * @remarks
 * This store combines:
 * - All 7 domain-specific slices (User, Game, Tablebase, Training, Progress, UI, Settings)
 * - Cross-slice orchestrators for complex async operations
 * - Middleware integration (DevTools, Persist, Immer)
 * - Global reset and hydration actions
 *
 * The store uses the same middleware configuration as the original monolithic store:
 * - DevTools: For debugging and time-travel debugging
 * - Persist: For localStorage persistence of user data
 * - Immer: For immutable state updates with mutable syntax
 *
 * @example
 * ```typescript
 * // Access slice state
 * const theme = useStore(state => state.theme);
 * const currentGame = useStore(state => state.game);
 *
 * // Access slice actions
 * const updateSettings = useStore(state => state.updateSettings);
 * const makeMove = useStore(state => state.addMove);
 *
 * // Access orchestrator actions
 * const makeUserMove = useStore(state => state.makeUserMove);
 * const requestEvaluation = useStore(state => state.requestPositionEvaluation);
 * ```
 */
export const useStore = create<RootState>()(
  devtools(
    persist(
      immer((set, get, store) => {
        return {
          // Combine all slices
          ...createUserSlice(set, get, store),
          ...createGameSlice(set, get, store),
          ...createTablebaseSlice(set, get, store),
          ...createTrainingSlice(set, get, store),
          ...createProgressSlice(set, get, store),
          ...createUISlice(set, get, store),
          ...createSettingsSlice(set, get, store),

          // Orchestrator actions - coordinate across multiple slices
          /**
           * Makes a user move with full validation and tablebase integration
           *
           * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
           * @returns {Promise<boolean>} Whether the move was successful
           *
           * @remarks
           * This orchestrator coordinates across multiple slices:
           * - Validates move through Game slice
           * - Updates Training slice with move result
           * - Requests tablebase analysis via Tablebase slice
           * - Updates Progress slice with attempt data
           * - Shows UI feedback for errors
           *
           * @example
           * ```typescript
           * const makeMove = useStore(state => state.makeUserMove);
           *
           * const handleMove = async (from: string, to: string) => {
           *   const success = await makeMove({ from, to });
           *   if (success) {
           *     console.log('Move completed successfully');
           *   }
           * };
           * ```
           */
          makeUserMove: async (
            move:
              | ChessJsMove
              | { from: string; to: string; promotion?: string }
              | string,
          ): Promise<boolean> => {
            const storeApi = { getState: get, setState: set };
            return await makeUserMoveOrchestrator(storeApi, move);
          },

          /**
           * Requests tablebase move analysis for current position
           *
           * @returns {Promise<void>} Completes when analysis is done
           *
           * @remarks
           * This orchestrator handles the complete tablebase analysis workflow:
           * - Validates current game state
           * - Makes API request to tablebase service
           * - Updates analysis status and results
           * - Handles errors and edge cases
           *
           * @example
           * ```typescript
           * const requestMove = useStore(state => state.requestTablebaseMove);
           *
           * useEffect(() => {
           *   if (position && isPlayerTurn) {
           *     requestMove();
           *   }
           * }, [position, isPlayerTurn]);
           * ```
           */
          requestTablebaseMove: async (): Promise<void> => {
            const storeApi = { getState: get, setState: set };
            return await requestTablebaseMoveOrchestrator(storeApi);
          },

          /**
           * Requests position evaluation from tablebase API
           *
           * @param {string} [fen] - Optional FEN string to evaluate (defaults to current position)
           * @returns {Promise<void>} Completes when evaluation is done
           *
           * @remarks
           * This orchestrator provides position analysis functionality:
           * - Uses current position FEN if none provided
           * - Leverages caching for performance
           * - Updates evaluation list with results
           * - Handles API errors gracefully
           *
           * @example
           * ```typescript
           * const requestEval = useStore(state => state.requestPositionEvaluation);
           *
           * const analyzePosition = async (fen?: string) => {
           *   await requestEval(fen);
           *   console.log('Position analysis complete');
           * };
           * ```
           */
          requestPositionEvaluation: async (fen?: string): Promise<void> => {
            const storeApi = { getState: get, setState: set };
            return await requestPositionEvaluationOrchestrator(storeApi, fen);
          },

          /**
           * Loads training context for a position
           *
           * @param {any} position - The endgame position to load
           * @returns {Promise<void>} Completes when context is loaded
           *
           * @remarks
           * This orchestrator sets up the complete training context:
           * - Loads position into Game slice
           * - Initializes Training slice state
           * - Resets UI and Progress tracking
           * - Prepares for user interaction
           *
           * @example
           * ```typescript
           * const loadContext = useStore(state => state.loadTrainingContext);
           *
           * const startTraining = async (position) => {
           *   await loadContext(position);
           *   console.log('Training context loaded');
           * };
           * ```
           */
          loadTrainingContext: async (position: any): Promise<void> => {
            const storeApi = { getState: get, setState: set };
            return await loadTrainingContextOrchestrator(storeApi, position);
          },

          /**
           * Resets entire store to initial state
           *
           * @remarks
           * This action resets all slices to their initial state.
           * Useful for logout, testing, or complete app reset scenarios.
           * Each slice defines its own initial state that gets restored.
           *
           * @example
           * ```typescript
           * const reset = useStore(state => state.reset);
           *
           * const handleLogout = () => {
           *   reset();
           *   navigate('/login');
           * };
           * ```
           */
          reset: () => {
            set((_state) => {
              // Reset each slice to its initial state
              const userSlice = createUserSlice(set, get, store);
              const gameSlice = createGameSlice(set, get, store);
              const tablebaseSlice = createTablebaseSlice(set, get, store);
              const trainingSlice = createTrainingSlice(set, get, store);
              const progressSlice = createProgressSlice(set, get, store);
              const uiSlice = createUISlice(set, get, store);
              const settingsSlice = createSettingsSlice(set, get, store);

              // Combine all initial states (excluding actions)
              const initialState = {
                // User slice initial state
                id: userSlice.id,
                username: userSlice.username,
                email: userSlice.email,
                rating: userSlice.rating,
                completedPositions: userSlice.completedPositions,
                currentStreak: userSlice.currentStreak,
                totalTrainingTime: userSlice.totalTrainingTime,
                lastActiveDate: userSlice.lastActiveDate,
                preferences: userSlice.preferences,

                // Game slice initial state
                game: gameSlice.game,
                currentFen: gameSlice.currentFen,
                currentPgn: gameSlice.currentPgn,
                moveHistory: gameSlice.moveHistory,
                currentMoveIndex: gameSlice.currentMoveIndex,
                isGameFinished: gameSlice.isGameFinished,

                // Tablebase slice initial state
                tablebaseMove: tablebaseSlice.tablebaseMove,
                analysisStatus: tablebaseSlice.analysisStatus,
                evaluations: tablebaseSlice.evaluations,
                currentEvaluation: tablebaseSlice.currentEvaluation,

                // Training slice initial state
                currentPosition: trainingSlice.currentPosition,
                nextPosition: trainingSlice.nextPosition,
                previousPosition: trainingSlice.previousPosition,
                isLoadingNavigation: trainingSlice.isLoadingNavigation,
                navigationError: trainingSlice.navigationError,
                chapterProgress: trainingSlice.chapterProgress,
                isPlayerTurn: trainingSlice.isPlayerTurn,
                isSuccess: trainingSlice.isSuccess,
                sessionStartTime: trainingSlice.sessionStartTime,
                sessionEndTime: trainingSlice.sessionEndTime,
                hintsUsed: trainingSlice.hintsUsed,
                mistakeCount: trainingSlice.mistakeCount,
                moveErrorDialog: trainingSlice.moveErrorDialog,

                // Progress slice initial state
                positionProgress: progressSlice.positionProgress,
                dailyStats: progressSlice.dailyStats,
                achievements: progressSlice.achievements,
                totalSolvedPositions: progressSlice.totalSolvedPositions,
                averageAccuracy: progressSlice.averageAccuracy,
                favoritePositions: progressSlice.favoritePositions,

                // UI slice initial state
                sidebarOpen: uiSlice.sidebarOpen,
                modalOpen: uiSlice.modalOpen,
                toasts: uiSlice.toasts,
                loading: uiSlice.loading,
                analysisPanel: uiSlice.analysisPanel,

                // Settings slice initial state
                theme: settingsSlice.theme,
                notifications: settingsSlice.notifications,
                difficulty: settingsSlice.difficulty,
                privacy: settingsSlice.privacy,
                experimentalFeatures: settingsSlice.experimentalFeatures,
                dataSync: settingsSlice.dataSync,
                language: settingsSlice.language,
                timezone: settingsSlice.timezone,
                firstTimeUser: settingsSlice.firstTimeUser,
                lastSettingsUpdate: settingsSlice.lastSettingsUpdate,
                restartRequired: settingsSlice.restartRequired,
              };

              return initialState;
            });
          },

          /**
           * Hydrates store with partial state data
           *
           * @param {Partial<RootState>} state - Partial state to merge into current state
           *
           * @remarks
           * This action is useful for:
           * - Loading state from external sources (localStorage, API)
           * - Server-side rendering hydration
           * - State synchronization between tabs
           * - Partial state restoration from backups
           *
           * The method performs a shallow merge of the provided state
           * with the current state, preserving any fields not specified.
           *
           * @example
           * ```typescript
           * const hydrate = useStore(state => state.hydrate);
           *
           * // Restore user data from API
           * const restoreUserData = async () => {
           *   const userData = await api.getUserData();
           *   hydrate({
           *     id: userData.id,
           *     username: userData.username,
           *     preferences: userData.preferences
           *   });
           * };
           *
           * // Sync settings from another tab
           * const syncSettings = (settingsData) => {
           *   hydrate({
           *     theme: settingsData.theme,
           *     language: settingsData.language
           *   });
           * };
           * ```
           */
          hydrate: (state: Partial<RootState>) => {
            set((currentState) => ({
              ...currentState,
              ...state,
            }));
          },
        };
      }),
      {
        name: "endgame-trainer-store",
        version: 1,
        // Only persist user data, settings, and progress (not ephemeral UI state)
        partialize: (state) => ({
          // User data - always persist
          id: state.id,
          username: state.username,
          email: state.email,
          rating: state.rating,
          completedPositions: state.completedPositions,
          currentStreak: state.currentStreak,
          totalTrainingTime: state.totalTrainingTime,
          lastActiveDate: state.lastActiveDate,
          preferences: state.preferences,

          // Settings - always persist
          theme: state.theme,
          notifications: state.notifications,
          difficulty: state.difficulty,
          privacy: state.privacy,
          experimentalFeatures: state.experimentalFeatures,
          dataSync: state.dataSync,
          language: state.language,
          timezone: state.timezone,
          firstTimeUser: state.firstTimeUser,
          lastSettingsUpdate: state.lastSettingsUpdate,
          restartRequired: state.restartRequired,

          // Progress data - always persist
          positionProgress: state.positionProgress,
          dailyStats: state.dailyStats,
          achievements: state.achievements,
          totalSolvedPositions: state.totalSolvedPositions,
          averageAccuracy: state.averageAccuracy,
          favoritePositions: state.favoritePositions,

          // Training position - persist for session continuity
          currentPosition: state.currentPosition,

          // Game state - don't persist (reset on page reload)
          // UI state - don't persist (reset on page reload)
          // Tablebase state - don't persist (ephemeral analysis data)
        }),
      },
    ),
    {
      name: "EndgameTrainer Store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

/**
 * Hook for accessing the complete store state and actions
 *
 * @remarks
 * This is the main hook for accessing the store. It provides access to:
 * - All slice state and actions
 * - Orchestrator actions for complex operations
 * - Global reset and hydration methods
 *
 * For performance-sensitive components, consider using specific selectors
 * to avoid unnecessary re-renders when unrelated state changes.
 *
 * @example
 * ```typescript
 * // Full store access
 * const store = useStore();
 *
 * // Selective access (better performance)
 * const theme = useStore(state => state.theme);
 * const updateTheme = useStore(state => state.updateTheme);
 *
 * // Multiple selections with useShallow for complex objects
 * import { useShallow } from 'zustand/react/shallow';
 * const { user, settings } = useStore(
 *   useShallow(state => ({ user: state, settings: state }))
 * );
 * ```
 */
export default useStore;

/**
 * Type-safe store instance for testing and external access
 *
 * @remarks
 * This provides direct access to the store instance for:
 * - Unit testing with store.getState() and store.setState()
 * - Integration testing with state manipulation
 * - External state access outside of React components
 * - Store inspection and debugging
 *
 * @example
 * ```typescript
 * // In tests
 * import { store } from '@/store/rootStore';
 *
 * test('should update theme', () => {
 *   store.getState().updateTheme({ mode: 'dark' });
 *   expect(store.getState().theme.mode).toBe('dark');
 * });
 *
 * // External state access
 * const currentUser = store.getState().username;
 * ```
 */
export const store = useStore;

/**
 * Hook for accessing the training state
 *
 * @remarks
 * Convenience hook that provides access to the training slice of the store.
 * This replaces the old `useEndgameState` hook and provides a cleaner
 * separation between training session state and endgame position data.
 *
 * @example
 * ```typescript
 * // In a component
 * const training = useTrainingState();
 *
 * // Access training state
 * const { currentPosition, isPlayerTurn, hintsUsed } = training;
 *
 * // Call training actions
 * training.setPlayerTurn(true);
 * training.useHint();
 * ```
 */
export const useTrainingState = () =>
  useStore((state) => ({
    // Training state
    currentPosition: state.currentPosition,
    nextPosition: state.nextPosition,
    previousPosition: state.previousPosition,
    isLoadingNavigation: state.isLoadingNavigation,
    navigationError: state.navigationError,
    chapterProgress: state.chapterProgress,
    isPlayerTurn: state.isPlayerTurn,
    isSuccess: state.isSuccess,
    sessionStartTime: state.sessionStartTime,
    sessionEndTime: state.sessionEndTime,
    hintsUsed: state.hintsUsed,
    mistakeCount: state.mistakeCount,
    moveErrorDialog: state.moveErrorDialog,

    // Training actions
    setPosition: state.setPosition,
    setNavigationPositions: state.setNavigationPositions,
    setNavigationLoading: state.setNavigationLoading,
    setNavigationError: state.setNavigationError,
    setChapterProgress: state.setChapterProgress,
    setPlayerTurn: state.setPlayerTurn,
    completeTraining: state.completeTraining,
    useHint: state.useHint,
    incrementMistake: state.incrementMistake,
    setMoveErrorDialog: state.setMoveErrorDialog,
    addTrainingMove: state.addTrainingMove,
    resetTraining: state.resetTraining,
    resetPosition: state.resetPosition,
  }));
