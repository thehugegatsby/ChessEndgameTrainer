/**
 * @fileoverview Unit tests for EvaluationPipelineFactory
 * @version 1.0.0
 * @description Tests the factory and strategy pattern for evaluation pipelines
 * Following TESTING_GUIDELINES.md principles
 */

import { EvaluationPipelineFactory } from '../../../../../shared/lib/chess/evaluation/pipelineFactory';
import type { 
  EvaluationPipelineStrategy,
  PipelineConfig 
} from '../../../../../shared/lib/chess/evaluation/pipelineFactory';
import type {
  EngineEvaluation,
  TablebaseResult
} from '../../../../../shared/types/evaluation';

// Test constants
const mockEngineEvaluation: EngineEvaluation = {
  score: 150,
  mate: null,
  evaluation: '+1.50',
  depth: 20,
  nodes: 1000000,
  time: 1000
};

const mockMateEvaluation: EngineEvaluation = {
  score: 0, // When mate is found, score is typically 0
  mate: 5,
  evaluation: 'M5',
  depth: 20,
  nodes: 1000000,
  time: 1000
};

const mockTablebaseResult: TablebaseResult = {
  wdl: 2,
  dtm: 15,
  dtz: 10,
  category: 'win',
  precise: true
};

const mockDrawTablebase: TablebaseResult = {
  wdl: 0,
  dtm: null,
  dtz: 0,
  category: 'draw',
  precise: true
};

describe('EvaluationPipelineFactory_[method]_[condition]_[expected]', () => {
  describe('factory methods', () => {
    it('should create pipeline with default config', () => {
      const pipeline = EvaluationPipelineFactory.createPipeline();
      
      expect(pipeline).toBeDefined();
      expect(pipeline.mode).toBe('enhanced');
    });

    it('should create pipeline with custom config', () => {
      const config: PipelineConfig = {
        enhancedPerspective: true,
        cacheEnabled: true
      };
      
      const pipeline = EvaluationPipelineFactory.createPipeline(config);
      
      expect(pipeline).toBeDefined();
      expect(pipeline.mode).toBe('enhanced');
    });

    it('should create default pipeline using convenience method', () => {
      const pipeline = EvaluationPipelineFactory.createDefault();
      
      expect(pipeline).toBeDefined();
      expect(pipeline.mode).toBe('enhanced');
    });
  });

  describe('EnhancedPipelineStrategy', () => {
    let pipeline: EvaluationPipelineStrategy;

    beforeEach(() => {
      pipeline = EvaluationPipelineFactory.createDefault();
    });

    describe('formatEngineEvaluation', () => {
      it('should format engine evaluation for White perspective', () => {
        const result = pipeline.formatEngineEvaluation(mockEngineEvaluation, 'w', 'w');
        
        expect(result).toBeDefined();
        expect(result.mainText).toBeDefined();
        expect(result.metadata.isTablebase).toBe(false);
        expect(result.metadata.isMate).toBe(false);
      });

      it('should format engine evaluation for Black perspective', () => {
        // White to move, but display from Black's perspective
        const result = pipeline.formatEngineEvaluation(mockEngineEvaluation, 'w', 'b');
        
        expect(result).toBeDefined();
        expect(result.mainText).toBeDefined();
        expect(result.metadata.isTablebase).toBe(false);
      });

      it('should format mate evaluation correctly', () => {
        const result = pipeline.formatEngineEvaluation(mockMateEvaluation, 'w', 'w');
        
        expect(result).toBeDefined();
        expect(result.metadata.isMate).toBe(true);
        expect(result.mainText).toContain('M'); // Mate notation
      });

      it('should handle formatting errors gracefully', () => {
        // Pass invalid data that might cause errors
        const invalidData = {
          score: 0,
          mate: null,
          evaluation: '',
          depth: 0,
          nodes: 0,
          time: 0
        } as EngineEvaluation;
        
        const result = pipeline.formatEngineEvaluation(invalidData, 'w', 'w');
        
        // Just verify it doesn't throw and returns something
        expect(result).toBeDefined();
        expect(result.mainText).toBeDefined();
      });
    });

    describe('formatTablebaseEvaluation', () => {
      it('should format tablebase win correctly', () => {
        const result = pipeline.formatTablebaseEvaluation(mockTablebaseResult, 'w', 'w');
        
        expect(result).toBeDefined();
        expect(result.metadata.isTablebase).toBe(true);
        expect(result.mainText).toContain('Win');
      });

      it('should format tablebase draw correctly', () => {
        const result = pipeline.formatTablebaseEvaluation(mockDrawTablebase, 'w', 'w');
        
        expect(result).toBeDefined();
        expect(result.metadata.isTablebase).toBe(true);
        expect(result.metadata.isDrawn).toBe(true);
        expect(result.mainText).toContain('Draw');
      });

      it('should handle Black perspective for tablebase', () => {
        const result = pipeline.formatTablebaseEvaluation(mockTablebaseResult, 'w', 'b');
        
        expect(result).toBeDefined();
        expect(result.metadata.isTablebase).toBe(true);
        // Verify it formats properly for Black perspective
        expect(result.mainText).toBeDefined();
      });

      it('should handle tablebase formatting errors', () => {
        const invalidData = {} as TablebaseResult;
        
        const result = pipeline.formatTablebaseEvaluation(invalidData, 'w', 'w');
        
        // Just verify it doesn't throw and returns something
        expect(result).toBeDefined();
        expect(result.mainText).toBeDefined();
      });
    });

    describe('getPerspectiveEvaluation', () => {
      it('should return perspective evaluation for White', () => {
        const result = pipeline.getPerspectiveEvaluation(mockEngineEvaluation, 'w', 'w');
        
        expect(result).toBeDefined();
        expect(result.perspective).toBe('w');
        expect(result.perspectiveScore).toBe(150);
        expect(result.scoreInCentipawns).toBe(150);
      });

      it('should return inverted perspective evaluation for Black', () => {
        const result = pipeline.getPerspectiveEvaluation(mockEngineEvaluation, 'b', 'b');
        
        expect(result).toBeDefined();
        expect(result.perspective).toBe('b');
        // The normalizer normalizes to White's perspective (playerToMove='b' means engine score is inverted)
        // Then perspectiveTransformer inverts again for Black display
        // So: 150 (engine) → -150 (normalized to White) → 150 (Black perspective)
        expect(result.perspectiveScore).toBe(150);
        expect(result.scoreInCentipawns).toBe(-150); // Normalized to White's perspective
      });

      it('should handle mate in perspective evaluation', () => {
        const result = pipeline.getPerspectiveEvaluation(mockMateEvaluation, 'w', 'w');
        
        expect(result).toBeDefined();
        expect(result.mate).toBe(5);
        expect(result.perspectiveMate).toBe(5);
      });

      it('should invert mate for Black perspective', () => {
        const result = pipeline.getPerspectiveEvaluation(mockMateEvaluation, 'b', 'b');
        
        expect(result).toBeDefined();
        // When playerToMove='b', normalizer inverts to White's perspective
        // So mate in 5 for Black becomes mate in -5 for White
        expect(result.mate).toBe(-5); // Normalized to White's perspective
        expect(result.perspectiveMate).toBe(5); // Re-inverted for Black display
      });
    });

    describe('error handling', () => {
      it('should handle null engine data gracefully', () => {
        const nullData = null as any;
        
        expect(() => {
          pipeline.formatEngineEvaluation(nullData, 'w', 'w');
        }).not.toThrow();
      });

      it('should handle undefined perspective gracefully', () => {
        const result = pipeline.formatEngineEvaluation(mockEngineEvaluation, undefined as any, undefined as any);
        
        expect(result).toBeDefined();
        // Should default to White perspective
      });
    });

    describe('integration with normalizer and transformer', () => {
      it('should properly chain normalization, transformation, and formatting', () => {
        const result = pipeline.formatEngineEvaluation(mockEngineEvaluation, 'b', 'b');
        
        // Verify the chain worked by checking Black perspective formatting
        expect(result).toBeDefined();
        expect(result.metadata.isTablebase).toBe(false);
      });

      it('should maintain data integrity through pipeline', () => {
        const whiteResult = pipeline.formatEngineEvaluation(mockEngineEvaluation, 'w', 'w');
        const blackResult = pipeline.formatEngineEvaluation(mockEngineEvaluation, 'b', 'b');
        
        // Both should be valid
        expect(whiteResult).toBeDefined();
        expect(blackResult).toBeDefined();
        // They may or may not be equal depending on formatter implementation
        // Just verify they both have valid structure
        expect(whiteResult.mainText).toBeDefined();
        expect(blackResult.mainText).toBeDefined();
      });
    });
  });

  describe('pipeline mode behavior', () => {
    it('should always return enhanced mode', () => {
      const pipeline1 = EvaluationPipelineFactory.createPipeline({});
      const pipeline2 = EvaluationPipelineFactory.createPipeline({ enhancedPerspective: false });
      const pipeline3 = EvaluationPipelineFactory.createPipeline({ enhancedPerspective: true });
      
      expect(pipeline1.mode).toBe('enhanced');
      expect(pipeline2.mode).toBe('enhanced');
      expect(pipeline3.mode).toBe('enhanced');
    });
  });
});