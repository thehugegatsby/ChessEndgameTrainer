/**
 * @fileoverview Comprehensive unit tests for WebPlatformService
 * @description Tests all browser API abstractions with extensive mocking and edge case coverage
 * Generated based on expert analysis of 334-line service with 0% coverage
 */

import { WebPlatformService } from '@shared/services/platform/web/WebPlatformService';
import { Platform, ShareOptions } from '@shared/services/platform/types';

/**
 * Helper to mock global browser APIs for deterministic testing.
 */
const mockBrowserAPIs = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  },
  performance: {
    now: jest.fn(),
  },
  navigator: {
    userAgent: 'Test User Agent',
    onLine: true,
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn(),
    },
    share: jest.fn(),
    // Properties for WebDevice
    deviceMemory: 4,
    connection: {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
    },
  },
  window: {
    screen: {
      width: 1920,
      height: 1080,
    },
    devicePixelRatio: 1,
    // Used by checkIsTablet
    ontouchstart: undefined as any,
    // Used by WebNotification
    Notification: {
      requestPermission: jest.fn(),
      permission: 'default',
    } as any,
  },
  document: {
    createElement: jest.fn(),
    execCommand: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
    addEventListener: jest.fn(),
  },
};

// Apply mocks to the global scope
Object.defineProperty(global, 'localStorage', { value: mockBrowserAPIs.localStorage });
Object.defineProperty(global, 'performance', { value: mockBrowserAPIs.performance });
Object.defineProperty(global, 'navigator', { value: mockBrowserAPIs.navigator, writable: true });
Object.defineProperty(global, 'window', { value: mockBrowserAPIs.window, writable: true });
Object.defineProperty(global, 'document', { value: mockBrowserAPIs.document, writable: true });
Object.defineProperty(global, 'Notification', { value: mockBrowserAPIs.window.Notification, writable: true });


describe('WebPlatformService', () => {
  let service: WebPlatformService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset localStorage mock state
    mockBrowserAPIs.localStorage.length = 0;
    const storage: Record<string, string> = {};
    mockBrowserAPIs.localStorage.setItem.mockImplementation((key, value) => {
      if (!Object.keys(storage).includes(key)) {
        mockBrowserAPIs.localStorage.length++;
      }
      storage[key] = value;
    });
    mockBrowserAPIs.localStorage.getItem.mockImplementation(key => storage[key] || null);
    mockBrowserAPIs.localStorage.removeItem.mockImplementation(key => {
      if (Object.keys(storage).includes(key)) {
        delete storage[key];
        mockBrowserAPIs.localStorage.length--;
      }
    });
    mockBrowserAPIs.localStorage.key.mockImplementation(i => Object.keys(storage)[i] || null);
    mockBrowserAPIs.localStorage.clear.mockImplementation(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
        mockBrowserAPIs.localStorage.length = 0;
    });


    // Reset performance.now mock
    let performanceNow = 1000;
    mockBrowserAPIs.performance.now.mockImplementation(() => {
      performanceNow += 100;
      return performanceNow;
    });

    // Re-initialize the service to get a clean instance
    service = new WebPlatformService();
  });

  it('should instantiate all sub-services on construction', () => {
    expect(service.storage).toBeDefined();
    expect(service.notifications).toBeDefined();
    expect(service.device).toBeDefined();
    expect(service.performance).toBeDefined();
    expect(service.clipboard).toBeDefined();
    expect(service.share).toBeDefined();
    expect(service.analytics).toBeDefined();
  });

  describe('WebStorage', () => {
    const prefix = 'chess_trainer_';
    const testKey = 'test';
    const testData = { id: 1, value: 'data' };

    it('should save data by serializing and prefixing the key', async () => {
      await service.storage.save(testKey, testData);
      expect(mockBrowserAPIs.localStorage.setItem).toHaveBeenCalledWith(
        prefix + testKey,
        JSON.stringify(testData)
      );
    });

    it('should throw a specific error if JSON.stringify fails', async () => {
      const circularData: any = {};
      circularData.self = circularData;
      // LINE 34: throw new Error('Failed to save data');
      await expect(service.storage.save(testKey, circularData)).rejects.toThrow('Failed to save data');
    });

    it('should throw a specific error if localStorage.setItem fails (e.g., quota exceeded)', async () => {
      mockBrowserAPIs.localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      // LINE 34: throw new Error('Failed to save data');
      await expect(service.storage.save(testKey, testData)).rejects.toThrow('Failed to save data');
    });

    it('should load and parse data for an existing key', async () => {
      mockBrowserAPIs.localStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const loadedData = await service.storage.load(testKey);
      expect(mockBrowserAPIs.localStorage.getItem).toHaveBeenCalledWith(prefix + testKey);
      expect(loadedData).toEqual(testData);
    });

    it('should return null if data does not exist', async () => {
      mockBrowserAPIs.localStorage.getItem.mockReturnValue(null);
      const loadedData = await service.storage.load('non-existent-key');
      expect(loadedData).toBeNull();
    });

    it('should return null silently if JSON.parse fails for corrupted data', async () => {
      mockBrowserAPIs.localStorage.getItem.mockReturnValue('{invalid-json}');
      // LINE 44: return null;
      const loadedData = await service.storage.load(testKey);
      expect(loadedData).toBeNull();
    });

    it('should remove an item from localStorage', async () => {
      await service.storage.remove(testKey);
      expect(mockBrowserAPIs.localStorage.removeItem).toHaveBeenCalledWith(prefix + testKey);
    });

    it('should retrieve all keys with the correct prefix', async () => {
        mockBrowserAPIs.localStorage.setItem(prefix + 'key1', 'a');
        mockBrowserAPIs.localStorage.setItem(prefix + 'key2', 'b');
        mockBrowserAPIs.localStorage.setItem('other_app_key', 'c');

        const keys = await service.storage.getAllKeys();
        expect(keys).toHaveLength(2);
        expect(keys).toContain('key1');
        expect(keys).toContain('key2');
    });

    it('should clear only the items with the correct prefix', async () => {
        mockBrowserAPIs.localStorage.setItem(prefix + 'key1', 'a');
        mockBrowserAPIs.localStorage.setItem('other_app_key', 'c');

        await service.storage.clear();
        expect(mockBrowserAPIs.localStorage.removeItem).toHaveBeenCalledWith(prefix + 'key1');
        expect(mockBrowserAPIs.localStorage.removeItem).not.toHaveBeenCalledWith('other_app_key');
    });
  });

  describe('WebDevice', () => {
    it.each([
      ['Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36', 'android'],
      ['Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1', 'ios'],
      ['Mozilla/5.0 (iPad; CPU OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.88 Mobile/15E148 Safari/604.1', 'ios'],
      ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36', 'windows'],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36', 'macos'],
      ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36', 'linux'],
      ['Mozilla/5.0 (Unknown; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 'macos'],
    ])('should detect platform as %s from user agent', (userAgent, expectedPlatform) => {
      Object.defineProperty(global.navigator, 'userAgent', { value: userAgent, configurable: true });
      // LINE 112: const userAgent = navigator.userAgent.toLowerCase();
      expect(service.device.getPlatform()).toBe(expectedPlatform as Platform);
    });

    it('should return device info from window and navigator', () => {
        const deviceInfo = service.device.getDeviceInfo();
        expect(deviceInfo.model).toBe(mockBrowserAPIs.navigator.userAgent);
        expect(deviceInfo.screenSize).toEqual({ width: 1920, height: 1080 });
        expect(deviceInfo.pixelRatio).toBe(1);
    });

    it('should return memory info when available', () => {
        Object.defineProperty(global.navigator, 'deviceMemory', { value: 8, configurable: true });
        // LINE 136: if (nav.deviceMemory) {
        const memoryInfo = service.device.getMemoryInfo();
        expect(memoryInfo.totalMemory).toBe(8 * 1024 * 1024 * 1024);
    });

    it('should return an empty object for memory info when not available', () => {
        Object.defineProperty(global.navigator, 'deviceMemory', { value: undefined, configurable: true });
        const memoryInfo = service.device.getMemoryInfo();
        expect(memoryInfo).toEqual({});
    });

    it('should return network status', () => {
        const networkStatus = service.device.getNetworkStatus();
        expect(networkStatus.isOnline).toBe(true);
        expect(networkStatus.type).toBe('wifi');
        expect(networkStatus.effectiveType).toBe('4g');
    });

    it('should identify a low-end device based on memory', () => {
        Object.defineProperty(global.navigator, 'deviceMemory', { value: 2, configurable: true });
        // LINE 163: return memoryGB < 4 || slowConnection || false;
        expect(service.device.isLowEndDevice()).toBe(true);
    });

    it('should identify a low-end device based on slow connection', () => {
        Object.defineProperty(global.navigator, 'connection', { value: { effectiveType: '2g' }, configurable: true });
        expect(service.device.isLowEndDevice()).toBe(true);
    });

    it('should not identify a high-end device as low-end', () => {
        Object.defineProperty(global.navigator, 'deviceMemory', { value: 8, configurable: true });
        Object.defineProperty(global.navigator, 'connection', { value: { effectiveType: '4g' }, configurable: true });
        expect(service.device.isLowEndDevice()).toBe(false);
    });
  });

  describe('WebPerformance', () => {
    it('should correctly measure duration between start and end', () => {
      mockBrowserAPIs.performance.now.mockReturnValueOnce(100).mockReturnValueOnce(250);
      service.performance.startMeasure('test-measure');
      const duration = service.performance.endMeasure('test-measure');
      expect(duration).toBe(150);
    });

    it('should throw an error if endMeasure is called without a start mark', () => {
      // LINE 188: throw new Error(`No start mark found for ${name}`);
      expect(() => service.performance.endMeasure('no-start')).toThrow('No start mark found for no-start');
    });

    it('should clean up start mark after endMeasure is called', () => {
      service.performance.startMeasure('test-measure');
      service.performance.endMeasure('test-measure');
      // Calling it again should throw, proving the mark was deleted
      expect(() => service.performance.endMeasure('test-measure')).toThrow();
    });

    it('should measure between two arbitrary marks', () => {
        mockBrowserAPIs.performance.now.mockReturnValueOnce(100).mockReturnValueOnce(500);
        service.performance.mark('start-point');
        service.performance.mark('end-point');
        const duration = service.performance.measure('custom-measure', 'start-point', 'end-point');
        expect(duration).toBe(400);
    });

    it('should throw if measure is called with a missing mark', () => {
        service.performance.mark('start-point');
        // LINE 208: throw new Error('Start or end mark not found');
        expect(() => service.performance.measure('custom', 'start-point', 'end-point')).toThrow('Start or end mark not found');
    });

    it('should return collected metrics and calculate averages', () => {
      // First measure
      mockBrowserAPIs.performance.now.mockReturnValueOnce(100).mockReturnValueOnce(200);
      service.performance.startMeasure('login');
      service.performance.endMeasure('login'); // duration 100

      // Second measure
      mockBrowserAPIs.performance.now.mockReturnValueOnce(300).mockReturnValueOnce(500);
      service.performance.startMeasure('login');
      service.performance.endMeasure('login'); // duration 200

      service.performance.mark('init-done'); // at time 600

      const metrics = service.performance.getMetrics();
      expect(metrics.measures['login']).toEqual([100, 200]);
      expect(metrics.averages['login']).toBe(150);
      expect(metrics.marks['init-done']).toBeDefined();
    });

    it('should clear all metrics', () => {
      service.performance.startMeasure('test');
      service.performance.endMeasure('test');
      service.performance.clearMetrics();
      const metrics = service.performance.getMetrics();
      expect(metrics.measures).toEqual({});
      expect(metrics.marks).toEqual({});
      expect(metrics.averages).toEqual({});
    });
  });

  describe('WebNotification', () => {
    it('should return false on permission request if Notifications are not available', async () => {
        Object.defineProperty(global, 'window', { value: {}, writable: true });
        // LINE 72: if (!('Notification' in window)) {
        const permission = await service.notifications.requestPermission();
        expect(permission).toBe(false);
    });

    it('should return true if permission is granted', async () => {
        Object.defineProperty(global, 'window', { value: { Notification: mockBrowserAPIs.window.Notification }, writable: true });
        mockBrowserAPIs.window.Notification.requestPermission.mockResolvedValue('granted');
        const permission = await service.notifications.requestPermission();
        expect(permission).toBe(true);
    });

    it('should return false if permission is denied', async () => {
        mockBrowserAPIs.window.Notification.requestPermission.mockResolvedValue('denied');
        const permission = await service.notifications.requestPermission();
        expect(permission).toBe(false);
    });

    it('should throw an error when showing notification if not permitted', async () => {
        mockBrowserAPIs.window.Notification.permission = 'denied';
        // LINE 82: throw new Error('Notifications not supported or not permitted');
        await expect(service.notifications.show('title')).rejects.toThrow('Notifications not supported or not permitted');
    });

    it('should throw for scheduled notifications as it is not supported', async () => {
        // LINE 97: throw new Error('Scheduled notifications not supported on web');
        await expect(service.notifications.schedule({} as any)).rejects.toThrow('Scheduled notifications not supported on web');
    });
  });

  describe('WebClipboard', () => {
    it('should use navigator.clipboard.writeText when available', async () => {
        await service.clipboard.copy('test text');
        expect(mockBrowserAPIs.navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });

    it('should use fallback method when navigator.clipboard is not available', async () => {
        const mockTextArea = {
            value: '',
            style: { position: '', opacity: '' },
            select: jest.fn(),
        };
        mockBrowserAPIs.document.createElement.mockReturnValue(mockTextArea);
        Object.defineProperty(global.navigator, 'clipboard', { value: undefined, configurable: true });

        await service.clipboard.copy('fallback text');

        expect(mockBrowserAPIs.document.createElement).toHaveBeenCalledWith('textarea');
        expect(mockTextArea.value).toBe('fallback text');
        expect(mockBrowserAPIs.document.body.appendChild).toHaveBeenCalledWith(mockTextArea);
        expect(mockTextArea.select).toHaveBeenCalled();
        expect(mockBrowserAPIs.document.execCommand).toHaveBeenCalledWith('copy');
        expect(mockBrowserAPIs.document.body.removeChild).toHaveBeenCalledWith(mockTextArea);
    });

    it('should read text from clipboard', async () => {
        Object.defineProperty(global.navigator, 'clipboard', { 
            value: { readText: jest.fn().mockResolvedValue('pasted text') }, 
            configurable: true 
        });
        const text = await service.clipboard.paste();
        expect(text).toBe('pasted text');
    });

    it('should throw on paste if clipboard API is not available', async () => {
        Object.defineProperty(global.navigator, 'clipboard', { value: undefined, configurable: true });
        // LINE 265: throw new Error('Clipboard paste not supported');
        await expect(service.clipboard.paste()).rejects.toThrow('Clipboard paste not supported');
    });
  });

  describe('WebShare', () => {
    it('should report canShare is true when navigator.share is available', () => {
        Object.defineProperty(global.navigator, 'share', { value: jest.fn(), configurable: true });
        expect(service.share.canShare()).toBe(true);
    });

    it('should report canShare is false when navigator.share is not available', () => {
        const newNavigator = { ...mockBrowserAPIs.navigator };
        delete (newNavigator as any).share;
        Object.defineProperty(global, 'navigator', { value: newNavigator, configurable: true });
        expect(service.share.canShare()).toBe(false);
    });

    it('should call navigator.share with correct options', async () => {
        Object.defineProperty(global.navigator, 'share', { value: jest.fn().mockResolvedValue(undefined), configurable: true });
        const options: ShareOptions = { title: 't', text: 'txt', url: 'u' };
        await service.share.share(options);
        expect(global.navigator.share).toHaveBeenCalledWith(options);
    });

    it('should throw if share is called when not supported', async () => {
        const newNavigator = { ...mockBrowserAPIs.navigator };
        delete (newNavigator as any).share;
        Object.defineProperty(global, 'navigator', { value: newNavigator, configurable: true });
        // LINE 282: throw new Error('Web Share API not supported');
        await expect(service.share.share({})).rejects.toThrow('Web Share API not supported');
    });

    it('should not re-throw AbortError when user cancels share', async () => {
        const abortError = new Error('Share aborted');
        abortError.name = 'AbortError';
        Object.defineProperty(global.navigator, 'share', { value: jest.fn().mockRejectedValue(abortError), configurable: true });
        // LINE 292: if ((error as Error).name !== 'AbortError') {
        await expect(service.share.share({})).resolves.toBeUndefined();
    });

    it('should re-throw other errors from navigator.share', async () => {
        const otherError = new Error('Some other error');
        Object.defineProperty(global.navigator, 'share', { value: jest.fn().mockRejectedValue(otherError), configurable: true });
        await expect(service.share.share({})).rejects.toThrow('Some other error');
    });
  });
});