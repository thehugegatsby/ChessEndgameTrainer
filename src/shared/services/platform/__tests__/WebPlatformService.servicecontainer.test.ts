/**
 * WebPlatformService Tests - ServiceContainer Migration
 * Migrated from global mocks to dependency injection pattern for Jest 30 compatibility
 */

import {
  createTestContainer,
  TestScenarios,
  TestAssertions,
} from "@tests/utils";
import type {
  PlatformService,
  PlatformStorage,
  PlatformDevice,
  PlatformPerformance,
  PlatformClipboard,
  PlatformShare,
  PlatformNotification,
  PlatformAnalytics,
  Platform,
  DeviceInfo,
  MemoryInfo,
  NetworkStatus,
} from "@shared/services/platform/types";
import { describe, it, test, expect, beforeEach } from 'vitest';
import { STORAGE, SYSTEM } from "@shared/constants/index";
import { MockStorage } from "@tests/utils/MockStorage";

describe("WebPlatformService - ServiceContainer Migration", () => {
  let container: ReturnType<typeof createTestContainer>;
  let platformService: PlatformService;
  let storageService: PlatformStorage;
  let deviceService: PlatformDevice;
  let performanceService: PlatformPerformance;
  let clipboardService: PlatformClipboard;
  let shareService: PlatformShare;
  let notificationService: PlatformNotification;
  let analyticsService: PlatformAnalytics;
  let mockStorage: MockStorage;
  let mockNavigator: Navigator;

  beforeEach(() => {
    container = createTestContainer();
    platformService = container.resolveCustom("platform.service");
    storageService = container.resolve("platform.storage");
    deviceService = container.resolve("platform.device");
    performanceService = container.resolve("platform.performance");
    clipboardService = container.resolve("platform.clipboard");
    shareService = container.resolve("platform.share");
    notificationService = container.resolve("platform.notifications");
    analyticsService = container.resolve("platform.analytics");
    mockStorage = container.resolveCustom<MockStorage>("browser.localStorage");
    mockNavigator = container.resolveCustom<Navigator>("browser.navigator");
  });

  describe("Service Initialization", () => {
    test("should initialize all platform services", () => {
      expect(platformService.storage).toBeDefined();
      expect(platformService.notifications).toBeDefined();
      expect(platformService.device).toBeDefined();
      expect(platformService.performance).toBeDefined();
      expect(platformService.clipboard).toBeDefined();
      expect(platformService.share).toBeDefined();
      expect(platformService.analytics).toBeDefined();
    });

    test("should implement IPlatformService interface", () => {
      const requiredProperties: (keyof IPlatformService)[] = [
        "storage",
        "notifications",
        "device",
        "performance",
        "clipboard",
        "share",
        "analytics",
      ];

      requiredProperties.forEach((prop) => {
        expect((platformService as any)[prop]).toBeDefined();
      });
    });

    test("should resolve services through container correctly", () => {
      expect(storageService).toBeDefined();
      expect(deviceService).toBeDefined();
      expect(performanceService).toBeDefined();
      expect(clipboardService).toBeDefined();
      expect(shareService).toBeDefined();
      expect(notificationService).toBeDefined();
      expect(analyticsService).toBeDefined();
    });
  });

  describe("Storage Service - Migrated Tests", () => {
    const testKey = "test-key";
    const testData = { foo: "bar", number: 42 };

    beforeEach(() => {
      // Use MockStorage's seed method to pre-populate data
      mockStorage.seed({
        [`${STORAGE.PREFIX}${testKey}`]: JSON.stringify(testData),
      });
    });

    test("should save data to localStorage with prefix", async () => {
      await storageService.save(testKey, testData);

      TestAssertions.expectStorageCall(
        mockStorage,
        "setItem",
        `${STORAGE.PREFIX}test-key`,
        JSON.stringify(testData),
      );
    });

    test("should load data from localStorage", async () => {
      const result = await storageService.load(testKey);

      expect(mockStorage.getItem).toHaveBeenCalledWith(
        `${STORAGE.PREFIX}test-key`,
      );
      expect(result).toEqual(testData);
    });

    test("should return null for non-existent keys", async () => {
      const result = await storageService.load("non-existent");
      expect(result).toBeNull();
    });

    test("should handle JSON parse errors gracefully", async () => {
      // Seed with invalid JSON
      mockStorage.seed({
        [`${STORAGE.PREFIX}invalid`]: "invalid json",
      });

      const result = await storageService.load("invalid");
      expect(result).toBeNull();
    });

    test("should remove data from localStorage", async () => {
      await storageService.remove(testKey);

      TestAssertions.expectStorageCall(
        mockStorage,
        "removeItem",
        `${STORAGE.PREFIX}test-key`,
      );
    });

    test("should clear all chess trainer data", async () => {
      // Seed storage with mixed data
      mockStorage.seed({
        [`${STORAGE.PREFIX}key1`]: "data1",
        other_app_key: "other_data",
        [`${STORAGE.PREFIX}key2`]: "data2",
      });

      await storageService.clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        `${STORAGE.PREFIX}key1`,
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        `${STORAGE.PREFIX}key2`,
      );
      expect(mockStorage.removeItem).not.toHaveBeenCalledWith("other_app_key");
    });

    test("should get all chess trainer keys", async () => {
      // Seed storage with mixed data
      mockStorage.seed({
        [`${STORAGE.PREFIX}key1`]: "data1",
        other_app_key: "other_data",
        [`${STORAGE.PREFIX}key2`]: "data2",
      });

      const keys = await storageService.getAllKeys();
      expect(keys).toEqual(["key1", "key2"]);
    });

    test("should handle storage quota errors", async () => {
      // Create a failing storage mock
      const failingStorage = new MockStorage();
      failingStorage.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const failingContainer = createTestContainer({
        localStorage: failingStorage,
      });
      const failingStorageService =
        failingContainer.resolve("platform.storage");

      await expect(failingStorageService.save("key", "data")).rejects.toThrow(
        "Failed to save data",
      );
    });
  });

  describe("Device Service - Migrated Tests", () => {
    test("should detect platform from user agent", () => {
      const platform = deviceService.getPlatform();
      expect(platform).toBe("web" as Platform); // Default in test environment
    });

    test("should get device info", () => {
      const deviceInfo: DeviceInfo = deviceService.getDeviceInfo();

      expect(deviceInfo).toEqual({
        model: mockNavigator.userAgent,
        osVersion: mockNavigator.userAgent,
        screenSize: {
          width: 1920,
          height: 1080,
        },
        pixelRatio: 1,
        isTablet: false,
      });
    });

    test("should get memory info", () => {
      const memoryInfo: MemoryInfo = deviceService.getMemoryInfo();

      expect(memoryInfo).toEqual({
        totalMemory: 8 * SYSTEM.GB_TO_BYTES_FACTOR, // 8GB in bytes
      });
    });

    test("should get network status", () => {
      const networkStatus: NetworkStatus = deviceService.getNetworkStatus();
      expect(networkStatus.isOnline).toBe(true);
    });

    test("should detect low-end device correctly", () => {
      // Test with high-end device (8GB RAM)
      expect(deviceService.isLowEndDevice()).toBe(false);
    });

    test("should work with low memory scenario", () => {
      const lowMemoryContainer = TestScenarios.lowMemory();
      const lowMemoryDevice = lowMemoryContainer.resolve("platform.device");

      expect(lowMemoryDevice.isLowEndDevice()).toBe(true);

      const memoryInfo = lowMemoryDevice.getMemoryInfo();
      expect(memoryInfo.totalMemory).toBeLessThan(
        4 * SYSTEM.GB_TO_BYTES_FACTOR,
      );
    });

    test("should work with offline scenario", () => {
      const offlineContainer = TestScenarios.offline();
      const offlineDevice = offlineContainer.resolve("platform.device");

      const networkStatus = offlineDevice.getNetworkStatus();
      expect(networkStatus.isOnline).toBe(false);
    });
  });

  describe("Performance Service - Migrated Tests", () => {
    beforeEach(() => {
      performanceService.clearMetrics();
    });

    test("should start and end measure", () => {
      // Note: Performance service uses global performance.now(), not injected mock
      // This test verifies the service works, even with real timing
      performanceService.startMeasure("test-measure");
      const duration = performanceService.endMeasure("test-measure");

      // Duration should be a small positive number
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    test("should throw error when ending non-existent measure", () => {
      expect(() => performanceService.endMeasure("non-existent")).toThrow(
        "No start mark found for non-existent",
      );
    });

    test("should create marks", () => {
      performanceService.mark("test-mark");

      const metrics = performanceService.getMetrics();
      expect(metrics.marks["test-mark"]).toBeGreaterThan(0);
    });

    test("should measure between marks", () => {
      performanceService.mark("start");
      // Small delay to ensure different timestamps
      performanceService.mark("end");

      const duration = performanceService.measure("test", "start", "end");
      expect(duration).toBeGreaterThanOrEqual(0); // Duration could be 0 if very fast
    });

    test("should get metrics with averages", () => {
      performanceService.startMeasure("test");
      const duration = performanceService.endMeasure("test");

      const metrics = performanceService.getMetrics();

      expect(metrics.measures.test).toEqual([duration]);
      expect(metrics.averages.test).toBe(duration);
    });

    test("should clear metrics", () => {
      performanceService.mark("test");
      performanceService.clearMetrics();

      const metrics = performanceService.getMetrics();
      expect(Object.keys(metrics.marks)).toHaveLength(0);
      expect(Object.keys(metrics.measures)).toHaveLength(0);
    });
  });

  describe("Clipboard Service - Migrated Tests", () => {
    test("should copy text using navigator clipboard", async () => {
      await clipboardService.copy("test text");

      expect(mockNavigator.clipboard.writeText).toHaveBeenCalledWith(
        "test text",
      );
    });

    test("should paste text using navigator clipboard", async () => {
      const result = await clipboardService.paste();

      expect(mockNavigator.clipboard.readText).toHaveBeenCalled();
      expect(result).toBe("mocked text");
    });

    test("should return false for hasContent on web", async () => {
      const hasContent = await clipboardService.hasContent();
      expect(hasContent).toBe(false);
    });
  });

  describe("Share Service - Migrated Tests", () => {
    test("should detect share capability", () => {
      const canShare = shareService.canShare();
      expect(canShare).toBe(true);
    });

    test("should share content", async () => {
      const shareOptions = {
        title: "Test Title",
        text: "Test Text",
        url: "https://test.com",
      };

      await shareService.share(shareOptions);

      expect(mockNavigator.share).toHaveBeenCalledWith(shareOptions);
    });

    test("should throw error when share API not supported", async () => {
      // Create container without share API
      const noShareNavigator = {
        ...mockNavigator,
        // Remove share property
      };
      delete (noShareNavigator as any).share;

      const noShareContainer = createTestContainer({
        navigator: noShareNavigator,
      });
      const noShareService = noShareContainer.resolve("platform.share");

      await expect(noShareService.share({ title: "test" })).rejects.toThrow(
        "Web Share API not supported",
      );
    });
  });

  describe("Analytics Service - Migrated Tests", () => {
    test("should have track method (stub)", () => {
      expect(() => analyticsService.track("test-event")).not.toThrow();
    });

    test("should have identify method (stub)", () => {
      expect(() => analyticsService.identify("user-id")).not.toThrow();
    });

    test("should have page method (stub)", () => {
      expect(() => analyticsService.page("test-page")).not.toThrow();
    });

    test("should have setUserProperties method (stub)", () => {
      expect(() => analyticsService.setUserProperties({})).not.toThrow();
    });
  });

  describe("ServiceContainer Integration", () => {
    test("should provide perfect test isolation", async () => {
      // Test that each container instance is completely isolated
      const container1 = createTestContainer();
      const storage1 = container1.resolve("platform.storage");
      await storage1.save("isolation-test", "data1");

      const container2 = createTestContainer();
      const storage2 = container2.resolve("platform.storage");
      const result = await storage2.load("isolation-test");

      expect(result).toBeNull(); // No data leakage between containers
    });

    test("should support pre-configured scenarios", async () => {
      const storageData = {
        [`${STORAGE.PREFIX}preset-key`]: JSON.stringify({ preset: "value" }),
      };

      const scenarioContainer = TestScenarios.withStorageData(storageData);
      const scenarioStorage = scenarioContainer.resolve("platform.storage");

      const result = await scenarioStorage.load("preset-key");
      expect(result).toEqual({ preset: "value" });
    });

    test("should work with Jest mocking system", () => {
      // Verify mocks are properly isolated to container
      expect(vi.isMockFunction(mockStorage.setItem)).toBe(true);
      expect(vi.isMockFunction(mockNavigator.clipboard.writeText)).toBe(true);

      // Different containers should have different mocks
      const container2 = createTestContainer();
      const mockStorage2 = container2.resolveCustom<Storage>(
        "browser.localStorage",
      );

      expect(mockStorage2).not.toBe(mockStorage);
      expect(vi.isMockFunction(mockStorage2.setItem)).toBe(true);
    });

    test("should support async patterns with proper cleanup", async () => {
      // Multiple async operations should work cleanly
      await Promise.all([
        storageService.save("async1", "data1"),
        storageService.save("async2", "data2"),
        storageService.save("async3", "data3"),
      ]);

      // Operations should complete successfully
      expect(mockStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });
});
