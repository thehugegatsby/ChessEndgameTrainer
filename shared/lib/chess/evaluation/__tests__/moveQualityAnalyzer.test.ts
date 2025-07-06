/**
 * Unit tests for MoveQualityAnalyzer
 * 
 * This module analyzes the difference between two evaluations to classify
 * move quality. It provides standardized move quality assessment across
 * different evaluation types (engine, tablebase).
 * 
 * Quality classifications:
 * - excellent: Significant improvement (>50cp or better WDL)
 * - good: Moderate improvement (20-50cp)  
 * - inaccuracy: Small mistake (20-100cp loss)
 * - mistake: Notable mistake (100-300cp loss)
 * - blunder: Major mistake (>300cp loss or WDL deterioration)
 * 
 * @module MoveQualityAnalyzer.test
 */

import './jest.setup'; // Setup mocks
import { MoveQualityAnalyzer } from '../moveQualityAnalyzer';
import { UnifiedEvaluationService } from '../unifiedService';
import { EvaluationNormalizer } from '../normalizer';
import { PlayerPerspectiveTransformer } from '../perspectiveTransformer';
import { EvaluationFormatter } from '../formatter';
import type { 
  IEngineProvider, 
  ITablebaseProvider, 
  ICacheProvider,
  UnifiedEvaluationConfig
} from '../providers';
import type { 
  PlayerPerspectiveEvaluation,
  MoveQualityResult
} from '@shared/types/evaluation';

// Mock dependencies for UnifiedEvaluationService
const mockEngineProvider: jest.Mocked<IEngineProvider> = {
  getEvaluation: jest.fn()
};

const mockTablebaseProvider: jest.Mocked<ITablebaseProvider> = {
  getEvaluation: jest.fn()
};

const mockCacheProvider: jest.Mocked<ICacheProvider<any>> = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
};

describe('MoveQualityAnalyzer', () => {
  let analyzer: MoveQualityAnalyzer;
  let evaluationService: UnifiedEvaluationService;

  const testFenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const testFenAfter = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

  beforeEach(() => {
    const normalizer = new EvaluationNormalizer();
    const transformer = new PlayerPerspectiveTransformer();
    const formatter = new EvaluationFormatter();
    
    evaluationService = new UnifiedEvaluationService(
      mockEngineProvider,
      mockTablebaseProvider,
      mockCacheProvider
    );

    analyzer = new MoveQualityAnalyzer(evaluationService);

    jest.clearAllMocks();
  });

  describe('analyzeMove', () => {
    it('should classify excellent move for significant improvement', async () => {
      // Mock evaluations: score improves from equal to +75cp
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 0,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 0,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        scoreInCentipawns: 75,
        perspectiveScore: 75
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('excellent');
      expect(result.scoreDifference).toBe(75);
      expect(result.reason).toContain('Excellent move');
    });

    it('should classify good move for moderate improvement', async () => {
      // Mock evaluations: score improves by 35cp
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 10,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 10,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        scoreInCentipawns: 45,
        perspectiveScore: 45
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('good');
      expect(result.scoreDifference).toBe(35);
    });

    it('should classify inaccuracy for small mistake', async () => {
      // Mock evaluations: score decreases by 60cp
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 50,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 50,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        scoreInCentipawns: -10,
        perspectiveScore: -10
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('inaccuracy');
      expect(result.scoreDifference).toBe(-60);
      expect(result.reason).toContain('Inaccuracy');
    });

    it('should classify mistake for notable score loss', async () => {
      // Mock evaluations: score decreases by 150cp
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 100,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 100,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        scoreInCentipawns: -50,
        perspectiveScore: -50
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('mistake');
      expect(result.scoreDifference).toBe(-150);
    });

    it('should classify blunder for major score loss', async () => {
      // Mock evaluations: score decreases by 400cp
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 200,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 200,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        scoreInCentipawns: -200,
        perspectiveScore: -200
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('blunder');
      expect(result.scoreDifference).toBe(-400);
      expect(result.reason).toContain('Blunder');
    });

    it('should handle tablebase WDL changes correctly', async () => {
      // Mock tablebase evaluations: WDL changes from draw to loss
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 0,
        dtm: null,
        dtz: null,
        isTablebasePosition: true,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 0,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        wdl: -2,
        perspectiveWdl: -2
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('blunder');
      expect(result.wdlChange).toBe(-2);
      expect(result.reason).toContain('WDL deterioration');
    });

    it('should handle mate evaluation changes', async () => {
      // Mock mate evaluations: mate in 5 becomes mate in 3
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 5,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: 5,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        mate: 3,
        perspectiveMate: 3
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('excellent');
      expect(result.mateChange).toBe(-2);
      expect(result.reason).toContain('Improved mate');
    });

    it('should handle Black perspective correctly', async () => {
      // Mock evaluations for Black: score improves from Black's perspective
      const beforeEval: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: -100, // Normalized to White's perspective
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'b',
        perspectiveScore: 100, // From Black's perspective (positive)
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const afterEval: PlayerPerspectiveEvaluation = {
        ...beforeEval,
        scoreInCentipawns: -175,
        perspectiveScore: 175
      };

      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockResolvedValueOnce(beforeEval)
        .mockResolvedValueOnce(afterEval);

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'b');

      expect(result.quality).toBe('excellent');
      expect(result.scoreDifference).toBe(75);
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockRejectedValue(new Error('Evaluation service error'));

      const result = await analyzer.analyzeMove(testFenBefore, testFenAfter, 'w');

      expect(result.quality).toBe('unknown');
      expect(result.reason).toContain('Error analyzing move');
    });
  });

  describe('analyzeMoveSequence', () => {
    it('should analyze multiple moves in sequence', async () => {
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2'
      ];

      // Mock evaluation service to return predictable results
      jest.spyOn(evaluationService, 'getPerspectiveEvaluation')
        .mockImplementation(async (fen, perspective) => ({
          type: 'engine',
          scoreInCentipawns: 25,
          mate: null,
          wdl: null,
          dtm: null,
          dtz: null,
          isTablebasePosition: false,
          raw: null,
          perspective,
          perspectiveScore: 25,
          perspectiveMate: null,
          perspectiveWdl: null,
          perspectiveDtm: null,
          perspectiveDtz: null
        }));

      const results = await analyzer.analyzeMoveSequence(fens, 'w');

      expect(results).toHaveLength(2); // 3 positions = 2 moves
      expect(results[0].fromFen).toBe(fens[0]);
      expect(results[0].toFen).toBe(fens[1]);
    });
  });

  describe('Configuration', () => {
    it('should respect custom thresholds', () => {
      const customAnalyzer = new MoveQualityAnalyzer(evaluationService, {
        excellentThreshold: 100,
        goodThreshold: 40,
        inaccuracyThreshold: 50,
        mistakeThreshold: 200
      });

      expect(customAnalyzer).toBeInstanceOf(MoveQualityAnalyzer);
    });
  });
});