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

// Web Storage Implementation
class WebStorage implements IPlatformStorage {
  private prefix = 'chess_trainer_';

  async save(key: string, data: any): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('WebStorage save error:', error);
      throw new Error('Failed to save data');
    }
  }

  async load<T = any>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('WebStorage load error:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.getAllKeys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
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

  async schedule(notification: ScheduledNotification): Promise<string> {
    // Web doesn't support scheduled notifications natively
    // Would need service worker implementation
    throw new Error('Scheduled notifications not supported on web');
  }

  async cancel(id: string): Promise<void> {
    // Not supported on web
  }

  async cancelAll(): Promise<void> {
    // Not supported on web
  }
}

// Web Device Implementation
class WebDevice implements IPlatformDevice {
  getPlatform(): Platform {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'web';
  }

  getDeviceInfo(): DeviceInfo {
    return {
      model: navigator.userAgent,
      osVersion: navigator.userAgent,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      pixelRatio: window.devicePixelRatio || 1,
      isTablet: this.checkIsTablet()
    };
  }

  getMemoryInfo(): MemoryInfo {
    const nav = navigator as any;
    if (nav.deviceMemory) {
      return {
        totalMemory: nav.deviceMemory * 1024 * 1024 * 1024 // Convert GB to bytes
      };
    }
    return {};
  }

  getNetworkStatus(): NetworkStatus {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      type: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink
    };
  }

  isLowEndDevice(): boolean {
    const nav = navigator as any;
    // Consider device low-end if it has less than 4GB RAM or slow network
    const memoryGB = nav.deviceMemory || 4;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const slowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
    
    return memoryGB < 4 || slowConnection || false;
  }

  private checkIsTablet(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const hasTouch = 'ontouchstart' in window;
    const screenSize = Math.min(window.screen.width, window.screen.height);
    
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

// Web Clipboard Implementation
class WebClipboard implements IPlatformClipboard {
  async copy(text: string): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  async paste(): Promise<string> {
    if (navigator.clipboard) {
      return await navigator.clipboard.readText();
    }
    throw new Error('Clipboard paste not supported');
  }

  async hasContent(): Promise<boolean> {
    // Web doesn't provide a way to check clipboard content without reading it
    return false;
  }
}

// Web Share Implementation
class WebShare implements IPlatformShare {
  canShare(): boolean {
    return 'share' in navigator;
  }

  async share(options: ShareOptions): Promise<void> {
    if (!this.canShare()) {
      throw new Error('Web Share API not supported');
    }

    try {
      await navigator.share({
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
  track(event: string, properties?: Record<string, any>): void {
    console.log('Analytics track:', event, properties);
    // Implement actual analytics (Google Analytics, Mixpanel, etc.)
  }

  identify(userId: string, traits?: Record<string, any>): void {
    console.log('Analytics identify:', userId, traits);
  }

  page(name: string, properties?: Record<string, any>): void {
    console.log('Analytics page:', name, properties);
  }

  setUserProperties(properties: Record<string, any>): void {
    console.log('Analytics user properties:', properties);
  }
}

// Main Web Platform Service
export class WebPlatformService implements IPlatformService {
  storage: IPlatformStorage;
  notifications: IPlatformNotification;
  device: IPlatformDevice;
  performance: IPlatformPerformance;
  clipboard: IPlatformClipboard;
  share: IPlatformShare;
  analytics: IPlatformAnalytics;

  constructor() {
    this.storage = new WebStorage();
    this.notifications = new WebNotification();
    this.device = new WebDevice();
    this.performance = new WebPerformance();
    this.clipboard = new WebClipboard();
    this.share = new WebShare();
    this.analytics = new WebAnalytics();
  }
}