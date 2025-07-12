/**
 * @fileoverview Unit tests for EvaluationService
 * Tests position evaluation, mistake detection, and analysis
 */

// Mock dependencies before imports
jest.mock('@shared/lib/chess/tablebase');
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    warn: jest.fn()
  })
}));

// Mock the SCENARIO_CONFIG
jest.mock('@shared/lib/chess/ScenarioEngine/types', () => ({
  SCENARIO_CONFIG: {
    CRITICAL_MISTAKE_THRESHOLD: 200, // 2 pawns
    TABLEBASE_LIMIT_CP: 10000 // 100 pawns
  }
}));

import { EvaluationService } from '@shared/lib/chess/ScenarioEngine/evaluationService';
import { tablebaseService } from '@shared/lib/chess/tablebase';
import type { Engine } from '@shared/lib/chess/engine/index';
import type { EngineEvaluation, DualEvaluation } from '@shared/lib/chess/ScenarioEngine/types';

describe('EvaluationService', () => {
  let evaluationService: EvaluationService;
  let mockEngine: jest.Mocked<Engine>;

  const whiteFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const blackFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock engine
    mockEngine = {
      evaluatePosition: jest.fn()
    } as any;

    // Create service instance
    evaluationService = new EvaluationService(mockEngine);
  });

  describe('constructor', () => {
    it('should initialize with engine', () => {
      expect(evaluationService).toBeDefined();
      expect(evaluationService).toBeInstanceOf(EvaluationService);
    });
  });

  describe('isCriticalMistake', () => {
    it('should detect sign flip as critical mistake', async () => {
      // White was winning (+3.0), now losing (-2.0)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 300, mate: null }) // fenBefore
        .mockResolvedValueOnce({ score: 200, mate: null }); // fenAfter (Black's perspective)

      const result = await evaluationService.isCriticalMistake(whiteFen, blackFen);

      expect(result).toBe(true);
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(whiteFen);
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(blackFen);
    });

    it('should detect significant score drop as critical mistake', async () => {
      // White drops from +5.0 to +2.0 (300 cp drop)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 500, mate: null })
        .mockResolvedValueOnce({ score: 200, mate: null });

      const result = await evaluationService.isCriticalMistake(whiteFen, whiteFen);

      expect(result).toBe(true);
    });

    it('should not flag small score changes as mistakes', async () => {
      // Small drop from +1.0 to +0.5
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: null })
        .mockResolvedValueOnce({ score: 50, mate: null });

      const result = await evaluationService.isCriticalMistake(whiteFen, whiteFen);

      expect(result).toBe(false);
    });

    it('should detect losing mate advantage as critical mistake', async () => {
      // Had mate in 5, now only +3.0
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 5 })
        .mockResolvedValueOnce({ score: 300, mate: null });

      const result = await evaluationService.isCriticalMistake(whiteFen, whiteFen);

      expect(result).toBe(true);
    });

    it('should detect getting mated as critical mistake', async () => {
      // Was equal, now facing mate
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: null })
        .mockResolvedValueOnce({ score: 0, mate: -3 });

      const result = await evaluationService.isCriticalMistake(whiteFen, whiteFen);

      expect(result).toBe(true);
    });

    it('should not flag mate sequence continuation as mistake', async () => {
      // Mate in 5 → Mate in 3
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 5 })
        .mockResolvedValueOnce({ score: 0, mate: 3 });

      const result = await evaluationService.isCriticalMistake(whiteFen, whiteFen);

      expect(result).toBe(false);
    });

    it('should handle tablebase positions with timeout', async () => {
      // Both positions are tablebase scores
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 15000, mate: null })
        .mockResolvedValueOnce({ score: 15000, mate: null });

      // Mock setTimeout to trigger timeout immediately
      jest.useFakeTimers();
      
      const resultPromise = evaluationService.isCriticalMistake(whiteFen, whiteFen);
      
      // Fast-forward time to trigger timeout
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      jest.useRealTimers();

      // Should timeout and return false
      expect(result).toBe(false);
    });

    it('should detect mate when already under threat', async () => {
      // Was facing mate in 10, now facing mate in 2
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: -10 })
        .mockResolvedValueOnce({ score: 0, mate: -2 });

      const result = await evaluationService.isCriticalMistake(whiteFen, whiteFen);

      // Not a mistake - both are losing positions
      expect(result).toBe(false);
    });

    it('should handle evaluation errors gracefully', async () => {
      mockEngine.evaluatePosition.mockRejectedValue(new Error('Engine error'));

      const result = await evaluationService.isCriticalMistake(whiteFen, blackFen);

      expect(result).toBe(false);
    });

    it('should apply perspective correction for Black moves', async () => {
      // Before: White +2.0, After: Black's turn shows -1.8 (White's +1.8)
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 200, mate: null })
        .mockResolvedValueOnce({ score: -180, mate: null }); // Black's perspective

      const result = await evaluationService.isCriticalMistake(whiteFen, blackFen);

      // Small drop, not a mistake
      expect(result).toBe(false);
    });

    it('should handle mate perspective correction', async () => {
      // White to move: mate in 3, Black to move: getting mated in 2
      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 3 })
        .mockResolvedValueOnce({ score: 0, mate: -2 }); // Black's perspective

      const result = await evaluationService.isCriticalMistake(whiteFen, blackFen);

      // Continuing mate sequence, not a mistake
      expect(result).toBe(false);
    });
  });

  describe('getDualEvaluation', () => {
    beforeEach(() => {
      // Mock tablebaseService
      (tablebaseService.queryPosition as jest.Mock) = jest.fn();
    });

    it('should return engine evaluation for non-tablebase position', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 123, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: false
      });

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result).toEqual({
        engine: {
          score: 123,
          mate: null,
          evaluation: '+1.2'
        },
        tablebase: undefined
      });
    });

    it('should return both engine and tablebase evaluations', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 15000, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 25,
          category: 'win',
          precise: true
        }
      });

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result).toEqual({
        engine: {
          score: 15000,
          mate: null,
          evaluation: '+150.0'
        },
        tablebase: {
          isAvailable: true,
          result: {
            wdl: 2,
            dtz: 25,
            category: 'win',
            precise: true
          },
          evaluation: 'Win in 25'
        }
      });
    });

    it('should apply perspective correction for Black to move', async () => {
      // Engine returns -150 from Black's perspective
      mockEngine.evaluatePosition.mockResolvedValue({ score: -150, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: -2, // Loss for Black = Win for White
          dtz: 30,
          category: 'loss',
          precise: true
        }
      });

      const result = await evaluationService.getDualEvaluation(blackFen);

      expect(result).toEqual({
        engine: {
          score: 150, // Corrected to White's perspective
          mate: null,
          evaluation: '+1.5'
        },
        tablebase: {
          isAvailable: true,
          result: {
            wdl: 2, // Corrected to White's perspective
            dtz: -30, // Corrected sign
            category: 'win', // Corrected category
            precise: true
          },
          evaluation: 'Win in 30' // Math.abs applied to DTZ
        }
      });
    });

    it('should format mate evaluations correctly', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: 3 });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: false
      });

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result.engine.evaluation).toBe('M3');
    });

    it('should handle negative mate correctly', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: -5 });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: false
      });

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result.engine.evaluation).toBe('M-5');
    });

    it('should handle tablebase special categories', async () => {
      const testCases = [
        { category: 'draw', expected: 'Draw' },
        { category: 'cursed-win', expected: 'Cursed Win' },
        { category: 'blessed-loss', expected: 'Blessed Loss' },
        { category: 'unknown', expected: 'Unknown' }
      ];

      for (const testCase of testCases) {
        mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
        (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
          isTablebasePosition: true,
          result: {
            wdl: 0,
            category: testCase.category,
            precise: true
          }
        });

        const result = await evaluationService.getDualEvaluation(whiteFen);

        expect(result.tablebase?.isAvailable).toBe(true);
        if (result.tablebase?.isAvailable) {
          expect(result.tablebase.evaluation).toBe(testCase.expected);
        }
      }
    });

    it('should handle tablebase query errors gracefully', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 50, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockRejectedValue(new Error('Tablebase error'));

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result).toEqual({
        engine: {
          score: 50,
          mate: null,
          evaluation: '+0.5'
        },
        tablebase: undefined
      });
    });

    it('should handle engine evaluation errors', async () => {
      mockEngine.evaluatePosition.mockRejectedValue(new Error('Engine crashed'));

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result).toEqual({
        engine: {
          score: 0,
          mate: null,
          evaluation: 'Evaluation unavailable'
        }
      });
    });

    it('should format negative scores correctly', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: -234, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: false
      });

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result.engine.evaluation).toBe('-2.3');
    });

    it('should handle DTZ without category correctly', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 10000, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 15,
          precise: true
          // missing category
        }
      });

      const result = await evaluationService.getDualEvaluation(whiteFen);

      expect(result.tablebase?.isAvailable).toBe(true);
      if (result.tablebase?.isAvailable) {
        expect(result.tablebase.evaluation).toBe('Unknown');
      }
    });
  });
});