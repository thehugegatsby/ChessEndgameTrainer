/**
 * Unit tests for EvaluationFormatter
 * 
 * This module converts PlayerPerspectiveEvaluation into UI-ready formatted strings.
 * It handles different evaluation types (engine score, mate, tablebase) with
 * appropriate formatting for display.
 * 
 * @module EvaluationFormatter.test
 */

import './jest.setup'; // Setup mocks
import { EvaluationFormatter } from '@/lib/chess/evaluation/formatter';
import type { 
  PlayerPerspectiveEvaluation,
  FormattedEvaluation 
} from '@shared/types/evaluation';

describe('EvaluationFormatter', () => {
  let formatter: EvaluationFormatter;

  beforeEach(() => {
    formatter = new EvaluationFormatter();
    jest.clearAllMocks();
  });

  describe('Tablebase Formatting', () => {
    it('should format tablebase win correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 2,
        dtm: 25,
        dtz: 30,
        isTablebasePosition: true,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 2,
        perspectiveDtm: 25,
        perspectiveDtz: 30
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Win',
        detailText: 'DTM: 25',
        className: 'winning',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should format tablebase cursed win correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 1,
        dtm: 55,
        dtz: 60,
        isTablebasePosition: true,
        raw: null,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 1,
        perspectiveDtm: 55,
        perspectiveDtz: 60
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Win*',
        detailText: 'DTM: 55',
        className: 'winning',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should format tablebase draw correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 0,
        dtm: null,
        dtz: 0,
        isTablebasePosition: true,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 0,
        perspectiveDtm: null,
        perspectiveDtz: 0
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Draw',
        detailText: null,
        className: 'neutral',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: true
        }
      });
    });

    it('should format tablebase draw with DTZ correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 0,
        dtm: null,
        dtz: 45,
        isTablebasePosition: true,
        raw: null,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 0,
        perspectiveDtm: null,
        perspectiveDtz: 45
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Draw',
        detailText: 'DTZ: 45',
        className: 'neutral',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: true
        }
      });
    });

    it('should format tablebase loss correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -2,
        dtm: -30,
        dtz: -35,
        isTablebasePosition: true,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: -2,
        perspectiveDtm: -30,
        perspectiveDtz: -35
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Loss',
        detailText: 'DTM: 30',
        className: 'losing',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should format tablebase blessed loss correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -1,
        dtm: -65,
        dtz: -70,
        isTablebasePosition: true,
        raw: null,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: -1,
        perspectiveDtm: -65,
        perspectiveDtz: -70
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Loss*',
        detailText: 'DTM: 65',
        className: 'losing',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should handle tablebase position without DTM', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 2,
        dtm: null,
        dtz: 20,
        isTablebasePosition: true,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: null,
        perspectiveWdl: 2,
        perspectiveDtm: null,
        perspectiveDtz: 20
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'TB Win',
        detailText: null,
        className: 'winning',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: false
        }
      });
    });
  });

  describe('Engine Mate Formatting', () => {
    it('should format positive mate correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 3,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: 3,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'M3',
        detailText: null,
        className: 'winning',
        metadata: {
          isTablebase: false,
          isMate: true,
          isDrawn: false
        }
      });
    });

    it('should format negative mate correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: -5,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'b',
        perspectiveScore: null,
        perspectiveMate: -5,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'M5',
        detailText: null,
        className: 'losing',
        metadata: {
          isTablebase: false,
          isMate: true,
          isDrawn: false
        }
      });
    });

    it('should format checkmate (mate in 0) correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: null,
        mate: 0,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: null,
        perspectiveMate: 0,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: 'M#',
        detailText: null,
        className: 'winning',
        metadata: {
          isTablebase: false,
          isMate: true,
          isDrawn: false
        }
      });
    });
  });

  describe('Engine Score Formatting', () => {
    it('should format positive score correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 125,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 125,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: '1.3',
        detailText: null,
        className: 'advantage',
        metadata: {
          isTablebase: false,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should format negative score correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: -250,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'b',
        perspectiveScore: -250,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: '-2.5',
        detailText: null,
        className: 'disadvantage',
        metadata: {
          isTablebase: false,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should format neutral score (within threshold) as 0.00', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 15,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 15,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: '0.1',
        detailText: null,
        className: 'neutral',
        metadata: {
          isTablebase: false,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should format exact zero score correctly', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 0,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'b',
        perspectiveScore: 0,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: '0.0',
        detailText: null,
        className: 'neutral',
        metadata: {
          isTablebase: false,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should cap extremely positive scores', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 1500,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 1500,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: '15.0',
        detailText: null,
        className: 'advantage',
        metadata: {
          isTablebase: false,
          isMate: false,
          isDrawn: false
        }
      });
    });

    it('should cap extremely negative scores', () => {
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: -2000,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'b',
        perspectiveScore: -2000,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = formatter.format(evaluation);

      expect(result).toEqual({
        mainText: '-20.0',
        detailText: null,
        className: 'disadvantage',
        metadata: {
          isTablebase: false,
          isMate: false,
          isDrawn: false
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle null input gracefully', () => {
      const result = formatter.format(null as any);

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

    it('should handle undefined input gracefully', () => {
      const result = formatter.format(undefined as any);

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
      const evaluation: PlayerPerspectiveEvaluation = {
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
      };

      const result = formatter.format(evaluation);

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
  });

  describe('Configuration', () => {
    it('should respect custom neutral threshold', () => {
      const customFormatter = new EvaluationFormatter({ neutralThreshold: 50 });
      
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 40,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 40,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = customFormatter.format(evaluation);

      expect(result.mainText).toBe('0.4');
      expect(result.className).toBe('neutral');
    });

    it('should respect custom extreme score threshold', () => {
      const customFormatter = new EvaluationFormatter({ extremeScoreThreshold: 500 });
      
      const evaluation: PlayerPerspectiveEvaluation = {
        type: 'engine',
        scoreInCentipawns: 600,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null,
        perspective: 'w',
        perspectiveScore: 600,
        perspectiveMate: null,
        perspectiveWdl: null,
        perspectiveDtm: null,
        perspectiveDtz: null
      };

      const result = customFormatter.format(evaluation);

      expect(result.mainText).toBe('6.0');
      expect(result.className).toBe('advantage');
    });
  });
});