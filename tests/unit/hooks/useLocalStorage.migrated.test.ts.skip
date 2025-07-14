/**
 * useLocalStorage Hook Migration - Jest 30 Compatible Version
 * 
 * MIGRATED FROM: Global localStorage and platform service mocks (Jest 30 incompatible)
 * MIGRATED TO: ServiceContainer with React integration (Jest 30 compatible)
 * 
 * This demonstrates migrating React hook tests that depend on platform services
 * to use our new ServiceContainer pattern with React Testing Library integration.
 */

import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createTestContainer, TestScenarios } from '../../utils';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

// Mock the logger to avoid external dependencies
jest.mock('@shared/services/logging', () => ({
  getLogger: () => require('../../../shared/logger-utils').createTestLogger()
}));

describe('useLocalStorage Hook - Migrated to ServiceContainer', () => {
  describe('Basic Hook Functionality with ServiceContainer', () => {
    let container: ReturnType<typeof createTestContainer>;
    let TestWrapper: React.ComponentType<{ children: React.ReactNode }>;

    beforeEach(() => {
      container = createTestContainer();
      
      // Create React wrapper with ServiceProvider
      TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };
    });

    test('should initialize with simple initial value', () => {
      const testKey = 'test-key';
      const testValue = 'simple string';
      
      const { result } = renderHook(
        () => useLocalStorage(testKey, testValue),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBe(testValue);
    });

    test('should initialize with function-based initial value', () => {
      const testKey = 'test-key';
      const testValue = { count: 42, name: 'test' };
      const initialValueFn = jest.fn(() => testValue);
      
      const { result } = renderHook(
        () => useLocalStorage(testKey, initialValueFn),
        { wrapper: TestWrapper }
      );

      expect(initialValueFn).toHaveBeenCalledTimes(1);
      expect(result.current[0]).toEqual(testValue);
    });

    test('should load existing value from storage via ServiceContainer', async () => {
      const testKey = 'existing-key';
      const testValue = { count: 42, name: 'test' };

      // Pre-populate storage using the container
      const storageService = container.resolve('platform.storage');
      await storageService.save(testKey, testValue);

      const { result } = renderHook(
        () => useLocalStorage(testKey, 'default'),
        { wrapper: TestWrapper }
      );

      // Allow hook to load data asynchronously
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toEqual(testValue);
    });

    test('should use initial value when storage is empty', () => {
      const testKey = 'empty-key';
      const initialValue = 'fallback value';

      const { result } = renderHook(
        () => useLocalStorage(testKey, initialValue),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBe(initialValue);
    });
  });

  describe('Setting Values with ServiceContainer Integration', () => {
    let container: ReturnType<typeof createTestContainer>;
    let TestWrapper: React.ComponentType<{ children: React.ReactNode }>;

    beforeEach(() => {
      container = createTestContainer();
      
      TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };
    });

    test('should update state and save to platform storage', async () => {
      const testKey = 'update-test';
      const initialValue = { count: 0, name: 'initial' };
      const newValue = { count: 100, name: 'updated' };

      const { result } = renderHook(
        () => useLocalStorage(testKey, initialValue),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);

      // Verify data was saved to the platform storage via ServiceContainer
      const storageService = container.resolve('platform.storage');
      const saved = await storageService.load(testKey);
      expect(saved).toEqual(newValue);
    });

    test('should handle function-based updates', async () => {
      const testKey = 'function-update-test';
      const initialValue = { count: 0 };

      const { result } = renderHook(
        () => useLocalStorage(testKey, initialValue),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        result.current[1](prev => ({ count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ count: 1 });

      // Verify the update was saved
      const storageService = container.resolve('platform.storage');
      const saved = await storageService.load(testKey);
      expect(saved).toEqual({ count: 1 });
    });

    test('should handle storage save failures gracefully', async () => {
      // Create container with failing storage
      const failingStorage = {
        save: jest.fn().mockRejectedValue(new Error('Platform storage failed')),
        load: jest.fn().mockResolvedValue(null),
        remove: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn().mockResolvedValue([])
      };

      const mockLocalStorage = {
        setItem: jest.fn(),
        getItem: jest.fn().mockReturnValue(null),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      };

      const containerWithFailingStorage = createTestContainer({
        localStorage: mockLocalStorage,
        customServices: {
          'platform.storage': failingStorage
        }
      });

      const FailureTestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return <ServiceProvider container={containerWithFailingStorage}>{children}</ServiceProvider>;
      };

      const testKey = 'failure-test';
      const initialValue = { count: 0 };
      const newValue = { count: 50, name: 'fallback' };

      const { result } = renderHook(
        () => useLocalStorage(testKey, initialValue),
        { wrapper: FailureTestWrapper }
      );

      await act(async () => {
        result.current[1](newValue);
        // Give time for fallback logic
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // State should still update even if storage fails
      expect(result.current[0]).toEqual(newValue);
      
      // Should fall back to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        testKey, 
        JSON.stringify(newValue)
      );
    });
  });

  describe('Type Safety with ServiceContainer', () => {
    let container: ReturnType<typeof createTestContainer>;
    let TestWrapper: React.ComponentType<{ children: React.ReactNode }>;

    beforeEach(() => {
      container = createTestContainer();
      
      TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };
    });

    test('should maintain type safety for primitives', async () => {
      const { result } = renderHook(
        () => useLocalStorage('number-key', 42),
        { wrapper: TestWrapper }
      );

      expect(typeof result.current[0]).toBe('number');
      
      await act(async () => {
        result.current[1](100);
      });

      expect(result.current[0]).toBe(100);
    });

    test('should maintain type safety for objects', async () => {
      interface TestObject {
        id: number;
        name: string;
        active: boolean;
      }

      const initialValue: TestObject = { id: 1, name: 'test', active: true };
      const { result } = renderHook(
        () => useLocalStorage('object-key', initialValue),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toEqual(initialValue);
      
      await act(async () => {
        result.current[1]({ id: 2, name: 'updated', active: false });
      });

      expect(result.current[0]).toEqual({ id: 2, name: 'updated', active: false });
    });

    test('should handle boolean values correctly', async () => {
      // Pre-populate storage with boolean value
      const storageService = container.resolve('platform.storage');
      await storageService.save('boolean-key', true);

      const { result } = renderHook(
        () => useLocalStorage('boolean-key', false),
        { wrapper: TestWrapper }
      );

      // Allow hook to load the pre-populated value
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toBe(true);
    });

    test('should handle array values correctly', async () => {
      const arrayValue = [1, 2, 3, 'test'];
      
      // Pre-populate storage
      const storageService = container.resolve('platform.storage');
      await storageService.save('array-key', arrayValue);

      const { result } = renderHook(
        () => useLocalStorage('array-key', []),
        { wrapper: TestWrapper }
      );

      // Allow hook to load the pre-populated value
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toEqual(arrayValue);
    });
  });

  describe('Error Recovery with ServiceContainer', () => {
    test('should recover from corrupted storage data', async () => {
      // Create storage that returns corrupted data
      const corruptedStorage = {
        getItem: jest.fn().mockReturnValue('corrupted{json}'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      };

      const container = createTestContainer({ localStorage: corruptedStorage });
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      const { result } = renderHook(
        () => useLocalStorage('corrupted-key', 'fallback'),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBe('fallback');
    });

    test('should handle storage access errors', async () => {
      // Create storage that throws errors
      const errorStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error('localStorage access denied');
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      };

      const container = createTestContainer({ localStorage: errorStorage });
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      const { result } = renderHook(
        () => useLocalStorage('error-key', 'fallback'),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBe('fallback');
    });
  });

  describe('Pre-configured Scenarios for Hook Testing', () => {
    test('should work with offline scenario', () => {
      const container = TestScenarios.offline();
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      const { result } = renderHook(
        () => useLocalStorage('offline-test', 'default'),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBe('default');
      
      // Verify we're in offline scenario
      const deviceService = container.resolve('platform.device');
      expect(deviceService.getNetworkStatus().isOnline).toBe(false);
    });

    test('should work with pre-populated storage scenario', async () => {
      const container = TestScenarios.withStorageData({
        'chess_trainer_prepopulated-key': JSON.stringify({ preset: 'value' })
      });
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      const { result } = renderHook(
        () => useLocalStorage('prepopulated-key', {}),
        { wrapper: TestWrapper }
      );

      // Allow hook to load pre-populated data
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toEqual({ preset: 'value' });
    });
  });

  describe('Complex Data Types with ServiceContainer', () => {
    let container: ReturnType<typeof createTestContainer>;
    let TestWrapper: React.ComponentType<{ children: React.ReactNode }>;

    beforeEach(() => {
      container = createTestContainer();
      
      TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };
    });

    test('should handle nested objects', async () => {
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

      // Pre-populate storage
      const storageService = container.resolve('platform.storage');
      await storageService.save('complex-key', complexObject);

      const { result } = renderHook(
        () => useLocalStorage('complex-key', {}),
        { wrapper: TestWrapper }
      );

      // Allow hook to load data
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toEqual(complexObject);
    });

    test('should handle null and undefined values', async () => {
      const { result } = renderHook(
        () => useLocalStorage('null-key', null),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBeNull();

      await act(async () => {
        result.current[1](undefined as any);
      });

      expect(result.current[0]).toBeUndefined();
    });
  });

  describe('Performance Considerations with ServiceContainer', () => {
    test('should not re-initialize container on every render', () => {
      const containerCreationSpy = jest.spyOn(require('../../utils'), 'createTestContainer');
      
      const container = createTestContainer();
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      const { rerender } = renderHook(
        () => useLocalStorage('perf-key', 'initial'),
        { wrapper: TestWrapper }
      );

      const initialCallCount = containerCreationSpy.mock.calls.length;

      rerender();
      rerender();

      // Container should not be recreated on re-renders
      expect(containerCreationSpy.mock.calls.length).toBe(initialCallCount);
      
      containerCreationSpy.mockRestore();
    });

    test('hook should work efficiently with ServiceContainer', async () => {
      const container = createTestContainer();
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      const start = performance.now();

      // Create multiple hook instances
      const { result: result1 } = renderHook(
        () => useLocalStorage('perf1', 'value1'),
        { wrapper: TestWrapper }
      );
      const { result: result2 } = renderHook(
        () => useLocalStorage('perf2', 'value2'),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        result1.current[1]('updated1');
        result2.current[1]('updated2');
      });

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(100); // Should be fast
      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('updated2');
    });
  });

  describe('Migration Validation', () => {
    test('new pattern should be Jest 30 compatible', () => {
      const container = createTestContainer();
      const mockStorage = container.resolveCustom<Storage>('browser.localStorage');
      
      // Verify mocks work in Jest 30
      expect(jest.isMockFunction(mockStorage.setItem)).toBe(true);
      expect(jest.isMockFunction(mockStorage.getItem)).toBe(true);
    });

    test('should provide better test isolation than global mocks', async () => {
      // Test 1: Set up data in one container
      const container1 = createTestContainer();
      const storage1 = container1.resolve('platform.storage');
      await storage1.save('isolation-test', 'data1');

      // Test 2: Different container should not see the data
      const container2 = createTestContainer();
      const storage2 = container2.resolve('platform.storage');
      const result = await storage2.load('isolation-test');
      
      expect(result).toBeNull(); // Perfect isolation
    });

    test('should demonstrate improved error handling', async () => {
      const container = createTestContainer();
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const { ServiceProvider } = require('@shared/services/container/adapter');
        return React.createElement(ServiceProvider, { container }, children);
      };

      // This would have been problematic with global mocks
      const { result } = renderHook(
        () => useLocalStorage('error-test', 'fallback'),
        { wrapper: TestWrapper }
      );

      expect(result.current[0]).toBe('fallback');
      
      // Hook should work normally even with error scenarios
      await act(async () => {
        result.current[1]('new value');
      });

      expect(result.current[0]).toBe('new value');
    });
  });
});