import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getPlatformService } from '../services/platform';
import { getLogger } from '../services/logging';

const logger = getLogger().setContext('useLocalStorage');

/**
 * Custom hook for managing localStorage with React state
 * Uses platform abstraction for cross-platform compatibility
 * 
 * REFACTORED VERSION: Fully async, ServiceContainer-compatible
 * - Eliminates direct window.localStorage access
 * - Uses only platform service for ALL storage operations
 * - Perfect Jest 30 compatibility through dependency injection
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [
  T | undefined,
  (value: T | ((val: T | undefined) => T)) => void,
  boolean,
  Error | null
] {
  const resolvedInitialValue = useMemo(() => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, [initialValue]);

  const [storedValue, setStoredValue] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // Effect for initial loading from storage
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPlatformService().storage.load<T>(key)
      .then(item => {
        if (isMounted) {
          setStoredValue(item !== null ? item : resolvedInitialValue);
        }
      })
      .catch(loadError => {
        logger.warn(`Error loading storage key "${key}": ${loadError}`);
        if (isMounted) {
          setStoredValue(resolvedInitialValue);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [key, resolvedInitialValue]);

  // Ref to prevent saving the value that was just loaded from storage
  const isInitialMountAfterLoad = useRef(true);

  // Effect for saving to storage on value change
  useEffect(() => {
    if (isLoading) {
      isInitialMountAfterLoad.current = true; // Reset on re-load
      return;
    }

    if (isInitialMountAfterLoad.current) {
      // This is the first render after loading. Don't save the initial value.
      isInitialMountAfterLoad.current = false;
      return;
    }

    let isMounted = true;
    getPlatformService().storage.save(key, storedValue)
      .then(() => {
        // On success, clear any previous error
        if (isMounted && saveError !== null) {
          setSaveError(null);
        }
      })
      .catch(err => {
        logger.error(`Failed to save storage key "${key}": ${err}`);
        if (isMounted) {
          setSaveError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => { isMounted = false; };
  }, [key, storedValue, isLoading, saveError]);

  const setValue = useCallback((value: T | ((val: T | undefined) => T)) => {
    // Clear any previous save error on a new update attempt
    if (saveError) {
      setSaveError(null);
    }
    setStoredValue(value);
  }, [saveError]);

  return [storedValue, setValue, isLoading, saveError];
}

/**
 * Backward compatibility hook with synchronous behavior
 * Uses the new async hook but provides a fallback for immediate values
 * 
 * ⚠️ DEPRECATED: Use the main useLocalStorage hook instead
 * This exists only for gradual migration of existing components
 */
export function useLocalStorageSync<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  const [asyncValue, setAsyncValue, isLoading, saveError] = useLocalStorage(key, initialValue);
  
  const resolvedInitialValue = useMemo(() => {
    return typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
  }, [initialValue]);

  // Return initial value while loading, then switch to loaded value
  const currentValue = isLoading ? resolvedInitialValue : (asyncValue ?? resolvedInitialValue);
  
  // Wrapper for the sync setter to maintain sync interface
  const syncSetValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(currentValue) : value;
    // Call the async setter (now synchronous, just updates state)
    setAsyncValue(valueToStore);
    
    // Log save errors if they occur
    if (saveError) {
      logger.warn(`Storage save error: ${saveError.message}`);
    }
  }, [currentValue, setAsyncValue, saveError]);

  return [currentValue, syncSetValue];
}