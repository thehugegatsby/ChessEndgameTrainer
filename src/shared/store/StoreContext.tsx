'use client';

/**
 * @file SSR-safe Zustand store context provider
 * @module store/StoreContext
 * @description Creates a React context for Zustand store to fix SSR hydration issues.
 * This resolves the runtime error where store actions are lost during Next.js hydration.
 *
 * @remarks
 * The singleton Zustand pattern conflicts with SSR because:
 * 1. Server creates one store instance per request
 * 2. Client hydration expects the same instance
 * 3. Hot Module Replacement can cause method binding loss
 *
 * This context pattern ensures:
 * - Fresh store instance per request on server
 * - Consistent store instance during client hydration
 * - Proper method binding preservation
 *
 * @example
 * ```typescript
 * // In _app.tsx
 * import { StoreProvider } from '@/shared/store/StoreContext';
 *
 * export default function MyApp({ Component, pageProps }) {
 *   return (
 *     <StoreProvider>
 *       <Component {...pageProps} />
 *     </StoreProvider>
 *   );
 * }
 *
 * // In components
 * import { useStore } from '@/shared/store/StoreContext';
 *
 * function MyComponent() {
 *   const setMoveErrorDialog = useStore(state => state.training.setMoveErrorDialog);
 *   // setMoveErrorDialog is now guaranteed to exist at runtime
 * }
 * ```
 */

import React, { createContext, useContext, useRef, useEffect, type ReactNode } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { getLogger } from '@shared/services/logging';
import { createStore } from './createStore';
import { browserTestApi } from '@shared/services/test/BrowserTestApi';
import { isE2EMode } from '@shared/utils/environment/isE2EMode';
import type { RootState } from './slices/types';

/**
 * Store instance type for the context
 */
type StoreApi = ReturnType<typeof createStore>;

/**
 * React context for the store
 */
const StoreContext = createContext<StoreApi | null>(null);

/**
 * Props for the StoreProvider component
 */
interface StoreProviderProps {
  /** Child components that need access to the store */
  children: ReactNode;
  /** Optional initial state for SSR hydration */
  initialState?: Partial<RootState>;
  /** Optional pre-created store instance (for testing) */
  store?: StoreApi;
}

/**
 * SSR-safe store provider component
 *
 * @param {StoreProviderProps} props - Provider configuration
 * @returns {JSX.Element} Provider wrapper component
 *
 * @remarks
 * This component creates a fresh store instance for each render tree,
 * preventing SSR hydration mismatches. The store is created once using
 * useRef and persists for the lifetime of the provider.
 *
 * Key benefits:
 * - Eliminates "setMoveErrorDialog is not a function" errors
 * - Ensures consistent store state across SSR/hydration
 * - Maintains store instance during hot module replacement
 * - Allows per-request store initialization on server
 *
 * @example
 * ```typescript
 * // Basic usage
 * <StoreProvider>
 *   <MyApp />
 * </StoreProvider>
 *
 * // With initial state for SSR
 * <StoreProvider initialState={{ game: { currentFen: startFen } }}>
 *   <MyApp />
 * </StoreProvider>
 * ```
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children, initialState, store }) => {
  // Create store instance once per provider instance
  // This ensures fresh store per request on server, stable store on client
  const storeRef = useRef<StoreApi | undefined>(undefined);

  if (!storeRef.current) {
    // Use provided store (for testing) or create new one
    storeRef.current = store || createStore(initialState);

    // Expose store globally for E2E tests (deterministic waiting)
    // Only in test environments to enable state-based waiting
    if (typeof window !== 'undefined' && isE2EMode()) {
      (window as unknown as Record<string, unknown>)['__e2e_store'] = storeRef.current;
      (window as unknown as Record<string, unknown>)['__zustand_store'] = storeRef.current;
    }
  }

  // Initialize BrowserTestApi for E2E tests (provides e2e_makeMove, e2e_getGameState)
  useEffect(() => {
    // Use browser-compatible E2E mode detection
    const isTestMode = isE2EMode();
    
    // Debug: Log environment detection for troubleshooting
    console.log('🔍 StoreContext E2E Debug:');
    console.log('- isClient:', typeof window !== 'undefined');
    console.log('- userAgent:', typeof window !== 'undefined' ? window.navigator.userAgent : 'server');
    console.log('- location.search:', typeof window !== 'undefined' ? window.location.search : 'server');
    console.log('- isE2EMode():', isTestMode);

    if (isTestMode) {
      getLogger().info('✅ E2E-Modus aktiviert: Initialisiere Test API');
      // Get store state to access actions
      const state = storeRef.current?.getState();

      // Create storeAccess object with required actions for TestApiService
      const storeAccess = {
        getState: () => storeRef.current?.getState() as RootState,
        subscribe: (listener: (state: RootState, prevState: RootState) => void) =>
          storeRef.current?.subscribe(listener) || (() => {}),
        setState: (
          updater:
            | RootState
            | Partial<RootState>
            | ((state: RootState) => RootState | Partial<RootState> | void)
        ) => {
          if (typeof updater === 'function') {
            storeRef.current?.setState(currentState => {
              const result = updater(currentState);
              return result === undefined ? currentState : result;
            });
          } else {
            storeRef.current?.setState(updater);
          }
        },
        // Use actual store actions from current architecture
        makeMove: ((move: unknown) => {
          if (state?.handlePlayerMove) {
            return state.handlePlayerMove(move as Parameters<typeof state.handlePlayerMove>[0]);
          }
          return Promise.resolve(false);
        }) as (move: unknown) => void,
        _internalApplyMove: ((move: unknown) => {
          if (state?.game?.applyMove) {
            return state.game.applyMove(move as Parameters<typeof state.game.applyMove>[0]);
          }
          return null;
        }) as (move: unknown) => void,
        resetPosition: (state?.reset || (() => {})) as () => void,
        setPosition: ((position: unknown) => {
          const currentState = storeRef.current?.getState();
          const fen = position as string;
          
          getLogger().info('🔍 E2E setPosition called', { 
            fen,
            currentState: Boolean(currentState),
            loadTrainingContext: Boolean(currentState?.loadTrainingContext),
            storeKeys: currentState ? Object.keys(currentState) : []
          });
          
          // Use the focused loadPosition orchestrator for E2E tests
          // This avoids navigation loading that would override the test position
          if (currentState?.loadPosition) {
            // Create a minimal EndgamePosition from FEN for E2E tests
            const endgamePosition = {
              id: 999, // E2E test position ID
              title: 'E2E Test Position',
              fen: fen,
              category: 'e2e-test',
              difficulty: 'intermediate' as const,
              sideToMove: fen.includes(' w ') ? 'white' as const : 'black' as const,
              goal: 'win' as const,
              description: 'Position set via E2E test API'
            };
            
            getLogger().info('🚀 Calling loadPosition with position (E2E safe)', { endgamePosition });
            
            // Use loadPosition to set position WITHOUT navigation loading
            currentState.loadPosition(endgamePosition).then(() => {
              getLogger().info('✅ Position set via loadPosition orchestrator', { 
                fen, 
                positionId: endgamePosition.id 
              });
            }).catch((error) => {
              getLogger().error('❌ Failed to load position', { 
                error: error instanceof Error ? error.message : String(error),
                fen 
              });
            });
          } else {
            getLogger().error('❌ loadPosition orchestrator not found', {
              currentState: Boolean(currentState),
              loadPosition: Boolean(currentState?.loadPosition),
              availableActions: currentState ? Object.keys(currentState).filter(key => typeof (currentState as unknown as Record<string, unknown>)[key] === 'function') : []
            });
            
            // Fallback: try to set position directly on game slice
            if (currentState?.game?.setCurrentFen) {
              getLogger().info('🔄 Fallback: Using game.setCurrentFen');
              currentState.game.setCurrentFen(fen);
            } else {
              getLogger().error('❌ No fallback method available for setting position');
            }
          }
        }) as (position: unknown) => void,
        goToMove: (state?.game?.goToMove || (() => {})) as (moveIndex: number) => void,
        setAnalysisStatus: (() => {}) as (status: string) => void, // Not directly available in new architecture
        setState: (updater: any) => {
          if (typeof updater === 'function') {
            storeRef.current?.setState(currentState => {
              const result = updater(currentState);
              return result === undefined ? currentState : result;
            });
          } else {
            storeRef.current?.setState(updater);
          }
        },
        setTurnState: (isPlayerTurn: boolean) => {
          const currentState = storeRef.current?.getState();
          if (currentState?.training?.setIsPlayerTurn) {
            currentState.training.setIsPlayerTurn(isPlayerTurn);
            getLogger().info('🔧 Turn state set via E2E API', { isPlayerTurn });
          } else {
            getLogger().warn('❌ setIsPlayerTurn not available in training state');
          }
        }
      };

      // Initialize BrowserTestApi which exposes e2e_makeMove to window
      try {
        browserTestApi.initialize(storeAccess);
      } catch (error) {
        const logger = getLogger().setContext('StoreContext');
        logger.error('Failed to initialize BrowserTestApi', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    } else {
      getLogger().info('❌ E2E Test API wird nicht initialisiert:', {
        reason: typeof window === 'undefined' ? 'Server-side' : 'E2E mode not detected',
        isClient: typeof window !== 'undefined',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      });
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        try {
          browserTestApi.cleanup();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
};

/**
 * Hook for accessing the store from context
 *
 * @param {Function} [selector] - Optional selector function for specific state
 * @returns {any} Selected state or complete store state
 *
 * @throws {Error} When used outside of StoreProvider
 *
 * @remarks
 * This hook replaces the singleton useStore import throughout the app.
 * It ensures that store actions are always available at runtime by
 * accessing the store through React context instead of a global singleton.
 *
 * The hook supports both selector-based and full store access patterns:
 * - With selector: Returns selected state and subscribes to changes
 * - Without selector: Returns complete store state (use sparingly)
 *
 * @example
 * ```typescript
 * // Selector usage (recommended)
 * const setMoveErrorDialog = useStore(state => state.training.setMoveErrorDialog);
 * const currentFen = useStore(state => state.game.currentFen);
 *
 * // Multiple selections with useShallow
 * import { useShallow } from 'zustand/react/shallow';
 * const { currentPosition, isPlayerTurn } = useStore(
 *   useShallow(state => ({
 *     currentPosition: state.training.currentPosition,
 *     isPlayerTurn: state.training.isPlayerTurn
 *   }))
 * );
 *
 * // Full store access (avoid if possible)
 * const store = useStore();
 * ```
 */
export const useStore = <T = RootState,>(
  selector?: (state: RootState) => T
): T extends RootState ? RootState : T => {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error(
      'useStore must be used within a StoreProvider. ' +
        'Make sure to wrap your app with <StoreProvider> in _app.tsx'
    );
  }

  // Always call the hook, but with different parameters
  const actualSelector = selector || ((state: RootState) => state as T);
  return useZustandStore(store, actualSelector) as T extends RootState ? RootState : T;
};

/**
 * Hook for accessing the raw store API
 *
 * @returns {StoreApi} Raw Zustand store instance
 *
 * @throws {Error} When used outside of StoreProvider
 *
 * @remarks
 * This hook provides access to the raw store instance for:
 * - Direct state access: store.getState()
 * - Manual state updates: store.setState()
 * - Store subscription: store.subscribe()
 * - Testing and debugging
 *
 * Use this sparingly - prefer the selector-based useStore hook
 * for component usage.
 *
 * @example
 * ```typescript
 * // For testing
 * const store = useStoreApi();
 * const currentState = store.getState();
 * store.setState({ training: { hintsUsed: 0 } });
 *
 * // For manual subscriptions (rare)
 * const store = useStoreApi();
 * const unsubscribe = store.subscribe((state) => {
 *   // Log state changes for debugging
 *   // logger.info('State changed:', state);
 * });
 * ```
 */
export const useStoreApi = (): StoreApi => {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error(
      'useStoreApi must be used within a StoreProvider. ' +
        'Make sure to wrap your app with <StoreProvider> in _app.tsx'
    );
  }

  return store;
};

/**
 * Type exports for external usage
 */
export type { StoreApi, RootState };
