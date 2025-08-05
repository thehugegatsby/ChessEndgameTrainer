/**
 * Global type declarations for E2E testing
 * Extends the Window interface with E2E test-specific properties
 */

interface Window {
  /**
   * Flag to indicate E2E test mode is active
   * Set by Playwright before navigation to avoid race conditions
   */
  __E2E_TEST_MODE__?: boolean;

  /**
   * E2E test hook for making chess moves programmatically
   * @param move - Move notation in format 'e2-e4', 'e2e4', 'Ke2-e4', 'Ke2e4'
   * @returns Promise with success status and optional error message
   */
  e2e_makeMove?: (move: string) => Promise<{
    success: boolean;
    error?: string;
    result?: any;
  }>;

  /**
   * E2E test hook for getting current game state
   * @returns Current game state including FEN, turn, game over status
   */
  e2e_getGameState?: () => {
    fen: string;
    turn: "w" | "b";
    isGameOver: boolean;
    isCheck: boolean;
    isCheckmate: boolean;
    moveCount: number;
  };

  // Test Bridge interface is already properly defined in shared/types/test-bridge.d.ts
  // This file should not redefine it to avoid conflicts

  /**
   * E2E Test Constants injected by webpack
   * Contains selectors, timeouts, and other test configuration
   */
  __E2E_TEST_CONSTANTS__?: {
    SELECTORS: Record<string, any>;
    TIMEOUTS: Record<string, number>;
    TEST_BRIDGE: Record<string, any>;
    // ... other constants
  };
}
