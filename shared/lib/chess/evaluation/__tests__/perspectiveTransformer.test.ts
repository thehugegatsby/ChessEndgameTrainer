/**
 * Unit tests for PlayerPerspectiveTransformer
 * 
 * This module transforms normalized evaluations (White's perspective)
 * into player-specific perspectives. Since the Normalizer already handles
 * the conversion to White's perspective, this transformer only needs to
 * invert values when showing from Black's perspective.
 * 
 * @module PlayerPerspectiveTransformer.test
 */

import { PlayerPerspectiveTransformer } from '../perspectiveTransformer';
import type { 
  NormalizedEvaluation,
  PlayerPerspectiveEvaluation 
} from '@shared/types/evaluation';

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

describe('PlayerPerspectiveTransformer', () => {
  let transformer: PlayerPerspectiveTransformer;

  beforeEach(() => {
    transformer = new PlayerPerspectiveTransformer();
    jest.clearAllMocks();
  });

  describe('transform - White perspective', () => {
    it('should keep values unchanged for White perspective', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 150,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'w');

      expect(result.perspective).toBe('w');
      expect(result.perspectiveScore).toBe(150);
      expect(result.perspectiveMate).toBe(null);
      expect(result.perspectiveWdl).toBe(null);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should handle mate values for White', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 5, // White mates in 5
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'w');

      expect(result.perspective).toBe('w');
      expect(result.perspectiveScore).toBe(null);
      expect(result.perspectiveMate).toBe(5);
      expect(result.perspectiveWdl).toBe(null);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should handle tablebase WDL for White', () => {
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 2, // Win for White
        dtm: 25,
        dtz: 30,
        isTablebasePosition: true,
        raw: null
      };

      const result = transformer.transform(normalized, 'w');

      expect(result).toEqual({
        ...normalized,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 2, // Same as normalized
        perspectiveDtm: 25, // Same as normalized
        perspectiveDtz: 30  // Same as normalized
      });
    });
  });

  describe('transform - Black perspective (CORRECTED after Bug Fix)', () => {
    it('should NOT invert score for Black perspective (Bug Fix)', () => {
      // FIXED: After bug fix, normalized values are already correctly oriented
      // No double-inversion needed - values are correct for specified perspective
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 150, // Already correctly oriented for Black if normalized for 'b'
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result.perspective).toBe('b');
      expect(result.perspectiveScore).toBe(150); // No double-inversion!
      expect(result.perspectiveMate).toBe(null);
      expect(result.perspectiveWdl).toBe(null);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should NOT invert negative scores for Black (Bug Fix)', () => {
      // FIXED: Values are already correctly oriented after normalization
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: -200, // Already correctly oriented for Black
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result.perspective).toBe('b');
      expect(result.perspectiveScore).toBe(-200); // No double-inversion!
      expect(result.perspectiveMate).toBe(null);
      expect(result.perspectiveWdl).toBe(null);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should NOT invert mate values for Black (Bug Fix)', () => {
      // FIXED: Mate values are already correctly oriented after normalization
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 5, // Already correctly oriented for Black perspective
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result.perspective).toBe('b');
      expect(result.perspectiveScore).toBe(null);
      expect(result.perspectiveMate).toBe(5); // No double-inversion!
      expect(result.perspectiveWdl).toBe(null);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should handle negative mate values for Black (Enhanced Perspective)', () => {
      // ENHANCED: Values are already correctly oriented after normalization for specified perspective
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: -3, // Already correctly oriented for Black - negative means Black loses in 3
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result.perspective).toBe('b');
      expect(result.perspectiveScore).toBe(null);
      expect(result.perspectiveMate).toBe(-3); // No transformation needed - already correct
      expect(result.perspectiveWdl).toBe(null);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should handle tablebase WDL for Black (Enhanced Perspective)', () => {
      // ENHANCED: Values are already correctly oriented for Black after normalization
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 2, // Already correctly oriented for Black perspective
        dtm: 25,
        dtz: 30,
        isTablebasePosition: true,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result).toEqual({
        ...normalized,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 2, // No transformation needed - already correct for Black
        perspectiveDtm: 25, // No transformation needed
        perspectiveDtz: 30  // No transformation needed
      });
    });

    it('should handle cursed win for Black (Enhanced Perspective)', () => {
      // ENHANCED: Values are already correctly oriented for Black after normalization
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -1, // Already correctly oriented for Black perspective
        dtm: -55,
        dtz: -60,
        isTablebasePosition: true,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result).toEqual({
        ...normalized,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: -1, // No transformation needed - already correct for Black
        perspectiveDtm: -55, // No transformation needed
        perspectiveDtz: -60  // No transformation needed
      });
    });

    it('should invert dtm and dtz values for Black with nulls', () => {
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -2, // Loss for White
        dtm: -25, // Black mates in 25
        dtz: null, // DTZ can be null
        isTablebasePosition: true,
        raw: null
      };

      const result = transformer.transform(normalized, 'b');

      expect(result).toEqual({
        ...normalized,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: -2,  // No inversion: values already correctly oriented
        perspectiveDtm: -25, // No inversion: values already correctly oriented
        perspectiveDtz: null  // Null remains null
      });
    });
  });

  describe('Special cases', () => {
    it('should handle draw (WDL = 0) correctly', () => {
      const normalized: NormalizedEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 0, // Draw
        dtm: null,
        dtz: 0,
        isTablebasePosition: true,
        raw: null
      };

      const resultWhite = transformer.transform(normalized, 'w');
      const resultBlack = transformer.transform(normalized, 'b');

      expect(resultWhite.perspectiveWdl).toBe(0);
      expect(resultBlack.perspectiveWdl).toBe(0); // Draw is same for both
      expect(resultWhite.perspectiveDtz).toBe(0);
      expect(resultBlack.perspectiveDtz).toBe(0); // DTZ 0 remains 0
    });

    it('should handle mate in 0 correctly', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 0, // Checkmate
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const resultWhite = transformer.transform(normalized, 'w');
      const resultBlack = transformer.transform(normalized, 'b');

      expect(resultWhite.perspectiveMate).toBe(0);
      expect(resultBlack.perspectiveMate).toBe(0); // Mate in 0 is absolute
    });

    it('should handle null values correctly', () => {
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

      const result = transformer.transform(normalized, 'b');

      expect(result).toEqual({
        ...normalized,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      });
    });

    it('should handle score of 0 correctly', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 0, // Equal position
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const resultWhite = transformer.transform(normalized, 'w');
      const resultBlack = transformer.transform(normalized, 'b');

      expect(resultWhite.perspectiveScore).toBe(0);
      expect(resultBlack.perspectiveScore).toBe(0); // 0 remains 0
    });
  });

  describe('Error handling', () => {
    it('should handle invalid perspective gracefully', () => {
      const normalized: NormalizedEvaluation = {
        type: 'engine',
        scoreInCentipawns: 100,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      };

      const result = transformer.transform(normalized, 'x' as any);

      // Should default to White perspective
      expect(result.perspective).toBe('w');
      expect(result.perspectiveScore).toBe(100);
      expect(result.perspectiveDtm).toBe(null);
      expect(result.perspectiveDtz).toBe(null);
    });

    it('should handle null input gracefully', () => {
      const result = transformer.transform(null as any, 'w');

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: null,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      });
    });
  });
});