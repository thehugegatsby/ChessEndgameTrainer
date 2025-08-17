/**
 * Web implementation of platform services
 * Provides browser-specific implementations of platform abstractions
 */

import {
  type PlatformService,
  type PlatformStorage,
  type PlatformNotification,
  type PlatformDevice,
  type PlatformPerformance,
  type PlatformClipboard,
  type PlatformShare,
  type PlatformAnalytics,
  type Platform,
  type DeviceInfo,
  type MemoryInfo,
  type NetworkStatus,
  type NotificationOptions,
  type ScheduledNotification,
  type PerformanceMetrics,
  type ShareOptions,
} from '../types';
import { STORAGE, SYSTEM } from '../../../constants';
import { DISPLAY_DEFAULTS, DEVICE_THRESHOLDS } from '../../../../constants/display.constants';
// Using console directly to avoid circular dependency with Logger

// Storage key validation regex
const VALID_KEY_REGEX = /^[a-zA-Z0-9-_]+$/;

// Browser APIs interface for dependency injection
export interface BrowserAPIs {
  localStorage: Storage;
  sessionStorage?: Storage;
  navigator: Navigator;
  window?: Window;
  document?: Document;
  performance?: Performance;
}

// Default implementation using real browser APIs
const getLiveBrowserAPIs = (): BrowserAPIs => ({
  localStorage: typeof window !== 'undefined' ? window.localStorage : ({} as Storage),
  sessionStorage: typeof window !== 'undefined' ? window.sessionStorage : ({} as Storage),
  navigator: typeof navigator !== 'undefined' ? navigator : ({} as Navigator),
  window: typeof window !== 'undefined' ? window : ({} as Window),
  document: typeof document !== 'undefined' ? document : ({} as Document),
  performance: typeof performance !== 'undefined' ? performance : ({} as Performance),
});

// Web Storage Implementation with dependency injection
class WebStorage implements PlatformStorage {
  private prefix = STORAGE.PREFIX;
  private storage: Storage;

  constructor(
    storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
  ) {
    this.storage = storage;
  }

  save(key: string, data: unknown): Promise<void> {
    // Validate key format
    if (!VALID_KEY_REGEX.test(key)) {
      throw new Error(
        `Invalid storage key: ${key}. Only alphanumeric characters, hyphens, and underscores are allowed.`
      );
    }

    try {
      const serialized = JSON.stringify(data);
      this.storage.setItem(this.prefix + key, serialized);
      return Promise.resolve();
    } catch (error) {
      // Preserve original error context for debugging
      throw new Error(`Failed to save data for key '${key}': ${(error as Error).message}`);
    }
  }

  load<T = unknown>(key: string): Promise<T | null> {
    // Validate key format
    if (!VALID_KEY_REGEX.test(key)) {
      console.error(`[WebPlatformService] Invalid storage key requested: ${key}`);
      return Promise.resolve(null);
    }

    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return Promise.resolve(null);

      // Parse JSON with error handling
      const data = JSON.parse(item);
      return Promise.resolve(data as T);
    } catch (error) {
      console.error(`[WebPlatformService] Failed to parse stored data for key '${key}':`, error);
      return Promise.resolve(null);
    }
  }

  remove(key: string): Promise<void> {
    // Validate key format
    if (!VALID_KEY_REGEX.test(key)) {
      console.error(`[WebPlatformService] Invalid storage key for removal: ${key}`);
      return Promise.resolve();
    }

    this.storage.removeItem(this.prefix + key);
    return Promise.resolve();
  }

  async clear(): Promise<void> {
    const keys = await this.getAllKeys();
    keys.forEach(key => this.storage.removeItem(this.prefix + key));
  }

  getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return Promise.resolve(keys);
  }
}

// Web Notification Implementation
class WebNotification implements PlatformNotification {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  show(title: string, options?: NotificationOptions): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      throw new Error('Notifications not supported or not permitted');
    }

    new Notification(title, {
      ...(options?.body !== undefined && { body: options.body }),
      ...(options?.icon !== undefined && { icon: options.icon }),
      ...(options?.badge !== undefined && { badge: options.badge }),
      ...(options?.tag !== undefined && { tag: options.tag }),
      ...(options?.data !== undefined && { data: options.data }),
    });

    return Promise.resolve();
  }

  schedule(_notification: ScheduledNotification /* unused */): Promise<string> {
    // Web doesn't support scheduled notifications natively
    // Would need service worker implementation
    throw new Error('Scheduled notifications not supported on web');
  }

  async cancel(_id: string /* unused */): Promise<void> {
    // Not supported on web
  }

  async cancelAll(): Promise<void> {
    // Not supported on web
  }
}

// Web Device Implementation with dependency injection
class WebDevice implements PlatformDevice {
  private navigator: Navigator;
  private window?: Window;

  constructor(
    navigator: Navigator = typeof window !== 'undefined' ? window.navigator : ({} as Navigator),
    windowObj?: Window
  ) {
    this.navigator = navigator;
    this.window = windowObj || (typeof window !== 'undefined' ? window : ({} as Window));
  }

  getPlatform(): Platform {
    const userAgent = this.navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'web';
  }

  getDeviceInfo(): DeviceInfo {
    return {
      model: this.navigator.userAgent,
      osVersion: this.navigator.userAgent,
      screenSize: {
        width: this.window?.screen?.width || DISPLAY_DEFAULTS.SCREEN_FALLBACK_WIDTH_PX,
        height: this.window?.screen?.height || DISPLAY_DEFAULTS.SCREEN_FALLBACK_HEIGHT_PX,
      },
      pixelRatio: this.window?.devicePixelRatio || 1,
      isTablet: this.checkIsTablet(),
    };
  }

  getMemoryInfo(): MemoryInfo {
    const nav = this.navigator as Navigator & { deviceMemory?: number };
    if (nav.deviceMemory) {
      return {
        totalMemory: nav.deviceMemory * SYSTEM.GB_TO_BYTES_FACTOR, // Convert GB to bytes
      };
    }
    return {};
  }

  getNetworkStatus(): NetworkStatus {
    const nav = this.navigator as Navigator & {
      connection?: { type?: string; effectiveType?: string; downlink?: number };
      mozConnection?: { type?: string; effectiveType?: string; downlink?: number };
      webkitConnection?: { type?: string; effectiveType?: string; downlink?: number };
    };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    return {
      isOnline: this.navigator.onLine,
      ...(connection?.type !== undefined && {
        type: connection.type as 'wifi' | '4g' | '3g' | '2g' | 'none',
      }),
      ...(connection?.effectiveType !== undefined && { effectiveType: connection.effectiveType }),
      ...(connection?.downlink !== undefined && { downlink: connection.downlink }),
    };
  }

  isLowEndDevice(): boolean {
    const nav = this.navigator as Navigator & {
      deviceMemory?: number;
      connection?: { effectiveType?: string };
      mozConnection?: { effectiveType?: string };
      webkitConnection?: { effectiveType?: string };
    };
    // Consider device low-end if it has less than 4GB RAM or slow network
    const memoryGB = nav.deviceMemory || SYSTEM.DEFAULT_MEMORY_GB;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const slowConnection =
      connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';

    return memoryGB < SYSTEM.LOW_MEMORY_THRESHOLD_GB || slowConnection || false;
  }

  private checkIsTablet(): boolean {
    const userAgent = this.navigator.userAgent.toLowerCase();
    const hasTouch = this.window && 'ontouchstart' in this.window;
    const screenSize = Math.min(
      this.window?.screen?.width || DISPLAY_DEFAULTS.SCREEN_FALLBACK_WIDTH_PX,
      this.window?.screen?.height || DISPLAY_DEFAULTS.SCREEN_FALLBACK_HEIGHT_PX
    );

    return (
      Boolean(hasTouch) &&
      screenSize >= DEVICE_THRESHOLDS.TABLET_MIN_SHORT_EDGE_PX &&
      (userAgent.includes('tablet') || userAgent.includes('ipad'))
    );
  }
}

// Web Performance Implementation
class WebPerformance implements PlatformPerformance {
  private measures: Record<string, number[]> = {};
  private marks: Record<string, number> = {};

  startMeasure(name: string): void {
    this.marks[`${name}_start`] = performance.now();
  }

  endMeasure(name: string): number {
    const startMark = `${name}_start`;
    if (!this.marks[startMark]) {
      throw new Error(`No start mark found for ${name}`);
    }

    const duration = performance.now() - this.marks[startMark];

    if (!this.measures[name]) {
      this.measures[name] = [];
    }
    this.measures[name].push(duration);

    delete this.marks[startMark];
    return duration;
  }

  mark(name: string): void {
    this.marks[name] = performance.now();
  }

  measure(name: string, startMark: string, endMark: string): number {
    if (!this.marks[startMark] || !this.marks[endMark]) {
      throw new Error('Start or end mark not found');
    }

    const duration = this.marks[endMark] - this.marks[startMark];

    if (!this.measures[name]) {
      this.measures[name] = [];
    }
    this.measures[name].push(duration);

    return duration;
  }

  getMetrics(): PerformanceMetrics {
    const averages: Record<string, number> = {};

    Object.entries(this.measures).forEach(([name, values]) => {
      if (values.length > 0) {
        averages[name] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });

    return {
      measures: { ...this.measures },
      marks: { ...this.marks },
      averages,
    };
  }

  clearMetrics(): void {
    this.measures = {};
    this.marks = {};
  }
}

// Web Clipboard Implementation with dependency injection
class WebClipboard implements PlatformClipboard {
  private navigator: Navigator;
  private document?: Document;

  constructor(
    navigator: Navigator = typeof window !== 'undefined' ? window.navigator : ({} as Navigator),
    document?: Document
  ) {
    this.navigator = navigator;
    this.document =
      document || (typeof window !== 'undefined' ? window.document : ({} as Document));
  }

  async copy(text: string): Promise<void> {
    if (this.navigator.clipboard) {
      await this.navigator.clipboard.writeText(text);
    } else if (this.document && typeof this.document.createElement === 'function') {
      // Fallback for older browsers
      const textArea = this.document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      this.document.body.appendChild(textArea);
      textArea.select();
      this.document.execCommand('copy');
      this.document.body.removeChild(textArea);
    } else {
      throw new Error('Clipboard API not supported and no DOM available for fallback');
    }
  }

  async paste(): Promise<string> {
    if (this.navigator.clipboard) {
      return await this.navigator.clipboard.readText();
    }
    throw new Error('Clipboard paste not supported');
  }

  hasContent(): Promise<boolean> {
    // Web doesn't provide a way to check clipboard content without reading it
    return Promise.resolve(false);
  }
}

// Web Share Implementation with dependency injection
class WebShare implements PlatformShare {
  private navigator: Navigator;

  constructor(
    navigator: Navigator = typeof window !== 'undefined' ? window.navigator : ({} as Navigator)
  ) {
    this.navigator = navigator;
  }

  canShare(): boolean {
    return 'share' in this.navigator;
  }

  async share(options: ShareOptions): Promise<void> {
    if (!this.canShare()) {
      throw new Error('Web Share API not supported');
    }

    try {
      await this.navigator.share({
        ...(options.title !== undefined && { title: options.title }),
        ...(options.text !== undefined && { text: options.text }),
        ...(options.url !== undefined && { url: options.url }),
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  }
}

// Web Analytics Implementation (stub for now)
class WebAnalytics implements PlatformAnalytics {
  track(_event: string /* unused */, _properties?: Record<string, unknown> /* unused */): void {
    // Implement actual analytics (Google Analytics, Mixpanel, etc.)
  }

  identify(_userId: string /* unused */, _traits?: Record<string, unknown> /* unused */): void {
    /* Interface requirement */
  }

  page(_name: string /* unused */, _properties?: Record<string, unknown> /* unused */): void {
    /* Interface requirement */
  }

  setUserProperties(_properties: Record<string, unknown> /* unused */): void {
    /* Interface requirement */
  }
}

// Main Web Platform Service with dependency injection
export class WebPlatformService implements PlatformService {
  storage: PlatformStorage;
  notifications: PlatformNotification;
  device: PlatformDevice;
  performance: PlatformPerformance;
  clipboard: PlatformClipboard;
  share: PlatformShare;
  analytics: PlatformAnalytics;

  private readonly apis: BrowserAPIs;

  // Optional apis parameter for dependency injection (backward compatible)
  constructor(apis: BrowserAPIs = getLiveBrowserAPIs()) {
    this.apis = apis;

    // Pass injected APIs to services that need them
    this.storage = new WebStorage(this.apis.localStorage);
    this.notifications = new WebNotification();
    this.device = new WebDevice(this.apis.navigator, this.apis.window);
    this.performance = new WebPerformance();
    this.clipboard = new WebClipboard(this.apis.navigator, this.apis.document);
    this.share = new WebShare(this.apis.navigator);
    this.analytics = new WebAnalytics();
  }
}
