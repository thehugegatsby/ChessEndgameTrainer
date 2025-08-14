import { vi } from 'vitest';
/**
 * @file Unit tests for MoveStrategyService
 * @module tests/unit/services/MoveStrategyService.test
 * 
 * @description
 * Comprehensive test suite for MoveStrategyService which provides
 * different chess move selection strategies for opponent play.
 * Tests all three strategies: longest resistance, best move, and human-like.
 * 
 * @see {@link MoveStrategyService} - Service being tested
 * @see {@link TablebaseService} - Mocked dependency
 */

import type { TablebaseMove } from '@shared/types/tablebase';

// Use vi.hoisted to ensure mock is available before module imports
const { mockLoggerInstance } = vi.hoisted(() => {
  const loggerInstance = {
    error: vi.fn(),
    warn: vi.fn(), 
    debug: vi.fn(),
    setContext: vi.fn(),
  };
  loggerInstance.setContext.mockReturnValue(loggerInstance);
  return { mockLoggerInstance: loggerInstance };
});

// Mock dependencies BEFORE importing the service
vi.mock('@shared/services/logging', () => ({
  getLogger: vi.fn(() => mockLoggerInstance),
}));

vi.mock('@shared/services/TablebaseService');

// Now import the service and dependencies
import { moveStrategyService } from '@shared/services/MoveStrategyService';
import { tablebaseService } from '@shared/services/TablebaseService';

// Use the mock logger instance directly
const mockLogger = mockLoggerInstance;
const mockTablebaseService = tablebaseService as any;

/**
 * Create a mock TablebaseMove object for testing
 * 
 * @param overrides - Partial move properties to override defaults
 * @returns Complete TablebaseMove object
 */
const createMockMove = (overrides: Partial<TablebaseMove>): TablebaseMove => ({
  uci: 'e2e4',
  san: 'e4',
  wdl: 0,
  dtz: 0,
  dtm: null,
  category: 'draw' as const,
  ...overrides,
});

/**
 * Create a successful tablebase response with moves
 * 
 * @param moves - Array of moves to include in response
 * @returns Mocked tablebase response object
 */
const createMockResponse = (moves: TablebaseMove[]): { isAvailable: boolean; moves: TablebaseMove[] } => ({
  isAvailable: true,
  moves,
});

describe('MoveStrategyService', () => {
  const testFen = 'K7/P7/k7/8/8/8/8/8 w - - 0 1';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
  });

  describe('getLongestResistanceMove', () => {
    it('returns longest resistance move for losing position', async () => {
      const mockMoves = [
        createMockMove({ uci: 'a7a8q', san: 'a8=Q', wdl: -2, dtm: -15, dtz: -12 }),
        createMockMove({ uci: 'a7a8r', san: 'a8=R', wdl: -2, dtm: -8, dtz: -10 }),
        createMockMove({ uci: 'a8b7', san: 'Kb7', wdl: -2, dtm: -20, dtz: -15 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBe('a8b7'); // Highest DTM (20) for longest resistance
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledWith(testFen, 100);
    });

    it('returns fastest win for winning position', async () => {
      const mockMoves = [
        createMockMove({ uci: 'a7b6', san: 'Kb6', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'a7b7', san: 'Kb7', wdl: 2, dtm: 8, dtz: 5 }),
        createMockMove({ uci: 'a7a6', san: 'Ka6', wdl: 2, dtm: 3, dtz: 2 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBe('a7a6'); // Lowest DTZ (2) for fastest win
    });

    it('returns any drawing move for drawn position', async () => {
      const mockMoves = [
        createMockMove({ uci: 'a7b6', san: 'Kb6', wdl: 0, dtm: null, dtz: 0 }),
        createMockMove({ uci: 'a7b7', san: 'Kb7', wdl: 0, dtm: null, dtz: 0 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(['a7b6', 'a7b7']).toContain(result);
    });

    it('prefers DTM over DTZ for losing positions when available', async () => {
      const mockMoves = [
        createMockMove({ uci: 'move1', san: 'Move1', wdl: -2, dtm: -10, dtz: -20 }),
        createMockMove({ uci: 'move2', san: 'Move2', wdl: -2, dtm: -15, dtz: -5 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBe('move2'); // Higher DTM (15) despite lower DTZ
    });

    it('falls back to DTZ when DTM is not available', async () => {
      const mockMoves = [
        createMockMove({ uci: 'move1', san: 'Move1', wdl: -2, dtm: null, dtz: -10 }),
        createMockMove({ uci: 'move2', san: 'Move2', wdl: -2, dtm: null, dtz: -20 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBe('move2'); // Higher DTZ (20) when DTM unavailable
    });

    it('handles empty moves array', async () => {
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse([]));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No tablebase moves available for position',
        { fen: testFen }
      );
    });

    it('handles tablebase not available', async () => {
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: false,
      });

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBeNull();
    });

    it('handles tablebase service error gracefully', async () => {
      const error = new Error('Tablebase API error');
      mockTablebaseService.getTopMoves.mockRejectedValue(error);

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get longest resistance move',
        error,
        { fen: testFen }
      );
    });

    it('uses secondary criterion DTZ when DTM is equal', async () => {
      const mockMoves = [
        createMockMove({ uci: 'move1', san: 'Move1', wdl: -2, dtm: -10, dtz: -5 }),
        createMockMove({ uci: 'move2', san: 'Move2', wdl: -2, dtm: -10, dtz: -8 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBe('move2'); // Same DTM, higher DTZ wins
    });
  });

  describe('getBestMove', () => {
    it('returns objectively best move', async () => {
      const mockMoves = [
        createMockMove({ uci: 'a7a8q', san: 'a8=Q', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'a7a8r', san: 'a8=R', wdl: 2, dtm: 8, dtz: 5 }),
        createMockMove({ uci: 'a7b6', san: 'Kb6', wdl: 1, dtm: 12, dtz: 8 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getBestMove(testFen);

      expect(result).toBe('a7a8q'); // First move (API returns sorted)
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledWith(testFen, 1);
    });

    it('handles empty moves array', async () => {
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse([]));

      const result = await moveStrategyService.getBestMove(testFen);

      expect(result).toBeNull();
    });

    it('handles tablebase service error', async () => {
      const error = new Error('Tablebase API error');
      mockTablebaseService.getTopMoves.mockRejectedValue(error);

      const result = await moveStrategyService.getBestMove(testFen);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get best move',
        error,
        { fen: testFen }
      );
    });

    it('handles tablebase not available', async () => {
      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: false,
      });

      const result = await moveStrategyService.getBestMove(testFen);

      expect(result).toBeNull();
    });
  });

  describe('getHumanLikeMove', () => {
    it('returns best move with default strength most of the time', async () => {
      const mockMoves = [
        createMockMove({ uci: 'best', san: 'Best', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'good', san: 'Good', wdl: 2, dtm: 8, dtz: 5 }),
        createMockMove({ uci: 'okay', san: 'Okay', wdl: 1, dtm: 12, dtz: 8 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      // Mock Math.random to return value below strength threshold (0.8)
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.5);

      const result = await moveStrategyService.getHumanLikeMove(testFen);

      expect(result).toBe('best');
      
      Math.random = originalRandom;
    });

    it('occasionally returns suboptimal move', async () => {
      const mockMoves = [
        createMockMove({ uci: 'best', san: 'Best', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'good', san: 'Good', wdl: 2, dtm: 8, dtz: 5 }),
        createMockMove({ uci: 'okay', san: 'Okay', wdl: 1, dtm: 12, dtz: 8 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      // Mock Math.random to return value above strength threshold
      const originalRandom = Math.random;
      Math.random = vi.fn()
        .mockReturnValueOnce(0.85) // Above 0.8 threshold
        .mockReturnValueOnce(0.6); // For move selection

      const result = await moveStrategyService.getHumanLikeMove(testFen);

      expect(['best', 'good', 'okay']).toContain(result);
      
      Math.random = originalRandom;
    });

    it('always returns best move with strength 1', async () => {
      const mockMoves = [
        createMockMove({ uci: 'best', san: 'Best', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'good', san: 'Good', wdl: 2, dtm: 8, dtz: 5 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getHumanLikeMove(testFen, 1);

      expect(result).toBe('best');
    });

    it('handles single move gracefully', async () => {
      const mockMoves = [
        createMockMove({ uci: 'only', san: 'Only', wdl: 2, dtm: 5, dtz: 3 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getHumanLikeMove(testFen);

      expect(result).toBe('only');
    });

    it('handles empty moves array', async () => {
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse([]));

      const result = await moveStrategyService.getHumanLikeMove(testFen);

      expect(result).toBeNull();
    });

    it('handles tablebase service error', async () => {
      const error = new Error('Tablebase API error');
      mockTablebaseService.getTopMoves.mockRejectedValue(error);

      const result = await moveStrategyService.getHumanLikeMove(testFen);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get human-like move',
        error,
        { fen: testFen }
      );
    });

    it('respects custom strength parameter', async () => {
      const mockMoves = [
        createMockMove({ uci: 'best', san: 'Best', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'good', san: 'Good', wdl: 2, dtm: 8, dtz: 5 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.3); // Below 0.5 strength

      const result = await moveStrategyService.getHumanLikeMove(testFen, 0.5);

      expect(result).toBe('best');
      
      Math.random = originalRandom;
    });
  });

  describe('Integration scenarios', () => {
    it('handles all service methods consistently for same position', async () => {
      const mockMoves = [
        createMockMove({ uci: 'a7a8q', san: 'a8=Q', wdl: 2, dtm: 5, dtz: 3 }),
        createMockMove({ uci: 'a7a8r', san: 'a8=R', wdl: 2, dtm: 8, dtz: 5 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const [longest, best, humanLike] = await Promise.all([
        moveStrategyService.getLongestResistanceMove(testFen),
        moveStrategyService.getBestMove(testFen),
        moveStrategyService.getHumanLikeMove(testFen),
      ]);

      expect(longest).toBeDefined();
      expect(best).toBeDefined();
      expect(humanLike).toBeDefined();
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledTimes(3);
    });

    it('logs debug information for move selection', async () => {
      const mockMoves = [
        createMockMove({ uci: 'a7a8q', san: 'a8=Q', wdl: 2, dtm: 5, dtz: 3 }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      await moveStrategyService.getLongestResistanceMove(testFen);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Selected'),
        expect.objectContaining({
          move: 'a8=Q',
        })
      );
    });

    it('handles positions with undefined/null DTM and DTZ gracefully', async () => {
      const mockMoves = [
        createMockMove({ uci: 'move1', san: 'Move1', wdl: 0, dtm: undefined, dtz: null }),
        createMockMove({ uci: 'move2', san: 'Move2', wdl: 0, dtm: null, dtz: undefined }),
      ];
      mockTablebaseService.getTopMoves.mockResolvedValue(createMockResponse(mockMoves));

      const result = await moveStrategyService.getLongestResistanceMove(testFen);

      expect(result).toBeDefined();
      expect(['move1', 'move2']).toContain(result);
    });
  });
});