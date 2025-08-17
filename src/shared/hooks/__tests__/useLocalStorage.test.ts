import { vi, describe, it, expect, beforeEach } from 'vitest';
/**
 * @file Unit tests for useLocalStorage hook
 * @description Tests the localStorage hook with direct mocking (ServiceContainer removed)
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorageWithState } from '@shared/hooks/useLocalStorage';

// Mock logger using inline pattern like other tests
vi.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    setContext: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }),
}));

// Mock localStorage directly for tests
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock the platform service module to use our mock storage
vi.mock('@shared/services/platform', () => ({
  getPlatformService: () => ({
    storage: mockLocalStorage,
  }),
}));

describe('useLocalStorage Hook', () => {
  const testKey = 'test-key';
  const testValue = { count: 42, name: 'test' };
  const testString = 'simple string';

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('useLocalStorageWithState - Basic Functionality', () => {
    it('should return default value when storage is empty', async () => {
      mockLocalStorage.getItem.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(testKey);
    });

    it('should load stored value on mount', async () => {
      const storedValue = { count: 100, name: 'stored' };
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(storedValue));

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(storedValue);
      });
    });

    it('should save value to storage when set', async () => {
      mockLocalStorage.getItem.mockResolvedValue(null);
      mockLocalStorage.setItem.mockResolvedValue();

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      const newValue = { count: 200, name: 'updated' };
      
      await act(async () => {
        result.current[1](newValue);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(newValue);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(newValue)
      );
    });

    it('should handle string values correctly', async () => {
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(testString));

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, 'default')
      );

      await waitFor(() => {
        expect(result.current[0]).toBe(testString);
      });
    });

    it('should handle storage errors gracefully', async () => {
      mockLocalStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });
    });

    it('should handle invalid JSON gracefully', async () => {
      mockLocalStorage.getItem.mockResolvedValue('invalid json');

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });
    });
  });
});