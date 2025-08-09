"use client";

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

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore } from "./createStore";
import { browserTestApi } from "@shared/services/test/BrowserTestApi";
import type { RootState } from "./slices/types";

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
export const StoreProvider: React.FC<StoreProviderProps> = ({
  children,
  initialState,
}) => {
  // Create store instance once per provider instance
  // This ensures fresh store per request on server, stable store on client
  const storeRef = useRef<StoreApi | undefined>(undefined);

  if (!storeRef.current) {
    storeRef.current = createStore(initialState);
    
    // Expose store globally for E2E tests (deterministic waiting)
    // Only in test environments to enable state-based waiting
    if (typeof window !== 'undefined' && 
        (process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true' || 
         process.env.NODE_ENV === 'test' ||
         process.env.NODE_ENV === 'development')) {
      (window as unknown as Record<string, unknown>).__e2e_store = storeRef.current;
      (window as unknown as Record<string, unknown>).__zustand_store = storeRef.current;
    }
  }

  // Initialize BrowserTestApi for E2E tests (provides e2e_makeMove, e2e_getGameState)
  useEffect(() => {
    if (typeof window !== 'undefined' && 
        (process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true' || 
         process.env.NODE_ENV === 'test')) {
      // Get store state to access actions
      const state = storeRef.current?.getState();
      
      // Create storeAccess object with required actions for TestApiService
      const storeAccess = {
        getState: () => storeRef.current?.getState() as RootState,
        subscribe: (listener: (state: RootState, prevState: RootState) => void) => storeRef.current?.subscribe(listener) || (() => {}),
        setState: (updater: RootState | Partial<RootState> | ((state: RootState) => RootState | Partial<RootState> | void)) => storeRef.current?.setState(updater),
        // Extract individual actions from state - these need to be fixed in TestApiService
        // For now, provide empty functions to avoid runtime errors
        makeMove: state?.handlePlayerMove || (() => Promise.resolve(false)),
        applyMove: state?.game?.applyMove || (() => null), // Test-only action for applying moves
        resetPosition: state?.reset || (() => {}),
        setPosition: (() => {}), // Not directly available in new architecture
        goToMove: state?.game?.goToMove || (() => {}),
        setAnalysisStatus: (() => {}), // Not directly available in new architecture
      };
      
      // Initialize BrowserTestApi which exposes e2e_makeMove to window
      browserTestApi.initialize(storeAccess).catch((error) => {
        console.error("Failed to initialize BrowserTestApi:", error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        browserTestApi.cleanup().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
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
  selector?: (state: RootState) => T,
): T extends RootState ? RootState : T => {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error(
      "useStore must be used within a StoreProvider. " +
        "Make sure to wrap your app with <StoreProvider> in _app.tsx",
    );
  }

  return useZustandStore(store, selector!) as T extends RootState ? RootState : T;
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
      "useStoreApi must be used within a StoreProvider. " +
        "Make sure to wrap your app with <StoreProvider> in _app.tsx",
    );
  }

  return store;
};

/**
 * Type exports for external usage
 */
export type { StoreApi, RootState };
