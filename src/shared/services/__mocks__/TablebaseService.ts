import { vi } from 'vitest';
/**
 * Central Mock for TablebaseService
 *
 * This mock provides a consistent, centralized mock implementation for the TablebaseService
 * that can be used across all test files. It follows Jest's manual mock pattern.
 *
 * Usage:
 * - Jest will automatically use this mock when `jest.mock('@shared/services/TablebaseService')` is called
 * - Test files can import helper methods to customize mock behavior
 * - Default implementations return sensible test data
 */

import {
  type TablebaseEvaluation,
  type TablebaseMovesResult,
  type TablebaseMove,
  type TablebaseResult,
} from "@shared/types/tablebase";

/**
 * Default mock tablebase result
 */
const createDefaultResult = (): TablebaseResult => ({
  wdl: 0,
  dtz: 0,
  dtm: null,
  category: "draw",
  precise: false,
  evaluation: "Remis",
});

/**
 * Default mock tablebase move
 */
const createDefaultMove = (): TablebaseMove => ({
  uci: "e2e4",
  san: "e4",
  wdl: 0,
  dtz: 0,
  dtm: null,
  category: "draw",
});

/**
 * Mock TablebaseService implementation
 */
class MockTablebaseService {
  // Mock methods as vi functions
  getEvaluation = vi.fn();
  getTopMoves = vi.fn();
  clearCache = vi.fn();
  getMetrics = vi.fn();

  constructor() {
    // Set up default implementations
    this.setupDefaults();
  }

  /**
   * Setup default mock implementations
   */
  setupDefaults(): void {
    // Default getEvaluation - returns draw position
    this.getEvaluation.mockImplementation((_fen: string) => Promise.resolve({
      isAvailable: true,
      result: createDefaultResult(),
    }));

    // Default getTopMoves - returns one draw move
    this.getTopMoves.mockImplementation(
      async (_fen: string, _limit?: number) => ({
        isAvailable: true,
        moves: [createDefaultMove()],
      }),
    );

    // Default clearCache - does nothing
    this.clearCache.mockImplementation(() => undefined);

    // Default getMetrics
    this.getMetrics.mockReturnValue({
      cacheHitRate: 0,
      totalApiCalls: 0,
      cacheSize: 0,
      maxCacheSize: 200,
    });
  }

  /**
   * Helper: Mock a winning position
   */
  mockWinPosition(fen?: string, dtm: number = 5): void {
    const result: TablebaseResult = {
      wdl: 2,
      dtz: dtm * 2,
      dtm: dtm,
      category: "win",
      precise: true,
      evaluation: `Gewinn in ${dtm} Zügen`,
    };

    const move: TablebaseMove = {
      uci: "e2e3",
      san: "Ke3",
      wdl: 2,
      dtz: (dtm - 1) * 2,
      dtm: dtm - 1,
      category: "win",
    };

    if (fen) {
      this.getEvaluation.mockImplementation(async (f: string) =>
        f === fen ? { isAvailable: true, result } : { isAvailable: false },
      );
      this.getTopMoves.mockImplementation(async (f: string) =>
        f === fen
          ? { isAvailable: true, moves: [move] }
          : { isAvailable: false },
      );
    } else {
      this.getEvaluation.mockResolvedValue({ isAvailable: true, result });
      this.getTopMoves.mockResolvedValue({ isAvailable: true, moves: [move] });
    }
  }

  /**
   * Helper: Mock a draw position
   */
  mockDrawPosition(fen?: string): void {
    const result: TablebaseResult = {
      wdl: 0,
      dtz: 0,
      dtm: null,
      category: "draw",
      precise: true,
      evaluation: "Remis",
    };

    const move: TablebaseMove = {
      uci: "e2e3",
      san: "Ke3",
      wdl: 0,
      dtz: 0,
      dtm: null,
      category: "draw",
    };

    if (fen) {
      this.getEvaluation.mockImplementation(async (f: string) =>
        f === fen ? { isAvailable: true, result } : { isAvailable: false },
      );
      this.getTopMoves.mockImplementation(async (f: string) =>
        f === fen
          ? { isAvailable: true, moves: [move] }
          : { isAvailable: false },
      );
    } else {
      this.getEvaluation.mockResolvedValue({ isAvailable: true, result });
      this.getTopMoves.mockResolvedValue({ isAvailable: true, moves: [move] });
    }
  }

  /**
   * Helper: Mock a losing position
   */
  mockLossPosition(fen?: string, dtm: number = -5): void {
    const result: TablebaseResult = {
      wdl: -2,
      dtz: dtm * 2,
      dtm: dtm,
      category: "loss",
      precise: true,
      evaluation: `Verlust in ${Math.abs(dtm)} Zügen`,
    };

    const move: TablebaseMove = {
      uci: "e8d7",
      san: "Kd7",
      wdl: -2,
      dtz: (dtm + 1) * 2,
      dtm: dtm + 1,
      category: "loss",
    };

    if (fen) {
      this.getEvaluation.mockImplementation(async (f: string) =>
        f === fen ? { isAvailable: true, result } : { isAvailable: false },
      );
      this.getTopMoves.mockImplementation(async (f: string) =>
        f === fen
          ? { isAvailable: true, moves: [move] }
          : { isAvailable: false },
      );
    } else {
      this.getEvaluation.mockResolvedValue({ isAvailable: true, result });
      this.getTopMoves.mockResolvedValue({ isAvailable: true, moves: [move] });
    }
  }

  /**
   * Helper: Mock API error
   */
  mockApiError(errorMessage: string = "Tablebase API unavailable"): void {
    this.getEvaluation.mockRejectedValue(new Error(errorMessage));
    this.getTopMoves.mockRejectedValue(new Error(errorMessage));
  }

  /**
   * Helper: Mock position not in tablebase
   */
  mockNotAvailable(fen?: string): void {
    const response: TablebaseEvaluation = {
      isAvailable: false,
      error: "Position not in tablebase",
    };

    const movesResponse: TablebaseMovesResult = {
      isAvailable: false,
      error: "Position not in tablebase",
    };

    if (fen) {
      this.getEvaluation.mockImplementation(async (f: string) =>
        f === fen
          ? response
          : { isAvailable: true, result: createDefaultResult() },
      );
      this.getTopMoves.mockImplementation(async (f: string) =>
        f === fen
          ? movesResponse
          : { isAvailable: true, moves: [createDefaultMove()] },
      );
    } else {
      this.getEvaluation.mockResolvedValue(response);
      this.getTopMoves.mockResolvedValue(movesResponse);
    }
  }

  /**
   * Helper: Mock loading state
   */
  mockLoading(delayMs: number = 1000): void {
    this.getEvaluation.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                isAvailable: true,
                result: {
                  wdl: 2,
                  dtz: 10,
                  dtm: 5,
                  category: "win",
                  precise: true,
                  evaluation: "Gewinn in 5 Zügen",
                },
              }),
            delayMs,
          ),
        ),
    );

    this.getTopMoves.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                isAvailable: true,
                moves: [
                  {
                    uci: "e2e3",
                    san: "Ke3",
                    wdl: 2,
                    dtz: 8,
                    dtm: 4,
                    category: "win",
                  },
                ],
              }),
            delayMs,
          ),
        ),
    );
  }

  /**
   * Helper: Reset all mocks to defaults
   */
  reset(): void {
    this.getEvaluation.mockClear();
    this.getTopMoves.mockClear();
    this.clearCache.mockClear();
    this.getMetrics.mockClear();
    this.setupDefaults();
  }

  /**
   * Helper: Clear mock calls but keep implementations
   */
  clearCalls(): void {
    this.getEvaluation.mockClear();
    this.getTopMoves.mockClear();
    this.clearCache.mockClear();
    this.getMetrics.mockClear();
  }
}

// Create singleton instance
const mockTablebaseService = new MockTablebaseService();

// Export as named export to match the real module
export const tablebaseService = mockTablebaseService;

// Export helper functions for easy test setup
export const mockWinPosition = (fen?: string, dtm?: number): void =>
  mockTablebaseService.mockWinPosition(fen, dtm);

export const mockDrawPosition = (fen?: string): void =>
  mockTablebaseService.mockDrawPosition(fen);

export const mockLossPosition = (fen?: string, dtm?: number): void =>
  mockTablebaseService.mockLossPosition(fen, dtm);

export const mockApiError = (message?: string): void =>
  mockTablebaseService.mockApiError(message);

export const mockNotAvailable = (fen?: string): void =>
  mockTablebaseService.mockNotAvailable(fen);

export const mockLoading = (delayMs?: number): void =>
  mockTablebaseService.mockLoading(delayMs);

export const resetMock = (): void => mockTablebaseService.reset();

export const clearMockCalls = (): void => mockTablebaseService.clearCalls();
