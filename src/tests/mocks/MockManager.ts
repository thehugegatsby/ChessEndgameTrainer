/**
 * Central Mock Manager
 * 
 * Singleton that manages all mock factories and provides
 * automatic cleanup after each test.
 * 
 * Usage:
 * ```typescript
 * import { mockManager } from '@tests/mocks/MockManager';
 * 
 * beforeEach(() => {
 *   const chessService = mockManager.chessService.create();
 *   const store = mockManager.zustandStore.create();
 * });
 * ```
 */

import { ChessServiceMockFactory } from './ChessServiceMockFactory';
import { ZustandStoreMockFactory } from './ZustandStoreMockFactory';
import { TablebaseServiceMockFactory } from './TablebaseServiceMockFactory';
import { MSWServerMockFactory } from './MSWServerMockFactory';
import { BaseMockFactory } from './BaseMockFactory';

class MockManager {
  // Service mocks
  public readonly chessService = new ChessServiceMockFactory();
  public readonly tablebaseService = new TablebaseServiceMockFactory();
  
  // Store mocks
  public readonly zustandStore = new ZustandStoreMockFactory();
  
  // API mocks (lazy loaded to avoid MSW import issues in Node tests)
  private _mswServer?: any;
  
  // Track all active mocks for cleanup
  private activeMocks = new Set<BaseMockFactory<any>>();
  
  constructor() {
    // Register this instance globally for factories to access
    if (typeof global !== 'undefined') {
      (global as any).__mockManager = this;
    }
  }
  
  /**
   * Get MSW server factory with lazy loading
   */
  public get mswServer() {
    if (!this._mswServer) {
      try {
        const { MSWServerMockFactory } = require('./MSWServerMockFactory');
        this._mswServer = new MSWServerMockFactory();
      } catch (error) {
        console.warn('MSW not available in this environment:', error instanceof Error ? error.message : String(error));
        // Return a mock that does nothing
        this._mswServer = {
          create: () => ({ server: null, addHandler: () => {}, resetHandlers: () => {}, close: () => {} }),
          cleanup: () => {},
          exists: () => false,
        };
      }
    }
    return this._mswServer;
  }

  /**
   * Get all registered mock factories
   */
  private get allFactories(): BaseMockFactory<any>[] {
    return [
      this.chessService,
      this.tablebaseService,
      this.zustandStore,
      ...(this._mswServer ? [this._mswServer] : []),
    ];
  }

  /**
   * Register a mock as active (called automatically by factories)
   */
  public registerActive(factory: BaseMockFactory<any>): void {
    this.activeMocks.add(factory);
  }

  /**
   * Master cleanup function - called after each test
   * Iterates through all registered factories and calls their cleanup methods
   */
  public cleanupAfterEach(): void {
    // Clean up all factories
    for (const factory of this.allFactories) {
      try {
        factory.cleanup();
      } catch (error) {
        console.error(`Error cleaning up ${factory.constructor.name}:`, error);
      }
    }
    
    // Clear active mocks set
    this.activeMocks.clear();
    
    // Additional global cleanup
    this.performGlobalCleanup();
  }

  /**
   * Perform additional global cleanup tasks
   */
  private performGlobalCleanup(): void {
    // IMPORTANT: Do NOT use jest.clearAllMocks() here!
    // It destroys module mock implementations defined at the top of test files.
    // Individual mock factories handle their own cleanup in their cleanup() methods.
    
    // Clear all timers if using fake timers
    if (jest.isMockFunction(setTimeout)) {
      jest.clearAllTimers();
    }
    
    // Clear any pending promises
    if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(() => {});
    }
  }

  /**
   * Reset all factories to initial state
   * More thorough than cleanup - use between test suites
   */
  public resetAll(): void {
    this.cleanupAfterEach();
    
    // Additional reset logic if needed
    this.activeMocks.clear();
  }

  /**
   * Check if any mocks are currently active
   */
  public hasActiveMocks(): boolean {
    return this.activeMocks.size > 0;
  }

  /**
   * Get a list of active mock names (for debugging)
   */
  public getActiveMockNames(): string[] {
    return Array.from(this.activeMocks).map(
      factory => factory.constructor.name
    );
  }

  /**
   * Create all common mocks with defaults
   * Useful for integration tests that need a full environment
   */
  public createFullEnvironment(overrides?: {
    chessService?: Parameters<ChessServiceMockFactory['create']>[0];
    tablebaseService?: Parameters<TablebaseServiceMockFactory['create']>[0];
    zustandStore?: Parameters<ZustandStoreMockFactory['create']>[0];
  }) {
    return {
      chessService: this.chessService.create(overrides?.chessService),
      tablebaseService: this.tablebaseService.create(overrides?.tablebaseService),
      store: this.zustandStore.create(overrides?.zustandStore),
      mswServer: this.mswServer.create(),
    };
  }

  /**
   * Verify all mocks are properly cleaned up
   * Useful for debugging memory leaks
   */
  public verifyCleanup(): void {
    const issues: string[] = [];
    
    for (const factory of this.allFactories) {
      if (factory.exists()) {
        issues.push(`${factory.constructor.name} still has an active instance`);
      }
    }
    
    if (this.activeMocks.size > 0) {
      issues.push(`${this.activeMocks.size} mocks are still marked as active`);
    }
    
    if (issues.length > 0) {
      console.warn('Mock cleanup issues detected:', issues);
    }
  }
}

// Export singleton instance
export const mockManager = new MockManager();

// Type exports for convenience
export type MockedChessService = ReturnType<ChessServiceMockFactory['create']>;
export type MockedTablebaseService = ReturnType<TablebaseServiceMockFactory['create']>;
export type MockedStore = ReturnType<ZustandStoreMockFactory['create']>;
export type MockedMSWServer = ReturnType<MSWServerMockFactory['create']>;