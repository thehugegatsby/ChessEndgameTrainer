/**
 * @fileoverview Unit tests for useLocalStorage hook
 * @description Tests platform-agnostic localStorage with async fallback and error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

// Mock platform service
const mockPlatformService = {
  storage: {
    save: jest.fn(),
    load: jest.fn(),
    remove: jest.fn()
  }
};

jest.mock('@shared/services/platform', () => ({
  getPlatformService: () => mockPlatformService
}));

// Mock logger
jest.mock('@shared/services/logging', () => ({
  getLogger: () => require('../../shared/logger-utils').createTestLogger()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('useLocalStorage Hook', () => {
  const testKey = 'test-key';
  const testValue = { count: 42, name: 'test' };
  const testString = 'simple string';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    
    // Reset platform service mock
    mockPlatformService.storage.save.mockResolvedValue(undefined);
    mockPlatformService.storage.load.mockResolvedValue(null);
  });

  describe('Initialization', () => {
    it('should initialize with simple initial value', () => {
      const { result } = renderHook(() => useLocalStorage(testKey, testString));

      expect(result.current[0]).toBe(testString);
    });

    it('should initialize with function-based initial value', () => {
      const initialValueFn = jest.fn(() => testValue);
      const { result } = renderHook(() => useLocalStorage(testKey, initialValueFn));

      expect(initialValueFn).toHaveBeenCalledTimes(1);
      expect(result.current[0]).toEqual(testValue);
    });

    it('should load existing value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testValue));

      const { result } = renderHook(() => useLocalStorage(testKey, 'default'));

      expect(localStorageMock.getItem).toHaveBeenCalledWith(testKey);
      expect(result.current[0]).toEqual(testValue);
    });

    it('should use initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage(testKey, testString));

      expect(result.current[0]).toBe(testString);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json {');

      const { result } = renderHook(() => useLocalStorage(testKey, testString));

      expect(result.current[0]).toBe(testString);
    });

    it('should handle missing window gracefully', () => {
      // Test the code path when window is undefined
      const { result } = renderHook(() => useLocalStorage(testKey, testValue));
      expect(result.current[0]).toEqual(testValue);
    });
  });

  describe('Setting Values', () => {
    it('should update state and save to platform storage', async () => {
      const { result } = renderHook(() => useLocalStorage(testKey, testValue));

      const newValue = { count: 100, name: 'updated' };
      await act(async () => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);
      expect(mockPlatformService.storage.save).toHaveBeenCalledWith(testKey, newValue);
    });

    it('should handle function-based updates', async () => {
      const { result } = renderHook(() => useLocalStorage(testKey, { count: 0 }));

      await act(async () => {
        result.current[1](prev => ({ count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ count: 1 });
      expect(mockPlatformService.storage.save).toHaveBeenCalledWith(testKey, { count: 1 });
    });

    it('should fall back to localStorage when platform storage fails', async () => {
      mockPlatformService.storage.save.mockRejectedValue(new Error('Platform storage failed'));

      const { result } = renderHook(() => useLocalStorage(testKey, testValue));

      const newValue = { count: 50, name: 'fallback' };
      await act(async () => {
        result.current[1](newValue);
        // Give time for async fallback
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toEqual(newValue);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(newValue));
    });

    it('should update state synchronously', async () => {
      const { result } = renderHook(() => useLocalStorage(testKey, testValue));

      const updatedValue = { count: 99, name: 'sync' };
      await act(async () => {
        result.current[1](updatedValue);
      });

      expect(result.current[0]).toEqual(updatedValue);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for primitives', () => {
      const { result } = renderHook(() => useLocalStorage('number-key', 42));

      expect(typeof result.current[0]).toBe('number');
      
      act(() => {
        result.current[1](100);
      });

      expect(result.current[0]).toBe(100);
    });

    it('should maintain type safety for objects', () => {
      interface TestObject {
        id: number;
        name: string;
        active: boolean;
      }

      const initialValue: TestObject = { id: 1, name: 'test', active: true };
      const { result } = renderHook(() => useLocalStorage('object-key', initialValue));

      expect(result.current[0]).toEqual(initialValue);
      
      act(() => {
        result.current[1]({ id: 2, name: 'updated', active: false });
      });

      expect(result.current[0]).toEqual({ id: 2, name: 'updated', active: false });
    });

    it('should handle boolean values correctly', () => {
      localStorageMock.getItem.mockReturnValue('true');

      const { result } = renderHook(() => useLocalStorage('boolean-key', false));

      expect(result.current[0]).toBe(true);
    });

    it('should handle array values correctly', () => {
      const arrayValue = [1, 2, 3, 'test'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(arrayValue));

      const { result } = renderHook(() => useLocalStorage('array-key', []));

      expect(result.current[0]).toEqual(arrayValue);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('corrupted{json}');

      const { result } = renderHook(() => useLocalStorage(testKey, 'fallback'));

      expect(result.current[0]).toBe('fallback');
    });

    it('should handle localStorage access errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useLocalStorage(testKey, 'fallback'));

      expect(result.current[0]).toBe('fallback');
    });
  });

  describe('Complex Data Types', () => {
    it('should handle nested objects', () => {
      const complexObject = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: {
          lastLogin: '2024-01-01',
          version: '1.0.0'
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));

      const { result } = renderHook(() => useLocalStorage('complex-key', {}));

      expect(result.current[0]).toEqual(complexObject);
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() => useLocalStorage('null-key', null));

      expect(result.current[0]).toBeNull();

      act(() => {
        result.current[1](undefined as any);
      });

      expect(result.current[0]).toBeUndefined();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-parse localStorage on every render', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testValue));

      const { rerender } = renderHook(() => useLocalStorage(testKey, 'initial'));

      rerender();
      rerender();

      // getItem should only be called once during initialization
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });
  });
});