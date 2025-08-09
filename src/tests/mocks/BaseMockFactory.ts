/**
 * Base Mock Factory Class
 * 
 * Provides a consistent pattern for creating and managing test mocks.
 * Ensures proper cleanup and type safety across all test suites.
 * 
 * @template T - The type/interface of the service being mocked
 * @template C - The type for creation-time overrides (defaults to Partial<jest.Mocked<T>>)
 */

import { jest } from '@jest/globals';

export abstract class BaseMockFactory<T extends object, C = Partial<jest.Mocked<T>>> {
  protected mockInstance: jest.Mocked<T> | null = null;
  private cleanupCallbacks: Array<() => void> = [];

  /**
   * Creates a new mock instance for a test.
   * Ensures clean state by disposing any existing instance first.
   * 
   * @param overrides - Optional overrides for the default mock behavior
   * @returns A fresh mock instance with type safety
   */
  public create(overrides?: C): jest.Mocked<T> {
    // Ensure we don't accidentally reuse a mock across tests
    if (this.mockInstance) {
      this.cleanup();
    }

    const defaultMock = this._createDefaultMock();
    
    // Deep merge overrides onto the default mock
    const finalMock = this._mergeOverrides(defaultMock, overrides);
    
    this.mockInstance = finalMock as jest.Mocked<T>;
    this._afterCreate(this.mockInstance);
    
    return this.mockInstance;
  }

  /**
   * Returns the current mock instance.
   * Throws if create() has not been called for the current test.
   */
  public get(): jest.Mocked<T> {
    if (!this.mockInstance) {
      throw new Error(
        `[MockFactory] Mock for ${this.constructor.name} has not been created. ` +
        `Call create() in a beforeEach block.`
      );
    }
    return this.mockInstance;
  }

  /**
   * Checks if a mock instance exists
   */
  public exists(): boolean {
    return this.mockInstance !== null;
  }

  /**
   * Cleans up the mock instance and any associated resources.
   * Called automatically by the MockManager after each test.
   */
  public cleanup(): void {
    // Run any registered cleanup callbacks
    this.cleanupCallbacks.forEach(callback => callback());
    this.cleanupCallbacks = [];
    
    if (this.mockInstance) {
      // Reset all mock function calls and implementations
      jest.clearAllMocks();
      
      // Call service-specific cleanup if needed
      this._beforeCleanup(this.mockInstance);
    }
    
    this.mockInstance = null;
  }

  /**
   * Register a cleanup callback to be run during cleanup
   */
  protected registerCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Merges overrides with the default mock.
   * Can be overridden for custom merge strategies.
   */
  protected _mergeOverrides(defaultMock: jest.Mocked<T>, overrides?: C): jest.Mocked<T> {
    if (!overrides) return defaultMock;
    
    // Deep merge for nested objects
    return this._deepMerge(defaultMock, overrides as any) as jest.Mocked<T>;
  }

  /**
   * Deep merge utility for nested mock objects
   */
  private _deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !jest.isMockFunction(source[key])) {
        if (target[key] && typeof target[key] === 'object') {
          result[key] = this._deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Hook called after creating a mock instance.
   * Override to add custom initialization logic.
   */
  protected _afterCreate(instance: jest.Mocked<T>): void {
    // Default: no-op
  }

  /**
   * Hook called before cleaning up a mock instance.
   * Override to add custom cleanup logic.
   */
  protected _beforeCleanup(instance: jest.Mocked<T>): void {
    // Default: no-op
  }

  /**
   * Each concrete factory MUST implement this to provide
   * a default version of the mock with all methods stubbed.
   */
  protected abstract _createDefaultMock(): jest.Mocked<T>;
}