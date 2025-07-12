/**
 * @fileoverview Unit Tests for Critical Mistake Detection
 * @description Tests the core logic for identifying critical chess mistakes
 */

// Mock the engine singleton first
const mockEngine = {
  evaluatePosition: jest.fn()
};

jest.mock('../../../../shared/lib/chess/engine/singleton', () => ({
  engine: mockEngine
}));

import { isCriticalMistake } from '../../../../shared/lib/chess/mistakeCheck';
import { EVALUATION } from '@shared/constants';

describe('isCriticalMistake', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Win -> Draw/Loss scenarios', () => {
    it('should detect win to draw as critical mistake', async () => {
      // Setup: Winning position becomes drawish
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 400, mate: null }) // Winning (+4 pawns)
        .mockResolvedValueOnce({ score: 200, mate: null }); // Drawish (+2 pawns)

      const result = await isCriticalMistake(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
      );

      expect(result).toBe(true);
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(2);
    });

    it('should detect win to loss as critical mistake', async () => {
      // Setup: Winning position becomes losing
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 500, mate: null }) // Winning (+5 pawns)
        .mockResolvedValueOnce({ score: -400, mate: null }); // Losing (-4 pawns)

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true);
    });

    it('should detect mate advantage to loss as critical mistake', async () => {
      // Setup: Mate in X becomes losing
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 5 }) // Mate in 5
        .mockResolvedValueOnce({ score: -400, mate: null }); // Losing

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true);
    });
  });

  describe('Draw/Equal -> Loss scenarios', () => {
    it('should detect draw to loss as critical mistake', async () => {
      // Setup: Equal position becomes losing
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 50, mate: null }) // Nearly equal
        .mockResolvedValueOnce({ score: -350, mate: null }); // Losing

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true);
    });

    it('should detect slight advantage to loss as critical mistake', async () => {
      // Setup: Slight advantage becomes losing
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 150, mate: null }) // Slight advantage
        .mockResolvedValueOnce({ score: -400, mate: null }); // Losing

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true);
    });

    it('should detect equal to mate against as critical mistake', async () => {
      // Setup: Equal position becomes mate against
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: null }) // Equal
        .mockResolvedValueOnce({ score: 100, mate: -3 }); // Mate in 3 against

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true);
    });
  });

  describe('Non-critical scenarios', () => {
    it('should not detect win to better win as mistake', async () => {
      // Setup: Winning position becomes even more winning
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 400, mate: null }) // Winning
        .mockResolvedValueOnce({ score: 600, mate: null }); // More winning

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false);
    });

    it('should not detect win to slightly less win as mistake', async () => {
      // Setup: Big win becomes smaller win (but still winning)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 600, mate: null }) // Big win
        .mockResolvedValueOnce({ score: 350, mate: null }); // Still winning

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false);
    });

    it('should not detect equal to slightly better as mistake', async () => {
      // Setup: Equal position becomes slightly better
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: null }) // Equal
        .mockResolvedValueOnce({ score: 150, mate: null }); // Slightly better

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false);
    });

    it('should not detect loss to worse loss as mistake', async () => {
      // Setup: Already losing, becomes more losing
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: -400, mate: null }) // Losing
        .mockResolvedValueOnce({ score: -600, mate: null }); // More losing

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false);
    });

    it('should not detect loss to less loss as mistake', async () => {
      // Setup: Losing position improves but still losing
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: -500, mate: null }) // Losing
        .mockResolvedValueOnce({ score: -350, mate: null }); // Less losing

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false);
    });
  });

  describe('Mate evaluation handling', () => {
    it('should handle mate for player correctly', async () => {
      // Setup: Mate advantage to drawish
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 200, mate: 3 }) // Mate in 3 for player
        .mockResolvedValueOnce({ score: 100, mate: null }); // Drawish

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true); // Lost mate advantage
    });

    it('should handle mate against player correctly', async () => {
      // Setup: Equal to mate against
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 50, mate: null }) // Nearly equal
        .mockResolvedValueOnce({ score: 200, mate: -4 }); // Mate in 4 against

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true); // Now facing mate
    });

    it('should handle mate to mate correctly', async () => {
      // Setup: Mate advantage maintained
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: 5 }) // Mate in 5
        .mockResolvedValueOnce({ score: 50, mate: 3 }); // Mate in 3

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false); // Still mate advantage, just faster
    });

    it('should handle negative mate to positive mate', async () => {
      // Setup: Facing mate, then giving mate (defensive save)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: -2 }) // Mate against in 2
        .mockResolvedValueOnce({ score: 0, mate: 4 }); // Mate for in 4

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(false); // Improved from facing mate to giving mate
    });
  });

  describe('Boundary value testing', () => {
    it('should handle exact threshold values', async () => {
      // Test WIN_THRESHOLD boundary (300 centipawns)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: EVALUATION.WIN_THRESHOLD + 1, mate: null }) // Just winning
        .mockResolvedValueOnce({ score: EVALUATION.WIN_THRESHOLD, mate: null }); // Exactly at threshold

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true); // Dropped from winning to threshold
    });

    it('should handle LOSS_THRESHOLD boundary', async () => {
      // Test LOSS_THRESHOLD boundary (-300 centipawns)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: EVALUATION.LOSS_THRESHOLD, mate: null }) // At threshold
        .mockResolvedValueOnce({ score: EVALUATION.LOSS_THRESHOLD - 1, mate: null }); // Just losing

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true); // Dropped below losing threshold
    });

    it('should handle MATE_THRESHOLD correctly', async () => {
      // Ensure mate values are converted to MATE_THRESHOLD
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: 1 }) // Mate in 1
        .mockResolvedValueOnce({ score: 50, mate: null }); // Normal score

      const result = await isCriticalMistake('fen_before', 'fen_after');

      // Mate in 1 should be treated as MATE_THRESHOLD (very high value)
      expect(result).toBe(true); // Lost mate advantage
    });
  });

  describe('Error handling', () => {
    it('should handle engine evaluation errors', async () => {
      // Setup: Engine throws error
      mockEngine.evaluatePosition
        .mockRejectedValueOnce(new Error('Engine error'))
        .mockResolvedValueOnce({ score: 100, mate: null });

      await expect(isCriticalMistake('fen_before', 'fen_after'))
        .rejects.toThrow('Engine error');
    });

    it('should handle null/undefined evaluation results', async () => {
      // Setup: Engine returns unexpected format
      mockEngine.evaluatePosition
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ score: 100, mate: null });

      await expect(isCriticalMistake('fen_before', 'fen_after'))
        .rejects.toThrow();
    });
  });

  describe('Concurrent evaluation calls', () => {
    it('should handle parallel evaluation calls correctly', async () => {
      // Setup: Both positions evaluated in parallel
      mockEngine.evaluatePosition
        .mockImplementation((fen) => {
          if (fen === 'fen_before') {
            return Promise.resolve({ score: 400, mate: null });
          } else {
            return Promise.resolve({ score: 100, mate: null });
          }
        });

      const result = await isCriticalMistake('fen_before', 'fen_after');

      expect(result).toBe(true);
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith('fen_before');
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith('fen_after');
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(2);
    });
  });
});