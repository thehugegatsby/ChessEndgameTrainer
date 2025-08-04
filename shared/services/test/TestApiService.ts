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

import { Chess } from "chess.js";
import { TESTING } from "@shared/constants";

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
 *
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
 *
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
 * Provides clean interface for E2E tests to interact with the chess game
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
    getState: () => any;
    subscribe: (listener: (state: any, prevState: any) => void) => () => void;
    // Individual action functions extracted from store state
    makeMove: (move: any) => void;
    _internalApplyMove: (move: any) => void;
    resetPosition: () => void;
    setPosition: (position: any) => void;
    goToMove: (moveIndex: number) => void;
    setAnalysisStatus: (status: string) => void;
  } | null = null;

  private constructor() {}

  /**
   * Get singleton instance
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
   * @param storeAccess._internalApplyMove
   * @param storeAccess.resetPosition
   * @param storeAccess.setPosition
   * @param storeAccess.goToMove
   * @param storeAccess.setAnalysisStatus
   * @param config
   */
  public initialize(
    storeAccess: {
      getState: () => any;
      subscribe: (listener: (state: any, prevState: any) => void) => () => void;
      // Individual action functions extracted from store state
      makeMove: (move: any) => void;
      _internalApplyMove: (move: any) => void;
      resetPosition: () => void;
      setPosition: (position: any) => void;
      goToMove: (moveIndex: number) => void;
      setAnalysisStatus: (status: string) => void;
    },
    config?: TestTablebaseConfig,
  ): void {
    // Validate required actions
    if (!storeAccess.makeMove || !storeAccess.resetPosition) {
      console.error("Required store actions not available");
      this._isInitialized = false;
      return;
    }

    this.storeAccess = storeAccess;
    this._isInitialized = true;

    if (config) {
      this.tablebaseConfig = { ...this.tablebaseConfig, ...config };
    }

    console.log(
      "✅ TestApiService: Successfully initialized with store actions",
    );

    // Emit initialization event
    this.emit("test:initialized", { config: this.tablebaseConfig });
  }

  /**
   * Clean up test API after test session
   */
  public cleanup(): void {
    this.tablebaseConfig = { deterministic: false };
    this._isInitialized = false;
    this.storeAccess = null;
    this.emit("test:cleanup", {});
    TestApiService.instance = null;
  }

  /**
   * Check if service is initialized
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Make a chess move
   * @param move - Move in format 'from-to' (e.g., 'e2-e4') or SAN notation
   */
  public async makeMove(move: string): Promise<TestMoveResponse> {
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

      // Execute move through store actions (bypass validation for tests)
      this.storeAccess._internalApplyMove(moveObj);
      const success = true; // makeMove is synchronous in Zustand

      if (success) {
        const newState = this.storeAccess.getState();

        // Check if deterministic mode is enabled and if we should mock tablebase response
        if (
          this.tablebaseConfig.deterministic &&
          this.tablebaseConfig.fixedResponses
        ) {
          // After player move, check if tablebase should respond with a fixed move
          await this.handleDeterministicTablebaseMove(newState.fen);
        }

        this.emit("test:move", {
          move,
          fen: newState.training?.currentFen || newState.fen,
          moveCount:
            newState.training?.moveHistory?.length ||
            newState.history?.length ||
            0,
        });

        // Get updated state after potential tablebase move
        const finalState = this.storeAccess.getState();

        return {
          success: true,
          resultingFen: finalState.training?.currentFen || finalState.fen,
          moveCount:
            finalState.training?.moveHistory?.length ||
            finalState.history?.length ||
            0,
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
   * Get current game state
   */
  public getGameState(): TestGameState {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    const state = this.storeAccess.getState();
    const currentFen =
      state.training?.currentFen ||
      state.fen ||
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const game = new Chess(currentFen);

    // Get last move if available
    const history = state.training?.moveHistory || state.history || [];
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
      history: history.map((h: any) => h.san),
      evaluation:
        state.training?.currentEvaluation?.evaluation ||
        state.evaluation?.engineEvaluation?.value,
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
      lastMove,
    };
  }

  /**
   * Reset game to initial position
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
        const analysisStatus =
          state.training?.analysisStatus || state.analysisStatus;

        if (analysisStatus === "idle" || analysisStatus === "success") {
          // Tablebase is working or has finished
          this.emit("test:tablebaseAnalysisComplete", {
            fen: state.training?.currentFen || state.fen,
          });
          return true;
        }

        // Wait a bit before checking again
        await new Promise((resolve) =>
          setTimeout(resolve, TESTING.POLL_INTERVAL),
        );
      }

      // Timeout reached
      console.warn("Tablebase analysis timeout after", timeoutMs);
      return false;
    } catch (error) {
      console.error("Tablebase analysis check failed:", error);
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
  public on(event: string, handler: (detail: any) => void): void {
    this.eventEmitter.addEventListener(event, (e: any) => handler(e.detail));
  }

  /**
   * Unsubscribe from test events
   * @param event
   * @param handler
   */
  public off(event: string, handler: (detail: any) => void): void {
    this.eventEmitter.removeEventListener(event, (e: any) => handler(e.detail));
  }

  /**
   * Emit test event
   * @param event
   * @param detail
   */
  private emit(event: string, detail: any): void {
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
        this.storeAccess._internalApplyMove(tablebaseMove);
        this.emit("test:tablebaseMove", {
          move: tablebaseMove,
          fen: currentFen,
          deterministic: true,
        });
      } catch (error) {
        console.warn("Deterministic tablebase move failed", {
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

// Export singleton instance getter for convenience
/**
 *
 */
export /**
 *
 */
const getTestApi = () => TestApiService.getInstance();
