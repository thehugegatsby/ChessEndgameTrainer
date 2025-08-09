/**
 * @file Root store assembly for refactored Zustand architecture
 * @module store/rootStore
 * @description Combines all domain-specific slices into a unified store with middleware
 * integration. Uses a clean, maintainable architecture with domain-driven slices.
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
import { devtools, persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Import all slice creators and initial states
import { createGameSlice, initialGameState } from "./slices/gameSlice";
import {
  createTablebaseState,
  createTablebaseActions,
  initialTablebaseState,
} from "./slices/tablebaseSlice";
import {
  createTrainingState,
  createTrainingActions,
  initialTrainingState,
} from "./slices/trainingSlice";
import {
  createProgressSlice,
  initialProgressState,
} from "./slices/progressSlice";
import { createUISlice, initialUIState } from "./slices/uiSlice";

// Import ChessService for event subscription
import {
  chessService,
  type ChessServiceEvent,
} from "@shared/services/ChessService";
import { getLogger } from "@shared/services/logging/Logger";

// Import orchestrators
import { loadTrainingContext as loadTrainingContextOrchestrator } from "./orchestrators/loadTrainingContext";
import { handlePlayerMove as handlePlayerMoveOrchestrator } from "./orchestrators/handlePlayerMove/index";

// Import types
import type { RootState } from "./slices/types";
import type { Move as ChessJsMove } from "chess.js";
import type { EndgamePosition } from "@shared/types/endgame";

// Initial state creation removed - slices are initialized directly in store

/**
 * Safe storage adapter that gracefully handles localStorage errors
 * This prevents warnings in E2E tests and other restricted environments
 * while maintaining functionality in normal browser environments
 */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(name);
    } catch {
      // Silently fail in restricted environments (E2E tests, etc.)
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(name, value);
    } catch {
      // Silently fail in restricted environments
      // This prevents warnings in E2E tests where localStorage exists but throws
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(name);
    } catch {
      // Silently fail in restricted environments
    }
  },
};

/**
 * Creates the root store with all slices and orchestrators integrated
 *
 * @returns {Object} Zustand store with all slices and middleware
 *
 * @remarks
 * This store combines:
 * - All 4 domain-specific slices (Game, Tablebase, Training, UI)
 * - Cross-slice orchestrators for complex async operations
 * - Middleware integration (DevTools, Persist, Immer)
 * - Global reset and hydration actions (using efficient initialState pattern)
 *
 * The store uses middleware configuration for enhanced functionality:
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
        // Create slices using Slice-in-Slice pattern (clean separation of state and actions)
        const gameSlice = createGameSlice(set, get, store);
        const progressSlice = createProgressSlice(set, get, store);
        const uiSlice = createUISlice(set, get, store);

        return {
          // Clean Slice-in-Slice pattern: state and actions preserved at slice level
          game: gameSlice,
          training: {
            ...createTrainingState(),
            ...createTrainingActions(set, get),
          },
          tablebase: {
            ...createTablebaseState(),
            ...createTablebaseActions(set),
          },
          progress: progressSlice,
          ui: uiSlice,

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
           * const handlePlayerMove = useStore(state => state.handlePlayerMove);
           *
           * const handleMove = async (from: string, to: string) => {
           *   const success = await handlePlayerMove({ from, to });
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
            const logger = getLogger().setContext("RootStore");
            logger.debug("handlePlayerMove called", { move });
            const storeApi = { getState: get, setState: set };
            logger.debug("Calling handlePlayerMoveOrchestrator");
            // Add timeout for E2E tests to prevent hanging
            let result;
            if (process.env.NEXT_PUBLIC_IS_E2E_TEST === "true") {
              result = await Promise.race([
                handlePlayerMoveOrchestrator(storeApi, move),
                new Promise<boolean>((_, reject) => 
                  setTimeout(() => reject(new Error("E2E orchestrator timeout")), 5000)
                )
              ]);
            } else {
              result = await handlePlayerMoveOrchestrator(storeApi, move);
            }
            logger.debug("handlePlayerMoveOrchestrator result", { result });
            return result;
          },

          // Note: handleOpponentTurn and requestPositionEvaluation removed
          // Their functionality is now in chessService and handlePlayerMove orchestrator

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
           * Uses pre-computed initial state for efficient and reliable reset.
           * With Slice-in-Slice pattern, actions are preserved automatically.
           */
          reset: () => {
            set((state) => {
              // Reset slices to their initial states (actions preserved automatically)
              
              // Game slice - merge initial state
              Object.assign(state.game, initialGameState);

              // Training slice - merge only state properties (actions preserved)
              Object.assign(state.training, {
                ...initialTrainingState,
                // Preserve action functions that are mixed in
                setPosition: state.training.setPosition,
                setNavigationPositions: state.training.setNavigationPositions,
                setNavigationLoading: state.training.setNavigationLoading,
                setNavigationError: state.training.setNavigationError,
                setChapterProgress: state.training.setChapterProgress,
                setPlayerTurn: state.training.setPlayerTurn,
                clearOpponentThinking: state.training.clearOpponentThinking,
                completeTraining: state.training.completeTraining,
                incrementHint: state.training.incrementHint,
                incrementMistake: state.training.incrementMistake,
                setMoveErrorDialog: state.training.setMoveErrorDialog,
                setMoveSuccessDialog: state.training.setMoveSuccessDialog,
                addTrainingMove: state.training.addTrainingMove,
                resetTraining: state.training.resetTraining,
                resetPosition: state.training.resetPosition,
              });

              // Tablebase slice - merge only state properties (actions preserved)
              Object.assign(state.tablebase, {
                ...initialTablebaseState,
                // Preserve action functions
                setTablebaseMove: state.tablebase.setTablebaseMove,
                setAnalysisStatus: state.tablebase.setAnalysisStatus,
                addEvaluation: state.tablebase.addEvaluation,
                setEvaluations: state.tablebase.setEvaluations,
                setCurrentEvaluation: state.tablebase.setCurrentEvaluation,
                clearTablebaseState: state.tablebase.clearTablebaseState,
              });

              // Progress slice - merge initial state
              Object.assign(state.progress, initialProgressState);

              // UI slice - merge initial state  
              Object.assign(state.ui, initialUIState);
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
        storage: createJSONStorage(() => safeStorage), // Safe storage that handles errors gracefully
        // Only persist training position for session continuity
        partialize: (state) => ({
          // Training position - persist for session continuity
          training: {
            currentPosition: state.training.currentPosition,
          },

          // All other state removed - was over-engineered and unused in UI:
          // - User data (authentication, profile, preferences) - not implemented
          // - Settings (restart flags, config) - not used by UI
          // - Progress data (statistics, achievements) - not displayed
          // - Game state - ephemeral (reset on page reload)
          // - UI state - ephemeral (toasts, modals, loading)
          // - Tablebase state - ephemeral (analysis data)
        }),
        // Merge strategy to prevent overwriting the entire slice
        merge: (persistedState, currentState) => {
          // Deep merge to preserve slice structure and functions
          const merged = { ...currentState };

          if (persistedState && typeof persistedState === "object") {
            const persisted = persistedState as Record<string, unknown>;

            // Only merge the specific persisted properties, not the entire slice
            const training = persisted.training as { currentPosition?: unknown } | undefined;
            if (training?.currentPosition) {
              merged.training = {
                ...currentState.training,
                currentPosition: training.currentPosition as typeof currentState.training.currentPosition,
              };
            }
          }

          return merged;
        },
      },
    ),
    {
      name: "EndgameTrainer Store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

/**
 * Subscribe to ChessService events for automatic state synchronization
 * This ensures the store stays in sync with the ChessService singleton
 */
const unsubscribeChessService = chessService.subscribe(
  (event: ChessServiceEvent) => {
    switch (event.type) {
      case "stateUpdate":
        // Use batched payload for atomic state update
        // This ensures consistency and reduces getter calls
        useStore.setState((draft) => {
          draft.game.currentFen = event.payload.fen;
          draft.game.currentPgn = event.payload.pgn;
          draft.game.moveHistory = event.payload.moveHistory;
          draft.game.currentMoveIndex = event.payload.currentMoveIndex;
          draft.game.isGameFinished = event.payload.isGameOver;
          draft.game.gameResult = event.payload.gameResult;
        });
        break;

      case "error":
        // Handle errors from ChessService
        useStore.setState((draft) => {
          draft.ui.toasts.push({
            id: crypto.randomUUID(),
            message: event.payload.message,
            type: "error",
            duration: 5000,
          });
        });
        // Logging already done in ChessService, avoid duplication
        break;
    }
  },
);

// Store cleanup function for hot-module reload or testing
if (typeof window !== "undefined") {
  (window as unknown as { __cleanupChessService?: () => void }).__cleanupChessService = unsubscribeChessService;
}

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
