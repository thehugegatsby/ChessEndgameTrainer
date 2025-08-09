/**
 * @file Test API Service - Clean interface for E2E tests
 * @version 1.0.0
 * @description Provides a dedicated service for test interactions,
 * separating test infrastructure from UI components.
 *
 * ARCHITECTURE PRINCIPLES:
 * - Single Responsibility: Only handles test interactions
 * - Clean Interface: Well-defined API for E2E tests
 * - No UI Coupling: Independent of component implementation
 * - Deterministic: Provides predictable test behavior
 */

import { Chess, Move as ChessJsMove } from "chess.js";
import { TESTING } from "@shared/constants";
import { getLogger } from "@shared/services/logging";
import type { RootState } from "@shared/store/slices/types";
import type { EndgamePosition } from "@shared/types/endgame";

const logger = getLogger().setContext("TestApiService");

/**
 * Test API Response types
 */
export interface TestMoveResponse {
  success: boolean;
  error?: string;
  resultingFen?: string;
  moveCount?: number;
}

/**
 * Game state information for test scenarios
 *
 * @interface TestGameState
 *
 * @property {string} fen - Current board position in FEN notation
 * @property {'w' | 'b'} turn - Current player to move (white or black)
 * @property {number} moveCount - Total number of moves made in the game
 * @property {string} pgn - Game in Portable Game Notation format
 * @property {boolean} isGameOver - Whether the game has ended
 * @property {string} [gameOverReason] - Reason for game termination if applicable
 * @property {string[]} history - List of moves in SAN notation
 * @property {number} [evaluation] - Current position evaluation if available
 * @property {boolean} isCheck - Whether the current player is in check
 * @property {boolean} isCheckmate - Whether the current player is checkmated
 * @property {boolean} isDraw - Whether the game is drawn
 * @property {object} [lastMove] - Details of the most recent move
 */
export interface TestGameState {
  fen: string;
  turn: "w" | "b";
  moveCount: number;
  pgn: string;
  isGameOver: boolean;
  gameOverReason?: string;
  history: string[];
  evaluation?: number;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  lastMove?: {
    from: string;
    to: string;
    san: string;
  };
}

/**
 * Configuration options for test tablebase behavior
 *
 * @interface TestTablebaseConfig
 *
 * @property {boolean} [deterministic] - Whether tablebase should provide predictable responses
 * @property {number} [seed] - Random seed for deterministic behavior
 * @property {Map<string, string>} [fixedResponses] - Pre-defined responses for specific FEN positions
 * @property {number} [depth] - Analysis depth limit for tablebase calculations
 * @property {number} [timeLimit] - Time limit in milliseconds for tablebase responses
 */
export interface TestTablebaseConfig {
  deterministic?: boolean;
  seed?: number;
  fixedResponses?: Map<string, string>;
  depth?: number;
  timeLimit?: number;
}

/**
 * Test API Service
 *
 * @class TestApiService
 * @description
 * Provides clean interface for E2E tests to interact with the chess game.
 * Implements singleton pattern for consistent test state management across
 * test scenarios while maintaining separation from UI components.
 *
 * @remarks
 * Key responsibilities:
 * - Game state management for test scenarios
 * - Move execution with bypass for test validation
 * - Tablebase configuration for deterministic behavior
 * - Event emission for test coordination
 * - Store integration without tight coupling
 * - Error handling with proper test feedback
 *
 * Architecture features:
 * - Singleton pattern for consistent state
 * - Store access through dependency injection
 * - Event-driven communication with tests
 * - Deterministic tablebase response handling
 * - Clean separation from UI layer
 *
 * @example
 * ```typescript
 * // Initialize test API with store access
 * const testApi = TestApiService.getInstance();
 * testApi.initialize(storeAccess, { deterministic: true });
 *
 * // Make moves and verify game state
 * await testApi.makeMove('e2-e4');
 * const state = testApi.getGameState();
 * expect(state.fen).toContain('e4');
 *
 * // Configure deterministic tablebase
 * testApi.configureTablebase({
 *   deterministic: true,
 *   fixedResponses: new Map([['fen1', 'Nf3']])
 * });
 * ```
 */
export class TestApiService {
  private static instance: TestApiService | null = null;
  private tablebaseConfig: TestTablebaseConfig = {
    deterministic: false,
  };
  private eventEmitter: EventTarget = new EventTarget();
  private _isInitialized: boolean = false;
  // Tablebase control is now handled via TestBridge, not directly
  private storeAccess: {
    getState: () => RootState;
    subscribe: (listener: (state: RootState, prevState: RootState) => void) => () => void;
    // Individual action functions extracted from store state
    makeMove: (move: ChessJsMove | { from: string; to: string; promotion?: string } | string) => void;
    applyMove: (move: ChessJsMove | { from: string; to: string; promotion?: string }) => void;
    resetPosition: () => void;
    setPosition: (position: EndgamePosition) => void;
    goToMove: (moveIndex: number) => void;
    setAnalysisStatus: (status: string) => void;
  } | null = null;

  private constructor() {}

  /**
   * Get singleton instance of TestApiService
   *
   * @static
   * @description
   * Returns the singleton instance of TestApiService, creating it if
   * it doesn't exist. Ensures consistent test state across all test
   * scenarios and prevents multiple instances from interfering.
   *
   * @returns {TestApiService} The singleton TestApiService instance
   *
   * @example
   * ```typescript
   * const testApi = TestApiService.getInstance();
   * await testApi.initialize(storeAccess);
   * ```
   */
  public static getInstance(): TestApiService {
    if (!TestApiService.instance) {
      TestApiService.instance = new TestApiService();
    }
    return TestApiService.instance;
  }

  /**
   * Initialize test API for a test session
   * @param storeAccess
   * @param storeAccess.getState
   * @param storeAccess.subscribe
   * @param storeAccess.makeMove
   * @param storeAccess.applyMove
   * @param storeAccess.resetPosition
   * @param storeAccess.setPosition
   * @param storeAccess.goToMove
   * @param storeAccess.setAnalysisStatus
   * @param config
   */
  public initialize(
    storeAccess: {
      getState: () => RootState;
      subscribe: (listener: (state: RootState, prevState: RootState) => void) => () => void;
      // Individual action functions extracted from store state
      makeMove: (move: ChessJsMove | { from: string; to: string; promotion?: string } | string) => void;
      applyMove: (move: ChessJsMove | { from: string; to: string; promotion?: string }) => void;
      resetPosition: () => void;
      setPosition: (position: EndgamePosition) => void;
      goToMove: (moveIndex: number) => void;
      setAnalysisStatus: (status: string) => void;
    },
    config?: TestTablebaseConfig,
  ): void {
    // Validate required actions
    if (!storeAccess.makeMove || !storeAccess.resetPosition) {
      logger.error("Required store actions not available");
      this._isInitialized = false;
      return;
    }

    this.storeAccess = storeAccess;
    this._isInitialized = true;

    if (config) {
      this.tablebaseConfig = { ...this.tablebaseConfig, ...config };
    }

    logger.info(
      "✅ TestApiService: Successfully initialized with store actions",
    );

    // Emit initialization event
    this.emit("test:initialized", { config: this.tablebaseConfig });
  }

  /**
   * Clean up test API after test session
   *
   * @description
   * Resets the TestApiService to its initial state, clearing all
   * configuration and store access. Should be called after each
   * test to prevent state leakage between test scenarios.
   *
   * @remarks
   * Cleanup operations:
   * - Reset tablebase configuration to defaults
   * - Clear store access references
   * - Emit cleanup event for test coordination
   * - Destroy singleton instance
   *
   * @example
   * ```typescript
   * // In test teardown
   * testApi.cleanup();
   * // Fresh instance will be created on next getInstance() call
   * ```
   */
  public cleanup(): void {
    this.tablebaseConfig = { deterministic: false };
    this._isInitialized = false;
    this.storeAccess = null;
    this.emit("test:cleanup", {});
    TestApiService.instance = null;
  }

  /**
   * Check if service is initialized and ready for use
   *
   * @description
   * Returns whether the TestApiService has been properly initialized
   * with store access and is ready to handle test operations.
   *
   * @returns {boolean} True if service is initialized and ready
   *
   * @example
   * ```typescript
   * if (!testApi.isInitialized) {
   *   await testApi.initialize(storeAccess);
   * }
   * ```
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Make a chess move through full validation pipeline (like real user interaction)
   * @param move - Move in format 'from-to' (e.g., 'e2-e4') or SAN notation
   * @returns Promise resolving to move execution result with validation
   */
  public async makeValidatedMove(move: string): Promise<TestMoveResponse> {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    try {
      // Parse move format
      let moveObj: { from: string; to: string; promotion?: string } | string;

      if (move.includes("-")) {
        // Format: 'e2-e4'
        const [from, to] = move.split("-");
        moveObj = { from, to };
      } else {
        // SAN notation
        moveObj = move;
      }

      // Import handlePlayerMove directly (it's not part of store, it's an orchestrator)
      const { handlePlayerMove } = await import(
        "@shared/store/orchestrators/handlePlayerMove"
      );

      // Create a store API object that handlePlayerMove expects (like in rootStore.ts:186)
      const storeApi = {
        getState: this.storeAccess.getState,
        setState: (updater: RootState | Partial<RootState> | ((state: RootState) => RootState | Partial<RootState> | void)) => {
          // We need the actual setState from store access - this is the key fix
          // The storeAccess should provide the actual Zustand setState method
          if (this.storeAccess && "setState" in this.storeAccess) {
            // If storeAccess provides setState directly
            (this.storeAccess as unknown as { setState: (updater: RootState | Partial<RootState> | ((state: RootState) => RootState | Partial<RootState> | void)) => void }).setState(updater);
          } else {
            // Fallback - log warning but don't fail
            logger.warn(
              "TestApiService: setState not available in storeAccess - state updates may not work",
            );
          }
        },
      };

      // Execute move through the FULL validation pipeline
      const result = await handlePlayerMove(storeApi, moveObj);

      // Get final state after move processing
      const finalState = this.storeAccess.getState();

      this.emit("test:validated_move", {
        move,
        success: result,
        fen: finalState.game?.currentFen || "unknown",
        moveCount: finalState.game?.moveHistory?.length || 0,
      });

      return {
        success: result,
        resultingFen:
          finalState.game?.currentFen || "unknown",
        moveCount: finalState.game?.moveHistory?.length || 0,
        error: result ? undefined : "Move rejected by validation pipeline",
      };
    } catch (error) {
      logger.error("TestApiService.makeValidatedMove error:", error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Make a chess move (bypasses validation for fast test setup)
   * @param move - Move in format 'from-to' (e.g., 'e2-e4') or SAN notation
   * @deprecated Use makeValidatedMove for behavior testing, this is for setup only
   */
  public async makeMove(move: string): Promise<TestMoveResponse> {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    try {
      // Parse move format
      let moveObj: { from: string; to: string; promotion?: string };

      if (move.includes("-")) {
        // Format: 'e2-e4'
        const [from, to] = move.split("-");
        moveObj = { from, to };
      } else {
        // SAN notation - need to convert to from/to format
        // For simplicity, we'll use makeMove which accepts strings
        this.storeAccess.makeMove(move);
        const success = true;
        
        if (success) {
          const newState = this.storeAccess.getState();
          
          if (
            this.tablebaseConfig.deterministic &&
            newState.training?.isPlayerTurn === false
          ) {
            // After player move, check if tablebase should respond with a fixed move
            await this.handleDeterministicTablebaseMove(newState.game?.currentFen || "");
          }
          
          this.emit("test:move", {
            move,
            fen: newState.game?.currentFen || "unknown",
            moveCount:
              newState.game?.moveHistory?.length || 0,
          });
          
          // Get updated state after potential tablebase move
          const finalState = this.storeAccess.getState();
          
          return {
            success: true,
            resultingFen:
              finalState.game?.currentFen || "unknown",
            moveCount: finalState.game?.moveHistory?.length || 0,
          };
        } else {
          return {
            success: false,
            error: "Invalid move",
          };
        }
      }

      // Execute move through store actions (bypass validation for tests)
      this.storeAccess.applyMove(moveObj);
      const success = true; // makeMove is synchronous in Zustand

      if (success) {
        const newState = this.storeAccess.getState();

        // Check if deterministic mode is enabled and if we should mock tablebase response
        if (
          this.tablebaseConfig.deterministic &&
          this.tablebaseConfig.fixedResponses
        ) {
          // After player move, check if tablebase should respond with a fixed move
          await this.handleDeterministicTablebaseMove(newState.game?.currentFen || "");
        }

        this.emit("test:move", {
          move,
          fen: newState.game?.currentFen || "unknown",
          moveCount:
            newState.game?.moveHistory?.length || 0,
        });

        // Get updated state after potential tablebase move
        const finalState = this.storeAccess.getState();

        return {
          success: true,
          resultingFen:
            finalState.game?.currentFen || "unknown",
          moveCount: finalState.game?.moveHistory?.length || 0,
        };
      } else {
        return {
          success: false,
          error: "Invalid move",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get current game state for test verification
   *
   * @description
   * Returns comprehensive game state information for test assertions
   * and verification. Constructs a detailed game state object from
   * the current store state with all relevant chess game information.
   *
   * @returns {TestGameState} Current game state with position, moves, and status
   *
   * @throws {Error} If service is not initialized with store access
   *
   * @example
   * ```typescript
   * const state = testApi.getGameState();
   * expect(state.fen).toBe('expected-fen');
   * expect(state.turn).toBe('w');
   * expect(state.moveCount).toBe(2);
   * expect(state.isCheck).toBe(false);
   * ```
   */
  public getGameState(): TestGameState {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    const state = this.storeAccess.getState();
    const currentFen =
      state.game?.currentFen ||
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const game = new Chess(currentFen);

    // Get last move if available
    const history = state.game?.moveHistory || [];
    let lastMove;
    if (history.length > 0) {
      const lastHistoryItem = history[history.length - 1];
      lastMove = {
        from: lastHistoryItem.from || "",
        to: lastHistoryItem.to || "",
        san: lastHistoryItem.san,
      };
    }

    return {
      fen: currentFen,
      turn: game.turn(),
      moveCount: history.length,
      pgn: game.pgn(),
      isGameOver: game.isGameOver(),
      gameOverReason: this.getGameOverReason(game),
      history: history.map((h: { san?: string }) => h.san || ''),
      evaluation:
        state.tablebase?.currentEvaluation?.evaluation || undefined,
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
      lastMove,
    };
  }

  /**
   * Reset game to initial position
   *
   * @description
   * Resets the chess game to its initial starting position, clearing
   * all move history and returning to the standard opening setup.
   * Useful for test scenarios that need a clean game state.
   *
   * @returns {Promise<void>} Promise that resolves when reset is complete
   *
   * @throws {Error} If service is not initialized with store access
   *
   * @example
   * ```typescript
   * // Reset before starting a new test scenario
   * await testApi.resetGame();
   * const state = testApi.getGameState();
   * expect(state.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
   * ```
   */
  public async resetGame(): Promise<void> {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    this.storeAccess.resetPosition();
    this.emit("test:reset", {});
  }

  /**
   * Configure tablebase for deterministic behavior
   * @param config
   */
  public configureTablebase(config: TestTablebaseConfig): void {
    this.tablebaseConfig = { ...this.tablebaseConfig, ...config };
    this.emit("test:tablebaseConfigured", { config: this.tablebaseConfig });

    // Note: TestBridge system already handles configuration propagation
    // to the actual tablebase instance for deterministic test behavior
  }

  /**
   * Trigger tablebase analysis for current position
   * @param timeoutMs - Maximum time to wait (for mock tablebase this is instant)
   *
   * Note: In the new architecture, tablebase analysis happens automatically
   * through the store when moves are made. This method now just waits
   * for the tablebase status to become ready.
   */
  public async triggerTablebaseAnalysis(
    timeoutMs: number = TESTING.DEFAULT_TIMEOUT,
  ): Promise<boolean> {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized");
    }

    try {
      const startTime = Date.now();

      // Wait for tablebase to be ready
      while (Date.now() - startTime < timeoutMs) {
        const state = this.storeAccess.getState();
        const analysisStatus = state.tablebase?.analysisStatus || "idle";

        if (analysisStatus === "idle" || analysisStatus === "success") {
          // Tablebase is working or has finished
          this.emit("test:tablebaseAnalysisComplete", {
            fen: state.game?.currentFen || "unknown",
          });
          return true;
        }

        // Wait a bit before checking again
        await new Promise((resolve) =>
          setTimeout(resolve, TESTING.POLL_INTERVAL),
        );
      }

      // Timeout reached
      logger.warn("Tablebase analysis timeout after", { timeoutMs });
      return false;
    } catch (error) {
      logger.error("Tablebase analysis check failed", error);
      this.emit("test:tablebaseError", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Subscribe to test events
   * @param event
   * @param handler
   */
  public on(event: string, handler: (detail: unknown) => void): void {
    this.eventEmitter.addEventListener(event, (e) => handler((e as CustomEvent).detail));
  }

  /**
   * Unsubscribe from test events
   * @param event
   * @param handler
   */
  public off(event: string, handler: (detail: unknown) => void): void {
    this.eventEmitter.removeEventListener(event, (e) => handler((e as CustomEvent).detail));
  }

  /**
   * Emit test event
   * @param event
   * @param detail
   */
  private emit(event: string, detail: unknown): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /**
   * Handle deterministic tablebase move in mock mode
   * @param currentFen
   */
  private async handleDeterministicTablebaseMove(
    currentFen: string,
  ): Promise<void> {
    if (!this.storeAccess || !this.tablebaseConfig.fixedResponses) {
      return;
    }

    // Check if we have a fixed response for this position
    const tablebaseMove = this.tablebaseConfig.fixedResponses.get(currentFen);

    if (tablebaseMove) {
      // Wait a bit to simulate tablebase thinking time (optional)
      if (
        this.tablebaseConfig.timeLimit &&
        this.tablebaseConfig.timeLimit > 0
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.tablebaseConfig.timeLimit),
        );
      }

      // Make the deterministic tablebase move
      try {
        // Use direct makeMove for test bypass
        if (this.storeAccess.makeMove) {
          this.storeAccess.makeMove(tablebaseMove);
        }
        this.emit("test:tablebaseMove", {
          move: tablebaseMove,
          fen: currentFen,
          deterministic: true,
        });
      } catch (error) {
        logger.warn("Deterministic tablebase move failed", {
          tablebaseMove,
          position: currentFen,
          error,
        });
      }
    }
  }

  /**
   * Get game over reason
   * @param game
   */
  private getGameOverReason(game: Chess): string | undefined {
    if (!game.isGameOver()) return undefined;

    if (game.isCheckmate()) return "checkmate";
    if (game.isDraw()) {
      if (game.isStalemate()) return "stalemate";
      if (game.isThreefoldRepetition()) return "threefold repetition";
      if (game.isInsufficientMaterial()) return "insufficient material";
      return "draw";
    }

    return "game over";
  }
}

/**
 * Convenience function to get TestApiService singleton instance
 *
 * @description
 * Provides a convenient way to access the TestApiService singleton
 * instance without having to call the full static method name.
 *
 * @returns {TestApiService} The singleton TestApiService instance
 *
 * @example
 * ```typescript
 * const testApi = getTestApi();
 * await testApi.initialize(storeAccess);
 * ```
 */
export const getTestApi = () => TestApiService.getInstance();
