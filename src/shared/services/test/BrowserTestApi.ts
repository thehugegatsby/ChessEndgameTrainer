/**
 * @file Browser Test API - Exposes test API for E2E tests
 * @version 1.0.0
 * @description Browser-specific implementation that exposes the Test API
 * to the window object for Playwright tests. Works with TestBridge for tablebase control.
 */

import { TestApiService } from "./TestApiService";
import type {
  TestMoveResponse,
  TestGameState,
  TestTablebaseConfig,
} from "./TestApiService";
import type { TestBridge } from "@shared/types/test-bridge";
import type { TablebaseData } from "@shared/types/evaluation";
import { getLogger } from "@shared/services/logging";

/**
 * Browser Test API
 *
 * @class BrowserTestApi
 * @description
 * Exposes test methods to the browser window object for E2E tests.
 * Acts as a bridge between Playwright test scripts and the application's
 * internal test infrastructure, providing a clean API for browser automation.
 *
 * @remarks
 * Key responsibilities:
 * - Window object API exposure for E2E tests
 * - TestApiService integration and lifecycle management
 * - TestBridge coordination for tablebase control
 * - Legacy API compatibility support
 * - Browser environment safety checks
 * - Automatic cleanup on page unload
 *
 * Security features:
 * - Test environment validation
 * - API exposure only in test mode
 * - Safe cleanup on navigation
 *
 * @example
 * ```typescript
 * // Browser usage (exposed to window)
 * const result = await window.__testApi.makeMove('e2-e4');
 * const state = window.__testApi.getGameState();
 *
 * // Legacy compatibility
 * await window.e2e_makeMove('Nf3');
 * const gameState = window.e2e_getGameState();
 * ```
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
   *
   * @description
   * Initializes the browser test API by setting up window object exposure,
   * TestBridge integration, and legacy compatibility methods. Only functions
   * in test environments for security.
   *
   * @param {any} [storeAccess] - Store access object with actions and state
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   *
   * @remarks
   * Initialization process:
   * - Validates test environment (NODE_ENV=test or NEXT_PUBLIC_IS_E2E_TEST=true)
   * - Initializes underlying TestApiService
   * - Connects to TestBridge for tablebase control
   * - Exposes modern API methods to window.__testApi
   * - Sets up legacy compatibility methods (e2e_makeMove, e2e_getGameState)
   * - Registers cleanup handlers for page unload
   *
   * @example
   * ```typescript
   * const browserTestApi = new BrowserTestApi();
   * await browserTestApi.initialize(storeAccess);
   * // Now window.__testApi is available
   * ```
   */
  public initialize(storeAccess?: {
    getState: () => unknown;
    subscribe: (listener: (state: unknown, prevState: unknown) => void) => () => void;
    makeMove: (move: unknown) => void;
    _internalApplyMove: (move: unknown) => void;
    resetPosition: () => void;
    setPosition: (position: unknown) => void;
    goToMove: (moveIndex: number) => void;
    setAnalysisStatus: (status: string) => void;
  }): void {
    if (
      process.env.NODE_ENV !== "test" &&
      process.env['NEXT_PUBLIC_IS_E2E_TEST'] !== "true"
    ) {
      console.warn("Test API is only available in test environment");
      return;
    }

    if (this.initialized) {
      return;
    }

    // Wait for store access to be provided
    if (!storeAccess) {
      console.warn(
        "BrowserTestApi: Store access not provided, delaying initialization",
      );
      return;
    }

    // Initialize test API with store access
    this.testApi.initialize(storeAccess);

    // Get TestBridge from window (set by _app.tsx)
    this.testBridge = (window as unknown as { __E2E_TEST_BRIDGE__?: TestBridge }).__E2E_TEST_BRIDGE__ || null;
    if (!this.testBridge) {
      console.warn(
        "TestBridge not found on window - tablebase control will not be available",
      );
    }

    // Expose methods to window
    (window as unknown as { __testApi: unknown }).__testApi = {
      makeMove: this.makeMove.bind(this),
      makeValidatedMove: this.makeValidatedMove.bind(this),
      getGameState: this.getGameState.bind(this),
      resetGame: this.resetGame.bind(this),
      configureTablebase: this.configureTablebase.bind(this),
      triggerTablebaseAnalysis: this.triggerTablebaseAnalysis.bind(this),
      addMockTablebaseResponse: this.addMockTablebaseResponse.bind(this),
      cleanup: this.cleanup.bind(this),
    };

    // Legacy compatibility - expose old API names
    /**
     *
     * @param move
     */
    (window as unknown as { e2e_makeMove: (move: string) => Promise<unknown> }).e2e_makeMove = async (move: string) => {
      // Use validated move for proper error dialog testing
      const result = await this.makeValidatedMove(move);
      return result;
    };

    /**
     *
     */
    (window as unknown as { e2e_getGameState: () => unknown }).e2e_getGameState = () => {
      return this.getGameState();
    };

    /**
     * Set board position via FEN string
     */
    (window as unknown as { e2e_setBoardState: (fen: string) => unknown }).e2e_setBoardState = (fen: string) => {
      return this.setPosition(fen);
    };

    this.initialized = true;
    getLogger().info("Browser Test API initialized");
    return; // Explicit return for TypeScript
  }

  /**
   * Clean up browser test API
   *
   * @description
   * Removes all test API methods from the window object and cleans up
   * the underlying TestApiService. Should be called when tests are
   * complete or during page navigation to prevent memory leaks.
   *
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   *
   * @remarks
   * Cleanup operations:
   * - Remove __testApi from window object
   * - Remove legacy compatibility methods
   * - Clean up TestApiService instance
   * - Reset initialization state
   *
   * @example
   * ```typescript
   * // Manual cleanup
   * await browserTestApi.cleanup();
   *
   * // Automatic cleanup on page unload (already handled)
   * ```
   */
  public cleanup(): void {
    if (!this.initialized) {
      return;
    }

    // Remove from window
    delete (window as unknown as { __testApi?: unknown }).__testApi;
    delete (window as unknown as { e2e_makeMove?: unknown }).e2e_makeMove;
    delete (window as unknown as { e2e_getGameState?: unknown }).e2e_getGameState;
    delete (window as unknown as { e2e_setBoardState?: unknown }).e2e_setBoardState;

    // Clean up test API
    this.testApi.cleanup();

    this.initialized = false;
  }

  /**
   * Make a move through test API (bypasses validation)
   *
   * @private
   * @description
   * Executes a chess move through the TestApiService. This is a private
   * method that's exposed to the window object during initialization.
   *
   * @param {string} move - Move in algebraic notation or from-to format
   * @returns {Promise<TestMoveResponse>} Promise resolving to move execution result
   */
  private makeMove(move: string): Promise<TestMoveResponse> {
    return this.testApi.makeMove(move);
  }

  /**
   * Make a validated move through test API (full validation pipeline)
   *
   * @private
   * @description
   * Executes a chess move through the full validation pipeline, including
   * error dialogs, tablebase checks, etc. This simulates real user interaction.
   *
   * @param {string} move - Move in algebraic notation or from-to format
   * @returns {Promise<TestMoveResponse>} Promise resolving to move execution result
   */
  private makeValidatedMove(move: string): Promise<TestMoveResponse> {
    return this.testApi.makeValidatedMove(move);
  }

  /**
   * Get game state through test API
   */
  private getGameState(): TestGameState {
    return this.testApi.getGameState();
  }

  /**
   * Set board position via FEN string
   */
  private setPosition(fen: string): boolean {
    return this.testApi.setPosition(fen);
  }

  /**
   * Reset game through test API
   */
  private resetGame(): void {
    this.testApi.resetGame();
  }

  /**
   * Configure tablebase through test API
   * @param config
   */
  private configureTablebase(config: TestTablebaseConfig): void {
    return this.testApi.configureTablebase(config);
  }

  /**
   * Trigger tablebase analysis (instant with mock)
   * @param timeout
   */
  private triggerTablebaseAnalysis(timeout?: number): Promise<boolean> {
    return this.testApi.triggerTablebaseAnalysis(timeout);
  }

  /**
   * Add custom mock tablebase response for testing
   * @param fen
   * @param analysis
   */
  private addMockTablebaseResponse(fen: string, analysis: TablebaseData): void {
    if (!this.testBridge) {
      getLogger().error(
        "TestBridge not available - cannot add mock tablebase response",
      );
      return;
    }

    // Use TestBridge to control the MockScenarioTablebase
    this.testBridge.tablebase.addCustomResponse(fen, analysis);
  }
}

/**
 * Browser test API singleton instance
 *
 * @description
 * Pre-created instance of BrowserTestApi that can be used for manual
 * initialization in test environments. Provides a convenient way to
 * access the browser test API without creating multiple instances.
 *
 * @example
 * ```typescript
 * import { browserTestApi } from '@shared/services/test/BrowserTestApi';
 * await browserTestApi.initialize(storeAccess);
 * ```
 */
export const browserTestApi = new BrowserTestApi();

// Auto-cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    browserTestApi.cleanup();
  });
}
