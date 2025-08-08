/**
 * @file Test Bridge Type Definitions
 * @version 1.0.0
 * @description Type definitions for E2E Test Bridge API.
 * Provides type-safe interface between Playwright tests and application.
 *
 * ARCHITECTURE PRINCIPLES:
 * - Minimal surface area for test control
 * - Type-safe without circular dependencies
 * - Zero production overhead (types only)
 * - Extensible for future services
 */

// Tablebase analysis type for E2E test configuration
/**
 *
 */
type TablebaseAnalysis = any;
import type { AnalysisStatus } from "../store/types";

/**
 * Tablebase control API for E2E tests
 * Provides methods to configure mock tablebase behavior
 */
export interface TestBridgeTablebaseAPI {
  /**
   * Set the next move the tablebase should return
   */
  setNextMove: (fen: string, move: string) => void;

  /**
   * Set a specific evaluation for a position
   */
  setEvaluation: (fen: string, evaluation: number) => void;

  /**
   * Add a complete custom response for a position
   */
  addCustomResponse: (fen: string, analysis: TablebaseAnalysis) => void;

  /**
   * Clear all custom responses
   */
  clearCustomResponses: () => void;

  /**
   * Reset tablebase to default state
   */
  reset: () => void;
}

/**
 * Diagnostic API for read-only state access
 * Optional - to be added in Phase 4
 */
export interface TestBridgeDiagnosticAPI {
  /**
   * Get current game state
   */
  getGameState: () => {
    fen: string;
    moveCount: number;
    isGameOver: boolean;
    turn: "w" | "b";
  } | null;

  /**
   * Get current analysis status
   */
  getAnalysisStatus: () => AnalysisStatus;
}

/**
 * Main Test Bridge interface
 * Global object available in E2E test environment
 */
export interface TestBridge {
  /**
   * Tablebase control API
   */
  tablebase: TestBridgeTablebaseAPI;

  /**
   * Diagnostic API (optional, added later)
   */
  diagnostic?: TestBridgeDiagnosticAPI;

  /**
   * Wait for tablebase to be ready
   * @param timeout - Maximum time to wait in milliseconds (default: 2000)
   * @returns Promise that resolves when tablebase is ready
   * @throws Error if timeout is exceeded
   */
  waitForReady: (timeout?: number) => Promise<void>;

  /**
   * Enable debug logging for test bridge
   */
  enableDebugLogging?: () => void;

  /**
   * Disable debug logging
   */
  disableDebugLogging?: () => void;
}

/**
 * Global type augmentation for window object
 * Makes TypeScript aware of the test bridge
 */
declare global {
  /**
   *
   */
  interface Window {
    __E2E_TEST_BRIDGE__?: TestBridge;
  }
}
