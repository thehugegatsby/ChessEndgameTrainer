/**
 * Web implementation of platform services
 * Provides browser-specific implementations of platform abstractions
 */

import {
  IPlatformService,
  IPlatformStorage,
  IPlatformNotification,
  IPlatformDevice,
  IPlatformPerformance,
  IPlatformClipboard,
  IPlatformShare,
  IPlatformAnalytics,
  Platform,
  DeviceInfo,
  MemoryInfo,
  NetworkStatus,
  NotificationOptions,
  ScheduledNotification,
  PerformanceMetrics,
  ShareOptions
} from '../types';
import { STORAGE, SYSTEM } from '@shared/constants';

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
  localStorage: typeof window !== 'undefined' ? window.localStorage : {} as Storage,
  sessionStorage: typeof window !== 'undefined' ? window.sessionStorage : {} as Storage,
  navigator: typeof navigator !== 'undefined' ? navigator : {} as Navigator,
  window: typeof window !== 'undefined' ? window : {} as Window,
  document: typeof document !== 'undefined' ? document : {} as Document,
  performance: typeof performance !== 'undefined' ? performance : {} as Performance,
});

// Web Storage Implementation with dependency injection
class WebStorage implements IPlatformStorage {
  private prefix = STORAGE.PREFIX;
  private storage: Storage;

  constructor(storage: Storage = typeof localStorage !== 'undefined' ? localStorage : {} as Storage) {
    this.storage = storage;
  }

  async save(key: string, data: any): Promise<void> {
    // Validate key format
    if (!VALID_KEY_REGEX.test(key)) {
      throw new Error(`Invalid storage key: ${key}. Only alphanumeric characters, hyphens, and underscores are allowed.`);
    }
    
    try {
      const serialized = JSON.stringify(data);
      this.storage.setItem(this.prefix + key, serialized);
    } catch (error) {
      // Preserve original error context for debugging
      throw new Error(`Failed to save data for key '${key}': ${(error as Error).message}`);
    }
  }

  async load<T = any>(key: string): Promise<T | null> {
    // Validate key format
    if (!VALID_KEY_REGEX.test(key)) {
      console.error(`Invalid storage key requested: ${key}`);
      return null;
    }
    
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;
      
      // Parse JSON with error handling
      const data = JSON.parse(item);
      return data as T;
    } catch (error) {
      console.error(`Failed to parse stored data for key '${key}':`, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    // Validate key format
    if (!VALID_KEY_REGEX.test(key)) {
      console.error(`Invalid storage key for removal: ${key}`);
      return;
    }
    
    this.storage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.getAllKeys();
    keys.forEach(key => this.storage.removeItem(this.prefix + key));
  }

  async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }
}

// Web Notification Implementation
class WebNotification implements IPlatformNotification {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  async show(title: string, options?: NotificationOptions): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      throw new Error('Notifications not supported or not permitted');
    }

    new Notification(title, {
      body: options?.body,
      icon: options?.icon,
      badge: options?.badge,
      tag: options?.tag,
      data: options?.data
    });
  }

  async schedule(_notification: ScheduledNotification): Promise<string> {
    // Web doesn't support scheduled notifications natively
    // Would need service worker implementation
    throw new Error('Scheduled notifications not supported on web');
  }

  async cancel(_id: string): Promise<void> {
    // Not supported on web
  }

  async cancelAll(): Promise<void> {
    // Not supported on web
  }
}

// Web Device Implementation with dependency injection
class WebDevice implements IPlatformDevice {
  private navigator: Navigator;
  private window?: Window;

  constructor(
    navigator: Navigator = typeof window !== 'undefined' ? window.navigator : {} as Navigator,
    windowObj?: Window
  ) {
    this.navigator = navigator;
    this.window = windowObj || (typeof window !== 'undefined' ? window : {} as Window);
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
        width: this.window?.screen?.width || 1920,
        height: this.window?.screen?.height || 1080
      },
      pixelRatio: this.window?.devicePixelRatio || 1,
      isTablet: this.checkIsTablet()
    };
  }

  getMemoryInfo(): MemoryInfo {
    const nav = this.navigator as any;
    if (nav.deviceMemory) {
      return {
        totalMemory: nav.deviceMemory * SYSTEM.GB_TO_BYTES_FACTOR // Convert GB to bytes
      };
    }
    return {};
  }

  getNetworkStatus(): NetworkStatus {
    const nav = this.navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    return {
      isOnline: this.navigator.onLine,
      type: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink
    };
  }

  isLowEndDevice(): boolean {
    const nav = this.navigator as any;
    // Consider device low-end if it has less than 4GB RAM or slow network
    const memoryGB = nav.deviceMemory || SYSTEM.DEFAULT_MEMORY_GB;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const slowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
    
    return memoryGB < SYSTEM.LOW_MEMORY_THRESHOLD_GB || slowConnection || false;
  }

  private checkIsTablet(): boolean {
    const userAgent = this.navigator.userAgent.toLowerCase();
    const hasTouch = this.window && 'ontouchstart' in this.window;
    const screenSize = Math.min(
      this.window?.screen?.width || 1920, 
      this.window?.screen?.height || 1080
    );
    
    return hasTouch && screenSize >= 768 && 
           (userAgent.includes('tablet') || userAgent.includes('ipad'));
  }
}

// Web Performance Implementation
class WebPerformance implements IPlatformPerformance {
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
      averages
    };
  }

  clearMetrics(): void {
    this.measures = {};
    this.marks = {};
  }
}

// Web Clipboard Implementation with dependency injection
class WebClipboard implements IPlatformClipboard {
  private navigator: Navigator;
  private document?: Document;

  constructor(
    navigator: Navigator = typeof window !== 'undefined' ? window.navigator : {} as Navigator,
    document?: Document
  ) {
    this.navigator = navigator;
    this.document = document || (typeof window !== 'undefined' ? window.document : {} as Document);
  }

  async copy(text: string): Promise<void> {
    if (this.navigator.clipboard) {
      await this.navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = this.document!.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      this.document!.body.appendChild(textArea);
      textArea.select();
      this.document!.execCommand('copy');
      this.document!.body.removeChild(textArea);
    }
  }

  async paste(): Promise<string> {
    if (this.navigator.clipboard) {
      return await this.navigator.clipboard.readText();
    }
    throw new Error('Clipboard paste not supported');
  }

  async hasContent(): Promise<boolean> {
    // Web doesn't provide a way to check clipboard content without reading it
    return false;
  }
}

// Web Share Implementation with dependency injection
class WebShare implements IPlatformShare {
  private navigator: Navigator;

  constructor(navigator: Navigator = typeof window !== 'undefined' ? window.navigator : {} as Navigator) {
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
        title: options.title,
        text: options.text,
        url: options.url
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  }
}

// Web Analytics Implementation (stub for now)
class WebAnalytics implements IPlatformAnalytics {
  track(_event: string, _properties?: Record<string, any>): void {
    // Implement actual analytics (Google Analytics, Mixpanel, etc.)
  }

  identify(_userId: string, _traits?: Record<string, any>): void {
  }

  page(_name: string, _properties?: Record<string, any>): void {
  }

  setUserProperties(_properties: Record<string, any>): void {
  }
}

// Main Web Platform Service with dependency injection
export class WebPlatformService implements IPlatformService {
  storage: IPlatformStorage;
  notifications: IPlatformNotification;
  device: IPlatformDevice;
  performance: IPlatformPerformance;
  clipboard: IPlatformClipboard;
  share: IPlatformShare;
  analytics: IPlatformAnalytics;

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