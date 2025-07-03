/**
 * Platform abstraction interfaces
 * Defines contracts for platform-specific implementations
 */

// Storage abstraction
export interface IPlatformStorage {
  save(key: string, data: any): Promise<void>;
  load<T = any>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

// Notification abstraction
export interface IPlatformNotification {
  requestPermission(): Promise<boolean>;
  show(title: string, options?: NotificationOptions): Promise<void>;
  schedule(notification: ScheduledNotification): Promise<string>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
}

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export interface ScheduledNotification {
  title: string;
  body: string;
  trigger: Date | { seconds: number };
  data?: any;
}

// Device info abstraction
export interface IPlatformDevice {
  getPlatform(): Platform;
  getDeviceInfo(): DeviceInfo;
  getMemoryInfo(): MemoryInfo;
  getNetworkStatus(): NetworkStatus;
  isLowEndDevice(): boolean;
}

export type Platform = 'web' | 'ios' | 'android' | 'windows' | 'macos' | 'linux';

export interface DeviceInfo {
  model: string;
  brand?: string;
  osVersion: string;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  isTablet: boolean;
}

export interface MemoryInfo {
  totalMemory?: number;
  availableMemory?: number;
  usedMemory?: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  type?: 'wifi' | '4g' | '3g' | '2g' | 'none';
  effectiveType?: string;
  downlink?: number;
}

// Performance monitoring abstraction
export interface IPlatformPerformance {
  startMeasure(name: string): void;
  endMeasure(name: string): number;
  mark(name: string): void;
  measure(name: string, startMark: string, endMark: string): number;
  getMetrics(): PerformanceMetrics;
  clearMetrics(): void;
}

export interface PerformanceMetrics {
  measures: Record<string, number[]>;
  marks: Record<string, number>;
  averages: Record<string, number>;
}

// File system abstraction (for mobile)
export interface IPlatformFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  getDocumentDirectory(): string;
  getCacheDirectory(): string;
}

// Clipboard abstraction
export interface IPlatformClipboard {
  copy(text: string): Promise<void>;
  paste(): Promise<string>;
  hasContent(): Promise<boolean>;
}

// Share abstraction
export interface IPlatformShare {
  canShare(): boolean;
  share(options: ShareOptions): Promise<void>;
}

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

// Analytics abstraction
export interface IPlatformAnalytics {
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name: string, properties?: Record<string, any>): void;
  setUserProperties(properties: Record<string, any>): void;
}

// Main platform service interface
export interface IPlatformService {
  storage: IPlatformStorage;
  notifications: IPlatformNotification;
  device: IPlatformDevice;
  performance: IPlatformPerformance;
  fileSystem?: IPlatformFileSystem;
  clipboard: IPlatformClipboard;
  share: IPlatformShare;
  analytics: IPlatformAnalytics;
}

// Platform detection utilities
export interface IPlatformDetection {
  isWeb(): boolean;
  isMobile(): boolean;
  isAndroid(): boolean;
  isIOS(): boolean;
  isDesktop(): boolean;
  isTouchDevice(): boolean;
  isStandalone(): boolean; // PWA installed
}