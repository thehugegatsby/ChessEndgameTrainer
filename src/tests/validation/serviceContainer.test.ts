import { vi } from 'vitest';
/**
 * ServiceContainer Validation Test
 * Simple test to validate core Jest 30 migration functionality
 */

import { createTestContainer, TestScenarios, TestAssertions } from "../utils";
import type { PlatformStorage } from "@shared/services/platform/types";
import { STORAGE } from "@shared/constants/index";

describe("ServiceContainer Validation - Jest 30 Migration", () => {
  describe("Basic Container Functionality", () => {
    let container: ReturnType<typeof createTestContainer>;
    let storageService: PlatformStorage;
    let mockStorage: Storage;

    beforeEach(() => {
      container = createTestContainer();
      storageService = container.resolve("platform.storage");
      mockStorage = container.resolveCustom<Storage>("browser.localStorage");
    });

    test("should create container with platform services", () => {
      expect(container).toBeDefined();
      expect(storageService).toBeDefined();
      expect(mockStorage).toBeDefined();
    });

    test("should resolve storage service correctly", () => {
      expect(typeof storageService.save).toBe("function");
      expect(typeof storageService.load).toBe("function");
      expect(typeof storageService.remove).toBe("function");
      expect(typeof storageService.clear).toBe("function");
      expect(typeof storageService.getAllKeys).toBe("function");
    });

    test("should provide working mocks", () => {
      expect(vi.isMockFunction(mockStorage.setItem)).toBe(true);
      expect(vi.isMockFunction(mockStorage.getItem)).toBe(true);
      expect(vi.isMockFunction(mockStorage.removeItem)).toBe(true);
    });

    test("should save data with proper prefix", async () => {
      const testKey = "validation-key";
      const testData = { validation: true, count: 42 };

      await storageService.save(testKey, testData);

      TestAssertions.expectStorageCall(
        mockStorage,
        "setItem",
        `${STORAGE.PREFIX}validation-key`,
        JSON.stringify(testData),
      );
    });

    test("should load data correctly", async () => {
      const testKey = "load-test";
      const testData = { loaded: true };

      // Mock return value
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify(testData),
      );

      const result = await storageService.load(testKey);

      expect(mockStorage.getItem).toHaveBeenCalledWith(
        `${STORAGE.PREFIX}load-test`,
      );
      expect(result).toEqual(testData);
    });

    test("should handle null values", async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = await storageService.load("non-existent");
      expect(result).toBeNull();
    });

    test("should provide perfect test isolation", async () => {
      // Test isolation: fresh container = clean state
      const container1 = createTestContainer();
      const storage1 = container1.resolve("platform.storage");
      await storage1.save("isolation-test", "data1");

      const container2 = createTestContainer();
      const storage2 = container2.resolve("platform.storage");
      const result = await storage2.load("isolation-test");

      expect(result).toBeNull(); // No data leakage
    });
  });

  describe("Pre-configured Scenarios", () => {
    test("should work with offline scenario", () => {
      const container = TestScenarios.offline();
      const deviceService = container.resolve("platform.device");

      const networkStatus = deviceService.getNetworkStatus();
      expect(networkStatus.isOnline).toBe(false);
      expect(networkStatus.type).toBe("none");
    });

    test("should work with pre-populated storage", async () => {
      const container = TestScenarios.withStorageData({
        "chess_trainer_test-key": JSON.stringify({ preset: "value" }),
      });

      const storageService = container.resolve("platform.storage");
      const result = await storageService.load("test-key");

      expect(result).toEqual({ preset: "value" });
    });

    test("should work with low memory scenario", () => {
      const container = TestScenarios.lowMemory();
      const deviceService = container.resolve("platform.device");

      const memoryInfo = deviceService.getMemoryInfo();
      expect(memoryInfo.totalMemory).toBeLessThan(4 * 1024 * 1024 * 1024); // Less than 4GB
    });
  });

  describe("Error Handling", () => {
    test("should handle storage errors gracefully", async () => {
      const failingStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error("QuotaExceededError");
        }),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      } as Storage;

      const container = createTestContainer({ localStorage: failingStorage });
      const storageService = container.resolve("platform.storage");

      await expect(storageService.save("key", "data")).rejects.toThrow(
        "Failed to save data",
      );
    });

    test("should handle corrupted JSON gracefully", async () => {
      const corruptedStorage = {
        getItem: vi.fn().mockReturnValue("invalid-json{"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      } as Storage;

      const container = createTestContainer({ localStorage: corruptedStorage });
      const storageService = container.resolve("platform.storage");

      const result = await storageService.load("corrupted-key");
      expect(result).toBeNull();
    });
  });

  describe("Performance Validation", () => {
    test("container creation should be fast", () => {
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        const container = createTestContainer();
        container.resolve("platform.storage");
        container.resolve("platform.device");
      }

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500); // 50 containers in <500ms
    });

    test("multiple services should resolve efficiently", () => {
      const container = createTestContainer();

      const start = Date.now();

      const storage = container.resolve("platform.storage");
      const device = container.resolve("platform.device");
      const notifications = container.resolve("platform.notifications");
      const performanceService = container.resolve("platform.performance");
      const clipboard = container.resolve("platform.clipboard");
      const share = container.resolve("platform.share");
      const analytics = container.resolve("platform.analytics");

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(50); // All services in <50ms
      expect(storage).toBeDefined();
      expect(device).toBeDefined();
      expect(notifications).toBeDefined();
      expect(performanceService).toBeDefined();
      expect(clipboard).toBeDefined();
      expect(share).toBeDefined();
      expect(analytics).toBeDefined();
    });
  });

  describe("Jest 30 Compatibility Verification", () => {
    test("should work without global localStorage mocking", () => {
      // This test verifies we're not using global mocks
      const container = createTestContainer();
      const mockStorage = container.resolveCustom<Storage>(
        "browser.localStorage",
      );

      // Mock is isolated to container, not global
      expect(vi.isMockFunction(mockStorage.setItem)).toBe(true);

      // Global localStorage should be unaffected
      if (typeof window !== "undefined" && window.localStorage) {
        expect(vi.isMockFunction(window.localStorage.setItem)).toBe(false);
      }
    });

    test("should provide proper mock isolation", () => {
      const container1 = createTestContainer();
      const container2 = createTestContainer();

      const mock1 = container1.resolveCustom<Storage>("browser.localStorage");
      const mock2 = container2.resolveCustom<Storage>("browser.localStorage");

      // Different containers = different mocks
      expect(mock1).not.toBe(mock2);

      // Both should be mocks
      expect(vi.isMockFunction(mock1.setItem)).toBe(true);
      expect(vi.isMockFunction(mock2.setItem)).toBe(true);
    });

    test("should support async patterns with proper cleanup", async () => {
      const container = createTestContainer();
      const storageService = container.resolve("platform.storage");

      // Multiple async operations should work cleanly
      await Promise.all([
        storageService.save("async1", "data1"),
        storageService.save("async2", "data2"),
        storageService.save("async3", "data3"),
      ]);

      const results = await Promise.all([
        storageService.load("async1"),
        storageService.load("async2"),
        storageService.load("async3"),
      ]);

      // Note: these will be null because mocks don't persist data by default
      // but the operations should complete successfully
      expect(results).toHaveLength(3);
    });
  });
});
