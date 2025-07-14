/**
 * @fileoverview Unit tests for PlayerPerspectiveTransformer
 * @version 1.0.0
 * @description Tests perspective transformation of chess evaluations
 * 
 * CRITICAL: This transformer is the ONLY place where perspective changes
 * should happen for display purposes. All internal logic uses White perspective.
 */

import { PlayerPerspectiveTransformer } from '../../../../../shared/lib/chess/evaluation/perspectiveTransformer';
import type {
  NormalizedEvaluation,
  EngineEvaluation,
  TablebaseResult
} from '../../../../../shared/types/evaluation';

// Test constants
const WHITE = 'w' as const;
const BLACK = 'b' as const;

// Mock data
const mockEngineEval: EngineEvaluation = {
  score: 150,
  mate: null,
  evaluation: '+1.50',
  depth: 20,
  nodes: 100000,
  time: 500
};

const mockTablebaseResult: TablebaseResult = {
  wdl: 2,
  dtz: 15,
  dtm: 25,
  category: 'win',
  precise: true
};

describe('PlayerPerspectiveTransformer', () => {
  let transformer: PlayerPerspectiveTransformer;

  beforeEach(() => {
    transformer = new PlayerPerspectiveTransformer();
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      expect(transformer).toBeInstanceOf(PlayerPerspectiveTransformer);
    });
  });

  describe('transform - White perspective', () => {
    it('should preserve all values for White perspective', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 150,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: mockEngineEval
      };

      const result = transformer.transform(normalized, WHITE);

      expect(result.perspective).toBe(WHITE);
      expect(result.perspectiveScore).toBe(150);
      expect(result.perspectiveMate).toBeNull();
      expect(result.perspectiveWdl).toBeNull();
      expect(result.perspectiveDtm).toBeNull();
      expect(result.perspectiveDtz).toBeNull();
    });

    it('should handle mate evaluations for White', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 5, // White mates in 5
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: { ...mockEngineEval, mate: 5, score: 0 }
      };

      const result = transformer.transform(normalized, WHITE);

      expect(result.perspectiveMate).toBe(5);
      expect(result.perspectiveScore).toBeNull();
    });

    it('should handle tablebase data for White', () => {
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 2, // Win for White
        dtm: 25,
        dtz: 15,
        isTablebasePosition: true,
        raw: mockTablebaseResult
      };

      const result = transformer.transform(normalized, WHITE);

      expect(result.perspectiveWdl).toBe(2);
      expect(result.perspectiveDtm).toBe(25);
      expect(result.perspectiveDtz).toBe(15);
    });
  });

  describe('transform - Black perspective', () => {
    it('should invert values for Black perspective', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 150, // White ahead by 1.5 pawns
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: mockEngineEval
      };

      const result = transformer.transform(normalized, BLACK);

      // FIXED BEHAVIOR (CORRECT):
      expect(result.perspectiveScore).toBe(-150); // Black sees this as -1.5 pawns disadvantage
    });

    it('should invert mate values for Black', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 5, // White mates in 5
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: { ...mockEngineEval, mate: 5 }
      };

      const result = transformer.transform(normalized, BLACK);

      // FIXED BEHAVIOR (CORRECT):
      expect(result.perspectiveMate).toBe(-5); // Black sees being mated in 5
    });

    it('should invert tablebase WDL for Black', () => {
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 2, // Win for White
        dtm: 25,
        dtz: 15,
        isTablebasePosition: true,
        raw: mockTablebaseResult
      };

      const result = transformer.transform(normalized, BLACK);

      // FIXED BEHAVIOR (CORRECT):
      expect(result.perspectiveWdl).toBe(-2); // Black sees this as a loss
      // expect(result.perspectiveDtm).toBe(-25); // Black is being mated in 25
    });
  });

  describe('transform - Edge cases', () => {
    it('should handle null input gracefully', () => {
      const result = transformer.transform(null, WHITE);

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: null,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: WHITE,
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      });
    });

    it('should handle undefined input gracefully', () => {
      const result = transformer.transform(undefined, BLACK);

      expect(result.perspective).toBe(WHITE); // Defaults to White
      expect(result.perspectiveScore).toBeNull();
    });

    it('should validate perspective and default to White', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 100,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: mockEngineEval
      };

      // @ts-expect-error Testing invalid perspective
      const result = transformer.transform(normalized, 'invalid');

      expect(result.perspective).toBe(WHITE);
    });

    it('should handle zero values correctly', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 0,
        mate: null,
        wdl: 0, // Draw
        dtm: 0,
        dtz: 0,
        isTablebasePosition: true,
        raw: { ...mockTablebaseResult, wdl: 0, dtm: 0, dtz: 0 }
      };

      const result = transformer.transform(normalized, BLACK);

      // Zero should remain zero even for Black
      expect(result.perspectiveScore).toBe(0);
      expect(result.perspectiveWdl).toBe(0);
      expect(result.perspectiveDtm).toBe(0);
      expect(result.perspectiveDtz).toBe(0);
    });

    it('should preserve null values in transformation', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, BLACK);

      expect(result.perspectiveScore).toBeNull();
      expect(result.perspectiveMate).toBeNull();
      expect(result.perspectiveWdl).toBeNull();
      expect(result.perspectiveDtm).toBeNull();
      expect(result.perspectiveDtz).toBeNull();
    });
  });

  describe('transform - Complex scenarios', () => {
    it('should handle mixed engine and tablebase data', () => {
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: 500, // Engine backup score
        mate: null,
        wdl: 2,
        dtm: 30,
        dtz: 20,
        isTablebasePosition: true,
        raw: mockTablebaseResult
      };

      const resultWhite = transformer.transform(normalized, WHITE);
      const resultBlack = transformer.transform(normalized, BLACK);

      // White perspective
      expect(resultWhite.perspectiveScore).toBe(500);
      expect(resultWhite.perspectiveWdl).toBe(2);
      expect(resultWhite.perspectiveDtm).toBe(30);

      // Black perspective (fixed behavior)
      expect(resultBlack.perspectiveScore).toBe(-500); // Correctly inverted
      expect(resultBlack.perspectiveWdl).toBe(-2); // Correctly inverted  
      expect(resultBlack.perspectiveDtm).toBe(-30); // Correctly inverted
    });

    it('should handle cursed wins and blessed losses', () => {
      const cursedWin: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 1, // Cursed win for White
        dtm: null,
        dtz: 60,
        isTablebasePosition: true,
        raw: { ...mockTablebaseResult, wdl: 1, category: 'cursed-win' }
      };

      const blessedLoss: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -1, // Blessed loss for White
        dtm: null,
        dtz: -60,
        isTablebasePosition: true,
        raw: { ...mockTablebaseResult, wdl: -1, category: 'blessed-loss' }
      };

      const cursedResult = transformer.transform(cursedWin, BLACK);
      const blessedResult = transformer.transform(blessedLoss, BLACK);

      // Fixed behavior (correct)
      expect(cursedResult.perspectiveWdl).toBe(-1); // Cursed win for White = cursed loss for Black
      expect(blessedResult.perspectiveWdl).toBe(1); // Blessed loss for White = blessed win for Black
    });
  });

  describe('Performance characteristics', () => {
    it('should handle many transformations efficiently', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 250,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: mockEngineEval
      };

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        transformer.transform(normalized, i % 2 === 0 ? WHITE : BLACK);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(250); // Should be fast (250ms for 10k transformations, relaxed for CI)
    });
  });

  describe('Integration with evaluation pipeline', () => {
    it('should maintain data integrity through transformation', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 175,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: mockEngineEval
      };

      const result = transformer.transform(normalized, WHITE);

      // All original data should be preserved
      expect(result.type).toBe(normalized.type);
      expect(result.scoreInCentipawns).toBe(normalized.scoreInCentipawns);
      expect(result.mate).toBe(normalized.mate);
      expect(result.wdl).toBe(normalized.wdl);
      expect(result.dtm).toBe(normalized.dtm);
      expect(result.dtz).toBe(normalized.dtz);
      expect(result.isTablebasePosition).toBe(normalized.isTablebasePosition);
      expect(result.raw).toBe(normalized.raw);
    });
  });
});

/**
 * CRITICAL FINDINGS:
 * 
 * The current implementation of PlayerPerspectiveTransformer has a major bug:
 * It does NOT invert values for Black's perspective as documented.
 * 
 * Lines 49-60 in perspectiveTransformer.ts simply copy the normalized values
 * without any transformation, which means Black players see evaluations from
 * White's perspective.
 * 
 * This violates the principle that:
 * - Positive values should mean "good for the viewer"
 * - Negative values should mean "bad for the viewer"
 * 
 * The fix would be to actually use the invertValue() method (lines 69-80)
 * when perspective === 'b'.
 */