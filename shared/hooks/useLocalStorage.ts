import { useState, useEffect } from 'react';
import { getPlatformService } from '../services/platform';
import { getLogger } from '../services/logging';

const logger = getLogger().setContext('useLocalStorage');

/**
 * Custom hook for managing localStorage with React state
 * Uses platform abstraction for cross-platform compatibility
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get from platform storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const platformService = getPlatformService();
      // For initial load, we need to use sync storage fallback
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.warn(`Error reading storage key "${key}"`, error, { key });
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to platform storage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to platform storage (async, but fire-and-forget for performance)
      if (typeof window !== 'undefined') {
        const platformService = getPlatformService();
        platformService.storage.save(key, valueToStore).catch(error => {
          logger.error(`Failed to save to platform storage`, error, { key, valueToStore });
          // Fallback to localStorage for web
          try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (fallbackError) {
            logger.error('Fallback localStorage also failed', fallbackError, { key });
          }
        });
      }
    } catch (error) {
      logger.warn(`Error setting storage key "${key}"`, error, { key });
    }
  };

  return [storedValue, setValue];
} 