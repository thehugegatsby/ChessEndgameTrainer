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
 *   const restartRequired = useStore(state => state.restartRequired);
 *   const clearRestart = useStore(state => state.clearRestartRequired);
 *   const makeMove = useStore(state => state.handlePlayerMove);
 *
 *   return (
 *     <div>
 *       {restartRequired && <div>App restart required</div>}
 *       <button onClick={() => makeMove({ from: 'e2', to: 'e4' })}>
 *         Make Move
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
import { handleOpponentTurn as handleOpponentTurnOrchestrator } from "./orchestrators/handleOpponentTurn";
import { requestPositionEvaluation as requestPositionEvaluationOrchestrator } from "./orchestrators/requestPositionEvaluation";
import { loadTrainingContext as loadTrainingContextOrchestrator } from "./orchestrators/loadTrainingContext";
import { handlePlayerMove as handlePlayerMoveOrchestrator } from "./orchestrators/handlePlayerMove";

// Import types
import type { RootState } from "./slices/types";
import type { Move as ChessJsMove } from "chess.js";
import type { EndgamePosition } from "@shared/types/endgame";

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
 * const restartRequired = useStore(state => state.restartRequired);
 * const currentGame = useStore(state => state.game);
 *
 * // Access slice actions
 * const clearRestart = useStore(state => state.clearRestartRequired);
 * const makeMove = useStore(state => state.addMove);
 *
 * // Access orchestrator actions
 * const handlePlayerMove = useStore(state => state.handlePlayerMove);
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
           *     logger.info('Move completed successfully');
           *   }
           * };
           * ```
           */
          handlePlayerMove: async (
            move:
              | ChessJsMove
              | { from: string; to: string; promotion?: string }
              | string,
          ): Promise<boolean> => {
            const storeApi = { getState: get, setState: set };
            return await handlePlayerMoveOrchestrator(storeApi, move);
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
          handleOpponentTurn: async (): Promise<void> => {
            const storeApi = { getState: get, setState: set };
            return await handleOpponentTurnOrchestrator(storeApi);
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
           *   logger.info('Position analysis complete');
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
           * @param {EndgamePosition} position - The endgame position to load
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
           * const startTraining = async (position: EndgamePosition) => {
           *   await loadContext(position);
           *   logger.info('Training context loaded');
           * };
           * ```
           */
          loadTrainingContext: async (
            position: EndgamePosition,
          ): Promise<void> => {
            const storeApi = { getState: get, setState: set };
            return await loadTrainingContextOrchestrator(storeApi, position);
          },

          /**
           * Resets entire store to initial state
           *
           * @remarks
           * Automatically recreates all slices with their initial state.
           * Much cleaner than manually listing every state property.
           */
          reset: () => {
            set(() => ({
              // Recreate all slices with initial state
              ...createUserSlice(set, get, store),
              ...createGameSlice(set, get, store),
              ...createTablebaseSlice(set, get, store),
              ...createTrainingSlice(set, get, store),
              ...createProgressSlice(set, get, store),
              ...createUISlice(set, get, store),
              ...createSettingsSlice(set, get, store),

              // Re-add orchestrator actions (they get overwritten by slice spread)
              handlePlayerMove: async (
                move:
                  | ChessJsMove
                  | { from: string; to: string; promotion?: string }
                  | string,
              ) => {
                const storeApi = { getState: get, setState: set };
                return await handlePlayerMoveOrchestrator(storeApi, move);
              },
              handleOpponentTurn: async () => {
                const storeApi = { getState: get, setState: set };
                return await handleOpponentTurnOrchestrator(storeApi);
              },
              requestPositionEvaluation: async (fen?: string) => {
                const storeApi = { getState: get, setState: set };
                return await requestPositionEvaluationOrchestrator(
                  storeApi,
                  fen,
                );
              },
              loadTrainingContext: async (position: EndgamePosition) => {
                const storeApi = { getState: get, setState: set };
                return await loadTrainingContextOrchestrator(
                  storeApi,
                  position,
                );
              },
              reset: get().reset, // Self-reference to prevent infinite recursion
              hydrate: get().hydrate,
            }));
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

          // Settings - always persist (only essential settings)
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
 * - All slice state and actions (Game, Training, Tablebase, Progress, UI, Settings, User)
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
 * const restartRequired = useStore(state => state.restartRequired);
 * const clearRestart = useStore(state => state.clearRestartRequired);
 *
 * // Training state access (replaces useTrainingState hook)
 * const currentPosition = useStore(state => state.currentPosition);
 * const isPlayerTurn = useStore(state => state.isPlayerTurn);
 * const setPlayerTurn = useStore(state => state.setPlayerTurn);
 *
 * // Game state access
 * const currentFen = useStore(state => state.currentFen);
 * const makeMove = useStore(state => state.makeMove);
 *
 * // Multiple selections with useShallow for complex objects
 * import { useShallow } from 'zustand/react/shallow';
 * const { currentPosition, isPlayerTurn, hintsUsed } = useStore(
 *   useShallow(state => ({
 *     currentPosition: state.currentPosition,
 *     isPlayerTurn: state.isPlayerTurn,
 *     hintsUsed: state.hintsUsed
 *   }))
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
 * test('should clear restart flag', () => {
 *   store.getState().clearRestartRequired();
 *   expect(store.getState().restartRequired).toBe(false);
 * });
 *
 * // External state access
 * const currentUser = store.getState().username;
 * ```
 */
export const store = useStore;
