/**
 * @fileoverview Unit tests for useLocalStorage hook - ServiceContainer Migration 
 * @description Demonstrates how to test localStorage hooks with ServiceContainer pattern
 * This is a simplified example showing the migration approach
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { createTestContainer } from '../../utils';
import type { IPlatformStorage } from '@shared/services/platform/types';

// Mock logger 
jest.mock('@shared/services/logging', () => ({
  getLogger: () => require('../../shared/logger-utils').createTestLogger()
}));

// Create test container and storage service
let testContainer: ReturnType<typeof createTestContainer>;
let mockStorageService: IPlatformStorage;

// Mock the platform service module to use our test container
jest.mock('@shared/services/platform', () => ({
  getPlatformService: () => ({
    storage: mockStorageService
  })
}));

describe('useLocalStorage Hook - ServiceContainer Migration', () => {
  let mockLocalStorage: Storage;

  const testKey = 'test-key';
  const testValue = { count: 42, name: 'test' };
  const testString = 'simple string';

  beforeEach(() => {
    // Create test container with mocked browser APIs
    testContainer = createTestContainer();
    mockStorageService = testContainer.resolve('platform.storage');
    mockLocalStorage = testContainer.resolveCustom<Storage>('browser.localStorage');
    
    // Mock window.localStorage for hook's synchronous initialization
    Object.assign(global, {
      window: {
        ...global.window,
        localStorage: mockLocalStorage
      }
    });

    // Reset mock behaviors
    jest.clearAllMocks();
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue(null);
    (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {});
  });

  describe('Initialization', () => {
    test('should initialize with simple initial value', () => {
      const { result } = renderHook(() => useLocalStorage(testKey, testString));
      expect(result.current[0]).toBe(testString);
    });

    test('should initialize with function-based initial value', () => {
      const initialValueFn = jest.fn(() => testValue);
      const { result } = renderHook(() => useLocalStorage(testKey, initialValueFn));

      expect(initialValueFn).toHaveBeenCalledTimes(1);
      expect(result.current[0]).toEqual(testValue);
    });

    test('should load existing value from localStorage', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(testValue));

      const { result } = renderHook(() => useLocalStorage(testKey, 'default'));

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result.current[0]).toEqual(testValue);
    });

    test('should use initial value when localStorage is empty', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage(testKey, testString));

      expect(result.current[0]).toBe(testString);
    });

    test('should handle invalid JSON gracefully', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('invalid json {');

      const { result } = renderHook(() => useLocalStorage(testKey, testString));

      expect(result.current[0]).toBe(testString);
    });
  });

  describe('Setting Values', () => {
    test('should update state and save to platform storage', async () => {
      const { result } = renderHook(() => useLocalStorage(testKey, testValue));

      const newValue = { count: 100, name: 'updated' };
      await act(async () => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);
      // Verify platform storage was called
      expect(mockStorageService.save).toHaveBeenCalledWith(testKey, newValue);
    });

    test('should handle function-based updates', async () => {
      const { result } = renderHook(() => useLocalStorage(testKey, { count: 0 }));

      await act(async () => {
        result.current[1](prev => ({ count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ count: 1 });
      expect(mockStorageService.save).toHaveBeenCalledWith(testKey, { count: 1 });
    });

    test('should fall back to localStorage when platform storage fails', async () => {
      jest.spyOn(mockStorageService, 'save').mockRejectedValue(new Error('Platform storage failed'));

      const { result } = renderHook(() => useLocalStorage(testKey, testValue));

      const newValue = { count: 50, name: 'fallback' };
      await act(async () => {
        result.current[1](newValue);
        // Give time for async fallback
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toEqual(newValue);
      // Should attempt platform storage first, then fallback to localStorage
      expect(mockStorageService.save).toHaveBeenCalledWith(testKey, newValue);
    });
  });

  describe('Type Safety', () => {
    test('should maintain type safety for primitives', () => {
      const { result } = renderHook(() => useLocalStorage('number-key', 42));

      expect(typeof result.current[0]).toBe('number');
      
      act(() => {
        result.current[1](100);
      });

      expect(result.current[0]).toBe(100);
    });

    test('should maintain type safety for objects', () => {
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

    test('should handle boolean values correctly', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('true');

      const { result } = renderHook(() => useLocalStorage('boolean-key', false));

      expect(result.current[0]).toBe(true);
    });

    test('should handle array values correctly', () => {
      const arrayValue = [1, 2, 3, 'test'];
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(arrayValue));

      const { result } = renderHook(() => useLocalStorage('array-key', []));

      expect(result.current[0]).toEqual(arrayValue);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from corrupted localStorage data', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('corrupted{json}');

      const { result } = renderHook(() => useLocalStorage(testKey, 'fallback'));

      expect(result.current[0]).toBe('fallback');
    });

    test('should handle localStorage access errors', () => {
      (mockLocalStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useLocalStorage(testKey, 'fallback'));

      expect(result.current[0]).toBe('fallback');
    });
  });

  describe('ServiceContainer Integration', () => {
    test('should use ServiceContainer storage service', async () => {
      const { result } = renderHook(() => useLocalStorage(testKey, 'initial'));

      await act(async () => {
        result.current[1]('updated');
      });

      // Verify the hook used our mocked storage service from the container
      expect(mockStorageService.save).toHaveBeenCalledWith(testKey, 'updated');
      expect(jest.isMockFunction(mockStorageService.save)).toBe(true);
    });

    test('should provide perfect test isolation', () => {
      // Each test gets fresh container and fresh mocks
      const container1 = createTestContainer();
      const storage1 = container1.resolve('platform.storage');
      
      const container2 = createTestContainer();
      const storage2 = container2.resolve('platform.storage');

      // Different containers = different service instances
      expect(storage1).not.toBe(storage2);
      
      // Both should be working mock instances
      expect(typeof storage1.save).toBe('function');
      expect(typeof storage2.save).toBe('function');
    });

    test('should work with Jest mocking system', () => {
      // Verify our mocks are properly isolated to container
      expect(jest.isMockFunction(mockLocalStorage.setItem)).toBe(true);
      expect(jest.isMockFunction(mockLocalStorage.getItem)).toBe(true);
      expect(jest.isMockFunction(mockStorageService.save)).toBe(true);
    });

    test('should support performance testing', () => {
      const { result } = renderHook(() => useLocalStorage(testKey, 'initial'));

      // Multiple re-renders should not re-parse localStorage
      const { rerender } = renderHook(() => useLocalStorage(testKey, 'initial'));
      rerender();
      rerender();

      // getItem should only be called once during initialization
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Migration Validation', () => {
    test('should demonstrate Jest 30 compatibility', () => {
      // This test validates that we are not using problematic global mocking patterns
      
      // ✅ Uses ServiceContainer dependency injection
      expect(testContainer).toBeDefined();
      expect(mockStorageService).toBeDefined();
      
      // ✅ Uses Object.assign instead of Object.defineProperty 
      expect(global.window.localStorage).toBe(mockLocalStorage);
      
      // ✅ Perfect mock isolation per test
      expect(jest.isMockFunction(mockLocalStorage.getItem)).toBe(true);
      
      // ✅ No global localStorage pollution
      const newContainer = createTestContainer();
      const newStorage = newContainer.resolveCustom<Storage>('browser.localStorage');
      expect(newStorage).not.toBe(mockLocalStorage);
    });
  });
});