/**
 * Mock Factories for Platform Services
 * Jest 30 compatible mocks for all platform services
 */

import type {
  IPlatformStorage,
  IPlatformNotification,
  IPlatformDevice,
  IPlatformPerformance,
  IPlatformClipboard,
  IPlatformShare,
  IPlatformAnalytics,
  DeviceInfo,
  MemoryInfo,
  NetworkStatus,
  PerformanceMetrics
} from '@shared/services/platform/types';

// Helper to create mock functions that work with or without Jest
const mockFn = (impl?: (...args: any[]) => any) => {
  if (typeof jest !== 'undefined' && jest.fn) {
    return impl ? jest.fn(impl) : jest.fn();
  }
  return impl || (() => {});
};

const asyncMockFn = (impl?: (...args: any[]) => any) => {
  if (typeof jest !== 'undefined' && jest.fn) {
    return impl ? jest.fn(impl) : jest.fn().mockResolvedValue(undefined);
  }
  return impl || (() => Promise.resolve(undefined));
};

/**
 * Mock Platform Storage Service
 */
export function createMockPlatformStorage(): jest.Mocked<IPlatformStorage> {
  const store: Record<string, any> = {};

  return {
    save: asyncMockFn(async (key: string, data: any) => {
      store[key] = data;
    }),
    load: asyncMockFn(async (key: string) => {
      return store[key] || null;
    }),
    remove: asyncMockFn(async (key: string) => {
      delete store[key];
    }),
    clear: asyncMockFn(async () => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    getAllKeys: asyncMockFn(async () => {
      return Object.keys(store);
    })
  } as jest.Mocked<IPlatformStorage>;
}

/**
 * Mock Platform Device Service
 */
export function createMockPlatformDevice(): jest.Mocked<IPlatformDevice> {
  const mockDeviceInfo: DeviceInfo = {
    model: 'Test Device',
    brand: 'Test Brand',
    osVersion: '1.0.0',
    screenSize: { width: 1920, height: 1080 },
    pixelRatio: 1,
    isTablet: false
  };

  const mockMemoryInfo: MemoryInfo = {
    totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
    availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
    usedMemory: 4 * 1024 * 1024 * 1024 // 4GB
  };

  const mockNetworkStatus: NetworkStatus = {
    isOnline: true,
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10
  };

  return {
    getPlatform: mockFn(() => 'web'),
    getDeviceInfo: mockFn(() => mockDeviceInfo),
    getMemoryInfo: mockFn(() => mockMemoryInfo),
    getNetworkStatus: mockFn(() => mockNetworkStatus),
    isLowEndDevice: mockFn(() => false)
  } as jest.Mocked<IPlatformDevice>;
}

/**
 * Mock Platform Notification Service
 */
export function createMockPlatformNotification(): jest.Mocked<IPlatformNotification> {
  return {
    requestPermission: asyncMockFn(async () => true),
    show: asyncMockFn(),
    schedule: asyncMockFn(async () => 'mock-notification-id'),
    cancel: asyncMockFn(),
    cancelAll: asyncMockFn()
  } as jest.Mocked<IPlatformNotification>;
}

/**
 * Mock Platform Performance Service
 */
export function createMockPlatformPerformance(): jest.Mocked<IPlatformPerformance> {
  let mockTime = 0;
  const measures: Record<string, number[]> = {};
  const marks: Record<string, number> = {};

  const mockMetrics: PerformanceMetrics = {
    measures,
    marks,
    averages: {}
  };

  return {
    startMeasure: mockFn((name: string) => {
      marks[`${name}_start`] = mockTime;
    }),
    endMeasure: mockFn((name: string) => {
      const startTime = marks[`${name}_start`] || 0;
      const duration = mockTime - startTime;
      if (!measures[name]) measures[name] = [];
      measures[name].push(duration);
      mockTime += 16.67; // Simulate time passing
      return duration;
    }),
    mark: mockFn((name: string) => {
      marks[name] = mockTime;
      mockTime += 1;
    }),
    measure: mockFn((name: string, startMark: string, endMark: string) => {
      const duration = (marks[endMark] || 0) - (marks[startMark] || 0);
      if (!measures[name]) measures[name] = [];
      measures[name].push(duration);
      return duration;
    }),
    getMetrics: mockFn(() => mockMetrics),
    clearMetrics: mockFn(() => {
      Object.keys(measures).forEach(key => delete measures[key]);
      Object.keys(marks).forEach(key => delete marks[key]);
    })
  } as jest.Mocked<IPlatformPerformance>;
}

/**
 * Mock Platform Clipboard Service
 */
export function createMockPlatformClipboard(): jest.Mocked<IPlatformClipboard> {
  let clipboardContent = '';

  return {
    copy: asyncMockFn(async (text: string) => {
      clipboardContent = text;
    }),
    paste: asyncMockFn(async () => clipboardContent),
    hasContent: asyncMockFn(async () => clipboardContent.length > 0)
  } as jest.Mocked<IPlatformClipboard>;
}

/**
 * Mock Platform Share Service
 */
export function createMockPlatformShare(): jest.Mocked<IPlatformShare> {
  return {
    canShare: mockFn(() => true),
    share: asyncMockFn()
  } as jest.Mocked<IPlatformShare>;
}

/**
 * Mock Platform Analytics Service
 */
export function createMockPlatformAnalytics(): jest.Mocked<IPlatformAnalytics> {
  return {
    track: mockFn(),
    identify: mockFn(),
    page: mockFn(),
    setUserProperties: mockFn()
  } as jest.Mocked<IPlatformAnalytics>;
}

/**
 * Complete mock platform service
 */
export function createMockPlatformService() {
  return {
    storage: createMockPlatformStorage(),
    notifications: createMockPlatformNotification(),
    device: createMockPlatformDevice(),
    performance: createMockPlatformPerformance(),
    clipboard: createMockPlatformClipboard(),
    share: createMockPlatformShare(),
    analytics: createMockPlatformAnalytics()
  };
}

/**
 * Pre-configured mock scenarios
 */
export const MockScenarios = {
  /**
   * Default mocks for most tests
   */
  default: createMockPlatformService,

  /**
   * Offline device scenario
   */
  offline: () => {
    const service = createMockPlatformService();
    (service.device.getNetworkStatus as any) = mockFn(() => ({
      isOnline: false,
      type: 'none' as const,
      effectiveType: undefined,
      downlink: 0
    }));
    return service;
  },

  /**
   * Low-end device scenario
   */
  lowEndDevice: () => {
    const service = createMockPlatformService();
    (service.device.isLowEndDevice as any) = mockFn(() => true);
    (service.device.getMemoryInfo as any) = mockFn(() => ({
      totalMemory: 2 * 1024 * 1024 * 1024, // 2GB
      availableMemory: 512 * 1024 * 1024, // 512MB
      usedMemory: 1.5 * 1024 * 1024 * 1024 // 1.5GB
    }));
    return service;
  },

  /**
   * No permissions scenario
   */
  noPermissions: () => {
    const service = createMockPlatformService();
    (service.notifications.requestPermission as any) = asyncMockFn(async () => false);
    (service.clipboard.hasContent as any) = asyncMockFn(async () => false);
    (service.share.canShare as any) = mockFn(() => false);
    return service;
  }
};