/**
 * @fileoverview AppDriver - DEPRECATED - Use ModernDriver instead!
 * @deprecated AppDriver is deprecated in favor of ModernDriver (~300 lines)
 * 
 * ⚠️ WICHTIG: DIESER DRIVER IST VERALTET! ⚠️
 * 
 * MIGRATION GUIDE:
 * - Replace: import { AppDriver } from './AppDriver'
 * - With:    import { ModernDriver } from './ModernDriver'
 * 
 * WHY MODERNDRIVER?
 * - 300 lines vs 1847 lines (6x smaller)
 * - Cleaner architecture with proper separation of concerns
 * - Built-in Test Bridge support for deterministic testing
 * - Better error handling with custom error types
 * - Follows the optimal solution principle (sauberste, langfristig beste Lösung)
 * 
 * EXAMPLE MIGRATION:
 * ```typescript
 * // OLD (AppDriver)
 * const appDriver = new AppDriver(page);
 * await appDriver.waitForPageReady();
 * await appDriver.makeMove('e2', 'e4');
 * 
 * // NEW (ModernDriver)
 * const driver = new ModernDriver(page, { useTestBridge: true });
 * await driver.visit('/train/1');
 * await driver.makeMove('e2', 'e4');
 * ```
 * 
 * DEPRECATION TIMELINE:
 * - 2025-01-10: ModernDriver introduced
 * - 2025-01-17: All new tests must use ModernDriver
 * - 2025-01-31: AppDriver will be removed
 * 
 * Original description (kept for historical context):
 * Provides a unified, high-level interface for E2E tests
 * Implements Facade pattern with lazy loading, DI, and fluent interface
 * 
 * Architecture Decision Records:
 * - ADR-1: Dependency Injection for Page object (testability, isolation)
 * - ADR-2: Lazy Loading via Getter with Memoization (performance)
 * - ADR-3: Fluent Interface for method chaining (readability)
 * - ADR-4: Per-Test Isolation, no global singleton (parallel execution)
 * - ADR-5: Test Bridge Integration for mock configuration
 * - ADR-6: Hybrid Refactoring Approach (2025-01-10)
 *   
 * REFACTORING ROADMAP (AI Consensus: Gemini 2.5 Pro + O3-Mini):
 * 
 * Current State: AppDriver has grown to 1650+ lines, violating single responsibility.
 * Target State: ~500 lines pure orchestration, all logic in helper classes.
 * 
 * Phase 1 (Immediate): Fix API inconsistencies for test stability
 * - Add missing methods (getMoveCount, etc.)
 * - Fix case sensitivity issues
 * - Get smoke tests passing
 * 
 * Phase 2 (Week 1-2): Add interface contracts
 * - Define IChessComponent, IBoardComponent, etc.
 * - Enforce API consistency at compile time
 * - Document expected behaviors
 * 
 * Phase 3 (Week 2-4): Refactor to helper classes
 * - Move game logic → GamePlayer
 * - Move puzzle logic → PuzzleSolver 
 * - Move analysis logic → EngineAnalyzer
 * - AppDriver only orchestrates, no business logic
 * 
 * Quality Gates:
 * - No method > 50 lines
 * - All components implement interfaces
 * - Zero code duplication with helpers
 * - AppDriver purely orchestrates
 * 
 * MOVE PANEL REFACTORING DEPENDENCY MAP (TECH-001):
 * 
 * Methods to extract to MovePanelPOM:
 * 1. Component Getters (move to private in POM):
 *    - moveList getter → private
 *    - navigationControls getter → private
 * 
 * 2. Navigation Methods (public in POM):
 *    - gotoMove(moveNumber) → delegates to POM
 *    - setMoveIndexViaBridge(index) → private in POM
 * 
 * 3. State Query Methods (via POM):
 *    - Calls to moveList.getMoves()
 *    - Calls to moveList.getMoveCount() 
 *    - Calls to navigationControls.getCurrentMoveIndex()
 *    - Calls to navigationControls.getTotalMoves()
 *    - Calls to navigationControls.getNavigationState()
 * 
 * 4. Navigation Actions (via POM):
 *    - Calls to navigationControls.goToStart()
 *    - Calls to navigationControls.goToEnd()
 *    - Calls to navigationControls.goBack()
 *    - Calls to navigationControls.goForward()
 *    - Calls to moveList.clickMove()
 * 
 * 5. Synchronization (stays in AppDriver or moves to POM?):
 *    - awaitUIUpdate() - uses moveList.waitForMoveCount()
 * 
 * 6. Partial Dependencies:
 *    - getFullGameState() - partially uses move panel data
 *    - setupGame() - calls goToStart()
 *    - resetState() - calls goToStart()
 * 
 * Dependencies Count:
 * - moveList: 6 direct method calls
 * - navigationControls: 11 direct method calls
 * 
 * Migration Strategy:
 * 1. Create MovePanelPOM with all methods
 * 2. Add movePanel property to AppDriver
 * 3. Delegate all calls through movePanel
 * 4. Update all test files to use new API
 */

import { Page, expect } from '@playwright/test';
import { BoardComponent } from './BoardComponent';
import { MoveListComponent } from './MoveListComponent';
import { EvaluationPanel } from './EvaluationPanel';
import { NavigationControls } from './NavigationControls';
import { MovePanelPOM } from './MovePanelPOM';
import { 
  GameStateBuilder,
  PositionBuilder,
  TrainingSessionBuilder,
  aGameState,
  aPosition,
  aTrainingSession
} from '../builders';
import { ValidationHelper } from '../helpers/ValidationHelper';
import { 
  TIMEOUTS, 
  ERROR_MESSAGES, 
  LOG_CONTEXTS,
  TEST_BRIDGE 
} from '../config/constants';
import { getLogger } from '../../../shared/services/logging/Logger';
import { ILogger } from '../../../shared/services/logging/types';
import { IGamePlayer } from '../helpers/IGamePlayer';
import { IPuzzleSolver } from '../helpers/IPuzzleSolver';
import { IEngineAnalyzer } from '../helpers/IEngineAnalyzer';
import { GamePlayer } from '../helpers/GamePlayer';
import { PuzzleSolver } from '../helpers/PuzzleSolver';
import { EngineAnalyzer } from '../helpers/EngineAnalyzer';
import { DriverDependencies } from '../interfaces/driver-dependencies';
import { Chess } from 'chess.js';
import { SequenceError } from '../helpers/types';

/**
 * Configuration options for AppDriver
 */
export interface AppDriverConfig {
  /** Base URL for the application */
  baseUrl?: string;
  /** Custom timeouts configuration */
  timeouts?: Partial<typeof TIMEOUTS>;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Auto-wait for engine after moves */
  autoWaitForEngine?: boolean;
  /** Auto-setup test bridge on initialization */
  autoSetupTestBridge?: boolean;
  /** Custom retry configuration for transient failures */
  retryConfig?: Partial<RetryConfig>;
}

/**
 * Complete game state representation
 * Aggregates state from all components for comprehensive assertions
 */
export interface GameState {
  /** Current FEN position */
  fen: string;
  /** All moves in the game */
  moves: string[];
  /** Current move index */
  currentMoveIndex: number;
  /** Total number of moves */
  totalMoves: number;
  /** Alias for totalMoves for backward compatibility */
  moveCount: number;
  /** Last move made */
  lastMove?: string;
  /** Engine evaluation */
  evaluation: number | null;
  /** Best move suggested by engine */
  bestMove: string | null;
  /** Search depth */
  depth: number | null;
  /** Is engine currently thinking */
  isEngineThinking: boolean;
  /** Navigation state */
  navigation: {
    isAtStart: boolean;
    isAtEnd: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
  };
  /** Game over state */
  isCheckmate?: boolean;
  gameOverReason?: string;
}

/**
 * Custom error classes for better error handling
 */
export class AppDriverError extends Error {
  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = 'AppDriverError';
  }
}

export class ComponentInitializationError extends AppDriverError {
  constructor(componentName: string, originalError: Error) {
    super(`Failed to initialize ${componentName}`, { componentName, originalError });
    this.name = 'ComponentInitializationError';
  }
}

export class NavigationError extends AppDriverError {
  constructor(message: string, context?: any) {
    super(message, context);
    this.name = 'NavigationError';
  }
}

export class SynchronizationError extends AppDriverError {
  constructor(message: string, timeout: number, context?: any) {
    super(`${message} (timeout: ${timeout}ms)`, { ...context, timeout });
    this.name = 'SynchronizationError';
  }
}

/**
 * Retry configuration for transient failures
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Component lifecycle interface for proper cleanup
 */
export interface DisposableComponent {
  dispose?(): Promise<void>;
}

// SequenceError is imported from helpers/types for consistency

/**
 * AppDriver - Central orchestrator for all E2E test components
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const driver = new AppDriver(page);
 * await driver.visit();
 * await driver.setupGame('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
 * await driver.makeMoveAndAwaitUpdate('e5', 'e6');
 * 
 * // Fluent interface
 * await driver
 *   .visit()
 *   .setupGame()
 *   .makeMoveAndAwaitUpdate('e2', 'e4')
 *   .makeMoveAndAwaitUpdate('e7', 'e5')
 *   .gotoMove(0);
 * 
 * // Direct component access when needed
 * const evaluation = await driver.evaluationPanel.getEvaluation();
 * const moves = await driver.moveList.getMoves();
 * ```
 */
export class AppDriver {
  private readonly logger: ILogger;
  private readonly config: Required<AppDriverConfig>;
  
  // Lazy-loaded components (memoization pattern)
  private _boardComponent: BoardComponent | null = null;
  private _moveListComponent: MoveListComponent | null = null;
  private _evaluationPanel: EvaluationPanel | null = null;
  private _navigationControls: NavigationControls | null = null;
  private _movePanel: MovePanelPOM | null = null;
  
  // Helper classes for clean separation of concerns
  private _gamePlayer: IGamePlayer | null = null;
  private _puzzleSolver: IPuzzleSolver | null = null;
  private _engineAnalyzer: IEngineAnalyzer | null = null;
  
  // Shared chess instance for consistency
  private _chess: Chess | null = null;
  
  // State tracking
  private _isInitialized = false;
  private _lastActionTime = 0;
  private _disposed = false;
  
  // Error collection for stopOnError: false scenarios
  private _sequenceErrors: SequenceError[] = [];
  
  // Retry configuration (can be overridden via config)
  private readonly retryConfig: RetryConfig;

  /**
   * Create a new AppDriver instance
   * @param page - Playwright Page object (Dependency Injection)
   * @param config - Optional configuration
   */
  constructor(
    private readonly page: Page,
    config: AppDriverConfig = {}
  ) {
    this.config = {
      baseUrl: config.baseUrl || 'http://127.0.0.1:3002',
      timeouts: { ...TIMEOUTS, ...(config.timeouts || {}) },
      verbose: config.verbose ?? false,
      autoWaitForEngine: config.autoWaitForEngine ?? true,
      autoSetupTestBridge: config.autoSetupTestBridge ?? true,
      retryConfig: config.retryConfig || {}
    };
    
    // Initialize retry configuration with defaults and overrides
    this.retryConfig = {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 2000,
      backoffFactor: 2,
      ...config.retryConfig
    };
    
    this.logger = getLogger();
    this.logger.setContext(LOG_CONTEXTS.APP_DRIVER || 'AppDriver');
  }

  /**
   * Lazy-loaded BoardComponent with memoization
   */
  public get board(): BoardComponent {
    if (!this._boardComponent) {
      try {
        this._boardComponent = new BoardComponent(this.page);
        this.log('info', 'BoardComponent initialized');
      } catch (error) {
        throw new ComponentInitializationError('BoardComponent', error as Error);
      }
    }
    return this._boardComponent;
  }

  /**
   * Lazy-loaded MoveListComponent with memoization
   * @refactor-to-MovePanelPOM - Move list component access
   */
  public get moveList(): MoveListComponent {
    if (!this._moveListComponent) {
      try {
        this._moveListComponent = new MoveListComponent(this.page);
        this.log('info', 'MoveListComponent initialized');
      } catch (error) {
        throw new ComponentInitializationError('MoveListComponent', error as Error);
      }
    }
    return this._moveListComponent;
  }

  /**
   * Lazy-loaded EvaluationPanel with memoization
   */
  public get evaluationPanel(): EvaluationPanel {
    if (!this._evaluationPanel) {
      try {
        this._evaluationPanel = new EvaluationPanel(this.page);
        this.log('info', 'EvaluationPanel initialized');
      } catch (error) {
        throw new ComponentInitializationError('EvaluationPanel', error as Error);
      }
    }
    return this._evaluationPanel;
  }

  /**
   * Lazy-loaded NavigationControls with memoization
   * @refactor-to-MovePanelPOM - Navigation controls component access
   */
  public get navigationControls(): NavigationControls {
    if (!this._navigationControls) {
      try {
        this._navigationControls = new NavigationControls(this.page);
        this.log('info', 'NavigationControls initialized');
      } catch (error) {
        throw new ComponentInitializationError('NavigationControls', error as Error);
      }
    }
    return this._navigationControls;
  }

  /**
   * Lazy-loaded MovePanelPOM with memoization
   * @refactor-to-MovePanelPOM - New consolidated component
   */
  public get movePanel(): MovePanelPOM {
    if (!this._movePanel) {
      try {
        this._movePanel = new MovePanelPOM(this.page, this.logger, {
          timeouts: {
            default: this.config.timeouts.default,
            navigation: this.config.timeouts.navigation
          },
          testBridge: {
            isAvailable: () => this.isTestBridgeAvailable(),
            setMoveIndex: (index) => this.setMoveIndexViaBridge(index)
          }
        });
        this.log('info', 'MovePanelPOM initialized');
      } catch (error) {
        throw new ComponentInitializationError('MovePanelPOM', error as Error);
      }
    }
    return this._movePanel;
  }

  /**
   * Get shared Chess instance
   */
  private get chess(): Chess {
    if (!this._chess) {
      this._chess = new Chess();
    }
    return this._chess;
  }

  /**
   * Map generic TIMEOUTS to dependency-specific format
   * Implements Adapter Pattern for interface compatibility
   */
  private mapTimeoutsForDependencies() {
    return {
      default: this.config.timeouts.default,
      navigation: this.config.timeouts.navigation,
      waitForSelector: this.config.timeouts.medium || this.config.timeouts.default,
      engineResponse: this.config.timeouts.long || this.config.timeouts.default
    };
  }

  /**
   * Build dependencies object for helpers
   */
  private buildDependencies(): DriverDependencies {
    return {
      page: this.page,
      board: this.board,
      moveList: this.moveList,
      evaluationPanel: this.evaluationPanel,
      navigationControls: this.navigationControls,
      logger: this.logger,
      errorHandler: async (context: string, error: Error) => {
        this.log('error', `Error in ${context}: ${error.message}`, { error });
      },
      config: {
        baseUrl: this.config.baseUrl,
        timeouts: this.mapTimeoutsForDependencies(),
        retries: {
          defaultAttempts: this.retryConfig.maxAttempts,
          delayMs: this.retryConfig.initialDelay,
          backoffFactor: this.retryConfig.backoffFactor
        },
        verbose: this.config.verbose,
        autoWaitForEngine: this.config.autoWaitForEngine
      }
    };
  }

  /**
   * Lazy-loaded GamePlayer helper
   */
  public get gamePlayer(): IGamePlayer {
    if (!this._gamePlayer) {
      this._gamePlayer = new GamePlayer(
        this.buildDependencies(),
        this.chess
      );
      this.log('info', 'GamePlayer helper initialized');
    }
    return this._gamePlayer;
  }

  /**
   * Lazy-loaded PuzzleSolver helper
   */
  public get puzzleSolver(): IPuzzleSolver {
    if (!this._puzzleSolver) {
      this._puzzleSolver = new PuzzleSolver(
        this.buildDependencies(),
        this.chess
      );
      this.log('info', 'PuzzleSolver helper initialized');
    }
    return this._puzzleSolver;
  }

  /**
   * Lazy-loaded EngineAnalyzer helper
   */
  public get engineAnalyzer(): IEngineAnalyzer {
    if (!this._engineAnalyzer) {
      this._engineAnalyzer = new EngineAnalyzer(this.buildDependencies());
      this.log('info', 'EngineAnalyzer helper initialized');
    }
    return this._engineAnalyzer;
  }

  /**
   * Visit the application and wait for initial load
   * @param path - Optional path to visit (default: '/train/1')
   * @returns this for fluent interface
   */
  public async visit(path: string = '/train/1'): Promise<this> {
    const url = `${this.config.baseUrl}${path}`;
    this.log('info', `Visiting ${url}`);
    
    try {
      // Set HTTP header to signal E2E test mode - CRITICAL for Test Bridge!
      await this.page.setExtraHTTPHeaders({ 'x-e2e-test-mode': 'true' });
      
      // Set E2E test flag BEFORE navigation to avoid race conditions
      await this.page.addInitScript(() => {
        (window as any).__E2E_TEST_MODE__ = true;
      });
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.config.timeouts.navigation 
      });
      
      // Wait for E2E hooks to be available
      await this.page.waitForFunction(
        () => typeof (window as any).e2e_makeMove === 'function',
        { timeout: 5000 }
      );
      
      // Use common initialization logic
      await this.initializeAfterNavigation();
      
      this.log('info', 'Application loaded successfully');
    } catch (error) {
      throw new NavigationError(`Failed to visit ${url}`, { 
        url, 
        error: (error as Error).message 
      });
    }
    
    return this;
  }

  /**
   * Reload the page and reinitialize
   * @returns this for fluent interface
   */
  public async reload(): Promise<this> {
    this.log('info', 'Reloading page');
    
    // Dispose components before clearing
    await this.disposeComponents();
    
    // Clear component references
    this._isInitialized = false;
    
    // Re-add init script before reload to ensure flag is set
    await this.page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    
    await this.page.reload({ 
      waitUntil: 'networkidle',
      timeout: this.config.timeouts.navigation 
    });
    
    // Wait for E2E hooks to be available after reload
    await this.page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === 'function',
      { timeout: 5000 }
    );
    
    // Use common initialization logic
    await this.initializeAfterNavigation();
    
    return this;
  }
  
  /**
   * Common initialization logic after navigation
   * Extracted to avoid code duplication between visit() and reload()
   */
  private async initializeAfterNavigation(): Promise<void> {
    if (this.config.autoSetupTestBridge) {
      await this.setupTestBridge();
    }
    
    await this.waitForAppReady();
    this._isInitialized = true;
  }
  
  /**
   * Dispose all cached components to prevent memory leaks
   */
  private async disposeComponents(): Promise<void> {
    this.log('debug', 'Disposing cached components and helpers');
    
    // Define helpers to dispose in order (least dependent first)
    const helpersToDispose = [
      '_gamePlayer',
      '_puzzleSolver',
      '_engineAnalyzer'
    ] as const;
    
    // Dispose helpers with proper error handling
    for (const key of helpersToDispose) {
      const helper = (this as any)[key] as { dispose: () => Promise<void> | void } | null;
      
      if (helper && typeof helper.dispose === 'function') {
        try {
          // await handles both sync and async dispose methods
          await helper.dispose();
          this.log('debug', `Disposed helper: ${String(key)}`);
        } catch (error) {
          this.log('error', `Failed to dispose helper '${String(key)}'`, error);
          // Continue to next helper to ensure all disposals are attempted
        } finally {
          // Set to null even if disposal fails to prevent reuse
          (this as any)[key] = null;
        }
      }
    }
    
    // Dispose UI components
    const components = [
      this._boardComponent,
      this._moveListComponent,
      this._evaluationPanel,
      this._navigationControls,
      this._movePanel
    ];
    
    // Dispose all components that support disposal
    await Promise.all(
      components
        .filter(comp => comp !== null && 'dispose' in comp)
        .map(comp => (comp as any).dispose().catch((err: any) => 
          this.log('warn', 'Component disposal failed', { error: err })
        ))
    );
    
    // Clear component references
    this._boardComponent = null;
    this._moveListComponent = null;
    this._evaluationPanel = null;
    this._navigationControls = null;
    this._movePanel = null;
  }
  
  /**
   * Dispose the AppDriver and cleanup resources
   */
  public async dispose(): Promise<void> {
    if (this._disposed) {
      return;
    }
    
    this.log('info', 'Disposing AppDriver');
    await this.disposeComponents();
    this._disposed = true;
  }

  /**
   * Setup test bridge for mock configuration
   * @returns this for fluent interface
   */
  private async setupTestBridge(): Promise<this> {
    try {
      await this.page.waitForFunction(
        () => {
          const constants = (window as any).__E2E_TEST_CONSTANTS__;
          const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
          return !!(window as any)[bridgeName];
        },
        { timeout: this.config.timeouts.medium }
      );
      
      this.log('info', 'Test bridge initialized');
    } catch (error) {
      this.log('warn', 'Test bridge not available', { 
        error: (error as Error).message 
      });
    }
    
    return this;
  }

  /**
   * Waits for the application to be in a ready state.
   * This is the public method intended for use in tests.
   */
  public async waitForReady(): Promise<void> {
    await this.waitForAppReady();
  }

  /**
   * Internal implementation for waiting until the app is ready.
   * Checks multiple readiness indicators
   */
  private async waitForAppReady(): Promise<void> {
    // Debug logging to understand what's happening
    await this.debugPageState('Before waitForAppReady');
    
    // First wait for loading to complete
    try {
      const loadingElement = this.page.locator('text=Loading...');
      await loadingElement.waitFor({ state: 'detached', timeout: 15000 });
      this.log('debug', 'Loading phase completed');
    } catch (error) {
      this.log('warn', 'Loading element not found or already gone', error);
    }
    
    // Explicit wait for board element after navigation (Best Practice)
    try {
      await this.page.waitForSelector('[data-testid="training-board"]', {
        state: 'visible',
        timeout: this.config.timeouts.medium
      });
      this.log('debug', 'Board element found and visible');
    } catch (error) {
      // Enhanced debugging on failure
      await this.debugPageState('After board selector timeout');
      this.log('error', 'Board element not found within timeout', error);
      throw new Error('Failed to find board element after navigation');
    }
    
    // Wait for engine to be ready (state-based waiting as recommended by Gemini & O3)
    try {
      const boardElement = this.page.locator('[data-testid="training-board"]');
      await expect(boardElement).toHaveAttribute('data-engine-status', 'ready', { 
        timeout: 15000 
      });
      this.log('debug', 'Engine status is ready');
    } catch (error) {
      // Log current engine status for debugging
      const currentStatus = await this.page.locator('[data-testid="training-board"]').getAttribute('data-engine-status');
      this.log('error', `Engine not ready. Current status: ${currentStatus}`, error);
      throw new Error(`Engine failed to reach ready state. Current status: ${currentStatus}`);
    }
    
    // Now wait for board component to be ready
    await this.board.waitForBoard();
    
    // Wait for engine to be ready (if available)
    try {
      await this.page.waitForFunction(
        () => {
          const engineStatus = document.body.getAttribute('data-engine-status');
          return engineStatus === 'ready' || engineStatus === 'mock-ready';
        },
        { timeout: this.config.timeouts.medium }
      );
    } catch {
      this.log('warn', 'Engine status not available, continuing anyway');
    }
  }
  
  /**
   * Debug helper to capture page state for troubleshooting
   */
  private async debugPageState(context: string): Promise<void> {
    try {
      // Log current URL
      const url = this.page.url();
      this.log('debug', `[${context}] Current URL: ${url}`);
      
      // Log all data-testid elements found
      const testIds = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        return Array.from(elements).map(el => ({
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName,
          visible: !!(el as HTMLElement).offsetParent,
          className: el.className
        }));
      });
      this.log('debug', `[${context}] Found data-testid elements:`, testIds);
      
      // Check specifically for board element
      const boardInfo = await this.page.evaluate(() => {
        const board = document.querySelector('[data-testid="training-board"]');
        if (!board) return null;
        const rect = board.getBoundingClientRect();
        const computed = window.getComputedStyle(board);
        return {
          exists: true,
          visible: !!(board as HTMLElement).offsetParent,
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          dimensions: { width: rect.width, height: rect.height },
          position: { top: rect.top, left: rect.left }
        };
      });
      this.log('debug', `[${context}] Board element info:`, boardInfo);
      
      // Log first 1000 chars of body HTML for comparison
      const bodyHtml = await this.page.evaluate(() => document.body.innerHTML.substring(0, 1000));
      this.log('debug', `[${context}] Body HTML (first 1000 chars): ${bodyHtml}`);
      
      // Take screenshot on debug
      if (this.config.verbose) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `test-results/debug-${context.replace(/\s+/g, '-')}-${timestamp}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.log('debug', `[${context}] Screenshot saved to: ${screenshotPath}`);
      }
    } catch (debugError) {
      this.log('warn', `Failed to capture debug state for ${context}:`, debugError);
    }
  }

  /**
   * Setup a new game with optional FEN position
   * @refactor-to-MovePanelPOM - Uses goToStart to reset navigation
   * @param fen - Optional FEN string (default: starting position)
   * @returns this for fluent interface
   */
  public async setupGame(fen?: string): Promise<this> {
    this.log('info', 'Setting up new game', { fen });
    
    if (!this._isInitialized) {
      await this.visit();
    }
    
    if (fen) {
      // Use test bridge to set position if available
      const bridgeAvailable = await this.isTestBridgeAvailable();
      if (bridgeAvailable) {
        await this.page.evaluate((fenString) => {
          const constants = (window as any).__E2E_TEST_CONSTANTS__;
          const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
          const bridge = (window as any)[bridgeName];
          bridge?.engine?.setPosition?.(fenString);
        }, fen);
        
        // Wait for position update
        await this.board.waitForPosition(fen);
      } else {
        this.log('warn', 'Test bridge not available, cannot set custom position');
      }
    }
    
    // Clear any existing moves
    await this.navigationControls.goToStart();
    
    return this;
  }

  /**
   * Make a move and wait for all UI updates
   * This is the primary orchestration method
   * @param from - Source square (e.g., 'e2')
   * @param to - Target square (e.g., 'e4')
   * @returns this for fluent interface
   */
  public async makeMoveAndAwaitUpdate(from: string, to: string): Promise<this> {
    this.log('info', `Making move ${from}-${to} with full synchronization`);
    
    // Delegate move logic to GamePlayer
    const moveNotation = `${from}${to}`;
    const result = await this.gamePlayer.playMove(moveNotation);
    
    if (!result.success) {
      const error = result.errors[0];
      throw new NavigationError(`Failed to make move ${from}-${to}: ${error.reason}`, {
        from,
        to,
        reason: error.reason
      });
    }
    
    // Handle UI synchronization (AppDriver's orchestration responsibility)
    await this.awaitUIUpdate(from, to);
    
    this.log('info', `Move ${from}-${to} completed successfully`);
    return this;
  }
  
  /**
   * Wait for UI updates after a move (orchestration responsibility)
   * Separated from move logic per consensus recommendation
   * @refactor-to-MovePanelPOM - Uses move count to track updates
   * @param from - Source square 
   * @param to - Target square
   */
  private async awaitUIUpdate(from: string, to: string): Promise<void> {
    // Wait for move list to update
    const moveCount = await this.moveList.getMoveCount();
    await this.withRetry(
      () => this.moveList.waitForMoveCount(moveCount + 1),
      `Waiting for move list update after ${from}-${to}`
    );
    
    // Wait for engine response if configured
    if (this.config.autoWaitForEngine) {
      await this.withRetry(
        () => this.waitForEngineAnalysis(),
        'Waiting for engine analysis'
      );
    }
  }

  /**
   * Navigate to a specific move number
   * @refactor-to-MovePanelPOM - Core navigation method
   * @param moveNumber - 0-based move index
   * @returns this for fluent interface
   */
  public async gotoMove(moveNumber: number): Promise<this> {
    this.log('info', `Navigating to move ${moveNumber}`);
    
    const currentIndex = await this.navigationControls.getCurrentMoveIndex();
    const totalMoves = await this.navigationControls.getTotalMoves();
    
    if (moveNumber < 0 || moveNumber >= totalMoves) {
      throw new NavigationError(`Invalid move number ${moveNumber}`, {
        moveNumber,
        totalMoves,
        validRange: `0-${totalMoves - 1}`
      });
    }
    
    // Check if Test Bridge supports direct navigation
    const bridgeAvailable = await this.isTestBridgeAvailable();
    if (bridgeAvailable) {
      try {
        await this.setMoveIndexViaBridge(moveNumber);
        return this;
      } catch (error) {
        this.log('warn', 'Test Bridge navigation failed, falling back to UI navigation', {
          error: (error as Error).message
        });
      }
    }
    
    // Use most efficient UI navigation path
    if (moveNumber === 0) {
      await this.navigationControls.goToStart();
    } else if (moveNumber === totalMoves - 1) {
      await this.navigationControls.goToEnd();
    } else {
      // For long jumps, consider using move list click if available
      const jumpDistance = Math.abs(moveNumber - currentIndex);
      if (jumpDistance > 5) {
        try {
          await this.moveList.clickMove(moveNumber);
          return this;
        } catch (error) {
          this.log('warn', 'Direct move click failed, using step navigation', {
            error: (error as Error).message
          });
        }
      }
      
      // Step navigation for short distances or as fallback
      if (moveNumber < currentIndex) {
        const steps = currentIndex - moveNumber;
        for (let i = 0; i < steps; i++) {
          await this.navigationControls.goBack();
        }
      } else if (moveNumber > currentIndex) {
        const steps = moveNumber - currentIndex;
        for (let i = 0; i < steps; i++) {
          await this.navigationControls.goForward();
        }
      }
    }
    
    return this;
  }
  
  /**
   * Set move index directly via Test Bridge (performance optimization)
   * @refactor-to-MovePanelPOM - Internal navigation implementation
   */
  private async setMoveIndexViaBridge(moveIndex: number): Promise<void> {
    // Get current state before change
    const currentFen = await this.board.getPosition();
    const currentMoveIndex = await this.navigationControls.getCurrentMoveIndex();
    
    // Skip if already at target index
    if (currentMoveIndex === moveIndex) {
      return;
    }
    
    await this.page.evaluate((index) => {
      const constants = (window as any).__E2E_TEST_CONSTANTS__;
      const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
      const bridge = (window as any)[bridgeName];
      
      if (!bridge?.diagnostic?.setCurrentMoveIndex) {
        throw new Error('Test Bridge does not support direct move navigation');
      }
      
      bridge.diagnostic.setCurrentMoveIndex(index);
    }, moveIndex);
    
    // Wait for navigation state to update
    await this.page.waitForFunction(
      (targetIndex) => {
        const constants = (window as any).__E2E_TEST_CONSTANTS__;
        const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
        const bridge = (window as any)[bridgeName];
        const currentIndex = bridge?.diagnostic?.getCurrentMoveIndex?.();
        return currentIndex === targetIndex;
      },
      moveIndex,
      { timeout: this.config.timeouts.navigation }
    );
    
    // If position should change, wait for it
    if (moveIndex !== currentMoveIndex) {
      try {
        await this.board.waitForPositionChange(currentFen, this.config.timeouts.position);
      } catch (error) {
        // Position might not change if moving within same position
        this.log('debug', 'Position did not change after navigation', {
          fromIndex: currentMoveIndex,
          toIndex: moveIndex
        });
      }
    }
  }

  /**
   * Wait for engine analysis to complete
   * @param timeout - Optional custom timeout
   */
  public async waitForEngineAnalysis(timeout?: number): Promise<void> {
    const effectiveTimeout = timeout || this.config.timeouts.long;
    
    try {
      // More robust approach: wait for either analysis completion or timeout
      await this.page.waitForFunction(
        () => {
          const panel = document.querySelector('[data-testid="evaluation-panel"]');
          if (!panel) return false;
          
          // Check if engine has result (evaluation value present)
          const evaluationValue = panel.querySelector('[data-testid="evaluation-value"]');
          const hasEvaluation = evaluationValue && evaluationValue.textContent && evaluationValue.textContent.trim() !== '';
          
          // Check if engine is thinking
          const thinkingIndicator = panel.querySelector('[data-testid="engine-thinking"]');
          const isThinking = thinkingIndicator && thinkingIndicator.getAttribute('data-thinking') === 'true';
          
          // Complete if we have evaluation and not thinking, or if thinking just started
          return hasEvaluation && !isThinking;
        },
        { timeout: effectiveTimeout }
      );
      
      this.log('info', 'Engine analysis completed');
    } catch (error) {
      // Check if we at least have some evaluation (even if still thinking)
      const hasPartialResult = await this.evaluationPanel.getEvaluation()
        .then(() => true)
        .catch(() => false);
        
      if (hasPartialResult) {
        this.log('warn', 'Engine analysis timeout but partial result available');
        return;
      }
      
      throw new SynchronizationError(
        'Engine analysis did not complete',
        effectiveTimeout,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Get complete game state from all components
   * Useful for comprehensive assertions
   * @refactor-to-MovePanelPOM - Partially - collects move panel state
   */
  public async getFullGameState(): Promise<GameState> {
    this.log('info', 'Collecting full game state');
    
    // Collect data from all components in parallel for performance
    const [
      fen,
      moves,
      moveCount,
      currentMoveIndex,
      evaluation,
      engineInfo,
      navigationState,
      isEngineThinking
    ] = await Promise.all([
      this.board.getPosition(),
      this.moveList.getMoves(),
      this.moveList.getMoveCount(),
      this.navigationControls.getCurrentMoveIndex(),
      this.evaluationPanel.getEvaluation().catch(() => null),
      this.evaluationPanel.getEvaluationInfo().catch(() => null),
      this.navigationControls.getNavigationState(),
      this.evaluationPanel.isThinking().catch(() => false)
    ]);
    
    // Get last move
    const lastMove = moves.length > 0 ? moves[moves.length - 1].san : undefined;
    
    // Check for checkmate/game over
    const isCheckmate = await this.detectCheckmate();
    
    // Derive game state from FEN using chess.js
    let isGameOver = false;
    let turn: 'w' | 'b' = 'w';
    let gameOverReason: string | undefined = undefined;
    
    try {
      this.chess.load(fen);
      isGameOver = this.chess.isGameOver();
      turn = this.chess.turn();
      
      if (isCheckmate) {
        gameOverReason = 'checkmate';
      } else if (this.chess.isStalemate()) {
        gameOverReason = 'stalemate';
      } else if (this.chess.isDraw()) {
        gameOverReason = 'draw';
      }
    } catch (error) {
      this.log('warn', 'Failed to derive game state from FEN', { error: (error as Error).message });
    }
    
    return {
      fen,
      moves: moves.map(m => m.san),
      currentMoveIndex,
      totalMoves: moveCount,
      moveCount, // Alias for backward compatibility
      lastMove,
      evaluation: engineInfo?.evaluation ?? evaluation,
      bestMove: engineInfo?.bestMove ?? null,
      depth: engineInfo?.depth ?? null,
      isEngineThinking,
      navigation: {
        isAtStart: navigationState.isAtStart,
        isAtEnd: navigationState.isAtEnd,
        canGoBack: navigationState.isBackEnabled,
        canGoForward: navigationState.isForwardEnabled
      },
      isCheckmate,
      gameOverReason
    };
  }

  /**
   * Detect if the current position is checkmate
   */
  public async detectCheckmate(): Promise<boolean> {
    try {
      const fen = await this.board.getPosition();
      this.chess.load(fen);
      return this.chess.isCheckmate();
    } catch (error) {
      this.log('warn', 'Failed to detect checkmate', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Check if test bridge is available
   */
  private async isTestBridgeAvailable(): Promise<boolean> {
    return this.page.evaluate(() => {
      const constants = (window as any).__E2E_TEST_CONSTANTS__;
      const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
      return !!(window as any)[bridgeName];
    });
  }

  /**
   * Reset application state
   * @refactor-to-MovePanelPOM - Uses goToStart to reset navigation
   * @returns this for fluent interface
   */
  public async resetState(): Promise<this> {
    this.log('info', 'Resetting application state');
    
    // Reset via test bridge if available
    const bridgeAvailable = await this.isTestBridgeAvailable();
    if (bridgeAvailable) {
      await this.page.evaluate(() => {
        const constants = (window as any).__E2E_TEST_CONSTANTS__;
        const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
        const bridge = (window as any)[bridgeName];
        bridge?.engine?.reset?.();
      });
    }
    
    // Navigate to start position
    await this.navigationControls.goToStart();
    
    return this;
  }

  /**
   * Helper method for logging with context
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any): void {
    if (this.config.verbose || level === 'error' || level === 'warn') {
      this.logger[level](message, context);
    }
  }

  /**
   * Play a sequence of moves with full synchronization
   * @param moves - Array of moves in format 'e2e4' or 'e2-e4' or SAN notation
   * @param options - Options for move execution
   * @returns this for fluent interface
   * 
   * @example
   * await driver.playMoveSequence(['e2e4', 'e7e5', 'g1f3', 'b8c6']);
   * await driver.playMoveSequence(['e4', 'e5', 'Nf3', 'Nc6'], { useSAN: true });
   */
  public async playMoveSequence(
    moves: string[], 
    options: {
      useSAN?: boolean;
      delayBetweenMoves?: number;
      stopOnError?: boolean;
    } = {}
  ): Promise<this> {
    // Auto-clear errors at the start (Principle of Least Surprise)
    this.clearSequenceErrors();
    
    const { 
      useSAN = false, 
      delayBetweenMoves = 0,
      stopOnError = true 
    } = options;
    
    this.log('info', `Playing move sequence of ${moves.length} moves`, { 
      moves, 
      options 
    });
    
    // Delegate to GamePlayer helper
    const result = await this.gamePlayer.playMoveSequence(moves, {
      useSAN,
      delayBetweenMoves,
      stopOnError
    });
    
    // Update sequence errors from helper result
    if (result.errors.length > 0) {
      this._sequenceErrors = result.errors;
      
      // Log errors
      result.errors.forEach(error => {
        this.log('error', `Failed to play move ${error.move} at position ${error.moveIndex + 1}`, {
          move: error.move,
          reason: error.reason,
          position: error.moveIndex
        });
      });
      
      if (stopOnError && result.errors.length > 0) {
        const firstError = result.errors[0];
        throw new NavigationError(`Move sequence failed at move ${firstError.moveIndex + 1}: ${firstError.move}`, {
          failedMove: firstError.move,
          position: firstError.moveIndex,
          playedMoves: moves.slice(0, result.movesPlayed),
          error: firstError.reason
        });
      }
    }
    
    this.log('info', `Move sequence completed: ${result.movesPlayed}/${moves.length} moves successful`, {
      successRate: `${(result.movesPlayed / moves.length * 100).toFixed(1)}%`,
      errorsCollected: this._sequenceErrors.length
    });
    
    return this;
  }
  
  /**
   * Parse move notation from various formats
   * Supports: e2e4, e2-e4, e2 e4
   */
  private parseMoveNotation(move: string): { from: string; to: string } {
    // Validate first
    if (!this.validateMoveNotation(move)) {
      throw new Error(`Invalid move notation: ${move}. Expected format like 'e2e4' or 'e2-e4'`);
    }
    
    // Remove spaces and dashes
    const cleanMove = move.replace(/[\s-]/g, '');
    
    return {
      from: cleanMove.substring(0, 2),
      to: cleanMove.substring(2, 4)
    };
  }
  
  /**
   * Validate move notation format
   * @param move - Move in coordinate notation (e2e4, e2-e4, e2 e4)
   * @returns true if valid
   */
  public validateMoveNotation(move: string): boolean {
    if (!move || typeof move !== 'string') return false;
    
    // Remove spaces and dashes for validation
    const cleanMove = move.replace(/[\s-]/g, '');
    
    // Check format: should be exactly 4 characters like 'e2e4'
    // Each position should be [a-h][1-8]
    return /^[a-h][1-8][a-h][1-8]$/.test(cleanMove);
  }
  
  /**
   * Validate FEN notation
   * Delegates to ValidationHelper for consistency
   * @param fen - FEN notation string
   * @returns true if valid
   */
  public validateFEN(fen: string): boolean {
    return ValidationHelper.validateFEN(fen);
  }
  
  
  /**
   * Play a full game from move list or PGN
   * @param moves - Array of moves or PGN string
   * @param options - Options for game playback
   * @returns Game result and final state
   * 
   * @example
   * const result = await driver.playFullGame([
   *   'e2e4', 'e7e5', 'g1f3', 'd7d6', 'f1c4', 'c8g4'
   * ]);
   * expect(result.finalState.moves).toHaveLength(6);
   */
  public async playFullGame(
    moves: string[] | string,
    options: {
      startFromPosition?: string; // FEN
      delayBetweenMoves?: number;
      stopOnError?: boolean;
      waitForResult?: boolean;
      resultTimeout?: number; // Timeout for game result detection
    } = {}
  ): Promise<{
    result: '1-0' | '0-1' | '1/2-1/2' | '*' | 'ongoing';
    finalState: GameState;
    movesPlayed: number;
    errors: Array<{ move: string; error: string }>;
  }> {
    const {
      startFromPosition,
      delayBetweenMoves = 0,
      stopOnError = false,
      waitForResult = true,
      resultTimeout = 10000 // Default 10 seconds
    } = options;
    
    // Parse moves if PGN provided
    const moveList = Array.isArray(moves) ? moves : this.parsePGN(moves);
    
    this.log('info', 'Playing full game', {
      totalMoves: moveList.length,
      startPosition: startFromPosition || 'standard',
      options
    });
    
    // Setup starting position if provided
    if (startFromPosition) {
      await this.setupGame(startFromPosition);
    }
    
    // Play all moves
    const errors: Array<{ move: string; error: string }> = [];
    let movesPlayed = 0;
    
    try {
      await this.playMoveSequence(moveList, {
        delayBetweenMoves,
        stopOnError
      });
      movesPlayed = moveList.length;
    } catch (error) {
      // Extract error details from NavigationError
      if (error instanceof NavigationError && error.context) {
        movesPlayed = error.context.position || 0;
        errors.push({
          move: error.context.failedMove,
          error: error.message
        });
      }
    }
    
    // Get final game state
    const finalState = await this.getFullGameState();
    
    // Determine game result
    let result: '1-0' | '0-1' | '1/2-1/2' | '*' | 'ongoing' = 'ongoing';
    
    if (waitForResult) {
      result = await this.detectGameResult(resultTimeout);
    }
    
    this.log('info', 'Game playback completed', {
      result,
      movesPlayed,
      totalMoves: moveList.length,
      errors: errors.length
    });
    
    return {
      result,
      finalState,
      movesPlayed,
      errors
    };
  }
  
  /**
   * Parse PGN string to move array
   * Basic implementation - full PGN parser would be more complex
   */
  private parsePGN(pgn: string): string[] {
    // This is a simplified parser - real implementation would need proper PGN parsing
    throw new Error('PGN parsing not yet implemented. Use move array instead.');
  }
  
  /**
   * Detect game result from UI
   * Looks for checkmate, stalemate, or draw indicators
   * @param timeout - Maximum time to wait for result detection
   */
  private async detectGameResult(timeout: number = 10000): Promise<'1-0' | '0-1' | '1/2-1/2' | '*' | 'ongoing'> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // First check data attributes (more reliable than text)
        const gameResultAttr = await this.page.locator('[data-game-result]').first()
          .getAttribute('data-game-result', { timeout: 500 })
          .catch(() => null);
          
        if (gameResultAttr) {
          if (['1-0', '0-1', '1/2-1/2', '*'].includes(gameResultAttr)) {
            this.log('info', `Game result detected from data attribute: ${gameResultAttr}`);
            return gameResultAttr as '1-0' | '0-1' | '1/2-1/2' | '*';
          }
        }
        
        // Fallback: Check for result indicators in UI text
        const resultElement = await this.page.locator('[data-testid="game-result"]').first();
        const resultText = await resultElement.textContent({ timeout: 500 }).catch(() => null);
        
        if (resultText) {
          if (resultText.includes('1-0') || resultText.toLowerCase().includes('white wins')) {
            return '1-0';
          }
          if (resultText.includes('0-1') || resultText.toLowerCase().includes('black wins')) {
            return '0-1';
          }
          if (resultText.includes('1/2-1/2') || resultText.toLowerCase().includes('draw')) {
            return '1/2-1/2';
          }
          if (resultText.includes('*')) {
            return '*';
          }
        }
        
        // Check for checkmate/stalemate in evaluation
        const evaluation = await this.evaluationPanel.getEvaluationInfo().catch(() => null);
        if (evaluation?.evaluation === Infinity) {
          // White has mate
          return '1-0';
        }
        if (evaluation?.evaluation === -Infinity) {
          // Black has mate
          return '0-1';
        }
        
        // Wait a bit before next check
        await this.page.waitForTimeout(100);
        
      } catch (error) {
        this.log('debug', 'Error during game result detection', { error: (error as Error).message });
      }
    }
    
    this.log('warn', `Game result detection timed out after ${timeout}ms`);
    return 'ongoing';
  }
  
  /**
   * Setup an endgame position and solve it with given moves
   * Perfect for testing training scenarios
   * @param fen - Starting position
   * @param solution - Solution moves
   * @param options - Puzzle options
   * @returns Success status and feedback
   * 
   * @example
   * const result = await driver.setupAndSolvePuzzle(
   *   '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
   *   ['e6e7', 'e8d7', 'e5e6']
   * );
   * expect(result.success).toBe(true);
   */
  public async setupAndSolvePuzzle(
    fen: string,
    solution: string[],
    options: {
      expectCheckmate?: boolean;
      timeLimit?: number;
      allowAlternatives?: boolean;
      delayBetweenMoves?: number;
    } = {}
  ): Promise<{
    success: boolean;
    feedback: string;
    movesPlayed: string[];
    finalPosition: string;
    timeElapsed: number;
  }> {
    const {
      expectCheckmate = false,
      timeLimit = 30000,
      allowAlternatives = false,
      delayBetweenMoves = 100
    } = options;
    
    this.log('info', 'Setting up puzzle', {
      fen,
      solutionLength: solution.length,
      expectCheckmate,
      options
    });
    
    // Validate FEN before attempting setup
    if (!this.validateFEN(fen)) {
      throw new Error(`Invalid FEN notation: ${fen}`);
    }
    
    // Setup puzzle using helper
    await this.puzzleSolver.setupPuzzle(fen, solution, 'E2E Test Puzzle');
    
    // Solve the puzzle
    const result = await this.puzzleSolver.solvePuzzle(solution, {
      expectCheckmate,
      timeLimit,
      allowAlternatives,
      delayBetweenMoves
    });
    
    this.log('info', 'Puzzle attempt completed', {
      success: result.success,
      feedback: result.feedback,
      movesPlayed: result.movesPlayed,
      timeElapsed: result.timeElapsed
    });
    
    return {
      success: result.success,
      feedback: result.feedback,
      movesPlayed: result.movesPlayed,
      finalPosition: result.finalPosition,
      timeElapsed: result.timeElapsed
    };
  }
  
  /**
   * Check if puzzle is completed successfully
   * Looks for success messages or completion indicators
   */
  private async checkPuzzleCompletion(expectCheckmate: boolean): Promise<{
    success: boolean;
    feedback: string;
  }> {
    try {
      // Check for puzzle success message
      const successSelectors = [
        '[data-testid="puzzle-success"]',
        '[data-testid="training-success"]',
        '.puzzle-success',
        '.training-complete'
      ];
      
      for (const selector of successSelectors) {
        const element = await this.page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (isVisible) {
          const text = await element.textContent() || 'Puzzle solved!';
          return { success: true, feedback: text.trim() };
        }
      }
      
      // Check for failure message
      const failureSelectors = [
        '[data-testid="puzzle-failure"]',
        '[data-testid="training-error"]',
        '.puzzle-failed',
        '.incorrect-move'
      ];
      
      for (const selector of failureSelectors) {
        const element = await this.page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (isVisible) {
          const text = await element.textContent() || 'Incorrect solution';
          return { success: false, feedback: text.trim() };
        }
      }
      
      // If expecting checkmate, that's the success indicator
      if (expectCheckmate) {
        return { 
          success: false, 
          feedback: 'No completion indicator found' 
        };
      }
      
      // Default to success if no indicators found
      return { 
        success: true, 
        feedback: 'Moves completed successfully' 
      };
      
    } catch (error) {
      return {
        success: false,
        feedback: `Error checking puzzle completion: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Get comprehensive engine analysis for current position
   * Triggers deep analysis and returns structured results
   * @param options - Analysis options
   * @returns Detailed engine analysis including top moves
   * 
   * @example
   * const analysis = await driver.getEngineAnalysis({
   *   depth: 20,
   *   multiPV: 3
   * });
   * console.log('Best move:', analysis.bestMove);
   * console.log('Evaluation (centipawns):', analysis.evaluation);
   * console.log('Top 3 lines:', analysis.lines);
   */
  public async getEngineAnalysis(options: {
    depth?: number;
    time?: number;
    multiPV?: number;
  } = {}): Promise<{
    /** Best move in SAN notation */
    bestMove: string;
    /** Evaluation in centipawns (100 = 1 pawn advantage for white) */
    evaluation: number;
    /** Search depth reached */
    depth: number;
    /** Top variations found */
    lines: Array<{
      move: string;
      /** Evaluation in centipawns */
      evaluation: number;
      continuation: string[];
    }>;
    /** Whether this is a known opening book move */
    isBookMove: boolean;
    /** Whether position is checkmate */
    isMate: boolean;
    /** Mate in N moves (positive = we have mate, negative = we're getting mated) */
    mateIn?: number;
  }> {
    this.log('info', 'Requesting engine analysis', options);
    
    // Get current position
    const currentFen = await this.board.getPosition();
    
    // Delegate to EngineAnalyzer
    const analysis = await this.engineAnalyzer.analyzePosition(currentFen, options);
    
    return analysis;
  }
  
  
  /**
   * Create test data using builders (convenience method)
   */
  public get builders() {
    return {
      gameState: aGameState,
      position: aPosition,
      trainingSession: aTrainingSession
    };
  }
  
  /**
   * Get accumulated sequence errors (from stopOnError: false scenarios)
   * @returns Array of error details
   */
  public get sequenceErrors(): ReadonlyArray<SequenceError> {
    return [...this._sequenceErrors];
  }
  
  /**
   * Clear accumulated sequence errors
   * @returns this for fluent interface
   */
  public clearSequenceErrors(): this {
    this._sequenceErrors = [];
    this.log('debug', 'Cleared sequence errors');
    return this;
  }
  
  /**
   * Execute a function with retry logic for transient failures
   * @param fn - Function to execute
   * @param context - Context for error messages
   * @param customRetryConfig - Optional custom retry configuration
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on non-transient errors
        if (this.isNonTransientError(lastError)) {
          throw lastError;
        }
        
        if (attempt < config.maxAttempts) {
          const delay = Math.min(
            config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
            config.maxDelay
          );
          
          this.log('warn', `${context} failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms`, {
            error: lastError.message,
            attempt,
            delay
          });
          
          await this.page.waitForTimeout(delay);
        }
      }
    }
    
    throw new AppDriverError(`${context} failed after ${config.maxAttempts} attempts`, {
      lastError: lastError?.message,
      attempts: config.maxAttempts
    });
  }
  
  /**
   * Check if an error is non-transient and should not be retried
   */
  private isNonTransientError(error: Error): boolean {
    // Don't retry on programming errors
    if (error instanceof TypeError || error instanceof ReferenceError) {
      return true;
    }
    
    // Don't retry on explicit navigation/validation errors
    if (error instanceof NavigationError || error instanceof ComponentInitializationError) {
      return true;
    }
    
    // Check for specific error messages that indicate non-transient issues
    const message = error.message.toLowerCase();
    const nonTransientPatterns = [
      'invalid',
      'not found',
      'does not exist',
      'permission denied',
      'unauthorized'
    ];
    
    return nonTransientPatterns.some(pattern => message.includes(pattern));
  }
  
  /**
   * Take a screenshot for debugging (convenience method)
   * @param name - Screenshot name (without extension)
   */
  public async screenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshots/${name}-${timestamp}.png`;
    
    try {
      await this.page.screenshot({ 
        path: filename,
        fullPage: true 
      });
      this.log('info', `Screenshot saved: ${filename}`);
    } catch (error) {
      this.log('error', 'Failed to take screenshot', { 
        error: (error as Error).message,
        filename 
      });
    }
  }
  
  /**
   * Utility method to mock engine responses via Test Bridge
   * @param responses - Mock responses configuration
   */
  public async mockEngineResponses(responses: {
    evaluation?: number;
    bestMove?: string;
    depth?: number;
    forPosition?: string;
  }): Promise<this> {
    const bridgeAvailable = await this.isTestBridgeAvailable();
    if (!bridgeAvailable) {
      this.log('warn', 'Cannot mock engine responses - Test Bridge not available');
      return this;
    }
    
    await this.page.evaluate((config) => {
      const constants = (window as any).__E2E_TEST_CONSTANTS__;
      const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
      const bridge = (window as any)[bridgeName];
      
      if (bridge?.engine) {
        if (config.forPosition && config.evaluation !== undefined) {
          bridge.engine.setEvaluation(config.forPosition, config.evaluation);
        }
        if (config.forPosition && config.bestMove) {
          bridge.engine.setNextMove(config.forPosition, config.bestMove);
        }
        // Add depth if the bridge supports it
        if (config.forPosition && config.depth !== undefined && bridge.engine.setDepth) {
          bridge.engine.setDepth(config.forPosition, config.depth);
        }
      }
    }, responses);
    
    this.log('info', 'Engine responses mocked', responses);
    return this;
  }
}

/**
 * Factory function for creating AppDriver instances
 * Supports test isolation and parallel execution
 */
export function createAppDriver(page: Page, config?: AppDriverConfig): AppDriver {
  return new AppDriver(page, config);
}