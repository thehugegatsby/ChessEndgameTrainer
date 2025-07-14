/**
 * Service Container Types
 * Type-safe dependency injection container for platform services
 */

import {
  IPlatformStorage,
  IPlatformNotification,
  IPlatformDevice,
  IPlatformPerformance,
  IPlatformClipboard,
  IPlatformShare,
  IPlatformAnalytics,
  IPlatformDetection
} from '../platform/types';

// Browser API abstractions for dependency injection
export interface IBrowserAPIs {
  localStorage: Storage;
  sessionStorage: Storage;
  navigator: Navigator;
  window: Window;
  document: Document;
  performance: Performance;
}

// Service identifier type (string literal for type safety)
export type ServiceKey = string;

// Service factory function type
export type ServiceFactory<T> = (container: IServiceContainer) => T;

// Service registry interface - maps service keys to their types
export interface ServiceRegistry {
  // Platform services
  'platform.storage': IPlatformStorage;
  'platform.notifications': IPlatformNotification;
  'platform.device': IPlatformDevice;
  'platform.performance': IPlatformPerformance;
  'platform.clipboard': IPlatformClipboard;
  'platform.share': IPlatformShare;
  'platform.analytics': IPlatformAnalytics;
  'platform.detection': IPlatformDetection;
  
  // Browser API abstractions
  'browser.apis': IBrowserAPIs;
  'browser.localStorage': Storage;
  'browser.navigator': Navigator;
  'browser.window': Window;
  'browser.document': Document;
  'browser.performance': Performance;
}

// Service container interface
export interface IServiceContainer {
  /**
   * Register a service with the container
   * @param key - Service identifier
   * @param factory - Factory function to create the service
   */
  register<K extends keyof ServiceRegistry>(
    key: K,
    factory: ServiceFactory<ServiceRegistry[K]>
  ): void;

  /**
   * Register a service with a custom key (for flexibility)
   * @param key - Custom service identifier
   * @param factory - Factory function to create the service
   */
  registerCustom<T>(key: string, factory: ServiceFactory<T>): void;

  /**
   * Resolve a service from the container
   * @param key - Service identifier
   * @returns The service instance
   */
  resolve<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K];

  /**
   * Resolve a custom service from the container
   * @param key - Custom service identifier
   * @returns The service instance
   */
  resolveCustom<T>(key: string): T;

  /**
   * Check if a service is registered
   * @param key - Service identifier
   * @returns True if service is registered
   */
  has<K extends keyof ServiceRegistry>(key: K): boolean;

  /**
   * Check if a custom service is registered
   * @param key - Custom service identifier
   * @returns True if service is registered
   */
  hasCustom(key: string): boolean;

  /**
   * Clear all resolved instances (useful for testing)
   */
  clearInstances(): void;

  /**
   * Get all registered service keys
   * @returns Array of registered service keys
   */
  getRegisteredKeys(): string[];
}

// Service overrides for testing
export type ServiceOverrides = Partial<{
  [K in keyof ServiceRegistry]: ServiceRegistry[K];
}>;

// Custom service overrides for testing
export type CustomServiceOverrides = Record<string, any>;

// Combined overrides for test containers
export interface TestContainerOverrides {
  services?: ServiceOverrides;
  custom?: CustomServiceOverrides;
}

// Service container configuration
export interface ServiceContainerConfig {
  // Whether to use singleton pattern (one instance per key)
  useSingletons?: boolean;
  
  // Whether to validate service keys
  validateKeys?: boolean;
  
  // Logger function for debugging
  logger?: (message: string) => void;
}

// Error types for service container
export class ServiceNotFoundError extends Error {
  constructor(key: string) {
    super(`Service not found for key: ${key}`);
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceAlreadyRegisteredError extends Error {
  constructor(key: string) {
    super(`Service already registered for key: ${key}`);
    this.name = 'ServiceAlreadyRegisteredError';
  }
}

export class CircularDependencyError extends Error {
  constructor(chain: string[]) {
    super(`Circular dependency detected: ${chain.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}