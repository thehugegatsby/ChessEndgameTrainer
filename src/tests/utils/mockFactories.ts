// @ts-nocheck
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
  PerformanceMetrics,
} from "@shared/services/platform/types";

// Helper to create mock functions that work with or without Jest
const mockFn = <TArgs extends unknown[] = unknown[], TReturn = unknown>(
  impl?: (...args: TArgs) => TReturn
) => {
  if (typeof jest !== "undefined" && jest.fn) {
    return impl ? jest.fn(impl) : jest.fn();
  }
  return impl || (() => {});
};

const asyncMockFn = <TArgs extends unknown[] = unknown[], TReturn = unknown>(
  impl?: (...args: TArgs) => Promise<TReturn>
) => {
  if (typeof jest !== "undefined" && jest.fn) {
    return impl ? jest.fn(impl) : jest.fn().mockResolvedValue(undefined);
  }
  return impl || (() => Promise.resolve(undefined));
};

/**
 * Mock Platform Storage Service
 */
export function createMockPlatformStorage(
  overrides: Partial<IPlatformStorage> = {}
): jest.Mocked<IPlatformStorage> {
  const store: Record<string, unknown> = {};

  const defaults: jest.Mocked<IPlatformStorage> = {
    save: asyncMockFn(async (key: string, data: unknown) => {
      store[key] = data;
    }),
    load: asyncMockFn(async (key: string) => {
      return store[key] || null;
    }),
    remove: asyncMockFn(async (key: string) => {
      delete store[key];
    }),
    clear: asyncMockFn(async () => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    getAllKeys: asyncMockFn(async () => {
      return Object.keys(store);
    }),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Device Service
 */
export function createMockPlatformDevice(
  overrides: Partial<IPlatformDevice> = {}
): jest.Mocked<IPlatformDevice> {
  const mockDeviceInfo: DeviceInfo = {
    model: "Test Device",
    brand: "Test Brand",
    osVersion: "1.0.0",
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
    type: "wifi",
    effectiveType: "4g",
    downlink: 10,
  };

  return {
    getPlatform: mockFn(() => "web"),
    getDeviceInfo: mockFn(() => mockDeviceInfo),
    getMemoryInfo: mockFn(() => mockMemoryInfo),
    getNetworkStatus: mockFn(() => mockNetworkStatus),
    isLowEndDevice: mockFn(() => false),
  } as jest.Mocked<IPlatformDevice>;
}

/**
 * Mock Platform Notification Service
 */
export function createMockPlatformNotification(
  overrides: Partial<IPlatformNotification> = {}
): jest.Mocked<IPlatformNotification> {
  const defaults: jest.Mocked<IPlatformNotification> = {
    requestPermission: asyncMockFn(async () => true),
    show: asyncMockFn(),
    schedule: asyncMockFn(async () => "mock-notification-id"),
    cancel: asyncMockFn(),
    cancelAll: asyncMockFn(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Performance Service
 */
export function createMockPlatformPerformance(
  overrides: Partial<IPlatformPerformance> = {}
): jest.Mocked<IPlatformPerformance> {
  let mockTime = 0;
  const measures: Record<string, number[]> = {};
  const marks: Record<string, number> = {};

  const mockMetrics: PerformanceMetrics = {
    measures,
    marks,
    averages: {},
  };

  const defaults: jest.Mocked<IPlatformPerformance> = {
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
      Object.keys(measures).forEach((key) => delete measures[key]);
      Object.keys(marks).forEach((key) => delete marks[key]);
    }),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Clipboard Service
 */
export function createMockPlatformClipboard(
  overrides: Partial<IPlatformClipboard> = {}
): jest.Mocked<IPlatformClipboard> {
  let clipboardContent = "";

  const defaults: jest.Mocked<IPlatformClipboard> = {
    copy: asyncMockFn(async (text: string) => {
      clipboardContent = text;
    }),
    paste: asyncMockFn(async () => clipboardContent),
    hasContent: asyncMockFn(async () => clipboardContent.length > 0),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Share Service
 */
export function createMockPlatformShare(
  overrides: Partial<IPlatformShare> = {}
): jest.Mocked<IPlatformShare> {
  const defaults: jest.Mocked<IPlatformShare> = {
    canShare: mockFn(() => true),
    share: asyncMockFn(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock Platform Analytics Service
 */
export function createMockPlatformAnalytics(
  overrides: Partial<IPlatformAnalytics> = {}
): jest.Mocked<IPlatformAnalytics> {
  const defaults: jest.Mocked<IPlatformAnalytics> = {
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
export function createMockPlatformService() {
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
  offline: () => {
    const service = createMockPlatformService();
    service.device = createMockPlatformDevice({
      getNetworkStatus: mockFn(() => ({
        isOnline: false,
        type: "none" as const,
        effectiveType: undefined,
        downlink: 0,
      })),
    });
    return service;
  },

  /**
   * Low-end device scenario
   */
  lowEndDevice: () => {
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
      requestPermission: asyncMockFn(async () => false),
    });
    service.clipboard = createMockPlatformClipboard({
      hasContent: asyncMockFn(async () => false),
    });
    service.share = createMockPlatformShare({
      canShare: mockFn(() => false),
    });
    return service;
  },
};
