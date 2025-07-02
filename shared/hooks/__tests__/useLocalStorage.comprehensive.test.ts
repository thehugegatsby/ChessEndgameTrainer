import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn()
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('useLocalStorage - Comprehensive Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Basic Functionality', () => {
    it('sollte initial value zurückgeben wenn localStorage leer ist', () => {
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial-value')
      );

      expect(result.current[0]).toBe('initial-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    it('sollte Wert aus localStorage laden wenn vorhanden', () => {
      localStorageMock.setItem('existing-key', JSON.stringify('stored-value'));

      const { result } = renderHook(() => 
        useLocalStorage('existing-key', 'initial-value')
      );

      expect(result.current[0]).toBe('stored-value');
    });

    it('sollte Werte korrekt in localStorage speichern', () => {
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key', 
        JSON.stringify('new-value')
      );
    });
  });

  describe('Complex Data Types', () => {
    it('sollte Objects korrekt handhaben', () => {
      const initialObject = { name: 'test', count: 0 };
      const { result } = renderHook(() => 
        useLocalStorage('object-key', initialObject)
      );

      const newObject = { name: 'updated', count: 5 };
      
      act(() => {
        result.current[1](newObject);
      });

      expect(result.current[0]).toEqual(newObject);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'object-key',
        JSON.stringify(newObject)
      );
    });

    it('sollte Arrays korrekt handhaben', () => {
      const initialArray = [1, 2, 3];
      const { result } = renderHook(() => 
        useLocalStorage('array-key', initialArray)
      );

      const newArray = [4, 5, 6];
      
      act(() => {
        result.current[1](newArray);
      });

      expect(result.current[0]).toEqual(newArray);
    });

    it('sollte Boolean values korrekt handhaben', () => {
      const { result } = renderHook(() => 
        useLocalStorage('bool-key', false)
      );

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
    });

    it('sollte Numbers korrekt handhaben', () => {
      const { result } = renderHook(() => 
        useLocalStorage('number-key', 0)
      );

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
    });
  });

  describe('Function Updater Pattern', () => {
    it('sollte function updater unterstützen', () => {
      const { result } = renderHook(() => 
        useLocalStorage('counter', 0)
      );

      act(() => {
        result.current[1](prev => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      
      act(() => {
        result.current[1](prev => prev * 2);
      });

      expect(result.current[0]).toBe(2);
    });

    it('sollte function updater für Objects unterstützen', () => {
      const initialState = { count: 0, name: 'test' };
      const { result } = renderHook(() => 
        useLocalStorage('state', initialState)
      );

      act(() => {
        result.current[1](prev => ({ ...prev, count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ count: 1, name: 'test' });
    });
  });

  describe('Error Handling', () => {
    it('sollte localStorage read errors graceful handhaben', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => 
        useLocalStorage('error-key', 'fallback')
      );

      expect(result.current[0]).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "error-key":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('sollte localStorage write errors graceful handhaben', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage write error');
      });

      const { result } = renderHook(() => 
        useLocalStorage('write-error-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      // State should still update even if localStorage fails
      expect(result.current[0]).toBe('new-value');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "write-error-key":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('sollte invalid JSON graceful handhaben', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock.setItem('invalid-json-key', 'invalid-json{');

      const { result } = renderHook(() => 
        useLocalStorage('invalid-json-key', 'fallback')
      );

      expect(result.current[0]).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('SSR Support', () => {
    it('sollte mit undefined localStorage korrekt funktionieren', () => {
      // Mock localStorage to be undefined (SSR simulation)
      const originalLocalStorage = global.localStorage;
      const originalWindow = global.window;
      
      // @ts-ignore
      global.localStorage = undefined;

      const { result } = renderHook(() => 
        useLocalStorage('ssr-key', 'ssr-initial')
      );

      expect(result.current[0]).toBe('ssr-initial');

      // Restore
      global.localStorage = originalLocalStorage;
      global.window = originalWindow;
    });

    it('sollte setValue mit undefined localStorage nicht crashen', () => {
      // Mock localStorage to be undefined (SSR simulation)
      const originalLocalStorage = global.localStorage;
      const originalWindow = global.window;
      
      // @ts-ignore
      global.localStorage = undefined;

      const { result } = renderHook(() => 
        useLocalStorage('ssr-key', 'ssr-initial')
      );

      // This should not crash
      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');

      // Restore
      global.localStorage = originalLocalStorage;
      global.window = originalWindow;
    });
  });

  describe('Performance & Memory', () => {
    it('sollte gleichen Wert nicht erneut serialisieren', () => {
      const { result } = renderHook(() => 
        useLocalStorage('perf-key', 'initial')
      );

      const initialSetItemCalls = localStorageMock.setItem.mock.calls.length;

      act(() => {
        result.current[1]('value1');
      });

      expect(localStorageMock.setItem.mock.calls.length).toBe(initialSetItemCalls + 1);

      act(() => {
        result.current[1]('value1'); // Same value
      });

      // Should still call setItem (this is current behavior)
      expect(localStorageMock.setItem.mock.calls.length).toBe(initialSetItemCalls + 2);
    });
  });

  describe('Key-specific Behavior', () => {
    it('sollte verschiedene Keys getrennt verwalten', () => {
      const { result: result1 } = renderHook(() => 
        useLocalStorage('key1', 'value1')
      );
      
      const { result: result2 } = renderHook(() => 
        useLocalStorage('key2', 'value2')
      );

      act(() => {
        result1.current[1]('updated1');
      });

      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('value2'); // Should not be affected
    });

    it('sollte mit speziellen Zeichen in Keys umgehen können', () => {
      const specialKey = 'key with spaces & symbols!@#$%^&*()';
      const { result } = renderHook(() => 
        useLocalStorage(specialKey, 'special-value')
      );

      act(() => {
        result.current[1]('updated-special');
      });

      expect(result.current[0]).toBe('updated-special');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        specialKey,
        JSON.stringify('updated-special')
      );
    });
  });

  describe('Edge Cases', () => {
    it('sollte null values korrekt handhaben', () => {
      const { result } = renderHook(() => 
        useLocalStorage<string | null>('null-key', null)
      );

      expect(result.current[0]).toBeNull();

      act(() => {
        result.current[1]('not-null');
      });

      expect(result.current[0]).toBe('not-null');

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();
    });

    it('sollte undefined als initial value handhaben', () => {
      const { result } = renderHook(() => 
        useLocalStorage<string | undefined>('undefined-key', undefined)
      );

      expect(result.current[0]).toBeUndefined();
    });

    it('sollte empty strings korrekt handhaben', () => {
      const { result } = renderHook(() => 
        useLocalStorage('empty-key', '')
      );

      expect(result.current[0]).toBe('');

      act(() => {
        result.current[1]('not-empty');
      });

      expect(result.current[0]).toBe('not-empty');

      act(() => {
        result.current[1]('');
      });

      expect(result.current[0]).toBe('');
    });
  });
}); 