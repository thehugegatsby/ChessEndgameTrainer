import { WebPlatformService } from '../WebPlatformService';

describe('WebPlatformService', () => {
  let service: WebPlatformService;
  let originalLocalStorage: Storage;
  let mockLocalStorage: { [key: string]: string };
  
  beforeEach(() => {
    service = new WebPlatformService();
    
    // Mock localStorage
    mockLocalStorage = {};
    originalLocalStorage = global.localStorage;
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
        key: jest.fn((index: number) => {
          const keys = Object.keys(mockLocalStorage);
          return keys[index] || null;
        }),
        length: Object.keys(mockLocalStorage).length
      },
      writable: true,
      configurable: true
    });

    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
      writable: true,
      configurable: true
    });

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    });

    // Mock window.screen
    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080
      },
      writable: true,
      configurable: true
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Storage', () => {
    test('should save data to localStorage', async () => {
      await service.storage.save('test-key', { foo: 'bar' });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chess_trainer_test-key',
        JSON.stringify({ foo: 'bar' })
      );
    });

    test('should load data from localStorage', async () => {
      mockLocalStorage['chess_trainer_test-key'] = JSON.stringify({ foo: 'bar' });
      
      const result = await service.storage.load('test-key');
      
      expect(result).toEqual({ foo: 'bar' });
      expect(localStorage.getItem).toHaveBeenCalledWith('chess_trainer_test-key');
    });

    test('should return null for missing data', async () => {
      const result = await service.storage.load('missing-key');
      
      expect(result).toBeNull();
    });

    test('should remove data from localStorage', async () => {
      mockLocalStorage['chess_trainer_test-key'] = JSON.stringify({ foo: 'bar' });
      
      await service.storage.remove('test-key');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('chess_trainer_test-key');
    });

    test('should clear all prefixed data', async () => {
      mockLocalStorage['chess_trainer_key1'] = 'data1';
      mockLocalStorage['chess_trainer_key2'] = 'data2';
      mockLocalStorage['other_key'] = 'other';
      
      // Mock getAllKeys to return the correct keys
      jest.spyOn(service.storage, 'getAllKeys').mockResolvedValue(['key1', 'key2']);
      
      await service.storage.clear();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('chess_trainer_key1');
      expect(localStorage.removeItem).toHaveBeenCalledWith('chess_trainer_key2');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    });

    test('should get all keys with prefix', async () => {
      const mockKeys = ['chess_trainer_key1', 'chess_trainer_key2', 'other_key'];
      Object.defineProperty(localStorage, 'length', {
        value: mockKeys.length,
        configurable: true
      });
      (localStorage.key as jest.Mock).mockImplementation((index: number) => mockKeys[index]);
      
      const keys = await service.storage.getAllKeys();
      
      expect(keys).toEqual(['key1', 'key2']);
    });

    test('should handle JSON parse errors', async () => {
      mockLocalStorage['chess_trainer_test-key'] = 'invalid-json';
      
      const result = await service.storage.load('test-key');
      
      expect(result).toBeNull();
    });

    test('should handle localStorage errors on save', async () => {
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      await expect(service.storage.save('test', { data: 'test' }))
        .rejects.toThrow('Failed to save data');
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      // Mock Notification API
      (global as any).Notification = {
        permission: 'default',
        requestPermission: jest.fn()
      };
    });

    test('should request notification permission', async () => {
      (Notification.requestPermission as jest.Mock).mockResolvedValue('granted');
      
      const result = await service.notifications.requestPermission();
      
      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    test('should return false for denied permission', async () => {
      (Notification.requestPermission as jest.Mock).mockResolvedValue('denied');
      
      const result = await service.notifications.requestPermission();
      
      expect(result).toBe(false);
    });

    test('should return false when Notification not available', async () => {
      delete (window as any).Notification;
      
      const result = await service.notifications.requestPermission();
      
      expect(result).toBe(false);
    });

    test('should show notification when permitted', async () => {
      const mockNotification = jest.fn();
      Object.defineProperty(global, 'Notification', {
        value: mockNotification,
        writable: true,
        configurable: true
      });
      Object.defineProperty(mockNotification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true
      });
      
      await service.notifications.show('Test Title', {
        body: 'Test Body',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test-tag',
        data: { test: true }
      });
      
      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test-tag',
        data: { test: true }
      });
    });

    test('should throw when showing notification without permission', async () => {
      (Notification as any).permission = 'denied';
      
      await expect(service.notifications.show('Test'))
        .rejects.toThrow('Notifications not supported or not permitted');
    });

    test('should throw for scheduled notifications', async () => {
      await expect(service.notifications.schedule({
        id: 'test',
        title: 'Test',
        scheduledAt: new Date()
      })).rejects.toThrow('Scheduled notifications not supported on web');
    });

    test('cancel methods should not throw', async () => {
      await service.notifications.cancel('test-id');
      await service.notifications.cancelAll();
      expect(true).toBe(true);
    });
  });

  describe('Device', () => {
    test('should detect Windows platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
      
      expect(service.device.getPlatform()).toBe('windows');
    });

    test('should detect macOS platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
        configurable: true
      });
      
      expect(service.device.getPlatform()).toBe('macos');
    });

    test('should detect Android platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11)',
        configurable: true
      });
      
      expect(service.device.getPlatform()).toBe('android');
    });

    test('should detect iOS platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        configurable: true
      });
      
      expect(service.device.getPlatform()).toBe('ios');
    });

    test('should detect Linux platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true
      });
      
      expect(service.device.getPlatform()).toBe('linux');
    });

    test('should default to web platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Unknown Browser',
        configurable: true
      });
      
      expect(service.device.getPlatform()).toBe('web');
    });

    test('should get device info', () => {
      const info = service.device.getDeviceInfo();
      
      expect(info).toEqual({
        model: navigator.userAgent,
        osVersion: navigator.userAgent,
        screenSize: {
          width: 1920,
          height: 1080
        },
        pixelRatio: 2,
        isTablet: false
      });
    });

    test('should detect tablet', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0)',
        configurable: true
      });
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        configurable: true
      });
      Object.defineProperty(window.screen, 'width', {
        value: 1024,
        configurable: true
      });
      
      const info = service.device.getDeviceInfo();
      expect(info.isTablet).toBe(true);
    });

    test('should get memory info when available', () => {
      (navigator as any).deviceMemory = 8;
      
      const memInfo = service.device.getMemoryInfo();
      
      expect(memInfo).toEqual({
        totalMemory: 8 * 1024 * 1024 * 1024
      });
    });

    test('should return empty memory info when not available', () => {
      delete (navigator as any).deviceMemory;
      
      const memInfo = service.device.getMemoryInfo();
      
      expect(memInfo).toEqual({});
    });

    test('should get network status', () => {
      (navigator as any).connection = {
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10
      };
      
      const status = service.device.getNetworkStatus();
      
      expect(status).toEqual({
        isOnline: true,
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10
      });
    });

    test('should detect low-end device by memory', () => {
      (navigator as any).deviceMemory = 2;
      
      expect(service.device.isLowEndDevice()).toBe(true);
    });

    test('should detect low-end device by network', () => {
      (navigator as any).deviceMemory = 8;
      (navigator as any).connection = {
        effectiveType: '2g'
      };
      
      expect(service.device.isLowEndDevice()).toBe(true);
    });

    test('should not detect as low-end device', () => {
      (navigator as any).deviceMemory = 8;
      (navigator as any).connection = {
        effectiveType: '4g'
      };
      
      expect(service.device.isLowEndDevice()).toBe(false);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      jest.spyOn(performance, 'now').mockReturnValue(1000);
    });

    test('should start and end measure', () => {
      service.performance.startMeasure('test-measure');
      
      jest.spyOn(performance, 'now').mockReturnValue(1500);
      
      const duration = service.performance.endMeasure('test-measure');
      
      expect(duration).toBe(500);
    });

    test('should throw when ending measure without start', () => {
      expect(() => service.performance.endMeasure('unknown'))
        .toThrow('No start mark found for unknown');
    });

    test('should mark timestamps', () => {
      service.performance.mark('test-mark');
      
      const metrics = service.performance.getMetrics();
      expect(metrics.marks['test-mark']).toBe(1000);
    });

    test('should measure between marks', () => {
      service.performance.mark('start');
      jest.spyOn(performance, 'now').mockReturnValue(1500);
      service.performance.mark('end');
      
      const duration = service.performance.measure('test', 'start', 'end');
      
      expect(duration).toBe(500);
    });

    test('should throw when measuring with missing marks', () => {
      service.performance.mark('start');
      
      expect(() => service.performance.measure('test', 'start', 'missing'))
        .toThrow('Start or end mark not found');
    });

    test('should calculate averages', () => {
      service.performance.startMeasure('test');
      jest.spyOn(performance, 'now').mockReturnValue(1100);
      service.performance.endMeasure('test');
      
      service.performance.startMeasure('test');
      jest.spyOn(performance, 'now').mockReturnValue(1300);
      service.performance.endMeasure('test');
      
      const metrics = service.performance.getMetrics();
      
      expect(metrics.averages['test']).toBe(150);
      expect(metrics.measures['test']).toEqual([100, 200]);
    });

    test('should clear metrics', () => {
      service.performance.mark('test');
      service.performance.startMeasure('measure');
      
      service.performance.clearMetrics();
      
      const metrics = service.performance.getMetrics();
      expect(metrics.marks).toEqual({});
      expect(metrics.measures).toEqual({});
      expect(metrics.averages).toEqual({});
    });
  });

  describe('Clipboard', () => {
    test('should copy text using navigator.clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true
      });
      
      await service.clipboard.copy('test text');
      
      expect(mockWriteText).toHaveBeenCalledWith('test text');
    });

    test('should fallback to execCommand for copy', async () => {
      delete (navigator as any).clipboard;
      
      const mockExecCommand = jest.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;
      
      const mockSelect = jest.fn();
      const mockTextArea = {
        value: '',
        style: { position: '', opacity: '' },
        select: mockSelect
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      await service.clipboard.copy('test text');
      
      expect(mockTextArea.value).toBe('test text');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
    });

    test('should paste text using navigator.clipboard', async () => {
      const mockReadText = jest.fn().mockResolvedValue('pasted text');
      Object.defineProperty(navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true
      });
      
      const result = await service.clipboard.paste();
      
      expect(result).toBe('pasted text');
      expect(mockReadText).toHaveBeenCalled();
    });

    test('should throw when paste not supported', async () => {
      delete (navigator as any).clipboard;
      
      await expect(service.clipboard.paste())
        .rejects.toThrow('Clipboard paste not supported');
    });

    test('should return false for hasContent', async () => {
      const result = await service.clipboard.hasContent();
      expect(result).toBe(false);
    });
  });

  describe('Share', () => {
    test('should detect share capability', () => {
      (navigator as any).share = jest.fn();
      expect(service.share.canShare()).toBe(true);
      
      delete (navigator as any).share;
      expect(service.share.canShare()).toBe(false);
    });

    test('should share content', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      (navigator as any).share = mockShare;
      
      await service.share.share({
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      });
      
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      });
    });

    test('should throw when share not supported', async () => {
      delete (navigator as any).share;
      
      await expect(service.share.share({ title: 'Test' }))
        .rejects.toThrow('Web Share API not supported');
    });

    test('should handle share cancellation', async () => {
      const abortError = new Error('Share cancelled');
      (abortError as any).name = 'AbortError';
      (navigator as any).share = jest.fn().mockRejectedValue(abortError);
      
      // Should not throw for AbortError
      await service.share.share({ title: 'Test' });
      expect(true).toBe(true);
    });

    test('should throw for other share errors', async () => {
      const error = new Error('Share failed');
      (navigator as any).share = jest.fn().mockRejectedValue(error);
      
      await expect(service.share.share({ title: 'Test' }))
        .rejects.toThrow('Share failed');
    });
  });

  describe('Analytics', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    test('should track events', () => {
      service.analytics.track('test-event', { value: 123 });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Analytics track:',
        'test-event',
        { value: 123 }
      );
    });

    test('should identify users', () => {
      service.analytics.identify('user-123', { name: 'Test User' });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Analytics identify:',
        'user-123',
        { name: 'Test User' }
      );
    });

    test('should track pages', () => {
      service.analytics.page('Home', { referrer: 'google' });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Analytics page:',
        'Home',
        { referrer: 'google' }
      );
    });

    test('should set user properties', () => {
      service.analytics.setUserProperties({ premium: true });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Analytics user properties:',
        { premium: true }
      );
    });
  });
});