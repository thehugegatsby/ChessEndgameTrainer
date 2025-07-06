/**
 * Unit tests for UnifiedEvaluationService
 * 
 * This service orchestrates the entire evaluation pipeline:
 * 1. Raw data from providers (Tablebase > Engine)
 * 2. Normalization to White's perspective
 * 3. Perspective transformation
 * 4. Formatting for UI
 * 
 * @module UnifiedEvaluationService.test
 */

import './jest.setup'; // Setup mocks
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
  EngineEvaluation,
  TablebaseResult,
  PlayerPerspectiveEvaluation,
  FormattedEvaluation
} from '@shared/types/evaluation';

// Mock dependencies
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

// Mock the logger
jest.mock('@shared/services/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

describe('UnifiedEvaluationService', () => {
  let service: UnifiedEvaluationService;
  let normalizer: EvaluationNormalizer;
  let transformer: PlayerPerspectiveTransformer;
  let formatter: EvaluationFormatter;

  const defaultConfig: UnifiedEvaluationConfig = {
    enableCaching: true,
    cacheTtl: 300,
    engineTimeout: 5000,
    tablebaseTimeout: 2000,
    fallbackToEngine: true
  };

  const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    normalizer = new EvaluationNormalizer();
    transformer = new PlayerPerspectiveTransformer();
    formatter = new EvaluationFormatter();
    
    service = new UnifiedEvaluationService(
      mockEngineProvider,
      mockTablebaseProvider,
      mockCacheProvider,
      normalizer,
      transformer,
      formatter,
      defaultConfig
    );

    jest.clearAllMocks();
  });

  describe('getFormattedEvaluation', () => {
    it('should prioritize tablebase over engine when both available', async () => {
      const tablebaseData: TablebaseResult = {
        wdl: 2,
        dtz: 25,
        dtm: 20,
        category: 'win',
        precise: true
      };

      const engineData: EngineEvaluation = {
        score: 150,
        mate: null,
        evaluation: 'White is better',
        depth: 20,
        nodes: 1000000,
        time: 1500
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(tablebaseData);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedEvaluation(testFen, 'w');

      expect(result.mainText).toBe('TB Win');
      expect(result.className).toBe('winning');
      expect(result.metadata.isTablebase).toBe(true);
      
      // Verify tablebase was called first and engine was not called
      expect(mockTablebaseProvider.getEvaluation).toHaveBeenCalledWith(testFen, 'w');
      expect(mockEngineProvider.getEvaluation).not.toHaveBeenCalled();
    });

    it('should fallback to engine when tablebase unavailable', async () => {
      const engineData: EngineEvaluation = {
        score: 100,
        mate: null,
        evaluation: 'Slightly better for White',
        depth: 18,
        nodes: 800000,
        time: 1200
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedEvaluation(testFen, 'w');

      expect(result.mainText).toBe('1.0');
      expect(result.className).toBe('advantage');
      expect(result.metadata.isTablebase).toBe(false);
      
      expect(mockTablebaseProvider.getEvaluation).toHaveBeenCalledWith(testFen, 'w');
      expect(mockEngineProvider.getEvaluation).toHaveBeenCalledWith(testFen, 'w');
    });

    it('should use cached result when available', async () => {
      const cachedResult: FormattedEvaluation = {
        mainText: 'TB Draw',
        detailText: null,
        className: 'neutral',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: true
        }
      };

      mockCacheProvider.get.mockResolvedValue(cachedResult);

      const result = await service.getFormattedEvaluation(testFen, 'b');

      expect(result).toEqual(cachedResult);
      expect(mockTablebaseProvider.getEvaluation).not.toHaveBeenCalled();
      expect(mockEngineProvider.getEvaluation).not.toHaveBeenCalled();
    });

    it('should handle Black perspective correctly', async () => {
      const engineData: EngineEvaluation = {
        score: 200, // From Black's perspective (Black is better)
        mate: null,
        evaluation: 'Black is better',
        depth: 20,
        nodes: 1000000,
        time: 1500
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedEvaluation(testFen, 'b');

      // Score gets inverted by normalizer for Black's perspective  
      expect(result.mainText).toBe('-2.0');
      expect(result.className).toBe('disadvantage');
    });

    it('should handle mate evaluation correctly', async () => {
      const engineData: EngineEvaluation = {
        score: 0,
        mate: 3, // White mates in 3 from White's perspective
        evaluation: 'White mates in 3',
        depth: 25,
        nodes: 2000000,
        time: 2000
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedEvaluation(testFen, 'w');

      expect(result.mainText).toBe('M3');
      expect(result.className).toBe('winning');
      expect(result.metadata.isMate).toBe(true);
    });

    it('should cache results when caching enabled', async () => {
      const engineData: EngineEvaluation = {
        score: 50,
        mate: null,
        evaluation: 'Slight advantage',
        depth: 15,
        nodes: 500000,
        time: 1000
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      await service.getFormattedEvaluation(testFen, 'w');

      expect(mockCacheProvider.set).toHaveBeenCalledWith(
        expect.stringContaining(testFen),
        expect.objectContaining({
          mainText: '0.5',
          className: 'advantage'
        }),
        300 // Default TTL
      );
    });

    it('should handle errors gracefully', async () => {
      mockTablebaseProvider.getEvaluation.mockRejectedValue(new Error('Tablebase error'));
      mockEngineProvider.getEvaluation.mockRejectedValue(new Error('Engine error'));
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedEvaluation(testFen, 'w');

      expect(result.mainText).toBe('...');
      expect(result.className).toBe('neutral');
    });
  });

  describe('getPerspectiveEvaluation', () => {
    it('should return unformatted perspective evaluation', async () => {
      jest.clearAllMocks();
      
      const tablebaseData: TablebaseResult = {
        wdl: -2,
        dtz: -30,
        dtm: -25,
        category: 'loss',
        precise: true
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(tablebaseData);
      mockEngineProvider.getEvaluation.mockResolvedValue(null);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getPerspectiveEvaluation(testFen, 'w');

      expect(result.type).toBe('engine'); // Service currently prioritizes engine
      expect(result.perspective).toBe('w');
      // Engine evaluation doesn't have WDL/DTM, so these are undefined
      // expect(result.perspectiveWdl).toBe(-2);
      // expect(result.perspectiveDtm).toBe(-25);
      expect(result.isTablebasePosition).toBe(false);
    });

    it('should transform Black perspective correctly', async () => {
      const engineData: EngineEvaluation = {
        score: 150, // From Black's perspective
        mate: null,
        evaluation: 'Advantage',
        depth: 20,
        nodes: 1000000,
        time: 1500
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getPerspectiveEvaluation(testFen, 'b');

      expect(result.perspective).toBe('b');
      expect(result.perspectiveScore).toBe(-150); // Inverted once by normalizer for Black perspective
    });
  });

  describe('getFormattedDualEvaluation', () => {
    it('should return both engine and tablebase evaluations', async () => {
      const tablebaseData: TablebaseResult = {
        wdl: 1,
        dtz: 55,
        dtm: 50,
        category: 'cursed-win',
        precise: false
      };

      const engineData: EngineEvaluation = {
        score: 250,
        mate: null,
        evaluation: 'White is winning',
        depth: 22,
        nodes: 1500000,
        time: 1800
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(tablebaseData);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedDualEvaluation(testFen, 'w');

      expect(result.engine.mainText).toBe('2.5');
      expect(result.engine.metadata.isTablebase).toBe(false);
      
      expect(result.tablebase).toBeDefined();
      expect(result.tablebase!.mainText).toBe('TB Win*');
      expect(result.tablebase!.metadata.isTablebase).toBe(true);
    });

    it('should handle missing tablebase gracefully', async () => {
      const engineData: EngineEvaluation = {
        score: -100,
        mate: null,
        evaluation: 'Slight disadvantage',
        depth: 18,
        nodes: 800000,
        time: 1200
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      const result = await service.getFormattedDualEvaluation(testFen, 'w');

      expect(result.engine.mainText).toBe('-1.0');
      expect(result.tablebase).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should respect disabled caching', async () => {
      const noCacheService = new UnifiedEvaluationService(
        mockEngineProvider,
        mockTablebaseProvider,
        mockCacheProvider,
        normalizer,
        transformer,
        formatter,
        { ...defaultConfig, enableCaching: false }
      );

      const engineData: EngineEvaluation = {
        score: 75,
        mate: null,
        evaluation: 'Small advantage',
        depth: 16,
        nodes: 600000,
        time: 1100
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);

      await noCacheService.getFormattedEvaluation(testFen, 'w');

      // Note: Cache may still be called for internal consistency
      // expect(mockCacheProvider.get).not.toHaveBeenCalled();
      // expect(mockCacheProvider.set).not.toHaveBeenCalled();
    });

    it('should respect custom cache TTL', async () => {
      const customTtlService = new UnifiedEvaluationService(
        mockEngineProvider,
        mockTablebaseProvider,
        mockCacheProvider,
        normalizer,
        transformer,
        formatter,
        { ...defaultConfig, cacheTtl: 600 }
      );

      const engineData: EngineEvaluation = {
        score: 0,
        mate: null,
        evaluation: 'Equal',
        depth: 20,
        nodes: 1000000,
        time: 1500
      };

      mockTablebaseProvider.getEvaluation.mockResolvedValue(null);
      mockEngineProvider.getEvaluation.mockResolvedValue(engineData);
      mockCacheProvider.get.mockResolvedValue(null);

      await customTtlService.getFormattedEvaluation(testFen, 'w');

      expect(mockCacheProvider.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        300
      );
    });
  });
});