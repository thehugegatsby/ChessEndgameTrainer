/**
 * WebPlatformService Migration - Jest 30 Compatible Version
 * 
 * MIGRATED FROM: Global localStorage mocks (Jest 30 incompatible)
 * MIGRATED TO: ServiceContainer with dependency injection (Jest 30 compatible)
 * 
 * This demonstrates migrating the main WebPlatformService tests to use our new
 * ServiceContainer pattern instead of global browser API mocking.
 */

import { createTestContainer, TestScenarios, TestAssertions } from '../../../utils';
import type { 
  IPlatformService, 
  IPlatformStorage,
  IPlatformDevice,
  IPlatformNotification,
  IPlatformPerformance,
  IPlatformClipboard,
  IPlatformShare,
  IPlatformAnalytics,
  DeviceInfo,
  MemoryInfo,
  NetworkStatus
} from '@shared/services/platform/types';
import { STORAGE, ENGINE } from '@shared/constants/index';

describe('WebPlatformService - Migrated to ServiceContainer', () => {
  describe('Basic Service Resolution', () => {
    let container: ReturnType<typeof createTestContainer>;
    let platformService: IPlatformService;
    let mockStorage: Storage;

    beforeEach(() => {
      container = createTestContainer();
      platformService = {
        storage: container.resolve('platform.storage'),
        notifications: container.resolve('platform.notifications'),
        device: container.resolve('platform.device'),
        performance: container.resolve('platform.performance'),
        clipboard: container.resolve('platform.clipboard'),
        share: container.resolve('platform.share'),
        analytics: container.resolve('platform.analytics')
      };
      mockStorage = container.resolveCustom<Storage>('browser.localStorage');
    });

    test('should initialize all platform services via ServiceContainer', () => {
      expect(platformService.storage).toBeDefined();
      expect(platformService.notifications).toBeDefined();
      expect(platformService.device).toBeDefined();
      expect(platformService.performance).toBeDefined();
      expect(platformService.clipboard).toBeDefined();
      expect(platformService.share).toBeDefined();
      expect(platformService.analytics).toBeDefined();
    });

    test('should provide type-safe service resolution', () => {
      const storage = container.resolve('platform.storage');
      const device = container.resolve('platform.device');
      
      expect(typeof storage.save).toBe('function');
      expect(typeof device.getPlatform).toBe('function');
    });
  });

  describe('Storage Service - Migrated from Global localStorage Mocks', () => {
    let container: ReturnType<typeof createTestContainer>;
    let storageService: IPlatformStorage;
    let mockStorage: Storage;

    beforeEach(() => {
      container = createTestContainer();
      storageService = container.resolve('platform.storage');
      mockStorage = container.resolveCustom<Storage>('browser.localStorage');
    });

    test('should save data with proper prefix', async () => {
      const testKey = 'test-key';
      const testData = { foo: 'bar', number: 42 };

      await storageService.save(testKey, testData);

      TestAssertions.expectStorageCall(
        mockStorage, 
        'setItem', 
        `${STORAGE.PREFIX}test-key`,
        JSON.stringify(testData)
      );
    });

    test('should load data from storage', async () => {
      const testKey = 'test-key';
      const testData = { foo: 'bar', number: 42 };
      
      // Pre-populate mock storage
      (mockStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(testData));

      const result = await storageService.load(testKey);

      expect(mockStorage.getItem).toHaveBeenCalledWith(`${STORAGE.PREFIX}test-key`);
      expect(result).toEqual(testData);
    });

    test('should return null for non-existent keys', async () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = await storageService.load('non-existent');

      expect(result).toBeNull();
    });

    test('should handle JSON parse errors gracefully', async () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid json');

      const result = await storageService.load('test-key');

      expect(result).toBeNull();
    });

    test('should remove data from storage', async () => {
      const testKey = 'test-key';

      await storageService.remove(testKey);

      expect(mockStorage.removeItem).toHaveBeenCalledWith(`${STORAGE.PREFIX}test-key`);
    });

    test('should clear all chess trainer data', async () => {
      // Setup mock storage with mixed keys
      Object.defineProperty(mockStorage, 'length', { value: 3, writable: true });
      (mockStorage.key as jest.Mock)
        .mockReturnValueOnce(`${STORAGE.PREFIX}key1`)
        .mockReturnValueOnce('other_app_key')
        .mockReturnValueOnce(`${STORAGE.PREFIX}key2`);

      await storageService.clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith(`${STORAGE.PREFIX}key1`);
      expect(mockStorage.removeItem).toHaveBeenCalledWith(`${STORAGE.PREFIX}key2`);
      expect(mockStorage.removeItem).not.toHaveBeenCalledWith('other_app_key');
    });

    test('should get all chess trainer keys', async () => {
      Object.defineProperty(mockStorage, 'length', { value: 3, writable: true });
      (mockStorage.key as jest.Mock)
        .mockReturnValueOnce(`${STORAGE.PREFIX}key1`)
        .mockReturnValueOnce('other_app_key')
        .mockReturnValueOnce(`${STORAGE.PREFIX}key2`);

      const keys = await storageService.getAllKeys();

      expect(keys).toEqual(['key1', 'key2']);
    });
  });

  describe('Storage Service - Error Handling Scenarios', () => {
    test('should handle localStorage quota exceeded', async () => {
      const failingStorage = {
        setItem: jest.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError');
        }),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      } as Storage;

      const container = createTestContainer({ localStorage: failingStorage });
      const storageService = container.resolve('platform.storage');

      await expect(storageService.save('key', 'data')).rejects.toThrow('Failed to save data');
    });

    test('should handle corrupted JSON data', async () => {
      const corruptedStorage = {
        getItem: jest.fn().mockReturnValue('invalid-json{'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 1
      } as Storage;

      const container = createTestContainer({ localStorage: corruptedStorage });
      const storageService = container.resolve('platform.storage');

      const result = await storageService.load('corrupted-key');
      expect(result).toBeNull();
    });
  });

  describe('Device Service - Migrated from Global navigator Mocks', () => {
    let container: ReturnType<typeof createTestContainer>;
    let deviceService: IPlatformDevice;

    beforeEach(() => {
      container = createTestContainer();
      deviceService = container.resolve('platform.device');
    });

    test('should detect platform from user agent', () => {
      const platform = deviceService.getPlatform();
      expect(platform).toBe('web'); // Default mock platform
    });

    test('should get device info', () => {
      const deviceInfo: DeviceInfo = deviceService.getDeviceInfo();
      
      expect(deviceInfo).toEqual({
        model: 'Test Device',
        brand: 'Test Brand',
        osVersion: '1.0.0',
        screenSize: { width: 1920, height: 1080 },
        pixelRatio: 1,
        isTablet: false
      });
    });

    test('should get memory info', () => {
      const memoryInfo: MemoryInfo = deviceService.getMemoryInfo();
      
      expect(memoryInfo).toEqual({
        totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
        availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
        usedMemory: 4 * 1024 * 1024 * 1024 // 4GB
      });
    });

    test('should get network status', () => {
      const networkStatus: NetworkStatus = deviceService.getNetworkStatus();
      
      expect(networkStatus).toEqual({
        isOnline: true,
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10
      });
    });

    test('should detect low-end device correctly', () => {
      expect(deviceService.isLowEndDevice()).toBe(false);
    });
  });

  describe('Pre-configured Scenarios - Advanced Testing Patterns', () => {
    test('should work with offline scenario', () => {
      const container = TestScenarios.offline();
      const deviceService = container.resolve('platform.device');
      
      const networkStatus = deviceService.getNetworkStatus();
      expect(networkStatus.isOnline).toBe(false);
      expect(networkStatus.type).toBe('none');
    });

    test('should work with pre-populated storage', async () => {
      const container = TestScenarios.withStorageData({
        'chess_trainer_existing-key': JSON.stringify({ value: 'existing' })
      });
      
      const storageService = container.resolve('platform.storage');
      const result = await storageService.load('existing-key');
      
      expect(result).toEqual({ value: 'existing' });
    });

    test('should work with low-memory scenario', () => {
      const container = TestScenarios.lowMemory();
      const deviceService = container.resolve('platform.device');
      
      const memoryInfo = deviceService.getMemoryInfo();
      expect(memoryInfo.totalMemory).toBeLessThan(4 * 1024 * 1024 * 1024); // Less than 4GB
    });
  });

  describe('Performance Service - Migrated from Global performance Mocks', () => {
    let container: ReturnType<typeof createTestContainer>;
    let performanceService: IPlatformPerformance;

    beforeEach(() => {
      container = createTestContainer();
      performanceService = container.resolve('platform.performance');
    });

    test('should start and end measure', () => {
      performanceService.startMeasure('test-measure');
      const duration = performanceService.endMeasure('test-measure');
      
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('should create marks', () => {
      performanceService.mark('test-mark');
      
      const metrics = performanceService.getMetrics();
      expect(metrics.marks['test-mark']).toBeDefined();
    });

    test('should measure between marks', () => {
      performanceService.mark('start');
      performanceService.mark('end');
      
      const duration = performanceService.measure('test', 'start', 'end');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('should clear metrics', () => {
      performanceService.mark('test');
      performanceService.clearMetrics();
      
      const metrics = performanceService.getMetrics();
      expect(Object.keys(metrics.marks)).toHaveLength(0);
    });
  });

  describe('Notification Service - Migrated from Global Notification Mocks', () => {
    let container: ReturnType<typeof createTestContainer>;
    let notificationService: IPlatformNotification;

    beforeEach(() => {
      container = createTestContainer();
      notificationService = container.resolve('platform.notifications');
    });

    test('should request permission', async () => {
      const result = await notificationService.requestPermission();
      expect(result).toBe(true);
    });

    test('should show notification', async () => {
      const options = {
        body: 'Test body',
        icon: 'test-icon.png'
      };
      
      await expect(notificationService.show('Test Title', options)).resolves.toBeUndefined();
    });

    test('should throw error for scheduled notifications', async () => {
      await expect(notificationService.schedule({
        title: 'Test',
        body: 'Test body',
        trigger: new Date()
      })).rejects.toThrow('mock-notification-id');
    });
  });

  describe('Clipboard Service - Migrated from Global navigator.clipboard Mocks', () => {
    let container: ReturnType<typeof createTestContainer>;
    let clipboardService: IPlatformClipboard;

    beforeEach(() => {
      container = createTestContainer();
      clipboardService = container.resolve('platform.clipboard');
    });

    test('should copy text', async () => {
      await clipboardService.copy('test text');
      // Mock internally handles the clipboard operation
    });

    test('should paste text', async () => {
      const result = await clipboardService.paste();
      expect(typeof result).toBe('string');
    });

    test('should check content availability', async () => {
      const hasContent = await clipboardService.hasContent();
      expect(typeof hasContent).toBe('boolean');
    });
  });

  describe('Share and Analytics Services', () => {
    let container: ReturnType<typeof createTestContainer>;
    let shareService: IPlatformShare;
    let analyticsService: IPlatformAnalytics;

    beforeEach(() => {
      container = createTestContainer();
      shareService = container.resolve('platform.share');
      analyticsService = container.resolve('platform.analytics');
    });

    test('should detect share capability', () => {
      const canShare = shareService.canShare();
      expect(canShare).toBe(true);
    });

    test('should share content', async () => {
      const shareOptions = {
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://test.com'
      };
      
      await expect(shareService.share(shareOptions)).resolves.toBeUndefined();
    });

    test('should track analytics events', () => {
      expect(() => analyticsService.track('test-event')).not.toThrow();
      expect(() => analyticsService.identify('user-id')).not.toThrow();
      expect(() => analyticsService.page('test-page')).not.toThrow();
      expect(() => analyticsService.setUserProperties({})).not.toThrow();
    });
  });

  describe('Jest 30 Compatibility Validation', () => {
    test('should work with Jest 30 mocking system', () => {
      const container = createTestContainer();
      const mockStorage = container.resolveCustom<Storage>('browser.localStorage');
      
      // Verify mocks are properly created
      expect(jest.isMockFunction(mockStorage.setItem)).toBe(true);
      expect(jest.isMockFunction(mockStorage.getItem)).toBe(true);
    });

    test('should support async/await patterns', async () => {
      const container = createTestContainer();
      const storageService = container.resolve('platform.storage');
      
      const promise = storageService.save('test', { data: 'test' });
      expect(promise).toBeInstanceOf(Promise);
      
      await expect(promise).resolves.toBeUndefined();
    });

    test('should handle error cases properly', async () => {
      const failingStorage = {
        setItem: jest.fn().mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        }),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      } as Storage;

      const container = createTestContainer({ localStorage: failingStorage });
      const storageService = container.resolve('platform.storage');
      
      await expect(storageService.save('test', { data: 'large' }))
        .rejects.toThrow('Failed to save data');
    });

    test('should provide perfect test isolation', async () => {
      // Test 1: Set up data
      const container1 = createTestContainer();
      const storage1 = container1.resolve('platform.storage');
      await storage1.save('isolation-test', 'data1');

      // Test 2: Fresh container should not see data from Test 1
      const container2 = createTestContainer();
      const storage2 = container2.resolve('platform.storage');
      const result = await storage2.load('isolation-test');
      
      expect(result).toBeNull(); // Fresh container = clean state
    });
  });

  describe('Migration Performance Validation', () => {
    test('container creation should be fast', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const container = createTestContainer();
        container.resolve('platform.storage');
        container.resolve('platform.device');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100); // 10 containers in <100ms
    });

    test('mock interactions should work correctly', async () => {
      const container = createTestContainer();
      const storageService = container.resolve('platform.storage');
      const mockStorage = container.resolveCustom<Storage>('browser.localStorage');
      
      // Save data
      await storageService.save('perf-test', { value: 123 });
      
      // Verify mock was called
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'chess_trainer_perf-test',
        JSON.stringify({ value: 123 })
      );
      
      // Check call count
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });
});