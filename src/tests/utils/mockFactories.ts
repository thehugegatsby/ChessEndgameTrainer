import { vi } from 'vitest';
// @ts-nocheck
/**
 * Mock Factories for Platform Services
 * Jest 30 compatible mocks for all platform services
 */

import type {
  PlatformStorage,
  PlatformNotification,
  PlatformDevice,
  PlatformPerformance,
  PlatformClipboard,
  PlatformShare,
  PlatformAnalytics,
  DeviceInfo,
  MemoryInfo,
  NetworkStatus,
  PerformanceMetrics,
} from '@shared/services/platform/types';

// Helper to create mock functions that work with or without Jest
const mockFn = <TArgs extends unknown[] = unknown[], TReturn = unknown>(
  impl?: (...args: TArgs) => TReturn
): vi.Mock<TReturn, TArgs> | ((...args: TArgs) => TReturn) => {
  if (vi.fn) {
    return impl ? vi.fn(impl) : vi.fn();
  }
  return impl || (() => {});
};

const asyncMockFn = <TArgs extends unknown[] = unknown[], TReturn = unknown>(
  impl?: (...args: TArgs) => Promise<TReturn>
): vi.Mock<Promise<TReturn>, TArgs> | ((...args: TArgs) => Promise<TReturn | undefined>) => {
  if (vi.fn) {
    return impl ? vi.fn(impl) : vi.fn().mockResolvedValue(undefined);
  }
  return impl || (() => Promise.resolve(undefined));
};

/**
 * Mock Platform Storage Service
 */
export function createMockPlatformStorage(
  overrides: Partial<PlatformStorage> = {}
): vi.Mocked<PlatformStorage> {
  const store: Record<string, unknown> = {};

  const defaults: vi.Mocked<PlatformStorage> = {
    save: asyncMockFn((key: string, data: unknown) => {
      store[key] = data;
      return Promise.resolve();
    }),
    load: asyncMockFn((key: string) => {
      return Promise.resolve(store[key] || null);
    }),
    remove: asyncMockFn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: asyncMockFn(() => {
      Object.keys(store).forEach(key => delete store[key]);
      return Promise.resolve();
    }),
    getAllKeys: asyncMockFn(() => {
      return Promise.resolve(Object.keys(store));
    }),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Device Service
 */
export function createMockPlatformDevice(
  overrides: Partial<PlatformDevice> = {}
): vi.Mocked<PlatformDevice> {
  const mockDeviceInfo: DeviceInfo = {
    model: 'Test Device',
    brand: 'Test Brand',
    osVersion: '1.0.0',
    screenSize: { width: 1920, height: 1080 },
    pixelRatio: 1,
    isTablet: false,
  };

  const mockMemoryInfo: MemoryInfo = {
    totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
    availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
    usedMemory: 4 * 1024 * 1024 * 1024, // 4GB
  };

  const mockNetworkStatus: NetworkStatus = {
    isOnline: true,
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
  };

  return {
    getPlatform: mockFn(() => 'web'),
    getDeviceInfo: mockFn(() => mockDeviceInfo),
    getMemoryInfo: mockFn(() => mockMemoryInfo),
    getNetworkStatus: mockFn(() => mockNetworkStatus),
    isLowEndDevice: mockFn(() => false),
  } as vi.Mocked<PlatformDevice>;
}

/**
 * Mock Platform Notification Service
 */
export function createMockPlatformNotification(
  overrides: Partial<PlatformNotification> = {}
): vi.Mocked<PlatformNotification> {
  const defaults: vi.Mocked<PlatformNotification> = {
    requestPermission: asyncMockFn(() => Promise.resolve(true)),
    show: asyncMockFn(),
    schedule: asyncMockFn(() => Promise.resolve('mock-notification-id')),
    cancel: asyncMockFn(),
    cancelAll: asyncMockFn(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Performance Service
 */
export function createMockPlatformPerformance(
  overrides: Partial<PlatformPerformance> = {}
): vi.Mocked<PlatformPerformance> {
  let mockTime = 0;
  const measures: Record<string, number[]> = {};
  const marks: Record<string, number> = {};

  const mockMetrics: PerformanceMetrics = {
    measures,
    marks,
    averages: {},
  };

  const defaults: vi.Mocked<PlatformPerformance> = {
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
    }),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Clipboard Service
 */
export function createMockPlatformClipboard(
  overrides: Partial<PlatformClipboard> = {}
): vi.Mocked<PlatformClipboard> {
  let clipboardContent = '';

  const defaults: vi.Mocked<PlatformClipboard> = {
    copy: asyncMockFn((text: string) => {
      clipboardContent = text;
      return Promise.resolve();
    }),
    paste: asyncMockFn(() => Promise.resolve(clipboardContent)),
    hasContent: asyncMockFn(() => Promise.resolve(clipboardContent.length > 0)),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Share Service
 */
export function createMockPlatformShare(
  overrides: Partial<PlatformShare> = {}
): vi.Mocked<PlatformShare> {
  const defaults: vi.Mocked<PlatformShare> = {
    canShare: mockFn(() => true),
    share: asyncMockFn(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Analytics Service
 */
export function createMockPlatformAnalytics(
  overrides: Partial<PlatformAnalytics> = {}
): vi.Mocked<PlatformAnalytics> {
  const defaults: vi.Mocked<PlatformAnalytics> = {
    track: mockFn(),
    identify: mockFn(),
    page: mockFn(),
    setUserProperties: mockFn(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Complete mock platform service
 */
interface MockPlatformService {
  storage: vi.Mocked<PlatformStorage>;
  notifications: vi.Mocked<PlatformNotification>;
  device: vi.Mocked<PlatformDevice>;
  performance: vi.Mocked<PlatformPerformance>;
  clipboard: vi.Mocked<PlatformClipboard>;
  share: vi.Mocked<PlatformShare>;
  analytics: vi.Mocked<PlatformAnalytics>;
}

export function createMockPlatformService(): MockPlatformService {
  return {
    storage: createMockPlatformStorage(),
    notifications: createMockPlatformNotification(),
    device: createMockPlatformDevice(),
    performance: createMockPlatformPerformance(),
    clipboard: createMockPlatformClipboard(),
    share: createMockPlatformShare(),
    analytics: createMockPlatformAnalytics(),
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
  offline: (): MockPlatformService => {
    const service = createMockPlatformService();
    service.device = createMockPlatformDevice({
      getNetworkStatus: mockFn(() => ({
        isOnline: false,
        type: 'none' as const,
        effectiveType: undefined,
        downlink: 0,
      })),
    });
    return service;
  },

  /**
   * Low-end device scenario
   */
  lowEndDevice: (): MockPlatformService => {
    const service = createMockPlatformService();
    service.device = createMockPlatformDevice({
      isLowEndDevice: mockFn(() => true),
      getMemoryInfo: mockFn(() => ({
        totalMemory: 2 * 1024 * 1024 * 1024, // 2GB
        availableMemory: 512 * 1024 * 1024, // 512MB
        usedMemory: 1.5 * 1024 * 1024 * 1024, // 1.5GB
      })),
    });
    return service;
  },

  /**
   * No permissions scenario
   */
  noPermissions: () => {
    const service = createMockPlatformService();
    service.notifications = createMockPlatformNotification({
      requestPermission: asyncMockFn(() => Promise.resolve(false)),
    });
    service.clipboard = createMockPlatformClipboard({
      hasContent: asyncMockFn(() => Promise.resolve(false)),
    });
    service.share = createMockPlatformShare({
      canShare: mockFn(() => false),
    });
    return service;
  },
};
