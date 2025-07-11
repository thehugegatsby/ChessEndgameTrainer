/**
 * @fileoverview ModernDriver Interface - Lean E2E Test Orchestrator
 * @description Replaces the 1847-line AppDriver with a focused ~300-line implementation
 * 
 * CRITICAL CONSTRAINT: This interface MUST NOT grow beyond 10 methods!
 * The implementation MUST stay under 300 lines total.
 * 
 * Design Principles (Consensus from Gemini & O3):
 * 1. Pure orchestration - no business logic
 * 2. Data provider, not verifier (tests do assertions)
 * 3. Maximum 10 public methods (currently 9)
 * 4. Clear separation of concerns
 * 5. No direct component exposure (avoid coupling)
 * 
 * Architecture:
 * ModernDriver → Helper Classes → Component Objects
 * 
 * Review History:
 * - 2025-01-10: Gemini suggested component accessors - REJECTED to prevent bloat
 * - 2025-01-10: O3 confirmed getUIState() as good compromise
 */

/**
 * Game state representation for E2E tests
 * Provides essential information without overloading
 */
export interface GameState {
  /** Current board position in FEN notation */
  fen: string;
  
  /** Active player */
  turn: 'w' | 'b';
  
  /** Total number of half-moves played */
  moveCount: number;
  
  /** Current game status */
  status: 'playing' | 'checkmate' | 'stalemate' | 'draw';
  
  /** Current scenario ID (extracted from URL) */
  scenario?: number;
  
  /** Details of the last move played */
  lastMove?: {
    from: string;
    to: string;
    san: string;
  };
}

/**
 * Setup options for flexible test initialization
 * Supports both FEN positions and predefined scenarios
 */
export interface SetupOptions {
  /** Custom position in FEN notation */
  fen?: string;
  
  /** Predefined scenario ID (e.g., training position) */
  scenario?: number;
  
  /** Mock engine responses for deterministic tests */
  engineMocks?: {
    [fen: string]: { bestMove: string; evaluation: number };
  };
}

/**
 * UI state representation for test assertions
 * Aggregates commonly needed UI information
 */
export interface UIState {
  /** Text of the last move in the move list */
  lastMoveText: string;
  
  /** Current engine evaluation display */
  evaluationText: string;
  
  /** Whether the engine is currently thinking */
  isThinking: boolean;
}

/**
 * ModernDriver Interface - Lean orchestrator for E2E tests
 * 
 * @example
 * ```typescript
 * const driver = new ModernDriver(page);
 * await driver.visit('/train/1');
 * await driver.makeMove('e2', 'e4');
 * const state = await driver.getGameState();
 * expect(state.moveCount).toBe(1);
 * ```
 */
export interface IModernDriver {
  // ==============================
  // Navigation & Setup (2 methods)
  // ==============================
  
  /**
   * Navigate to a specific path in the application
   * @param path - Relative path (e.g., '/train/1')
   */
  visit(path: string): Promise<void>;
  
  /**
   * Setup the test environment with specific conditions
   * @param options - Configuration for position and mocks
   */
  setup(options: SetupOptions): Promise<void>;
  
  // ==============================
  // Game Actions (2 methods)
  // ==============================
  
  /**
   * Execute a single move on the board
   * @param from - Source square (e.g., 'e2')
   * @param to - Target square (e.g., 'e4')
   * @param promotion - Optional promotion piece ('q', 'r', 'b', 'n')
   */
  makeMove(from: string, to: string, promotion?: string): Promise<void>;
  
  /**
   * Execute a sequence of moves
   * @param moves - Array of moves in coordinate notation ['e2-e4', 'd7-d5']
   */
  playMoves(moves: string[]): Promise<void>;
  
  // ==============================
  // State Queries (2 methods)  
  // ==============================
  
  /**
   * Get comprehensive game state
   * Aggregates data from multiple components
   */
  getGameState(): Promise<GameState>;
  
  /**
   * Get UI-specific state for assertions
   * Aggregates commonly needed UI information without exposing components
   * 
   * @example
   * const ui = await driver.getUIState();
   * expect(ui.lastMoveText).toBe('1. e4');
   * expect(ui.evaluationText).toContain('+0.3');
   */
  getUIState(): Promise<UIState>;
  
  // ==============================
  // Synchronization (2 methods)
  // ==============================
  
  /**
   * Wait for the engine to make its move
   * Essential for stable test execution
   */
  waitForEngineMove(): Promise<void>;
  
  /**
   * Wait until the application is fully loaded and ready for interaction
   * Waits for: board to be visible, engine to be initialized, no loading spinners
   * Called automatically by visit(), but exposed for special cases
   */
  waitUntilReady(): Promise<void>;
  
  // ==============================
  // Lifecycle (1 method)
  // ==============================
  
  /**
   * Clean up resources and reset state
   * Should be called in afterEach() hooks
   */
  dispose(): Promise<void>;
}

/**
 * Error thrown when ModernDriver operations fail
 * Provides context for debugging test failures
 */
export class ModernDriverError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ModernDriverError';
  }
}