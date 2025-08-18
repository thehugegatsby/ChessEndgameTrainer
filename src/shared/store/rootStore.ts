/**
 * @file Root store assembly for refactored Zustand architecture
 * @module store/rootStore
 * @description Combines all domain-specific slices into a unified store with middleware
 * integration. Uses a clean, maintainable architecture with domain-driven slices.
 * @note Cache-bust: 2025-08-14 CI build refresh
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

import { create } from 'zustand';
import { devtools, persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import all slice creators and initial states
import { createGameState, createGameActions, initialGameState } from './slices/gameSlice';
import {
  createTablebaseState,
  createTablebaseActions,
  initialTablebaseState,
} from './slices/tablebaseSlice';
import {
  createTrainingState,
  createTrainingActions,
  initialTrainingState,
} from './slices/trainingSlice';
import { createUIState, createUIActions, initialUIState } from './slices/uiSlice';

// TODO: PHASE B.3 - Service Dependencies for RootStore
// Import game services for dependency injection
import { 
  PositionService,
  MoveService,
  GameStateService
} from '@domains/game/services';
import { ChessEngine } from '@domains/game/engine/ChessEngine';

// Using pure functions for chess logic
import { getLogger } from '@shared/services/logging/Logger';
import { UI_DURATIONS_MS } from '../../constants/time.constants';

// Import orchestrators
import { loadTrainingContext as loadTrainingContextOrchestrator } from './orchestrators/loadTrainingContext';
import { handlePlayerMove as handlePlayerMoveOrchestrator } from './orchestrators/handlePlayerMove/index';

// Import types
import type { RootState } from './slices/types';
import type { Move as ChessJsMove } from 'chess.js';
import type { EndgamePosition } from '@shared/types/endgame';

// Re-export RootStore type for external use
export type RootStore = RootState;

// Initial state creation removed - slices are initialized directly in store

/**
 * Safe storage adapter that gracefully handles localStorage errors
 * This prevents warnings in E2E tests and other restricted environments
 * while maintaining functionality in normal browser environments
 */
const safeStorage: StateStorage = {
  getItem: name => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(name);
    } catch {
      // Silently fail in restricted environments (E2E tests, etc.)
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(name, value);
    } catch {
      // Silently fail in restricted environments
      // This prevents warnings in E2E tests where localStorage exists but throws
    }
  },
  removeItem: name => {
    try {
      if (typeof window === 'undefined') return;
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
      immer((set, get, _store) => {
        // TODO: PHASE B.3 - Create Service Dependencies for RootStore
        // Initialize ChessEngine and game services for dependency injection
        const chessEngine = new ChessEngine();
        const gameServices = {
          positionService: new PositionService(chessEngine),
          moveService: new MoveService(chessEngine),
          gameStateService: new GameStateService(chessEngine),
        };

        // Create slices using new pattern (clean separation of state and actions)
        return {
          // Clean separation pattern: state and actions composed
          game: {
            ...createGameState(),
            ...createGameActions(set, get),
          },
          training: {
            ...createTrainingState(),
            ...createTrainingActions(set, get, gameServices),
          },
          tablebase: {
            ...createTablebaseState(),
            ...createTablebaseActions(set),
          },
          ui: {
            ...createUIState(),
            ...createUIActions(set, get),
          },

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
            move: ChessJsMove | { from: string; to: string; promotion?: string } | string
          ): Promise<boolean> => {
            const logger = getLogger().setContext('RootStore');
            logger.debug('handlePlayerMove called', { move });
            const storeApi = { getState: get, setState: set };
            logger.debug('Calling handlePlayerMoveOrchestrator');
            // Add timeout for E2E tests to prevent hanging
            let result;
            if (process.env['NEXT_PUBLIC_IS_E2E_TEST'] === 'true') {
              result = await Promise.race([
                handlePlayerMoveOrchestrator(storeApi, move),
                new Promise<boolean>((_, reject) =>
                  setTimeout(
                    () => reject(new Error('E2E orchestrator timeout')),
                    UI_DURATIONS_MS.STORE_TIMEOUT
                  )
                ),
              ]);
            } else {
              result = await handlePlayerMoveOrchestrator(storeApi, move);
            }
            logger.debug('handlePlayerMoveOrchestrator result', { result });
            return result;
          },

          // Note: handleOpponentTurn and requestPositionEvaluation removed
          // Their functionality is now in orchestrators and domain services

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
           * - Resets UI state
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
          loadTrainingContext: async (position: EndgamePosition): Promise<void> => {
            const storeApi = { getState: get, setState: set };
            return await loadTrainingContextOrchestrator(storeApi, position);
          },

          /**
           * Resets entire store to initial state
           *
           * @remarks
           * Resets store to initial state while preserving action functions.
           * INVARIANT: initialState objects must contain only data properties.
           * Actions are automatically preserved via programmatic filtering.
           */
          reset: () => {
            set(state => {
              // Game slice - merge initial state
              Object.assign(state.game, initialGameState);

              // Training slice - programmatically preserve functions
              const preservedTrainingActions = Object.fromEntries(
                Object.entries(state.training).filter(([_, v]) => typeof v === 'function')
              );
              Object.assign(state.training, initialTrainingState, preservedTrainingActions);

              // Tablebase slice - programmatically preserve functions
              const preservedTablebaseActions = Object.fromEntries(
                Object.entries(state.tablebase).filter(([_, v]) => typeof v === 'function')
              );
              Object.assign(state.tablebase, initialTablebaseState, preservedTablebaseActions);

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
            set(currentState => ({
              ...currentState,
              ...state,
            }));
          },
        };
      }),
      {
        name: 'endgame-trainer-store',
        version: 1,
        storage: createJSONStorage(() => safeStorage), // Safe storage that handles errors gracefully
        // Only persist training position for session continuity
        partialize: state => ({
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

          if (persistedState && typeof persistedState === 'object') {
            const persisted = persistedState as Record<string, unknown>;

            // Only merge the specific persisted properties, not the entire slice
            const training = persisted['training'] as { currentPosition?: unknown } | undefined;
            if (training?.currentPosition) {
              merged.training = {
                ...currentState.training,
                ...(training.currentPosition !== undefined && {
                  currentPosition:
                    training.currentPosition as typeof currentState.training.currentPosition,
                }),
              };
            }
          }

          return merged;
        },
      }
    ),
    {
      name: 'EndgameTrainer Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// State managed directly by slice actions

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
