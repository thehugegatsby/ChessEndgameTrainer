/**
 * @file Store factory for SSR-safe Zustand store creation
 * @module store/createStore
 * @description Factory function that creates fresh store instances for each request/context.
 * This resolves SSR hydration issues by ensuring consistent store creation patterns.
 * 
 * @remarks
 * This factory is used by the StoreProvider to create store instances:
 * - Server: Fresh instance per request
 * - Client: Consistent instance during hydration
 * - HMR: Stable instance during development
 * 
 * The factory extracts the store creation logic from rootStore.ts to enable
 * per-request instantiation without singleton conflicts.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import all slice creators
import { createGameSlice } from './slices/gameSlice';
import { createTablebaseSlice } from './slices/tablebaseSlice';
import { createTrainingSlice } from './slices/trainingSlice';
import { createUISlice } from './slices/uiSlice';

// Import ChessService for event subscription
import {
  chessService,
  type ChessServiceEvent,
} from '@shared/services/ChessService';

// Import orchestrators
import { loadTrainingContext as loadTrainingContextOrchestrator } from './orchestrators/loadTrainingContext';
import { handlePlayerMove as handlePlayerMoveOrchestrator } from './orchestrators/handlePlayerMove/index';

// Import types
import type { RootState } from './slices/types';
import type { Move as ChessJsMove } from 'chess.js';
import type { EndgamePosition } from '@shared/types/endgame';

/**
 * Creates a fresh store instance with all slices and middleware
 * 
 * @param {Partial<RootState>} [initialState] - Optional initial state for hydration
 * @returns {ReturnType<typeof create<RootState>>} Fresh Zustand store instance
 * 
 * @remarks
 * This factory creates a complete store with:
 * - All 4 domain-specific slices (Game, Tablebase, Training, UI)
 * - Cross-slice orchestrators for complex operations
 * - Middleware integration (DevTools, Persist, Immer)
 * - ChessService event subscription for state sync
 * - Global reset and hydration actions
 * 
 * Each call creates a completely fresh store instance, preventing
 * SSR hydration mismatches and ensuring clean state isolation.
 * 
 * @example
 * ```typescript
 * // Create fresh store
 * const store = createStore();
 * 
 * // Create with initial state for SSR
 * const store = createStore({
 *   game: { currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }
 * });
 * 
 * // Use in context provider
 * const storeRef = useRef<ReturnType<typeof createStore>>();
 * if (!storeRef.current) {
 *   storeRef.current = createStore(initialState);
 * }
 * ```
 */
export const createStore = (initialState?: Partial<RootState>) => {
  const store = create<RootState>()(
    devtools(
      persist(
        immer((set, get, api) => {
          // Create slices with their actions
          const gameSlice = createGameSlice(set, get, api);
          const trainingSlice = createTrainingSlice(set, get, api);
          const tablebaseSlice = createTablebaseSlice(set, get, api);
          const uiSlice = createUISlice(set, get, api);
          
          // CRITICAL FIX: Store actions separately to prevent Immer from stripping them
          // We'll attach them to the root store where they can be accessed directly
          const trainingActions = {
            setPosition: trainingSlice.setPosition,
            setNavigationPositions: trainingSlice.setNavigationPositions,
            setNavigationLoading: trainingSlice.setNavigationLoading,
            setNavigationError: trainingSlice.setNavigationError,
            setChapterProgress: trainingSlice.setChapterProgress,
            setPlayerTurn: trainingSlice.setPlayerTurn,
            clearOpponentThinking: trainingSlice.clearOpponentThinking,
            completeTraining: trainingSlice.completeTraining,
            incrementHint: trainingSlice.incrementHint,
            incrementMistake: trainingSlice.incrementMistake,
            setMoveErrorDialog: trainingSlice.setMoveErrorDialog,
            addTrainingMove: trainingSlice.addTrainingMove,
            resetTraining: trainingSlice.resetTraining,
            resetPosition: trainingSlice.resetPosition,
          };

          const rootState: RootState = {
            // Nested state structure - each slice in its namespace
            game: gameSlice,
            training: trainingSlice,
            tablebase: tablebaseSlice,
            ui: uiSlice,
            
            // CRITICAL: Store training actions at root level to prevent Immer stripping
            _trainingActions: trainingActions,

            // Orchestrator actions - coordinate across multiple slices
            handlePlayerMove: async (
              move:
                | ChessJsMove
                | { from: string; to: string; promotion?: string }
                | string,
            ): Promise<boolean> => {
              console.log('[CreateStore] handlePlayerMove called with:', { move });
              const storeApi = { getState: get, setState: set };
              console.log('[CreateStore] Calling handlePlayerMoveOrchestrator');
              const result = await handlePlayerMoveOrchestrator(storeApi, move);
              console.log('[CreateStore] handlePlayerMoveOrchestrator result:', {
                result,
              });
              return result;
            },

            loadTrainingContext: async (
              position: EndgamePosition,
            ): Promise<void> => {
              const storeApi = { getState: get, setState: set };
              return await loadTrainingContextOrchestrator(storeApi, position);
            },

            /**
             * Resets entire store to initial state
             */
            reset: () => {
              set((state) => {
                // Reset only the state properties, not the actions - MANUAL PROPERTY RESET
                // Game slice - explicit property reset
                state.game.moveHistory = [];
                state.game.currentMoveIndex = 0;
                state.game.isGameFinished = false;
                
                // Training slice - DO NOT RESET - Preserve all action methods
                
                // Tablebase slice - explicit property reset
                state.tablebase.tablebaseMove = null;
                state.tablebase.analysisStatus = 'idle';
                state.tablebase.evaluations = [];
                state.tablebase.currentEvaluation = undefined;
                
                // UI slice - explicit property reset
                state.ui.isSidebarOpen = false;
                state.ui.currentModal = null;
                state.ui.toasts = [];
                state.ui.loading = { global: false, position: false, tablebase: false, analysis: false };
                state.ui.analysisPanel = { isOpen: false, activeTab: 'evaluation', showTablebase: false };
              });
            },

            /**
             * Hydrates store with partial state data
             */
            hydrate: (state: Partial<RootState>) => {
              set((currentState) => ({
                ...currentState,
                ...state,
              }));
            },
          };

          // Apply initial state if provided
          if (initialState) {
            Object.assign(rootState, initialState);
          }

          return rootState;
        }),
        {
          name: 'endgame-trainer-store',
          version: 1,
          // Only persist training position for session continuity
          partialize: (state) => ({
            training: {
              currentPosition: state.training.currentPosition,
            },
          }),
        },
      ),
      {
        name: 'EndgameTrainer Store',
        enabled: process.env.NODE_ENV === 'development',
      },
    ),
  );

  // DEBUG: Check what the store actually contains after creation
  console.log("[CreateStore POST-CREATE] store.getState().training keys:", Object.keys(store.getState().training));
  console.log("[CreateStore POST-CREATE] store.getState().training has setMoveErrorDialog?", 'setMoveErrorDialog' in store.getState().training);
  
  // Subscribe to ChessService events for automatic state synchronization
  const unsubscribeChessService = chessService.subscribe(
    (event: ChessServiceEvent) => {
      switch (event.type) {
        case 'stateUpdate':
          // Use batched payload for atomic state update
          store.setState((draft) => {
            draft.game.currentFen = event.payload.fen;
            draft.game.currentPgn = event.payload.pgn;
            draft.game.moveHistory = event.payload.moveHistory;
            draft.game.currentMoveIndex = event.payload.currentMoveIndex;
            draft.game.isGameFinished = event.payload.isGameOver;
            draft.game.gameResult = event.payload.gameResult;
          });
          break;

        case 'error':
          // Handle errors from ChessService
          store.setState((draft) => {
            draft.ui.toasts.push({
              id: crypto.randomUUID(),
              message: event.payload.message,
              type: 'error',
              duration: 5000,
            });
          });
          break;
      }
    },
  );

  // Attach cleanup function to store instance
  (store as any).__cleanup = unsubscribeChessService;

  return store;
};

/**
 * Type export for the store instance
 */
export type StoreInstance = ReturnType<typeof createStore>;