/**
 * @fileoverview Unit tests for Evaluation Formatter
 * @description Tests evaluation formatting, display conversion, and perspective-aware output generation
 *
 * Test guidelines followed (see docs/testing/TESTING_GUIDELINES.md):
 * - Each test has a single responsibility
 * - Self-explanatory test names  
 * - No magic values
 * - Deterministic behavior
 * - Fast execution
 */

import { EvaluationFormatter } from '../../../../../shared/lib/chess/evaluation/formatter';
import type { PlayerPerspectiveEvaluation } from '../../../../../shared/types/evaluation';

// Helper function to create a minimal PlayerPerspectiveEvaluation
function createEvaluation(overrides: Partial<PlayerPerspectiveEvaluation>): PlayerPerspectiveEvaluation {
  return {
    perspective: 'w',
    type: 'engine',
    scoreInCentipawns: null,
    mate: null,
    wdl: null,
    dtm: null,
    dtz: null,
    perspectiveScore: null,
    perspectiveMate: null,
    perspectiveWdl: null,
    perspectiveDtm: null,
    perspectiveDtz: null,
    isTablebasePosition: false,
    raw: null,
    ...overrides
  };
}

describe('EvaluationFormatter', () => {
  let formatter: EvaluationFormatter;

  beforeEach(() => {
    formatter = new EvaluationFormatter();
  });

  describe('constructor', () => {
    it('should use default config values', () => {
      const result = formatter.format(createEvaluation({
        perspectiveScore: 40, // Below default threshold of 50
        scoreInCentipawns: 40
      }));
      
      expect(result.className).toBe('neutral');
    });

    it('should accept custom config values', () => {
      const customFormatter = new EvaluationFormatter({
        neutralThreshold: 100,
        extremeScoreThreshold: 2000
      });
      
      const result = customFormatter.format(createEvaluation({
        perspectiveScore: 80, // Below custom threshold of 100
        scoreInCentipawns: 80
      }));
      
      expect(result.className).toBe('neutral');
    });
  });

  describe('format', () => {
    describe('null/undefined handling', () => {
      it('should handle null evaluation', () => {
        const result = formatter.format(null);
        
        expect(result).toEqual({
          mainText: '...',
          detailText: null,
          className: 'neutral',
          metadata: {
            isTablebase: false,
            isMate: false,
            isDrawn: false
          }
        });
      });

      it('should handle undefined evaluation', () => {
        const result = formatter.format(undefined);
        
        expect(result).toEqual({
          mainText: '...',
          detailText: null,
          className: 'neutral',
          metadata: {
            isTablebase: false,
            isMate: false,
            isDrawn: false
          }
        });
      });

      it('should handle evaluation with all null values', () => {
        const evaluation = createEvaluation({});
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('...');
        expect(result.className).toBe('neutral');
      });
    });

    describe('priority hierarchy', () => {
      it('should prioritize tablebase over mate', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          scoreInCentipawns: 500,
          mate: 5,
          wdl: 2,
          dtm: 10,
          perspectiveScore: 500,
          perspectiveMate: 5,
          perspectiveWdl: 2,
          perspectiveDtm: 10,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Win');
        expect(result.metadata.isTablebase).toBe(true);
      });

      it('should prioritize mate over score', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 500,
          mate: 5,
          perspectiveScore: 500,
          perspectiveMate: 5
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('M5');
        expect(result.metadata.isMate).toBe(true);
      });

      it('should use score when tablebase and mate are null', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 250,
          perspectiveScore: 250
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('2.5');
        expect(result.className).toBe('advantage');
      });
    });

    describe('tablebase formatting', () => {
      it('should format clear win (WDL > 1)', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: 2,
          dtm: 15,
          perspectiveWdl: 2,
          perspectiveDtm: 15,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Win');
        expect(result.detailText).toBe('DTM: 15');
        expect(result.className).toBe('winning');
        expect(result.metadata.isDrawn).toBe(false);
      });

      it('should format cursed win (WDL = 1)', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: 1,
          dtm: 20,
          perspectiveWdl: 1,
          perspectiveDtm: 20,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Win*');
        expect(result.detailText).toBe('DTM: 20');
        expect(result.className).toBe('winning');
      });

      it('should format draw (WDL = 0)', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: 0,
          dtz: 5,
          perspectiveWdl: 0,
          perspectiveDtz: 5,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Draw');
        expect(result.detailText).toBe('DTZ: 5');
        expect(result.className).toBe('neutral');
        expect(result.metadata.isDrawn).toBe(true);
      });

      it('should format blessed loss (WDL = -1)', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: -1,
          dtm: -25,
          perspectiveWdl: -1,
          perspectiveDtm: -25,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Loss*');
        expect(result.detailText).toBe('DTM: 25');
        expect(result.className).toBe('losing');
      });

      it('should format clear loss (WDL < -1)', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: -2,
          dtm: -30,
          perspectiveWdl: -2,
          perspectiveDtm: -30,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Loss');
        expect(result.detailText).toBe('DTM: 30');
        expect(result.className).toBe('losing');
      });

      it('should handle tablebase without DTM/DTZ', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: 2,
          perspectiveWdl: 2,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Win');
        expect(result.detailText).toBe(null);
      });

      it('should not show DTZ for non-draw positions', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: 2,
          dtz: 10, // Should be ignored for wins
          perspectiveWdl: 2,
          perspectiveDtz: 10,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.detailText).toBe(null);
      });

      it('should not show DTZ when DTZ is 0', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          wdl: 0,
          dtz: 0,
          perspectiveWdl: 0,
          perspectiveDtz: 0,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('TB Draw');
        expect(result.detailText).toBe(null);
      });
    });

    describe('mate formatting', () => {
      it('should format checkmate on board (mate = 0)', () => {
        const evaluation = createEvaluation({
          mate: 0,
          perspectiveMate: 0
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('M#');
        expect(result.className).toBe('winning');
        expect(result.metadata.isMate).toBe(true);
      });

      it('should format positive mate (player wins)', () => {
        const evaluation = createEvaluation({
          mate: 7,
          perspectiveMate: 7
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('M7');
        expect(result.className).toBe('winning');
      });

      it('should format negative mate (player loses)', () => {
        const evaluation = createEvaluation({
          mate: -5,
          perspectiveMate: -5
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('M5'); // Absolute value
        expect(result.className).toBe('losing');
      });

      it('should handle large mate numbers', () => {
        const evaluation = createEvaluation({
          mate: 99,
          perspectiveMate: 99
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('M99');
        expect(result.className).toBe('winning');
      });
    });

    describe('score formatting', () => {
      it('should format neutral score', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 25,
          perspectiveScore: 25 // Below 50 threshold
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('0.3'); // 25/100 = 0.25, rounded to 0.3
        expect(result.className).toBe('neutral');
      });

      it('should format positive advantage', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 150,
          perspectiveScore: 150
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('1.5');
        expect(result.className).toBe('advantage');
      });

      it('should format negative disadvantage', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: -275,
          perspectiveScore: -275
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('-2.8'); // -275/100 = -2.75, rounded to -2.8
        expect(result.className).toBe('disadvantage');
      });

      it('should handle exactly neutral threshold', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 50,
          perspectiveScore: 50
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('0.5');
        expect(result.className).toBe('advantage'); // 50 is not < 50
      });

      it('should handle zero score', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 0,
          perspectiveScore: 0
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('0.0');
        expect(result.className).toBe('neutral');
      });

      it('should handle large scores', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 1250,
          perspectiveScore: 1250
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('12.5');
        expect(result.className).toBe('advantage');
      });
    });

    describe('edge cases', () => {
      it('should handle tablebase position without WDL', () => {
        const evaluation = createEvaluation({
          type: 'tablebase',
          scoreInCentipawns: 100,
          perspectiveScore: 100,
          isTablebasePosition: true
        });
        
        const result = formatter.format(evaluation);
        
        // Should fall back to score
        expect(result.mainText).toBe('1.0');
        expect(result.metadata.isTablebase).toBe(false);
      });

      it('should handle very small scores', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: 5,
          perspectiveScore: 5
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('0.1'); // 5/100 = 0.05, rounded to 0.1
        expect(result.className).toBe('neutral');
      });

      it('should handle negative neutral scores', () => {
        const evaluation = createEvaluation({
          scoreInCentipawns: -45,
          perspectiveScore: -45
        });
        
        const result = formatter.format(evaluation);
        
        expect(result.mainText).toBe('-0.5'); // -45/100 = -0.45, rounded to -0.5
        expect(result.className).toBe('neutral');
      });
    });
  });
});