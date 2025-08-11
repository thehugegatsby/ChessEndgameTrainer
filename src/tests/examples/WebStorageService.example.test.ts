/**
 * WebStorageService Testing Example
 * Shows how to test storage services using ServiceContainer with dependency injection
 *
 * This example demonstrates the recommended approach for testing platform services
 * with proper isolation and no global state pollution.
 */

import React from "react";
import { createTestContainer, TestScenarios, TestAssertions } from "../utils";
import type { PlatformStorage } from "@shared/services/platform/types";

describe("WebStorageService - Example Tests", () => {
  // APPROACH 1: Per-test container (recommended for isolation)
  describe("Per-test container approach", () => {
    let container: ReturnType<typeof createTestContainer>;
    let storageService: PlatformStorage;
    let mockStorage: Storage;

    beforeEach(() => {
      // Create fresh container per test - no global state!
      container = createTestContainer();
      storageService = container.resolve("platform.storage");
      mockStorage = container.resolveCustom<Storage>("browser.localStorage");
    });

    test("should save and load data correctly", async () => {
      // Test data
      const testKey = "test-key";
      const testData = { name: "John", age: 30 };

      // Save data
      await storageService.save(testKey, testData);

      // Verify localStorage was called
      TestAssertions.expectStorageCall(
        mockStorage,
        "setItem",
        "chess_trainer_test-key",
        JSON.stringify(testData),
      );

      // Load data
      const loadedData = await storageService.load(testKey);

      // Assertions
      expect(loadedData).toEqual(testData);
      TestAssertions.expectStorageCall(
        mockStorage,
        "getItem",
        "chess_trainer_test-key",
      );
    });

    test("should handle invalid keys gracefully", async () => {
      const invalidKey = "invalid-key!@#";

      // Should throw error for invalid key
      await expect(storageService.save(invalidKey, "data")).rejects.toThrow(
        "Invalid storage key",
      );
    });

    test("should clear all prefixed keys", async () => {
      // Setup: Save multiple items
      await storageService.save("key1", "value1");
      await storageService.save("key2", "value2");

      // Clear all
      await storageService.clear();

      // Verify all keys were removed
      const keys = await storageService.getAllKeys();
      expect(keys).toHaveLength(0);
    });

    test("should return null for non-existent keys", async () => {
      const result = await storageService.load("non-existent-key");
      expect(result).toBeNull();
    });
  });

  // APPROACH 2: Pre-configured scenarios
  describe("Pre-configured scenarios", () => {
    test("should work with pre-populated storage", async () => {
      // Use scenario with pre-existing data
      const container = TestScenarios.withStorageData({
        "chess_trainer_existing-key": JSON.stringify({ value: "existing" }),
      });

      const storageService = container.resolve("platform.storage");

      // Should load existing data
      const result = await storageService.load("existing-key");
      expect(result).toEqual({ value: "existing" });
    });

    test("should handle offline scenario", async () => {
      const container = TestScenarios.offline();
      const deviceService = container.resolve("platform.device");

      // Device should report offline
      const networkStatus = deviceService.getNetworkStatus();
      expect(networkStatus.isOnline).toBe(false);
    });
  });

  // APPROACH 3: Custom mock overrides
  describe("Custom mock scenarios", () => {
    test("should handle localStorage quota exceeded", async () => {
      // Create container with localStorage that throws quota error
      const mockStorageWithQuota = {
        getItem: jest.fn(),
        setItem: jest.fn().mockImplementation(() => {
          throw new Error("QuotaExceededError");
        }),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0,
      } as Storage;

      const container = createTestContainer({
        localStorage: mockStorageWithQuota,
      });

      const storageService = container.resolve("platform.storage");

      // Should handle quota error gracefully
      await expect(storageService.save("key", "data")).rejects.toThrow(
        "Failed to save data",
      );
    });

    test("should handle corrupted JSON data", async () => {
      // Create localStorage with corrupted data
      const mockStorageWithCorruption = {
        getItem: jest.fn().mockReturnValue("invalid-json{"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 1,
      } as Storage;

      const container = createTestContainer({
        localStorage: mockStorageWithCorruption,
      });

      const storageService = container.resolve("platform.storage");

      // Should handle corrupted JSON gracefully
      const result = await storageService.load("corrupted-key");
      expect(result).toBeNull();
    });
  });

  // COMPARISON: Old vs New approach
  describe("Migration comparison", () => {
    test("OLD APPROACH (Jest 30 incompatible)", () => {
      // This is what we used to do - BREAKS in Jest 30!
      /*
      beforeAll(() => {
        Object.defineProperty(global, 'localStorage', {
          value: mockLocalStorage,
          writable: true
        });
      });
      
      afterAll(() => {
        Object.defineProperty(global, 'localStorage', {
          value: originalLocalStorage,
          writable: true
        });
      });
      */
      // Problems:
      // - Global state pollution
      // - Jest 30 incompatible (window.localStorage non-configurable)
      // - Manual cleanup required
      // - Test isolation issues
    });

    test("NEW APPROACH (Jest 30 compatible)", async () => {
      // ✅ This is our new approach - Jest 30 compatible!
      const container = createTestContainer();
      const storageService = container.resolve("platform.storage");
      const mockStorage = container.resolveCustom<Storage>(
        "browser.localStorage",
      );

      // Benefits:
      // ✅ No global state pollution
      // ✅ Jest 30 compatible
      // ✅ Automatic cleanup via container
      // ✅ Perfect test isolation
      // ✅ Type-safe service resolution

      await storageService.save("test", "data");
      TestAssertions.expectStorageCall(
        mockStorage,
        "setItem",
        "chess_trainer_test",
        '"data"',
      );
    });
  });
});

/**
 * Performance comparison between old and new approach
 */
describe("Performance comparison", () => {
  test("container creation should be fast", () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const container = createTestContainer();
      container.resolve("platform.storage");
    }

    const end = performance.now();
    const duration = end - start;

    // Should create 100 containers + services in reasonable time
    expect(duration).toBeLessThan(1000); // 1 second
  });
});

/**
 * Integration test showing real-world usage
 */
describe("Real-world integration", () => {
  test("should integrate with React Testing Library", () => {
    // Example of how this would work with components
    const container = createTestContainer();

    /**
     *
     * @param root0
     * @param root0.children
     */
    const TestWrapper = ({ children }: { children: React.ReactNode }) => {
      const { ServiceProvider } = require("@shared/services/container/adapter");
      return React.createElement(ServiceProvider, { container }, children);
    };

    // Component tests would use this wrapper
    // render(<MyComponent />, { wrapper: TestWrapper });

    expect(TestWrapper).toBeDefined();
  });
});
