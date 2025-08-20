/**
 * @file Hydration hooks for Zustand store persistence
 * @module hooks/useHydration
 *
 * @description
 * Provides hooks to check if the Zustand store has been hydrated from persisted storage.
 * Essential for preventing UI flicker and ensuring correct initial state in SSR environments.
 */

import { useEffect, useState } from 'react';
import { useStore, useStoreApi } from '@shared/store/StoreContext';

/**
 * Type for Zustand persist API (internal/undocumented)
 */
interface PersistAPI {
  onFinishHydration?: (callback: () => void) => (() => void) | undefined;
  hasHydrated?: () => boolean;
}

interface StoreApiWithPersist {
  persist?: PersistAPI;
}

interface StateWithHydration {
  _hasHydrated?: boolean;
}

/**
 * Hook to check if Zustand store has been hydrated from persisted storage
 *
 * @description
 * This hook prevents UI flicker by waiting for localStorage/sessionStorage data to load.
 * Particularly important for SSR/SSG applications where the server and client may have
 * different initial states until hydration completes.
 *
 * @returns {boolean} Whether the store has been hydrated from persistent storage
 *
 * @example
 * ```tsx
 * function App() {
 *   const hasHydrated = useHydration();
 *
 *   if (!hasHydrated) {
 *     return <LoadingSpinner />; // or null to prevent flicker
 *   }
 *
 *   return <MainContent />;
 * }
 * ```
 *
 * @remarks
 * - Uses Zustand's persist middleware API
 * - Returns true immediately if persist is not configured
 * - Automatically cleans up listeners on unmount
 * - Safe to use in SSR environments
 */
export function useHydration(): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);
  const storeApi = useStoreApi();

  useEffect(() => {
    // Access the internal persist API to check hydration status
    const persistApi = (storeApi as StoreApiWithPersist).persist;
    const unsubscribe = persistApi?.onFinishHydration?.(() => {
      setHasHydrated(true);
    });

    // If persist is not configured or hydration already finished
    if (!persistApi || persistApi.hasHydrated?.()) {
      setHasHydrated(true);
    }

    return () => {
      unsubscribe?.();
    };
  }, [storeApi]);

  return hasHydrated;
}

/**
 * Alternative hydration check using Zustand's internal _hasHydrated property
 *
 * @description
 * This is a simpler approach that directly accesses the _hasHydrated property
 * added by Zustand's persist middleware. Less code but relies on internal implementation.
 *
 * @returns {boolean} Whether the store has been hydrated from persistent storage
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const isHydrated = useStoreHydration();
 *   const settings = useStore(state => state.settings);
 *
 *   // Show placeholder while hydrating to prevent flicker
 *   if (!isHydrated) {
 *     return <SettingsSkeleton />;
 *   }
 *
 *   return <SettingsForm settings={settings} />;
 * }
 * ```
 *
 * @remarks
 * - Relies on Zustand v5 internal implementation detail (_hasHydrated)
 * - Returns true if persist middleware is not configured
 * - Synchronous - no useEffect needed
 * - Consider using useHydration() for more robust implementation
 *
 * @see {@link useHydration} for the recommended approach
 */
export function useStoreHydration(): boolean {
  // This property is automatically added by persist middleware in v5
  return useStore(state => (state as StateWithHydration)._hasHydrated ?? true);
}
