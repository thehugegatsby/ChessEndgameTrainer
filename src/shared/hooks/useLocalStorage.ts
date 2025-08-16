/**
 * @file localStorage hooks with React state management
 * @module hooks/useLocalStorage
 *
 * @description
 * Provides cross-platform localStorage functionality with async support.
 * Uses the PlatformService abstraction to work across web, mobile, and desktop.
 *
 * Three APIs are provided:
 * - useLocalStorage: Backward-compatible API that hides async complexity
 * - useLocalStorageWithState: Full-featured API with loading/error states
 * - useLocalStorageSync: Deprecated sync wrapper
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getPlatformService } from '../services/platform';
import { getLogger } from '../services/logging';

const logger = getLogger().setContext('useLocalStorage');

/**
 * INTERNAL: Full-featured async hook with loading state and error handling
 * Private implementation used by both legacy and new APIs
 *
 * @private
 * @template T - Type of the stored value
 * @param {string} key - Storage key
 * @param {T | (() => T)} initialValue - Initial value or factory function
 * @returns {[T | undefined, Function, boolean, Error | null]} Tuple of [value, setter, isLoading, error]
 */
function useLocalStorageInternal<T>(
  key: string,
  initialValue: T | (() => T)
): [T | undefined, (value: T | ((val: T | undefined) => T)) => void, boolean, Error | null] {
  const resolvedInitialValue = useMemo(() => {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }, [initialValue]);

  const [storedValue, setStoredValue] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // Effect for initial loading from storage
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPlatformService()
      .storage.load<T>(key)
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

    return () => {
      isMounted = false;
    };
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
    getPlatformService()
      .storage.save(key, storedValue)
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

    return () => {
      isMounted = false;
    };
  }, [key, storedValue, isLoading, saveError]);

  const setValue = useCallback(
    (value: T | ((val: T | undefined) => T)) => {
      // Clear any previous save error on a new update attempt
      if (saveError) {
        setSaveError(null);
      }
      setStoredValue(value);
    },
    [saveError]
  );

  return [storedValue, setValue, isLoading, saveError];
}

/**
 * Custom hook for managing localStorage with React state
 *
 * @description
 * Uses platform abstraction for cross-platform compatibility.
 * This API maintains backward compatibility with a simple [value, setValue] interface
 * while handling async operations internally. Loading states and errors are hidden.
 *
 * @template T - Type of the stored value
 * @param {string} key - Storage key to use
 * @param {T | (() => T)} initialValue - Initial value or factory function
 * @returns {[T, Function]} Tuple of [currentValue, setValue]
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * // Update value
 * setTheme('dark');
 *
 * // Update with function
 * setTheme(prev => prev === 'light' ? 'dark' : 'light');
 * ```
 *
 * @remarks
 * - Returns initialValue while loading from storage
 * - Automatically saves to storage on value changes
 * - Errors are logged but not exposed (use useLocalStorageWithState for error handling)
 * - For new code, consider using useLocalStorageWithState for full async support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  const [asyncValue, setAsyncValue, isLoading, saveError] = useLocalStorageInternal(
    key,
    initialValue
  );

  const resolvedInitialValue = useMemo(() => {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }, [initialValue]);

  // Return initial value while loading, then switch to loaded value (backward compatible)
  const currentValue = isLoading ? resolvedInitialValue : (asyncValue ?? resolvedInitialValue);

  // Wrapper for the setter to maintain backward compatible interface
  const compatSetValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(currentValue) : value;
      setAsyncValue(valueToStore);

      // Log save errors (backward compatible - original didn't expose errors)
      if (saveError) {
        logger.warn(`Storage save error (backward compatibility mode): ${saveError.message}`);
      }
    },
    [currentValue, setAsyncValue, saveError]
  );

  return [currentValue, compatSetValue];
}

/**
 * Enhanced localStorage hook with full loading state and error handling
 *
 * @description
 * New API that exposes all async behavior and error states.
 * Use this for new code that needs to handle loading states or save errors.
 *
 * @template T - Type of the stored value
 * @param {string} key - Storage key to use
 * @param {T | (() => T)} initialValue - Initial value or factory function
 * @returns {[T | undefined, Function, boolean, Error | null]} Tuple of [value, setValue, isLoading, saveError]
 *
 * @example
 * ```tsx
 * const [settings, setSettings, isLoading, error] = useLocalStorageWithState('settings', {});
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <SettingsForm
 *     settings={settings}
 *     onChange={setSettings}
 *   />
 * );
 * ```
 *
 * @remarks
 * - value is undefined during initial load
 * - isLoading is true until first load completes
 * - saveError contains any errors from the last save attempt
 * - Errors are automatically cleared on successful saves
 */
export function useLocalStorageWithState<T>(
  key: string,
  initialValue: T | (() => T)
): [T | undefined, (value: T | ((val: T | undefined) => T)) => void, boolean, Error | null] {
  return useLocalStorageInternal(key, initialValue);
}
