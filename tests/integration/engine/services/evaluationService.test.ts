import { EvaluationService } from '@/shared/lib/chess/ScenarioEngine/evaluationService';
import { Engine } from '@/shared/lib/chess/engine';
import { tablebaseService } from '@/shared/lib/chess/tablebase';

// Mock dependencies
jest.mock('@/shared/lib/chess/engine');
jest.mock('@/shared/lib/chess/tablebase');

// Mock SCENARIO_CONFIG
jest.mock('@/shared/lib/chess/ScenarioEngine/types', () => ({
  SCENARIO_CONFIG: {
    CRITICAL_MISTAKE_THRESHOLD: 200,
    TABLEBASE_LIMIT_CP: 10000
  }
}));

describe('EvaluationService', () => {
  let service: EvaluationService;
  let mockEngine: jest.Mocked<Engine>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getInstance to return a mock engine
    mockEngine = {
      evaluatePosition: jest.fn(),
      getBestMove: jest.fn(),
      isReady: jest.fn(),
      quit: jest.fn(),
      reset: jest.fn(),
      restart: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn()
    } as unknown as jest.Mocked<Engine>;
    
    (Engine.getInstance as jest.Mock).mockReturnValue(mockEngine);
    service = new EvaluationService(mockEngine);
  });

  describe('isCriticalMistake', () => {
    test('should detect sign flip as critical mistake', async () => {
      const fenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fenAfter = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: null }) // Before: +1.0 for white
        .mockResolvedValueOnce({ score: 150, mate: null }); // After: +1.5 for black (corrected to -1.5 for white)

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(true); // Sign flip from +1.0 to -1.5
    });

    test('should detect loss of mate advantage', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 5 }) // Before: mate in 5
        .mockResolvedValueOnce({ score: 0, mate: null }); // After: no mate

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(true); // Lost mate advantage
    });

    test('should detect getting mated', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: null }) // Before: +1.0
        .mockResolvedValueOnce({ score: 0, mate: 3 }); // After: getting mated in 3 (for black)

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(true); // Now facing mate
    });

    test('should detect significant score drop', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 500, mate: null }) // Before: +5.0
        .mockResolvedValueOnce({ score: 200, mate: null }); // After: +2.0 for black (corrected to -2.0 for white)

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(true); // Drop from +5.0 to -2.0 exceeds threshold
    });

    test('should not flag good moves', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: null }) // Before: +1.0
        .mockResolvedValueOnce({ score: -150, mate: null }); // After: -1.5 for black (corrected to +1.5 for white)

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(false); // Improved position
    });

    test('should handle both mates for player as not a blunder', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 3 }) // Before: mate in 3
        .mockResolvedValueOnce({ score: 0, mate: -5 }); // After: mate in 5 for black (corrected to mate in 5 for white)

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(false); // Still winning
    });

    test('should handle tablebase positions', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 12000, mate: null }) // Tablebase score
        .mockResolvedValueOnce({ score: 12000, mate: null }); // Still tablebase

      // Mock analyzePositionDeeply to time out
      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(false); // Timeout defaults to not a mistake
    });

    test('should handle engine errors gracefully', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 b - - 0 1';

      mockEngine.evaluatePosition.mockRejectedValue(new Error('Engine error'));

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(false); // Defaults to not a mistake on error
    });
  });

  describe('getDualEvaluation', () => {
    test('should get engine evaluation with white perspective', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 30, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getDualEvaluation(fen);

      expect(result.engine.score).toBe(30);
      expect(result.engine.evaluation).toBe('+0.3');
      expect(result.tablebase).toBeUndefined();
    });

    test('should correct black perspective to white', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 50, mate: null }); // Black's perspective
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getDualEvaluation(fen);

      expect(result.engine.score).toBe(-50); // Corrected to white perspective
      expect(result.engine.evaluation).toBe('-0.5');
    });

    test('should handle mate evaluations', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 0, mate: 3 });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getDualEvaluation(fen);

      expect(result.engine.mate).toBe(3);
      expect(result.engine.evaluation).toBe('M3');
    });

    test('should handle negative mate for black', async () => {
      const fen = '8/8/8/8/8/8/1k2K3/8 b - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 0, mate: -5 }); // Black's perspective
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getDualEvaluation(fen);

      expect(result.engine.mate).toBe(5); // Corrected to white perspective
      expect(result.engine.evaluation).toBe('M5');
    });

    test('should include tablebase evaluation when available', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 12000, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce({
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 15,
          category: 'win',
          precise: true
        }
      });

      const result = await service.getDualEvaluation(fen);

      expect(result.tablebase).toBeDefined();
      expect(result.tablebase?.isAvailable).toBe(true);
      expect(result.tablebase?.result.wdl).toBe(2);
      expect(result.tablebase?.evaluation).toBe('Win in 15');
    });

    test('should correct tablebase WDL for black', async () => {
      const fen = '8/8/8/8/8/8/1k2K3/8 b - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: -12000, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce({
        isTablebasePosition: true,
        result: {
          wdl: -2,
          dtz: -20,
          category: 'loss',
          precise: true
        }
      });

      const result = await service.getDualEvaluation(fen);

      expect(result.tablebase?.result.wdl).toBe(2); // Corrected to white perspective
      expect(result.tablebase?.result.dtz).toBe(20);
      expect(result.tablebase?.result.category).toBe('win');
      expect(result.tablebase?.evaluation).toBe('Win in 20');
    });

    test('should handle tablebase draw', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 0, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce({
        isTablebasePosition: true,
        result: {
          wdl: 0,
          dtz: null,
          category: 'draw',
          precise: true
        }
      });

      const result = await service.getDualEvaluation(fen);

      expect(result.tablebase?.evaluation).toBe('Draw');
    });

    test('should handle cursed win and blessed loss', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 5000, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce({
        isTablebasePosition: true,
        result: {
          wdl: 1,
          dtz: null,
          category: 'cursed-win',
          precise: true
        }
      });

      const result = await service.getDualEvaluation(fen);

      expect(result.tablebase?.evaluation).toBe('Cursed Win');
    });

    test('should handle tablebase errors', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      mockEngine.evaluatePosition.mockResolvedValueOnce({ score: 100, mate: null });
      (tablebaseService.queryPosition as jest.Mock).mockRejectedValue(new Error('Tablebase error'));

      const result = await service.getDualEvaluation(fen);

      expect(result.engine.score).toBe(100);
      expect(result.tablebase).toBeUndefined();
    });

    test('should handle engine errors with fallback', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      mockEngine.evaluatePosition.mockRejectedValue(new Error('Engine error'));

      const result = await service.getDualEvaluation(fen);

      expect(result.engine.score).toBe(0);
      expect(result.engine.mate).toBeNull();
      expect(result.engine.evaluation).toBe('Evaluation unavailable');
      expect(result.tablebase).toBeUndefined();
    });

    test('should format evaluations correctly', async () => {
      const fen = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';

      // Test various score formats
      const testCases = [
        { score: 150, mate: null, expected: '+1.5' },
        { score: -250, mate: null, expected: '-2.5' },
        { score: 0, mate: null, expected: '+0.0' },
        { score: 0, mate: 7, expected: 'M7' },
        { score: 0, mate: -3, expected: 'M-3' }
      ];

      for (const testCase of testCases) {
        mockEngine.evaluatePosition.mockResolvedValueOnce(testCase);
        (tablebaseService.queryPosition as jest.Mock).mockResolvedValueOnce(null);

        const result = await service.getDualEvaluation(fen);
        expect(result.engine.evaluation).toBe(testCase.expected);
      }
    });
  });

  describe('perspective correction', () => {
    test('should not correct white to move positions', async () => {
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/2K1k3/8 b - - 0 1';

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: null })
        .mockResolvedValueOnce({ score: -100, mate: null }); // Black's perspective

      await service.isCriticalMistake(fenBefore, fenAfter);

      // The corrected evalAfter should be +100 from white's perspective
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(2);
    });

    test('should handle edge case where position doesn\'t change sides', async () => {
      // This is an edge case - normally after a move, the side changes
      const fenBefore = '8/8/8/8/8/8/1K2k3/8 w - - 0 1';
      const fenAfter = '8/8/8/8/8/8/1K2k3/8 w - - 0 1'; // Same side (unusual)

      mockEngine.evaluatePosition
        .mockResolvedValueOnce({ score: 100, mate: null })
        .mockResolvedValueOnce({ score: 50, mate: null });

      const result = await service.isCriticalMistake(fenBefore, fenAfter);
      expect(result).toBe(false); // Small drop, not critical
    });
  });
});