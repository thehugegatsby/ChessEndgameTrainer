/**
 * @file Service container type definitions
 * @module services/container/types
 *
 * @description
 * Type definitions for the dependency injection container system.
 * Provides type-safe service registration and resolution with support
 * for both predefined platform services and custom services.
 *
 * @remarks
 * The service container supports:
 * - Type-safe service registry with compile-time checks
 * - Singleton and factory patterns
 * - Circular dependency detection
 * - Testing overrides and mocks
 * - Browser API abstractions
 * - Platform service abstractions
 *
 * @example
 * ```typescript
 * // Define a service in the registry
 * interface ServiceRegistry {
 *   'my.service': IMyService;
 * }
 *
 * // Register and resolve services
 * container.register('my.service', () => new MyService());
 * const service = container.resolve('my.service');
 * ```
 */

import {
  IPlatformStorage,
  IPlatformNotification,
  IPlatformDevice,
  IPlatformPerformance,
  IPlatformClipboard,
  IPlatformShare,
  IPlatformAnalytics,
  IPlatformDetection,
} from "../platform/types";

/**
 * Browser API abstractions for dependency injection
 *
 * @interface IBrowserAPIs
 *
 * @description
 * Provides abstracted interfaces for browser APIs to enable
 * testing and platform-specific implementations.
 *
 * @property {Storage} localStorage - Browser localStorage API
 * @property {Storage} sessionStorage - Browser sessionStorage API
 * @property {Navigator} navigator - Browser navigator API
 * @property {Window} window - Browser window object
 * @property {Document} document - Browser document object
 * @property {Performance} performance - Browser performance API
 *
 * @example
 * ```typescript
 * const apis: IBrowserAPIs = {
 *   localStorage: window.localStorage,
 *   sessionStorage: window.sessionStorage,
 *   navigator: window.navigator,
 *   window: window,
 *   document: window.document,
 *   performance: window.performance
 * };
 * ```
 */
export interface IBrowserAPIs {
  localStorage: Storage;
  sessionStorage: Storage;
  navigator: Navigator;
  window: Window;
  document: Document;
  performance: Performance;
}

/**
 * Service identifier type
 *
 * @typedef {string} ServiceKey
 *
 * @description
 * String literal type for service identifiers. Used as keys
 * in the service registry for type-safe service resolution.
 */
export type ServiceKey = string;

/**
 * Service factory function type
 *
 * @typedef {Function} ServiceFactory
 * @template T - The service type being created
 * @param {IServiceContainer} container - Container for resolving dependencies
 * @returns {T} The service instance
 *
 * @description
 * Factory function that creates service instances. Receives the
 * container to enable dependency resolution during construction.
 *
 * @example
 * ```typescript
 * const storageFactory: ServiceFactory<IStorage> = (container) => {
 *   const platform = container.resolve('platform.detection');
 *   return new StorageService(platform);
 * };
 * ```
 */
export type ServiceFactory<T> = (container: IServiceContainer) => T;

/**
 * Service registry interface
 *
 * @interface ServiceRegistry
 *
 * @description
 * Central type registry mapping service keys to their corresponding types.
 * This enables compile-time type safety when registering and resolving services.
 * Extend this interface to add custom services to the type system.
 *
 * @remarks
 * The registry is organized into logical groups:
 * - platform.*: Cross-platform service abstractions
 * - browser.*: Browser-specific API abstractions
 *
 * @example
 * ```typescript
 * // Extend the registry in your application
 * declare module '@shared/services/container/types' {
 *   interface ServiceRegistry {
 *     'app.theme': IThemeService;
 *     'app.auth': IAuthService;
 *   }
 * }
 * ```
 */
export interface ServiceRegistry {
  // Platform services
  "platform.storage": IPlatformStorage;
  "platform.notifications": IPlatformNotification;
  "platform.device": IPlatformDevice;
  "platform.performance": IPlatformPerformance;
  "platform.clipboard": IPlatformClipboard;
  "platform.share": IPlatformShare;
  "platform.analytics": IPlatformAnalytics;
  "platform.detection": IPlatformDetection;

  // Browser API abstractions
  "browser.apis": IBrowserAPIs;
  "browser.localStorage": Storage;
  "browser.navigator": Navigator;
  "browser.window": Window;
  "browser.document": Document;
  "browser.performance": Performance;
}

/**
 * Service container interface
 *
 * @interface IServiceContainer
 *
 * @description
 * Main interface for the dependency injection container.
 * Provides methods for registering, resolving, and managing services
 * with support for both type-safe predefined services and dynamic
 * custom services.
 *
 * @remarks
 * The container supports:
 * - Lazy service instantiation
 * - Singleton caching (configurable)
 * - Circular dependency detection
 * - Type-safe service resolution
 * - Testing utilities
 *
 * @example
 * ```typescript
 * const container: IServiceContainer = new ServiceContainer();
 *
 * // Register services
 * container.register('platform.storage', () => new WebStorage());
 *
 * // Resolve services
 * const storage = container.resolve('platform.storage');
 * ```
 */
export interface IServiceContainer {
  /**
   * Register a service with the container
   * @param key - Service identifier
   * @param factory - Factory function to create the service
   */
  register<K extends keyof ServiceRegistry>(
    key: K,
    factory: ServiceFactory<ServiceRegistry[K]>,
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

/**
 * Service overrides for testing
 *
 * @typedef {Object} ServiceOverrides
 *
 * @description
 * Partial type allowing override of any registered service.
 * Used in tests to provide mock implementations.
 *
 * @example
 * ```typescript
 * const overrides: ServiceOverrides = {
 *   'platform.storage': mockStorage,
 *   'platform.notifications': mockNotifications
 * };
 * ```
 */
export type ServiceOverrides = Partial<{
  [K in keyof ServiceRegistry]: ServiceRegistry[K];
}>;

/**
 * Custom service overrides for testing
 *
 * @typedef {Object} CustomServiceOverrides
 *
 * @description
 * Dynamic overrides for custom services not in the registry.
 * Provides flexibility for test-specific services.
 */
export type CustomServiceOverrides = Record<string, unknown>;

/**
 * Combined overrides for test containers
 *
 * @interface TestContainerOverrides
 *
 * @description
 * Configuration object for creating test containers with
 * both registered and custom service overrides.
 *
 * @property {ServiceOverrides} [services] - Registry service overrides
 * @property {CustomServiceOverrides} [custom] - Custom service overrides
 *
 * @example
 * ```typescript
 * const testOverrides: TestContainerOverrides = {
 *   services: {
 *     'platform.storage': mockStorage
 *   },
 *   custom: {
 *     'test.helper': testHelper
 *   }
 * };
 * ```
 */
export interface TestContainerOverrides {
  services?: ServiceOverrides;
  custom?: CustomServiceOverrides;
}

/**
 * Service container configuration
 *
 * @interface ServiceContainerConfig
 *
 * @description
 * Configuration options for the service container behavior.
 * Controls caching, validation, and debugging features.
 *
 * @property {boolean} [useSingletons=true] - Cache service instances (singleton pattern)
 * @property {boolean} [validateKeys=true] - Validate keys to prevent duplicate registration
 * @property {Function} [logger] - Optional logger for debugging service resolution
 *
 * @example
 * ```typescript
 * const config: ServiceContainerConfig = {
 *   useSingletons: true,
 *   validateKeys: true,
 *   logger: (msg) => console.log(`[Container] ${msg}`)
 * };
 *
 * const container = new ServiceContainer(config);
 * ```
 */
export interface ServiceContainerConfig {
  // Whether to use singleton pattern (one instance per key)
  useSingletons?: boolean;

  // Whether to validate service keys
  validateKeys?: boolean;

  // Logger function for debugging
  logger?: (message: string) => void;
}

/**
 * Error thrown when a requested service is not found
 *
 * @class ServiceNotFoundError
 * @extends {Error}
 *
 * @description
 * Thrown when attempting to resolve a service that hasn't been registered.
 * Includes the requested key in the error message for debugging.
 *
 * @example
 * ```typescript
 * try {
 *   container.resolve('unknown.service');
 * } catch (error) {
 *   if (error instanceof ServiceNotFoundError) {
 *     console.error('Service not registered:', error.message);
 *   }
 * }
 * ```
 */
export class ServiceNotFoundError extends Error {
  constructor(key: string) {
    super(`Service not found for key: ${key}`);
    this.name = "ServiceNotFoundError";
  }
}

/**
 * Error thrown when attempting to register a duplicate service
 *
 * @class ServiceAlreadyRegisteredError
 * @extends {Error}
 *
 * @description
 * Thrown when trying to register a service with a key that's already
 * in use. Only thrown when validateKeys is enabled in configuration.
 *
 * @example
 * ```typescript
 * container.register('my.service', factory1);
 * try {
 *   container.register('my.service', factory2); // Throws
 * } catch (error) {
 *   console.error('Duplicate registration:', error.message);
 * }
 * ```
 */
export class ServiceAlreadyRegisteredError extends Error {
  constructor(key: string) {
    super(`Service already registered for key: ${key}`);
    this.name = "ServiceAlreadyRegisteredError";
  }
}

/**
 * Error thrown when circular dependencies are detected
 *
 * @class CircularDependencyError
 * @extends {Error}
 *
 * @description
 * Thrown when service resolution encounters a circular dependency chain.
 * The error message includes the complete dependency chain for debugging.
 *
 * @example
 * ```typescript
 * // Service A depends on B, B depends on A
 * container.register('a', (c) => new A(c.resolve('b')));
 * container.register('b', (c) => new B(c.resolve('a')));
 *
 * try {
 *   container.resolve('a'); // Throws CircularDependencyError
 * } catch (error) {
 *   console.error('Circular dependency:', error.message);
 *   // "Circular dependency detected: a -> b -> a"
 * }
 * ```
 */
export class CircularDependencyError extends Error {
  constructor(chain: string[]) {
    super(`Circular dependency detected: ${chain.join(" -> ")}`);
    this.name = "CircularDependencyError";
  }
}
