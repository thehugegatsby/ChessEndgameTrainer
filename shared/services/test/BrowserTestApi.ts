/**
 * @fileoverview Browser Test API - Exposes test API for E2E tests
 * @version 1.0.0
 * @description Browser-specific implementation that exposes the Test API
 * to the window object for Playwright tests. Works with TestBridge for engine control.
 */

import { TestApiService } from './TestApiService';
import type { TestMoveResponse, TestGameState, TestEngineConfig } from './TestApiService';
import type { TestBridge } from '@shared/types/test-bridge';

/**
 * Browser Test API
 * Exposes test methods to window object for E2E tests
 */
export class BrowserTestApi {
  private testApi: TestApiService;
  private initialized = false;
  private testBridge: TestBridge | null = null;

  constructor() {
    this.testApi = TestApiService.getInstance();
  }

  /**
   * Initialize browser test API
   * Only works in test environment
   */
  public async initialize(storeAccess?: any): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && process.env.NEXT_PUBLIC_IS_E2E_TEST !== 'true') {
      console.warn('Test API is only available in test environment');
      return;
    }

    if (this.initialized) {
      return;
    }

    // Wait for store access to be provided
    if (!storeAccess) {
      console.warn('BrowserTestApi: Store access not provided, delaying initialization');
      return;
    }

    // Initialize test API with store access
    this.testApi.initialize(storeAccess);

    // Get TestBridge from window (set by _app.tsx)
    this.testBridge = (window as any).__E2E_TEST_BRIDGE__ || null;
    if (!this.testBridge) {
      console.warn('TestBridge not found on window - engine control will not be available');
    }

    // Expose methods to window
    (window as any).__testApi = {
      makeMove: this.makeMove.bind(this),
      getGameState: this.getGameState.bind(this),
      resetGame: this.resetGame.bind(this),
      configureEngine: this.configureEngine.bind(this),
      triggerEngineAnalysis: this.triggerEngineAnalysis.bind(this),
      addMockEngineResponse: this.addMockEngineResponse.bind(this),
      cleanup: this.cleanup.bind(this)
    };

    // Legacy compatibility - expose old API names
    (window as any).e2e_makeMove = async (move: string) => {
      const result = await this.makeMove(move);
      return result;
    };

    (window as any).e2e_getGameState = () => {
      return this.getGameState();
    };

    this.initialized = true;
    console.log('Browser Test API initialized');
  }

  /**
   * Clean up browser test API
   */
  public async cleanup(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Remove from window
    delete (window as any).__testApi;
    delete (window as any).e2e_makeMove;
    delete (window as any).e2e_getGameState;

    // Clean up test API
    this.testApi.cleanup();
    
    this.initialized = false;
  }

  /**
   * Make a move through test API
   */
  private async makeMove(move: string): Promise<TestMoveResponse> {
    return this.testApi.makeMove(move);
  }

  /**
   * Get game state through test API
   */
  private getGameState(): TestGameState {
    return this.testApi.getGameState();
  }

  /**
   * Reset game through test API
   */
  private async resetGame(): Promise<void> {
    return this.testApi.resetGame();
  }

  /**
   * Configure engine through test API
   */
  private configureEngine(config: TestEngineConfig): void {
    return this.testApi.configureEngine(config);
  }

  /**
   * Trigger engine analysis (instant with mock)
   */
  private async triggerEngineAnalysis(timeout?: number): Promise<boolean> {
    return this.testApi.triggerEngineAnalysis(timeout);
  }

  /**
   * Add custom mock engine response for testing
   */
  private addMockEngineResponse(fen: string, analysis: any): void {
    if (!this.testBridge) {
      console.error('TestBridge not available - cannot add mock engine response');
      return;
    }
    
    // Use TestBridge to control the MockScenarioEngine
    this.testBridge.engine.addCustomResponse(fen, analysis);
  }
}

// Export browser test API instance for manual initialization
export const browserTestApi = new BrowserTestApi();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    browserTestApi.cleanup();
  });
}