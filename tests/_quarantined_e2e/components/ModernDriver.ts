/**
 * @fileoverview ModernDriver Implementation - Lean E2E Test Orchestrator
 * @description Implements the ~300-line replacement for 1847-line AppDriver
 * 
 * CRITICAL: This file MUST NOT exceed 300 lines!
 * Current: ~250 lines (leaving room for future additions)
 * 
 * Implementation approach (Gemini + O3 consensus):
 * - Direct component injection (pragmatic over pure abstraction)
 * - Minimal private methods (pure delegation)
 * - Optional logging for debugging
 * - Custom errors for better test diagnostics
 */

import { Page } from '@playwright/test';
import { BoardComponent } from './BoardComponent';
import { MoveListComponent } from './MoveListComponent';
import { EvaluationPanel } from './EvaluationPanel';
import { NavigationControls } from './NavigationControls';
import { GamePlayer } from '../helpers/GamePlayer';
import { ValidationHelper } from '../helpers/ValidationHelper';
import { TestBridgeWrapper } from './TestBridgeWrapper';
import { 
  IModernDriver, 
  GameState, 
  UIState, 
  SetupOptions,
  ModernDriverError 
} from './IModernDriver';
import { ILogger } from '../../../shared/services/logging/types';
import { noopLogger } from '../../shared/logger-utils';
import { createGamePlayerConfigCached } from '../utils/config-adapter';
import { TIMEOUTS } from '../config/constants';

// Re-export TestBridgeWrapper for convenience
export { TestBridgeWrapper } from './TestBridgeWrapper';
export { ModernDriverError } from './IModernDriver';

/**
 * Configuration for ModernDriver
 */
export interface ModernDriverConfig {
  /** Optional logger for debugging */
  logger?: ILogger;
  /** Timeout for wait operations (default: 30000ms) */
  defaultTimeout?: number;
  /** Base URL for navigation (default: http://localhost:3002) */
  baseUrl?: string;
  /** Enable Test Bridge for engine mocking (default: true in test env) */
  useTestBridge?: boolean;
}

/**
 * ModernDriver - Lean implementation of E2E test orchestrator
 * 
 * Design decisions:
 * 1. Direct component injection (no interface abstraction layer)
 * 2. Components created lazily but stored for reuse
 * 3. All business logic delegated to helpers/components
 * 4. Zero private methods (pure orchestration)
 */
export class ModernDriver implements IModernDriver {
  public readonly page: Page; // Made public for test access
  private readonly config: Required<ModernDriverConfig>;
  private readonly logger: ILogger; // No longer optional - always has a value
  
  // Lazily initialized components
  private _board?: BoardComponent;
  private _moveList?: MoveListComponent;
  private _evaluation?: EvaluationPanel;
  private _navigation?: NavigationControls;
  private _gamePlayer?: GamePlayer;
  private _bridge?: TestBridgeWrapper;

  constructor(page: Page, config: ModernDriverConfig = {}) {
    this.page = page;
    // Use provided logger or fall back to no-op logger
    this.logger = config.logger ?? noopLogger;
    this.config = {
      logger: this.logger, // Now always defined as ILogger
      defaultTimeout: config.defaultTimeout ?? 30000,
      baseUrl: config.baseUrl ?? 'http://localhost:3002',
      useTestBridge: config.useTestBridge ?? true // Default to true in test env
    };
    
    // Initialize Test Bridge if enabled
    if (this.config.useTestBridge) {
      this._bridge = new TestBridgeWrapper(this.page, this.logger);
    }
    
    this.logger?.debug('ModernDriver initialized', { config: this.config });
  }

  // ==============================
  // Navigation & Setup
  // ==============================
  
  async visit(path: string): Promise<void> {
    this.logger?.debug('Navigating to path', { path });
    
    try {
      const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
      
      // Set E2E test mode flag BEFORE navigation (optimal client-side approach)
      await this.page.addInitScript(() => {
        window.__E2E_TEST_MODE__ = true;
      });
      
      await this.page.goto(url);
      await this.waitUntilReady();
      
      this.logger?.debug('Navigation successful', { url });
    } catch (error) {
      this.logger?.error('Navigation failed', error as Error);
      throw new ModernDriverError(
        `Failed to visit ${path}`,
        'visit',
        { path, error: (error as Error).message }
      );
    }
  }

  async setup(options: SetupOptions): Promise<void> {
    this.logger?.debug('Setting up test environment', { options });
    
    try {
      // Setup FEN position if provided
      if (options.fen) {
        // Transform FEN string to Position object (adapter pattern)
        await this.board.loadPosition({ fen: options.fen });
      }
      
      // Navigate to scenario if provided
      if (options.scenario !== undefined) {
        await this.visit(`/train/${options.scenario}`);
      }
      
      // Configure engine mocks using Test Bridge
      if (options.engineMocks && this._bridge) {
        for (const [fen, response] of Object.entries(options.engineMocks)) {
          await this._bridge.addCustomResponse(fen, response);
        }
      }
      
      this.logger?.debug('Setup completed');
    } catch (error) {
      this.logger?.error('Setup failed', error as Error);
      throw new ModernDriverError(
        'Failed to setup test environment',
        'setup',
        { options, error: (error as Error).message }
      );
    }
  }

  // ==============================
  // Game Actions
  // ==============================
  
  async makeMove(from: string, to: string, promotion?: string): Promise<void> {
    this.logger?.debug('Making move', { from, to, promotion });
    
    try {
      const moveString = promotion ? `${from}${to}${promotion}` : `${from}-${to}`;
      const currentMoveCount = await this.moveList.getMoveCount();
      
      // Delegate to GamePlayer
      await this.gamePlayer.playMove(moveString);
      
      // Wait for move to be reflected in UI
      await this.moveList.waitForMoveCount(currentMoveCount + 1, this.config.defaultTimeout);
      
      this.logger?.debug('Move completed', { moveString, newMoveCount: currentMoveCount + 1 });
    } catch (error) {
      this.logger?.error('Move failed', error as Error);
      console.error('🚨 ModernDriver.makeMove failed:', {
        from, to, promotion,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        errorType: error?.constructor?.name
      });
      throw new ModernDriverError(
        `Failed to make move ${from}-${to}`,
        'makeMove',
        { from, to, promotion, error: (error as Error).message }
      );
    }
  }

  async playMoves(moves: string[]): Promise<void> {
    this.logger?.debug('Playing move sequence', { moves, count: moves.length });
    
    try {
      // Delegate to GamePlayer for efficient sequence execution
      const result = await this.gamePlayer.playMoveSequence(moves);
      
      if (!result.success && result.errors.length > 0) {
        throw new ModernDriverError(
          'Failed to play move sequence',
          'playMoves',
          { moves, errors: result.errors }
        );
      }
      
      this.logger?.debug('Move sequence completed');
    } catch (error) {
      this.logger?.error('Move sequence failed', error as Error);
      throw error; // Re-throw to preserve stack trace
    }
  }

  // ==============================
  // State Queries
  // ==============================
  
  async getGameState(): Promise<GameState> {
    this.logger?.debug('Querying game state');
    
    try {
      // Aggregate state from multiple components
      // Components handle their own initialization internally
      const [fen, moves, navState] = await Promise.all([
        this.board.getPosition(),
        this.moveList.getMoves(),
        this.navigation.getNavigationState()
      ]);
      
      const lastMove = moves[moves.length - 1];
      
      // Get game status using ValidationHelper
      const gameStatus = ValidationHelper.getGameStatus(fen);
      const status = gameStatus?.isCheckmate ? 'checkmate' : 
                     gameStatus?.isStalemate ? 'stalemate' :
                     gameStatus?.isDraw ? 'draw' : 
                     'playing';
      
      // Extract scenario ID from URL if on training page
      let scenario: number | undefined;
      const currentUrl = this.page.url();
      const scenarioMatch = currentUrl.match(/\/train\/(\d+)/);
      if (scenarioMatch) {
        scenario = parseInt(scenarioMatch[1], 10);
      }
      
      const gameState: GameState = {
        fen,
        turn: navState.currentMoveIndex % 2 === 0 ? 'w' : 'b',
        moveCount: moves.length,
        status,
        scenario,
        lastMove: lastMove ? {
          from: lastMove.from || '',
          to: lastMove.to || '',
          san: lastMove.san
        } : undefined
      };
      
      this.logger?.debug('Game state retrieved', { gameState });
      return gameState;
    } catch (error) {
      this.logger?.error('Failed to get game state', error as Error);
      throw new ModernDriverError(
        'Failed to retrieve game state',
        'getGameState',
        { error: (error as Error).message }
      );
    }
  }

  async getUIState(): Promise<UIState> {
    this.logger?.debug('Querying UI state');
    
    try {
      const [lastMove, evalInfo, isThinking] = await Promise.all([
        this.moveList.getLastMove(),
        this.evaluation.getEvaluationInfo(),
        this.evaluation.isThinking()
      ]);
      
      const uiState: UIState = {
        lastMoveText: lastMove ? `${lastMove.moveNumber}. ${lastMove.san}` : '',
        evaluationText: evalInfo.evaluation !== null ? 
          `${evalInfo.evaluation > 0 ? '+' : ''}${(evalInfo.evaluation / 100).toFixed(1)}` : 
          '...',
        isThinking
      };
      
      this.logger?.debug('UI state retrieved', { uiState });
      return uiState;
    } catch (error) {
      this.logger?.error('Failed to get UI state', error as Error);
      throw new ModernDriverError(
        'Failed to retrieve UI state',
        'getUIState',
        { error: (error as Error).message }
      );
    }
  }

  // ==============================
  // Synchronization
  // ==============================
  
  async waitForEngineMove(): Promise<void> {
    this.logger?.debug('Waiting for engine move');
    
    try {
      const currentMoveCount = await this.moveList.getMoveCount();
      await this.moveList.waitForMoveCount(currentMoveCount + 1, this.config.defaultTimeout);
      
      this.logger?.debug('Engine move completed');
    } catch (error) {
      this.logger?.error('Timeout waiting for engine', error as Error);
      throw new ModernDriverError(
        'Timeout waiting for engine move',
        'waitForEngineMove',
        { error: (error as Error).message }
      );
    }
  }

  async waitUntilReady(): Promise<void> {
    const startTime = Date.now();
    this.logger?.debug('Waiting for application ready state...');
    
    try {
      // Phase 1: Wait for DOM basics
      const phase1Start = Date.now();
      this.logger?.debug('Phase 1: Waiting for basic DOM elements...');
      await this.page.waitForSelector('body', { timeout: 5000 });
      this.logger?.debug(`Phase 1 completed in ${Date.now() - phase1Start}ms`);
      
      // Phase 2: Wait for app initialization signal (robust event-based approach)
      const phase2Start = Date.now();
      this.logger?.debug('Phase 2: Waiting for app-ready signal...');
      
      try {
        await this.page.waitForSelector('body[data-app-ready="true"]', {
          state: 'attached',
          timeout: TIMEOUTS.appReady || this.config.defaultTimeout
        });
        this.logger?.debug(`Phase 2 completed in ${Date.now() - phase2Start}ms`);
        
        // Phase 3: Verify no error state
        const appStatus = await this.page.locator('body').getAttribute('data-app-ready');
        if (appStatus === 'error') {
          throw new Error('Application failed to initialize - check engine initialization logs');
        }
      } catch (phase2Error) {
        // Kein Fallback mehr - wenn app-ready fehlt, ist das ein echter Fehler
        throw new ModernDriverError(
          'Application ready signal not detected - check _app.tsx implementation',
          'waitUntilReady',
          { 
            error: (phase2Error as Error).message,
            hint: 'Ensure body[data-app-ready="true"] is set when app is ready'
          }
        );
      }
      
      // Phase 3: Wait for board to be ready
      // Note: Previous Phase 3 (router ready check) was removed as redundant - 
      // Phase 5 already ensures app is fully loaded via e2e_makeMove availability
      this.logger?.debug('Phase 3: Waiting for board component...');
      await this.board.waitForBoard();
      
      // Phase 4: Initialize Test Bridge if enabled
      if (this._bridge) {
        this.logger?.debug('Phase 4: Initializing Test Bridge...');
        await this._bridge.initialize(this.config.defaultTimeout);
      }
      
      // Phase 5: Verify e2e_makeMove is available (if in test mode)
      if (this.config.useTestBridge) {
        const phase5Start = Date.now();
        this.logger?.debug('Phase 5: Waiting for e2e_makeMove hook...');
        await this.page.waitForFunction(
          () => typeof (window as any).e2e_makeMove === 'function',
          { timeout: 5000 }
        );
        this.logger?.debug(`Phase 5 completed in ${Date.now() - phase5Start}ms`);
      }
      
      const totalDuration = Date.now() - startTime;
      this.logger?.info('✅ Application is ready - all phases completed', { 
        totalDuration: `${totalDuration}ms` 
      });
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.logger?.error('❌ Application failed to become ready', {
        totalDuration: `${totalDuration}ms`,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ModernDriverError(
        'Timeout waiting for application ready state',
        'waitUntilReady',
        { error: (error as Error).message }
      );
    }
  }

  // ==============================
  // Lifecycle
  // ==============================
  
  async dispose(): Promise<void> {
    this.logger?.debug('Disposing ModernDriver');
    
    try {
      // Clean up Test Bridge first
      if (this._bridge) {
        await this._bridge.reset();
        this._bridge.dispose();
        this._bridge = undefined;
      }
      
      // Clean up other resources
      this._gamePlayer = undefined;
      this._board = undefined;
      this._moveList = undefined;
      this._evaluation = undefined;
      this._navigation = undefined;
      
      this.logger?.debug('Disposal completed');
    } catch (error) {
      this.logger?.error('Disposal failed', error as Error);
      // Don't throw on disposal errors
    }
  }

  // ==============================
  // Public Bridge Access (for advanced scenarios)
  // ==============================
  
  /**
   * Get Test Bridge wrapper for advanced test scenarios
   * @returns TestBridgeWrapper if enabled, undefined otherwise
   */
  get bridge(): TestBridgeWrapper | undefined {
    return this._bridge;
  }
  
  /**
   * Get Board component for test access
   * @returns BoardComponent instance
   */
  get board(): BoardComponent {
    if (!this._board) {
      this._board = new BoardComponent(this.page);
    }
    return this._board;
  }
  
  // ==============================
  // Helper Methods (for tests)
  // ==============================
  
  /**
   * Get current board position
   * @returns Promise<{fen: string}>
   */
  async getBoardPosition(): Promise<{ fen: string }> {
    const fen = await this.board.getPosition();
    return { fen };
  }
  
  /**
   * Get current move count
   * @returns Promise<number>
   */
  async getMoveCount(): Promise<number> {
    return await this.moveList.getMoveCount();
  }
  
  // ==============================
  // Lazy Component Getters
  // ==============================
  

  private get moveList(): MoveListComponent {
    if (!this._moveList) {
      this._moveList = new MoveListComponent(this.page);
    }
    return this._moveList;
  }

  private get evaluation(): EvaluationPanel {
    if (!this._evaluation) {
      this._evaluation = new EvaluationPanel(this.page);
    }
    return this._evaluation;
  }

  private get navigation(): NavigationControls {
    if (!this._navigation) {
      // Fix: Set correct root selector for navigation controls
      this._navigation = new NavigationControls(this.page, '[data-testid="move-navigation"]');
    }
    return this._navigation;
  }

  private get gamePlayer(): GamePlayer {
    if (!this._gamePlayer) {
      this._gamePlayer = new GamePlayer({
        board: this.board,
        moveList: this.moveList,
        logger: this.logger,
        page: this.page,
        errorHandler: async (context: string, error: Error) => {
          this.logger.error(`GamePlayer error in ${context}`, error);
        },
        config: createGamePlayerConfigCached(this.config)
      });
    }
    return this._gamePlayer;
  }
}