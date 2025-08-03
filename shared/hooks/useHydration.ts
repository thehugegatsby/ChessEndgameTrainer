import { useEffect, useState } from "react";
import { useStore } from "@shared/store/store";

/**
 * Hook to check if Zustand store has been hydrated from persisted storage
 * This prevents UI flicker by waiting for localStorage data to load
 *
 * @returns Whether the store has been hydrated
 */
export function useHydration(): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Access the internal persist API to check hydration status
    const unsubscribe = useStore.persist?.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // If persist is not configured or hydration already finished
    if (!useStore.persist || useStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  return hasHydrated;
}

/**
 * Alternative approach using the _hasHydrated property directly from store
 * This is simpler but relies on Zustand's internal implementation
 *
 * @returns Whether the store has been hydrated
 */
export function useStoreHydration(): boolean {
  // This property is automatically added by persist middleware in v5
  return useStore((state) => (state as any)._hasHydrated ?? true);
}
