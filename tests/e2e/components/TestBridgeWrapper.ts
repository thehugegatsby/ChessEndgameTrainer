/**
 * @fileoverview Test Bridge Wrapper for E2E Tests
 * @description Encapsulates all interactions with the browser-side Test Bridge
 * 
 * Design decisions (Gemini + O3 consensus):
 * - Wrapper pattern for clean separation of concerns
 * - Graceful degradation when bridge not available
 * - Console listener integration for debug logging
 * - Proper lifecycle management with cleanup
 */

import { Page, ConsoleMessage } from '@playwright/test';
import { ILogger, ModernDriverError } from './ModernDriver';
import { ITestBridge, EngineAnalysis } from './ITestBridge';

/**
 * Test Bridge Wrapper - Encapsulates browser-side test bridge interaction
 * 
 * Key features:
 * - Type-safe bridge access
 * - Availability checking with graceful degradation
 * - Console listener for debug logging
 * - Memory leak prevention through proper cleanup
 */
export class TestBridgeWrapper {
  private debugLoggingEnabled = false;
  private consoleHandler?: (msg: ConsoleMessage) => void;
  private isInitialized = false;

  constructor(
    private readonly page: Page,
    private readonly logger?: ILogger
  ) {
    this.setupConsoleListener();
  }

  /**
   * Set up console listener for bridge debug messages
   */
  private setupConsoleListener(): void {
    this.consoleHandler = (msg: ConsoleMessage) => {
      if (this.debugLoggingEnabled && msg.type() === 'debug') {
        const text = msg.text();
        if (text.includes('[TestBridge]') || text.includes('[MockEngine]')) {
          this.logger?.debug(`Bridge: ${text}`);
        }
      }
    };
    this.page.on('console', this.consoleHandler);
  }

  /**
   * Check if Test Bridge is available in the browser context
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await this.page.evaluate(() => {
        return typeof window.__E2E_TEST_BRIDGE__ !== 'undefined';
      });
    } catch {
      return false;
    }
  }

  /**
   * Initialize the bridge and wait for it to be ready
   */
  async initialize(timeout: number = 30000): Promise<void> {
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      this.logger?.debug('Test Bridge not available, skipping initialization');
      return;
    }

    try {
      await this.page.evaluate((timeout) => {
        return window.__E2E_TEST_BRIDGE__?.waitForReady(timeout);
      }, timeout);
      
      this.isInitialized = true;
      this.logger?.debug('Test Bridge initialized successfully');
    } catch (error) {
      this.logger?.error('Bridge initialization failed', error as Error);
      throw new ModernDriverError(
        'Test Bridge failed to initialize',
        'TestBridge.initialize',
        { timeout, error: (error as Error).message }
      );
    }
  }

  /**
   * Enable debug logging for the bridge
   */
  async enableDebugLogging(): Promise<void> {
    this.debugLoggingEnabled = true;
    
    if (await this.isAvailable()) {
      await this.page.evaluate(() => {
        window.__E2E_TEST_BRIDGE__?.enableDebugLogging();
      });
      this.logger?.debug('Test Bridge debug logging enabled');
    }
  }

  /**
   * Disable debug logging for the bridge
   */
  async disableDebugLogging(): Promise<void> {
    this.debugLoggingEnabled = false;
    
    if (await this.isAvailable()) {
      await this.page.evaluate(() => {
        window.__E2E_TEST_BRIDGE__?.disableDebugLogging();
      });
      this.logger?.debug('Test Bridge debug logging disabled');
    }
  }

  /**
   * Add a custom engine response for a specific position
   */
  async addCustomResponse(fen: string, response: { bestMove: string; evaluation: number }): Promise<void> {
    if (!await this.isAvailable()) {
      this.logger?.debug('Test Bridge not available, skipping addCustomResponse');
      return;
    }

    await this.page.evaluate(([fen, response]) => {
      window.__E2E_TEST_BRIDGE__?.engine.addCustomResponse(fen, {
        bestMove: response.bestMove,
        evaluation: response.evaluation,
        depth: 20
      });
    }, [fen, response] as const);
    
    this.logger?.debug('Added custom engine response', { fen, response });
  }

  /**
   * Set the next move for the engine
   */
  async setNextMove(fen: string, move: string): Promise<void> {
    if (!await this.isAvailable()) {
      this.logger?.debug('Test Bridge not available, skipping setNextMove');
      return;
    }

    await this.page.evaluate(([fen, move]) => {
      window.__E2E_TEST_BRIDGE__?.engine.setNextMove(fen, move);
    }, [fen, move] as const);
    
    this.logger?.debug('Set next engine move', { fen, move });
  }

  /**
   * Set engine evaluation for a position
   */
  async setEvaluation(fen: string, evaluation: number): Promise<void> {
    if (!await this.isAvailable()) {
      this.logger?.debug('Test Bridge not available, skipping setEvaluation');
      return;
    }

    await this.page.evaluate(([fen, evaluation]) => {
      window.__E2E_TEST_BRIDGE__?.engine.setEvaluation(fen, evaluation);
    }, [fen, evaluation] as const);
    
    this.logger?.debug('Set engine evaluation', { fen, evaluation });
  }

  /**
   * Clear all custom engine responses
   */
  async clearCustomResponses(): Promise<void> {
    if (!await this.isAvailable()) {
      return;
    }

    await this.page.evaluate(() => {
      window.__E2E_TEST_BRIDGE__?.engine.clearCustomResponses();
    });
    
    this.logger?.debug('Cleared all custom engine responses');
  }

  /**
   * Reset the test bridge to initial state
   */
  async reset(): Promise<void> {
    if (!await this.isAvailable()) {
      return;
    }

    await this.page.evaluate(() => {
      const bridge = window.__E2E_TEST_BRIDGE__;
      if (bridge?.engine) {
        bridge.engine.reset();
        bridge.engine.clearCustomResponses();
      }
    });
    
    this.isInitialized = false;
    this.logger?.debug('Test Bridge reset completed');
  }

  /**
   * Clean up resources and listeners
   */
  dispose(): void {
    if (this.consoleHandler) {
      this.page.off('console', this.consoleHandler);
      this.consoleHandler = undefined;
    }
    this.isInitialized = false;
    this.logger?.debug('Test Bridge wrapper disposed');
  }
}