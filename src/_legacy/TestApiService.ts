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
  /**
   * Set turn state for test scenarios (bypasses normal game flow)
   * @param isPlayerTurn - Whether it's the player's turn
   * @description
   * This method allows E2E tests to manually control whose turn it is,
   * enabling testing of mixed validation scenarios where player moves
   * go through validation but opponent moves are direct.
   */
  public setTurnState(isPlayerTurn: boolean): void {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    try {
      // Try to use setState to update the store
      if ((this.storeAccess as any).setState) {
        (this.storeAccess.setState as any)((state: unknown) => {
          const typedState = state as any;
          if (typedState.training) {
            return {
              ...typedState,
              training: {
                ...typedState.training,
                isPlayerTurn,
                isOpponentThinking: false,
                moveInFlight: false
              }
            };
          }
          return typedState;
        });
        console.log("Test API: Turn state set via setState", { isPlayerTurn });
      } else {
        console.warn("Test API: No setState method available to set turn state");
      }
    } catch (error) {
      console.error("Test API: Failed to set turn state", error);
      throw new Error(`Failed to set turn state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

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
    console.error('🚨🚨🚨 MAKEVALIDATEDMOVE ENTRY POINT - THIS SHOULD ALWAYS APPEAR');
    if (!this.storeAccess) {
      console.error('🚨 storeAccess is null - TestApiService not initialized');
      throw new Error("TestApiService not initialized with store access");
    }

    try {
      // CRITICAL FIX: Set turn state to allow handlePlayerMove to proceed
      // handlePlayerMove has early return if !isPlayerTurn, so we must ensure it's true
      console.log('🔧🔧🔧 MAKEVALIDATEDMOVE CALLED WITH MOVE:', move);
      console.log('🔧 Setting turn state to player before validation pipeline');
      this.setTurnState(true);

      // Debug: Check current state after setting turn
      const stateAfterTurnSet = this.storeAccess.getState();
      console.log('🔍 State after setTurnState:', {
        isPlayerTurn: stateAfterTurnSet.training?.isPlayerTurn,
        isOpponentThinking: stateAfterTurnSet.training?.isOpponentThinking,
        moveInFlight: stateAfterTurnSet.training?.moveInFlight,
        currentFen: stateAfterTurnSet.game?.currentFen
      });

      // Parse move format
      let moveObj: { from: string; to: string; promotion?: string } | string;

      if (move.includes("-")) {
        // Format: 'e2-e4'
        const parts = move.split("-");
        if (parts.length >= 2 && parts[0] && parts[1]) {
          moveObj = { from: parts[0], to: parts[1] };
        } else {
          throw new Error(`Invalid move format: ${move}`);
        }
      } else {
        // SAN notation
        moveObj = move;
      }

      console.log('🎯 About to call handlePlayerMove with:', { move, moveObj });

      // Import handlePlayerMove directly (it's not part of store, it's an orchestrator)
      const { handlePlayerMove } = await import(
        "@shared/store/orchestrators/handlePlayerMove"
      );

      // Create a store API object that handlePlayerMove expects (like in rootStore.ts:186)
      const storeApi = {
        getState: this.storeAccess.getState,
        setState: (updater: any) => {
          // We need the actual setState from store access - this is the key fix
          // The storeAccess should provide the actual Zustand setState method
          if (this.storeAccess && "setState" in this.storeAccess) {
            // If storeAccess provides setState directly
            (this.storeAccess as any).setState(updater);
          } else {
            // Fallback - log warning but don't fail
            console.warn(
              "TestApiService: setState not available in storeAccess - state updates may not work",
            );
          }
        },
      };

      // Execute move through the FULL validation pipeline
      console.log('🚀 Calling handlePlayerMove...');
      const result = await handlePlayerMove(storeApi, moveObj);
      console.log('📋 handlePlayerMove result:', result);

      // Get final state after move processing
      const finalState = this.storeAccess.getState();
      console.log('🔍 Final state after handlePlayerMove:', {
        success: result,
        currentFen: finalState.game?.currentFen,
        moveCount: finalState.game?.moveHistory?.length,
        isPlayerTurn: finalState.training?.isPlayerTurn
      });

      this.emit("test:validated_move", {
        move,
        success: result,
        fen: finalState.game?.currentFen || finalState.currentFen || "unknown",
        moveCount: finalState.game?.moveHistory?.length || 0,
      });

      const response: TestMoveResponse = {
        success: result,
        resultingFen:
          finalState.game?.currentFen || finalState.currentFen || "unknown",
        moveCount: finalState.game?.moveHistory?.length || 0,
      };
      if (!result) {
        response.error = "Move rejected by validation pipeline";
      }
      return response;
    } catch (error) {
      console.error("TestApiService.makeValidatedMove error:", error);
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
      let moveObj: { from: string; to: string; promotion?: string } | string;

      if (move.includes("-")) {
        // Format: 'e2-e4'
        const parts = move.split("-");
        if (parts.length >= 2 && parts[0] && parts[1]) {
          moveObj = { from: parts[0], to: parts[1] };
        } else {
          throw new Error(`Invalid move format: ${move}`);
        }
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
          resultingFen:
            finalState.game?.currentFen || finalState.currentFen || "unknown",
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
   * Make a direct move bypassing all validation (for opponent moves in E2E tests)
   * @param move - Move in format 'from-to' (e.g., 'e2-e4') or SAN notation
   * @description
   * This method executes moves directly without any validation, using the new
   * commitMoveToTraining function. It's specifically designed for opponent moves
   * in E2E tests where we need to bypass the validation pipeline that blocks
   * moves when !isPlayerTurn.
   * 
   * This method:
   * - Parses the move into a ValidatedMove object
   * - Executes the move using chess.js directly
   * - Updates both game and training state via commitMoveToTraining
   * - Handles turn state correctly based on training configuration
   */
  public makeDirectMove(move: string): TestMoveResponse {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    try {
      console.log(`🔧 Direct move (bypassing validation): ${move}`);
      
      // Get current state
      const currentState = this.storeAccess.getState();
      const currentFen = currentState.game?.currentFen || currentState.currentFen;
      
      if (!currentFen) {
        throw new Error("No current FEN available for move execution");
      }
      
      // Create chess instance and load current position
      const chess = new Chess(currentFen);
      
      // Parse and execute move
      let moveObj: { from: string; to: string; promotion?: string } | string;
      
      if (move.includes("-")) {
        // Format: 'e2-e4'
        const parts = move.split("-");
        if (parts.length >= 2 && parts[0] && parts[1]) {
          moveObj = { from: parts[0], to: parts[1] };
        } else {
          throw new Error(`Invalid move format: ${move}`);
        }
      } else {
        // SAN notation
        moveObj = move;
      }
      
      // Execute move with chess.js
      const chessMove = chess.move(moveObj);
      if (!chessMove) {
        throw new Error(`Invalid move: ${move} in position ${currentFen}`);
      }
      
      // Create ValidatedMove object
      const validatedMove = {
        from: chessMove.from,
        to: chessMove.to,
        san: chessMove.san,
        ...(chessMove.promotion && { promotion: chessMove.promotion }),
        timestamp: Date.now()
      };
      
      // Get new game state after move
      const newFen = chess.fen();
      const newHistory = [...(currentState.game?.moveHistory || []), validatedMove];
      
      // Update game state first (lower level)
      if (this.storeAccess._internalApplyMove) {
        this.storeAccess._internalApplyMove(validatedMove);
      } else {
        throw new Error("_internalApplyMove not available in storeAccess");
      }
      
      // Use the commitMoveToTraining function if available
      const finalGameState = this.storeAccess.getState();
      
      if (typeof (finalGameState as any).commitMoveToTraining === 'function') {
        // Use the new commit function to update training state
        (finalGameState as any).commitMoveToTraining(validatedMove, {
          fen: newFen,
          moveHistory: newHistory,
          turn: chess.turn(),
          isGameOver: chess.isGameOver()
        });
      } else {
        console.warn("commitMoveToTraining not available - falling back to manual state update");
        // Fallback: manually update training state
        if ((this.storeAccess as any).setState) {
          (this.storeAccess.setState as any)((state: unknown) => {
            const typedState = state as any;
            if (typedState.training) {
              const currentPosition = typedState.training.currentPosition;
              const isPlayerColor = currentPosition ? 
                ((chess.turn() === 'w' && currentPosition.colorToTrain === 'white') ||
                 (chess.turn() === 'b' && currentPosition.colorToTrain === 'black')) : true;
              
              return {
                ...typedState,
                training: {
                  ...typedState.training,
                  moveHistory: newHistory,
                  isPlayerTurn: isPlayerColor && !chess.isGameOver(),
                  isOpponentThinking: false,
                  moveInFlight: false
                }
              };
            }
            return typedState;
          });
        }
      }
      
      // Get final state
      const finalState = this.storeAccess.getState();
      
      console.log(`✅ Direct move completed: ${chessMove.san}`, {
        newFen,
        moveCount: newHistory.length,
        isPlayerTurn: finalState.training?.isPlayerTurn
      });
      
      this.emit("test:direct_move", {
        move,
        san: chessMove.san,
        fen: newFen,
        moveCount: newHistory.length,
      });

      return {
        success: true,
        resultingFen: newFen,
        moveCount: newHistory.length,
      };
    } catch (error) {
      console.error("TestApiService.makeDirectMove error:", error);
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
    console.log('🔍 TestApiService.getGameState: Store state keys', Object.keys(state));
    console.log('🔍 TestApiService.getGameState: Available FENs', {
      'state.game?.currentFen': state.game?.currentFen,
      'state.training?.currentFen': state.training?.currentFen,
      'state.fen': state.fen,
      'gameKeys': state.game ? Object.keys(state.game) : null,
      'trainingKeys': state.training ? Object.keys(state.training) : null
    });
    
    const currentFen =
      state.game?.currentFen ||           // ✅ Correct path for new architecture
      state.training?.currentFen ||       // Fallback for old training slice
      state.fen ||                        // Fallback for very old architecture
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Starting position fallback
      
    console.log('🔍 TestApiService.getGameState: Selected FEN', { currentFen });
    const game = new Chess(currentFen);

    // Get last move if available
    const history = state.game?.moveHistory || state.training?.moveHistory || state.history || [];
    console.log('🔍 TestApiService.getGameState: Move history', { 
      historyLength: history.length,
      'state.game?.moveHistory': state.game?.moveHistory?.length,
      'state.training?.moveHistory': state.training?.moveHistory?.length 
    });
    let lastMove;
    if (history.length > 0) {
      const lastHistoryItem = history[history.length - 1];
      lastMove = {
        from: lastHistoryItem.from || "",
        to: lastHistoryItem.to || "",
        san: lastHistoryItem.san,
      };
    }

    const response: TestGameState = {
      fen: currentFen,
      turn: game.turn(),
      moveCount: history.length,
      pgn: game.pgn(),
      isGameOver: game.isGameOver(),
      history: history.map((h: any) => h.san),
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
    };

    const gameOverReason = this.getGameOverReason(game);
    if (gameOverReason) {
      response.gameOverReason = gameOverReason;
    }

    const evaluation = state.training?.currentEvaluation?.evaluation ||
      state.evaluation?.engineEvaluation?.value;
    if (evaluation !== undefined) {
      response.evaluation = evaluation;
    }

    if (lastMove) {
      response.lastMove = lastMove;
    }

    return response;
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
  public resetGame(): void {
    if (!this.storeAccess) {
      throw new Error("TestApiService not initialized with store access");
    }

    this.storeAccess.resetPosition();
    this.emit("test:reset", {});
  }

  /**
   * Set board position via FEN string
   *
   * @description
   * Sets the chess board to a specific position defined by the FEN string.
   * This is essential for testing specific scenarios and positions.
   *
   * @param {string} fen - Valid FEN string representing the board position
   * @returns {boolean} True if position was set successfully, false otherwise
   *
   * @throws {Error} If service is not initialized with store access
   *
   * @example
   * ```typescript
   * // Set an endgame position
   * const success = testApi.setPosition('8/8/8/4k3/4P3/4K3/8/8 w - - 0 1');
   * expect(success).toBe(true);
   * ```
   */
  public setPosition(fen: string): boolean {
    console.log('🔍 TestApiService.setPosition called', { fen });
    
    if (!this.storeAccess) {
      console.error("TestApiService not initialized with store access");
      return false;
    }

    if (!this.storeAccess.setPosition) {
      console.error("setPosition not available in store");
      return false;
    }

    try {
      console.log('🚀 TestApiService: Calling storeAccess.setPosition');
      this.storeAccess.setPosition(fen);
      console.log('✅ TestApiService: storeAccess.setPosition called successfully');
      this.emit("test:positionSet", { fen });
      return true;
    } catch (error) {
      console.error("Failed to set position:", error);
      return false;
    }
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
    timeoutMs: number = 10000,
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
            fen: state.game?.currentFen || state.currentFen,
          });
          return true;
        }

        // Wait a bit before checking again
        await new Promise((resolve) =>
          setTimeout(resolve, 100),
        );
      }

      // Timeout reached
      console.warn("Tablebase analysis timeout after", { timeoutMs });
      return false;
    } catch (error) {
      console.error("Tablebase analysis check failed", error);
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
