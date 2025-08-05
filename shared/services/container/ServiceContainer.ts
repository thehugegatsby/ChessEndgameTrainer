/**
 * @file Service Container Implementation
 * @module services/container/ServiceContainer
 * 
 * @description
 * Lightweight dependency injection container for platform services.
 * Provides a centralized way to manage service instances and their dependencies,
 * supporting both singleton and factory patterns with circular dependency detection.
 * 
 * @remarks
 * Key features:
 * - Lazy service instantiation
 * - Singleton and factory patterns
 * - Circular dependency detection
 * - Mock services for testing
 * - Browser API abstraction
 * - Type-safe service registry
 */

import {
  IServiceContainer,
  ServiceRegistry,
  ServiceFactory,
  ServiceContainerConfig,
  ServiceNotFoundError,
  ServiceAlreadyRegisteredError,
  CircularDependencyError,
  IBrowserAPIs
} from './types';
import {
  createMockStorage,
  createMockNavigator,
  createMockWindow,
  createMockDocument,
  createMockPerformance
} from './mocks';

/**
 * Service Container implementation for dependency injection
 * 
 * @class ServiceContainer
 * @implements {IServiceContainer}
 * 
 * @description
 * Manages service registration, instantiation, and dependency resolution.
 * Supports both singleton and factory patterns with automatic circular
 * dependency detection.
 * 
 * @example
 * ```typescript
 * // Create a container
 * const container = new ServiceContainer({ useSingletons: true });
 * 
 * // Register a service factory
 * container.register('storage', (container) => {
 *   return new StorageService(container.get('platform'));
 * });
 * 
 * // Get service instance
 * const storage = container.get<IStorageService>('storage');
 * ```
 */
export class ServiceContainer implements IServiceContainer {
  private factories = new Map<string, ServiceFactory<any>>();
  private instances = new Map<string, any>();
  private resolving = new Set<string>(); // For circular dependency detection
  private config: ServiceContainerConfig;

  /**
   * Creates a new service container
   * 
   * @param {ServiceContainerConfig} config - Configuration options
   * @param {boolean} [config.useSingletons=true] - Whether to cache service instances
   * @param {boolean} [config.validateKeys=true] - Whether to validate service keys
   * @param {Function} [config.logger] - Optional logger function
   */
  constructor(config: ServiceContainerConfig = {}) {
    this.config = {
      useSingletons: true,
      validateKeys: true,
      logger: config.logger || (() => {}), // No-op logger by default
      ...config
    };
  }


  /**
   * Create a production container with real browser APIs
   * 
   * @static
   * @returns {ServiceContainer} Container configured for production use
   * 
   * @example
   * ```typescript
   * const container = ServiceContainer.createProductionContainer();
   * const platform = container.get('platform');
   * ```
   */
  static createProductionContainer(): ServiceContainer {
    const container = new ServiceContainer();
    
    if (typeof window !== 'undefined') {
      container.registerBrowserAPIs({
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage,
        navigator: window.navigator,
        window: window,
        document: window.document,
        performance: window.performance
      });
      
      // Register platform services
      container.registerPlatformServices();
    }
    
    return container;
  }

  /**
   * Create a test container with browser API mocks
   * 
   * @description
   * This is the main entry point for Jest tests. Creates a container with
   * mocked browser APIs and platform services suitable for testing.
   * 
   * @static
   * @param {Partial<IBrowserAPIs>} [mockAPIs] - Optional custom mock implementations
   * @returns {ServiceContainer} Container configured for testing
   * 
   * @example
   * ```typescript
   * // In a test file
   * const container = ServiceContainer.createTestContainer({
   *   localStorage: customMockStorage
   * });
   * 
   * const storage = container.get('storage');
   * await storage.save('key', 'value');
   * ```
   */
  static createTestContainer(mockAPIs?: Partial<IBrowserAPIs>): ServiceContainer {
    const container = new ServiceContainer();
    
    // Register mock browser APIs
    const apis = {
      localStorage: createMockStorage(),
      sessionStorage: createMockStorage(),
      navigator: createMockNavigator(),
      window: createMockWindow(),
      document: createMockDocument(),
      performance: createMockPerformance(),
      ...mockAPIs
    };
    
    container.registerBrowserAPIs(apis);
    
    // Register platform services with mocked dependencies
    container.registerPlatformServices();
    
    return container;
  }

  /**
   * Register a service with type-safe key
   * 
   * @template K - Key from the ServiceRegistry type
   * @param {K} key - Service identifier from ServiceRegistry
   * @param {ServiceFactory<ServiceRegistry[K]>} factory - Factory function to create service
   * @throws {ServiceAlreadyRegisteredError} If service is already registered
   * 
   * @example
   * ```typescript
   * container.register('storage', (container) => {
   *   const platform = container.get('platform');
   *   return new StorageService(platform);
   * });
   * ```
   */
  register<K extends keyof ServiceRegistry>(
    key: K,
    factory: ServiceFactory<ServiceRegistry[K]>
  ): void {
    this.registerInternal(key as string, factory);
  }

  /**
   * Register a service with custom key
   */
  registerCustom<T>(key: string, factory: ServiceFactory<T>): void {
    this.registerInternal(key, factory);
  }

  /**
   * Internal registration method
   */
  private registerInternal(key: string, factory: ServiceFactory<any>): void {
    if (this.config.validateKeys && this.factories.has(key)) {
      throw new ServiceAlreadyRegisteredError(key);
    }

    this.config.logger!(`Registering service: ${key}`);
    this.factories.set(key, factory);
    
    // Clear existing instance if re-registering
    if (this.instances.has(key)) {
      this.instances.delete(key);
    }
  }

  /**
   * Resolve a service with type-safe key
   */
  resolve<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K] {
    return this.resolveInternal(key as string);
  }

  /**
   * Resolve a custom service
   */
  resolveCustom<T>(key: string): T {
    return this.resolveInternal(key);
  }

  /**
   * Internal resolution method
   */
  private resolveInternal<T>(key: string): T {
    // Check for circular dependencies
    if (this.resolving.has(key)) {
      const chain = Array.from(this.resolving);
      chain.push(key);
      throw new CircularDependencyError(chain);
    }

    // Return existing instance if using singletons
    if (this.config.useSingletons && this.instances.has(key)) {
      this.config.logger!(`Returning cached instance: ${key}`);
      return this.instances.get(key);
    }

    // Check if factory is registered
    const factory = this.factories.get(key);
    if (!factory) {
      throw new ServiceNotFoundError(key);
    }

    // Mark as resolving for circular dependency detection
    this.resolving.add(key);

    try {
      this.config.logger!(`Creating instance: ${key}`);
      const instance = factory(this);

      // Cache instance if using singletons
      if (this.config.useSingletons) {
        this.instances.set(key, instance);
      }

      return instance;
    } finally {
      // Always remove from resolving set
      this.resolving.delete(key);
    }
  }

  /**
   * Check if service is registered (type-safe)
   */
  has<K extends keyof ServiceRegistry>(key: K): boolean {
    return this.factories.has(key as string);
  }

  /**
   * Check if custom service is registered
   */
  hasCustom(key: string): boolean {
    return this.factories.has(key);
  }

  /**
   * Clear all resolved instances
   */
  clearInstances(): void {
    this.config.logger!('Clearing all service instances');
    this.instances.clear();
    this.resolving.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get container statistics (useful for debugging)
   */
  getStats(): {
    registeredServices: number;
    resolvedInstances: number;
    currentlyResolving: number;
  } {
    return {
      registeredServices: this.factories.size,
      resolvedInstances: this.instances.size,
      currentlyResolving: this.resolving.size
    };
  }

  /**
   * Register browser APIs abstraction
   */
  registerBrowserAPIs(apis: Partial<{
    localStorage: Storage;
    sessionStorage: Storage;
    navigator: Navigator;
    window: Window;
    document: Document;
    performance: Performance;
  }>): void {
    // Register complete browser APIs object
    if (apis.localStorage && apis.navigator && apis.window && apis.document && apis.performance) {
      this.registerCustom('browser.apis', () => ({
        localStorage: apis.localStorage!,
        sessionStorage: apis.sessionStorage || apis.window!.sessionStorage,
        navigator: apis.navigator!,
        window: apis.window!,
        document: apis.document!,
        performance: apis.performance!
      }));
    }

    // Register individual APIs
    if (apis.localStorage) {
      this.registerCustom('browser.localStorage', () => apis.localStorage!);
    }
    if (apis.navigator) {
      this.registerCustom('browser.navigator', () => apis.navigator!);
    }
    if (apis.window) {
      this.registerCustom('browser.window', () => apis.window!);
    }
    if (apis.document) {
      this.registerCustom('browser.document', () => apis.document!);
    }
    if (apis.performance) {
      this.registerCustom('browser.performance', () => apis.performance!);
    }
  }

  /**
   * Register platform services using the existing WebPlatformService
   */
  private registerPlatformServices(): void {
    // For Phase 1, we keep it simple and register a factory that will
    // import WebPlatformService when first accessed
    this.registerCustom('platform.service', () => {
      const { WebPlatformService } = require('../platform/web/WebPlatformService');
      return new WebPlatformService();
    });
    
    // Register individual services that delegate to the main service
    this.register('platform.storage', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.storage;
    });
    
    this.register('platform.notifications', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.notifications;
    });
    
    this.register('platform.device', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.device;
    });
    
    this.register('platform.performance', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.performance;
    });
    
    this.register('platform.clipboard', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.clipboard;
    });
    
    this.register('platform.share', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.share;
    });
    
    this.register('platform.analytics', (container) => {
      const platformService = container.resolveCustom('platform.service') as any;
      return platformService.analytics;
    });
  }

  /**
   * Create a child container with same factories but separate instances
   */
  createChild(config?: Partial<ServiceContainerConfig>): ServiceContainer {
    const child = new ServiceContainer({
      ...this.config,
      ...config
    });

    // Copy all factories to child
    this.factories.forEach((factory, key) => {
      child.factories.set(key, factory);
    });

    return child;
  }
}