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

// Mock storage with correct PlatformStorage interface
const mockStorage = {
  load: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  getAllKeys: vi.fn(),
};

// Mock the platform service module to use our mock storage
vi.mock('@shared/services/platform', () => ({
  getPlatformService: () => ({
    storage: mockStorage,
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
      mockStorage.load.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });

      expect(mockStorage.load).toHaveBeenCalledWith(testKey);
    });

    it('should load stored value on mount', async () => {
      const storedValue = { count: 100, name: 'stored' };
      mockStorage.load.mockResolvedValue(storedValue);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(storedValue);
      });
    });

    it('should save value to storage when set', async () => {
      mockStorage.load.mockResolvedValue(null);
      mockStorage.save.mockResolvedValue();

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current[2]).toBe(false); // isLoading = false
        expect(result.current[0]).toEqual(testValue); // Initial value loaded
      });

      const newValue = { count: 200, name: 'updated' };
      
      await act(async () => {
        result.current[1](newValue);
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(newValue);
      });

      expect(mockStorage.save).toHaveBeenCalledWith(testKey, newValue);
    });

    it('should handle string values correctly', async () => {
      mockStorage.load.mockResolvedValue(testString);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, 'default')
      );

      await waitFor(() => {
        expect(result.current[0]).toBe(testString);
      });
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.load.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });
    });

    it('should handle invalid JSON gracefully', async () => {
      mockStorage.load.mockRejectedValue(new Error('Parse error'));

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testValue)
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });
    });
  });
});