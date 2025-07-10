/**
 * @fileoverview Test Bridge Type Definitions
 * @description Type-safe interface for the E2E Test Bridge
 */

/**
 * Engine analysis result from mock engine
 */
export interface EngineAnalysis {
  bestMove: string;
  evaluation: number;
  depth?: number;
}

/**
 * Test Bridge interface exposed on window object during E2E tests
 */
export interface ITestBridge {
  engine: {
    setNextMove(fen: string, move: string): void;
    setEvaluation(fen: string, evaluation: number): void;
    addCustomResponse(fen: string, analysis: EngineAnalysis): void;
    clearCustomResponses(): void;
    reset(): void;
  };
  waitForReady(timeout?: number): Promise<void>;
  enableDebugLogging(): void;
  disableDebugLogging(): void;
}

/**
 * Global type augmentation for window object
 */
declare global {
  interface Window {
    __E2E_TEST_BRIDGE__?: ITestBridge;
  }
}