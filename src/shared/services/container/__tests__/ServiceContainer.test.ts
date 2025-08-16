import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultServiceContainer } from '../ServiceContainer';
import {
  ServiceNotFoundError,
  ServiceAlreadyRegisteredError,
  CircularDependencyError,
  type ServiceContainer,
} from '../types';

// Mock the heavy WebPlatformService to isolate the container logic.
// This is critical for ensuring these are unit tests of the container itself.
const mockPlatformServiceInstance = {
  storage: { get: vi.fn(), set: vi.fn() },
  notifications: { notify: vi.fn() },
  device: { getDeviceInfo: vi.fn() },
  performance: { startTrace: vi.fn() },
  clipboard: { copy: vi.fn() },
  share: { share: vi.fn() },
  analytics: { track: vi.fn() },
};

vi.mock('../../platform/web/WebPlatformService', () => ({
  WebPlatformService: vi.fn().mockImplementation(() => mockPlatformServiceInstance),
}));

describe('DefaultServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new DefaultServiceContainer();
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks();
  });

  describe('Core DI Logic', () => {
    it('should register and resolve a simple service', () => {
      // Arrange
      const myServiceFactory = vi.fn(() => ({ id: 'test-service' }));
      container.registerCustom('myService', myServiceFactory);

      // Act
      const resolvedService = container.resolveCustom<{ id: string }>('myService');

      // Assert
      expect(resolvedService).toEqual({ id: 'test-service' });
      expect(myServiceFactory).toHaveBeenCalledTimes(1);
      expect(myServiceFactory).toHaveBeenCalledWith(container);
    });

    it('should return true from has() for a registered service', () => {
      // Arrange
      container.registerCustom('existingService', () => 'exists');

      // Act & Assert
      expect(container.hasCustom('existingService')).toBe(true);
    });

    it('should return false from has() for an unregistered service', () => {
      // Act & Assert
      expect(container.hasCustom('nonExistentService')).toBe(false);
    });

    it('should resolve dependencies within a factory', () => {
      // Arrange
      container.registerCustom('dependency', () => 'dependency-data');
      container.registerCustom('service', c => {
        const dep = c.resolveCustom<string>('dependency');
        return `service-with-${dep}`;
      });

      // Act
      const result = container.resolveCustom<string>('service');

      // Assert
      expect(result).toBe('service-with-dependency-data');
    });

    it('should work with type-safe registry services', () => {
      // Arrange - Using the type-safe register method
      const mockStorage = { get: vi.fn(), set: vi.fn() };
      container.register('platform.storage', () => mockStorage);

      // Act
      const storage = container.resolve('platform.storage');

      // Assert
      expect(storage).toBe(mockStorage);
      expect(container.has('platform.storage')).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should cache instances and act as a singleton by default', () => {
      // Arrange
      const factory = vi.fn(() => ({}));
      container.registerCustom('singletonService', factory);

      // Act
      const instance1 = container.resolveCustom('singletonService');
      const instance2 = container.resolveCustom('singletonService');

      // Assert
      expect(instance1).toBe(instance2);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should create new instances when useSingletons is false', () => {
      // Arrange
      const factoryContainer = new DefaultServiceContainer({ useSingletons: false });
      const factory = vi.fn(() => ({}));
      factoryContainer.registerCustom('factoryService', factory);

      // Act
      const instance1 = factoryContainer.resolveCustom('factoryService');
      const instance2 = factoryContainer.resolveCustom('factoryService');

      // Assert
      expect(instance1).not.toBe(instance2);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should call a provided logger function during operations', () => {
      // Arrange
      const logger = vi.fn();
      const loggingContainer = new DefaultServiceContainer({ logger });

      // Act
      loggingContainer.registerCustom('logService', () => 'logged');
      loggingContainer.resolveCustom('logService');
      loggingContainer.resolveCustom('logService'); // Should log a cache hit
      loggingContainer.clearInstances();

      // Assert
      expect(logger).toHaveBeenCalledWith('Registering service: logService');
      expect(logger).toHaveBeenCalledWith('Creating instance: logService');
      expect(logger).toHaveBeenCalledWith('Returning cached instance: logService');
      expect(logger).toHaveBeenCalledWith('Clearing all service instances');
    });

    it('should use default configuration when none provided', () => {
      // Arrange & Act
      const defaultContainer = new DefaultServiceContainer();
      const factory = vi.fn(() => 'test');
      
      // Test singleton behavior (default)
      defaultContainer.registerCustom('test', factory);
      const instance1 = defaultContainer.resolveCustom('test');
      const instance2 = defaultContainer.resolveCustom('test');

      // Assert
      expect(instance1).toBe(instance2);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw ServiceNotFoundError when resolving an unregistered service', () => {
      // Arrange, Act & Assert
      const action = () => container.resolveCustom('unregistered');
      expect(action).toThrow(ServiceNotFoundError);
      expect(action).toThrow('Service not found for key: unregistered');
    });

    it('should throw ServiceAlreadyRegisteredError on duplicate registration by default', () => {
      // Arrange
      container.registerCustom('duplicate', () => 'first');
      const action = () => container.registerCustom('duplicate', () => 'second');

      // Act & Assert
      expect(action).toThrow(ServiceAlreadyRegisteredError);
      expect(action).toThrow('Service already registered for key: duplicate');
    });

    it('should allow re-registering when validateKeys is false', () => {
      // Arrange
      const permissiveContainer = new DefaultServiceContainer({ validateKeys: false });
      permissiveContainer.registerCustom('re-register', () => 'first');
      const firstInstance = permissiveContainer.resolveCustom('re-register');

      // Act
      permissiveContainer.registerCustom('re-register', () => 'second');
      const secondInstance = permissiveContainer.resolveCustom('re-register');

      // Assert
      expect(firstInstance).toBe('first');
      expect(secondInstance).toBe('second');
    });

    it('should throw CircularDependencyError for direct dependencies (A -> A)', () => {
      // Arrange
      container.registerCustom('circularA', c => c.resolveCustom('circularA'));

      // Act & Assert
      const action = () => container.resolveCustom('circularA');
      expect(action).toThrow(CircularDependencyError);
      expect(action).toThrow('Circular dependency detected: circularA -> circularA');
    });

    it('should throw CircularDependencyError for indirect dependencies (A -> B -> C -> A)', () => {
      // Arrange
      container.registerCustom('circularA', c => c.resolveCustom('circularB'));
      container.registerCustom('circularB', c => c.resolveCustom('circularC'));
      container.registerCustom('circularC', c => c.resolveCustom('circularA'));

      // Act & Assert
      const action = () => container.resolveCustom('circularA');
      expect(action).toThrow(CircularDependencyError);
      expect(action).toThrow('Circular dependency detected: circularA -> circularB -> circularC -> circularA');
    });

    it('should propagate errors from a factory and clean up its resolving state', () => {
      // Arrange
      const factoryError = new Error('Factory failed');
      container.registerCustom('failingService', () => {
        throw factoryError;
      });

      // Act & Assert
      expect(() => container.resolveCustom('failingService')).toThrow(factoryError);

      // The container should not be in a broken state. We can check this by
      // trying to resolve another service or the same one again.
      const stats = (container as DefaultServiceContainer).getStats();
      expect(stats.currentlyResolving).toBe(0);

      // It should fail again, not with a circular dependency error
      expect(() => container.resolveCustom('failingService')).toThrow(factoryError);
    });

    it('should handle nested dependency resolution errors properly', () => {
      // Arrange
      const nestedError = new Error('Nested dependency failed');
      container.registerCustom('dependency', () => {
        throw nestedError;
      });
      container.registerCustom('service', c => {
        return c.resolveCustom('dependency');
      });

      // Act & Assert
      expect(() => container.resolveCustom('service')).toThrow(nestedError);
      
      // Verify container state is clean
      const stats = (container as DefaultServiceContainer).getStats();
      expect(stats.currentlyResolving).toBe(0);
    });
  });

  describe('Instance Management', () => {
    it('should clear all cached instances when clearInstances() is called', () => {
      // Arrange
      const factory = vi.fn(() => ({}));
      container.registerCustom('serviceToClear', factory);
      container.resolveCustom('serviceToClear'); // Resolve to cache it

      // Act
      container.clearInstances();
      const newInstance = container.resolveCustom('serviceToClear');

      // Assert
      expect(factory).toHaveBeenCalledTimes(2);
      const stats = (container as DefaultServiceContainer).getStats();
      expect(stats.resolvedInstances).toBe(1);
    });

    it('should clear existing instance when re-registering a service', () => {
      // Arrange
      const permissiveContainer = new DefaultServiceContainer({ validateKeys: false });
      const factory1 = vi.fn(() => 'first');
      const factory2 = vi.fn(() => 'second');
      
      permissiveContainer.registerCustom('service', factory1);
      const instance1 = permissiveContainer.resolveCustom('service');

      // Act
      permissiveContainer.registerCustom('service', factory2);
      const instance2 = permissiveContainer.resolveCustom('service');

      // Assert
      expect(instance1).toBe('first');
      expect(instance2).toBe('second');
      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Child Containers', () => {
    it('should create a child container that inherits factories', () => {
      // Arrange
      container.registerCustom('parentService', () => 'from-parent');
      const child = (container as DefaultServiceContainer).createChild();

      // Act & Assert
      expect(child.hasCustom('parentService')).toBe(true);
      expect(child.resolveCustom('parentService')).toBe('from-parent');
    });

    it('should maintain separate instance scopes for parent and child', () => {
      // Arrange
      const factory = vi.fn(() => ({}));
      container.registerCustom('scopedService', factory);
      const child = (container as DefaultServiceContainer).createChild();

      // Act
      const parentInstance = container.resolveCustom('scopedService');
      const childInstance = child.resolveCustom('scopedService');

      // Assert
      expect(parentInstance).not.toBe(childInstance);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should not affect the parent when a service is registered in the child', () => {
      // Arrange
      const child = (container as DefaultServiceContainer).createChild();

      // Act
      child.registerCustom('childOnlyService', () => 'child-only');

      // Assert
      expect(child.hasCustom('childOnlyService')).toBe(true);
      expect(container.hasCustom('childOnlyService')).toBe(false);
    });

    it('should inherit parent configuration but allow overrides', () => {
      // Arrange
      const logger = vi.fn();
      const parentContainer = new DefaultServiceContainer({ 
        useSingletons: true, 
        validateKeys: true, 
        logger 
      });
      
      // Act
      const child = (parentContainer as DefaultServiceContainer).createChild({ 
        useSingletons: false 
      });

      // Test that child inherited some config but overrode useSingletons
      const factory = vi.fn(() => ({}));
      child.registerCustom('testService', factory);
      
      const instance1 = child.resolveCustom('testService');
      const instance2 = child.resolveCustom('testService');

      // Assert
      expect(instance1).not.toBe(instance2); // useSingletons: false
      expect(factory).toHaveBeenCalledTimes(2);
      expect(logger).toHaveBeenCalled(); // Inherited logger
    });
  });

  describe('Browser API Registration', () => {
    it('should register individual browser APIs', () => {
      // Arrange
      const mockLocalStorage = { getItem: vi.fn(), setItem: vi.fn() } as any;
      const mockNavigator = { userAgent: 'test-agent' } as any;
      
      // Act
      (container as DefaultServiceContainer).registerBrowserAPIs({
        localStorage: mockLocalStorage,
        navigator: mockNavigator,
      });

      // Assert
      expect(container.hasCustom('browser.localStorage')).toBe(true);
      expect(container.hasCustom('browser.navigator')).toBe(true);
      expect(container.resolveCustom('browser.localStorage')).toBe(mockLocalStorage);
      expect(container.resolveCustom('browser.navigator')).toBe(mockNavigator);
    });

    it('should register complete browser APIs object when all APIs provided', () => {
      // Arrange
      const mockAPIs = {
        localStorage: { getItem: vi.fn() } as any,
        sessionStorage: { getItem: vi.fn() } as any,
        navigator: { userAgent: 'test' } as any,
        window: { location: {} } as any,
        document: { createElement: vi.fn() } as any,
        performance: { now: vi.fn() } as any,
      };

      // Act
      (container as DefaultServiceContainer).registerBrowserAPIs(mockAPIs);

      // Assert
      expect(container.hasCustom('browser.apis')).toBe(true);
      const apis = container.resolveCustom<any>('browser.apis');
      expect(apis.localStorage).toBe(mockAPIs.localStorage);
      expect(apis.navigator).toBe(mockAPIs.navigator);
    });
  });

  describe('Static Initializers and Platform Services', () => {
    it('createTestContainer should register mock browser APIs', () => {
      // Arrange
      const testContainer = DefaultServiceContainer.createTestContainer();

      // Act & Assert
      expect(testContainer.hasCustom('browser.apis')).toBe(true);
      expect(testContainer.hasCustom('browser.localStorage')).toBe(true);
      expect(testContainer.hasCustom('browser.navigator')).toBe(true);
      const apis = testContainer.resolveCustom<any>('browser.apis');
      expect(apis.localStorage.setItem).toBeDefined();
    });

    it('createTestContainer should accept custom mock APIs', () => {
      // Arrange
      const customStorage = { getItem: vi.fn(), setItem: vi.fn() } as any;
      const testContainer = DefaultServiceContainer.createTestContainer({
        localStorage: customStorage,
      });

      // Act
      const localStorage = testContainer.resolveCustom<any>('browser.localStorage');

      // Assert
      expect(localStorage).toBe(customStorage);
    });

    it('createProductionContainer should register platform services when window exists', () => {
      // Arrange
      const originalWindow = globalThis.window;
      globalThis.window = {
        localStorage: { getItem: vi.fn() } as any,
        sessionStorage: { getItem: vi.fn() } as any,
        navigator: { userAgent: 'test' } as any,
        document: { createElement: vi.fn() } as any,
        performance: { now: vi.fn() } as any,
      } as any;

      try {
        // Act
        const prodContainer = DefaultServiceContainer.createProductionContainer();

        // Assert
        expect(prodContainer.hasCustom('browser.localStorage')).toBe(true);
        expect(prodContainer.has('platform.storage')).toBe(true);
      } finally {
        // Cleanup
        globalThis.window = originalWindow;
      }
    });

    it('registerPlatformServices should register platform service factories', () => {
      // Arrange
      const testContainer = new DefaultServiceContainer();
      // Manually call the private method for this unit test
      (testContainer as any).registerPlatformServices();

      // Act & Assert - Just verify the factories are registered without resolving
      expect(testContainer.has('platform.storage')).toBe(true);
      expect(testContainer.has('platform.notifications')).toBe(true);
      expect(testContainer.has('platform.device')).toBe(true);
      expect(testContainer.has('platform.performance')).toBe(true);
      expect(testContainer.has('platform.clipboard')).toBe(true);
      expect(testContainer.has('platform.share')).toBe(true);
      expect(testContainer.has('platform.analytics')).toBe(true);
      expect(testContainer.hasCustom('platform.service')).toBe(true);
    });
  });

  describe('Utilities', () => {
    it('getStats should return correct statistics', () => {
      // Arrange
      container.registerCustom('service1', () => 'one');
      container.registerCustom('service2', () => 'two');
      container.resolveCustom('service1');

      // Act
      const stats = (container as DefaultServiceContainer).getStats();

      // Assert
      expect(stats).toEqual({
        registeredServices: 2,
        resolvedInstances: 1,
        currentlyResolving: 0,
      });
    });

    it('getRegisteredKeys should return all registered service keys', () => {
      // Arrange
      container.registerCustom('serviceA', () => 'A');
      container.registerCustom('serviceB', () => 'B');

      // Act
      const keys = container.getRegisteredKeys();

      // Assert
      expect(keys).toHaveLength(2);
      expect(keys).toContain('serviceA');
      expect(keys).toContain('serviceB');
    });

    it('should handle empty container statistics correctly', () => {
      // Act
      const stats = (container as DefaultServiceContainer).getStats();

      // Assert
      expect(stats).toEqual({
        registeredServices: 0,
        resolvedInstances: 0,
        currentlyResolving: 0,
      });
    });

    it('should return empty array for getRegisteredKeys on empty container', () => {
      // Act
      const keys = container.getRegisteredKeys();

      // Assert
      expect(keys).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle factory returning null or undefined', () => {
      // Arrange
      container.registerCustom('nullService', () => null);
      container.registerCustom('undefinedService', () => undefined);

      // Act & Assert
      expect(container.resolveCustom('nullService')).toBeNull();
      expect(container.resolveCustom('undefinedService')).toBeUndefined();
    });

    it('should handle complex dependency chains', () => {
      // Arrange
      container.registerCustom('level1', () => 'base');
      container.registerCustom('level2', c => `${c.resolveCustom('level1')}-level2`);
      container.registerCustom('level3', c => `${c.resolveCustom('level2')}-level3`);
      container.registerCustom('level4', c => `${c.resolveCustom('level3')}-level4`);

      // Act
      const result = container.resolveCustom<string>('level4');

      // Assert
      expect(result).toBe('base-level2-level3-level4');
    });

    it('should maintain correct resolving state during concurrent resolutions', () => {
      // Arrange
      const resolutionOrder: string[] = [];
      container.registerCustom('serviceA', c => {
        resolutionOrder.push('A-start');
        const b = c.resolveCustom('serviceB');
        resolutionOrder.push('A-end');
        return `A-${b}`;
      });
      
      container.registerCustom('serviceB', c => {
        resolutionOrder.push('B-start');
        const c_result = c.resolveCustom('serviceC');
        resolutionOrder.push('B-end');
        return `B-${c_result}`;
      });
      
      container.registerCustom('serviceC', () => {
        resolutionOrder.push('C');
        return 'C';
      });

      // Act
      const result = container.resolveCustom<string>('serviceA');

      // Assert
      expect(result).toBe('A-B-C');
      expect(resolutionOrder).toEqual(['A-start', 'B-start', 'C', 'B-end', 'A-end']);
      
      // Verify clean state
      const stats = (container as DefaultServiceContainer).getStats();
      expect(stats.currentlyResolving).toBe(0);
    });
  });
});