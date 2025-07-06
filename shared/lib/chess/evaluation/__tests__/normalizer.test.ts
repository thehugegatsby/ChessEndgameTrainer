/**
 * Unit tests for EvaluationNormalizer
 * 
 * This module is responsible for converting raw engine and tablebase evaluation data
 * into a unified, player-agnostic format. All evaluations are normalized to White's
 * perspective for consistency.
 * 
 * Key responsibilities:
 * - Standardize centipawn scores (always from White's perspective)
 * - Normalize mate values (positive = White wins, negative = Black wins)
 * - Handle edge cases and invalid data gracefully
 * 
 * @module EvaluationNormalizer.test
 */

import './jest.setup'; // Setup mocks
import { EvaluationNormalizer } from '../normalizer';
import type { 
  EngineEvaluation, 
  TablebaseResult, 
  NormalizedEvaluation 
} from '@shared/types/evaluation';

// Mock the logger to isolate tests
jest.mock('@shared/services/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

describe('EvaluationNormalizer', () => {
  let normalizer: EvaluationNormalizer;

  beforeEach(() => {
    normalizer = new EvaluationNormalizer();
    jest.clearAllMocks();
  });

  describe('normalizeEngineData', () => {
    it('should normalize a simple positive engine score for White', () => {
      const engineData: EngineEvaluation = {
        score: 100,
        mate: null,
        evaluation: 'White is slightly better',
        depth: 20,
        nodes: 1000000,
        time: 1500
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData, 
        'w' // White to move
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: 100, // Positive = White advantage
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should normalize a negative engine score for Black', () => {
      const engineData: EngineEvaluation = {
        score: -150, // Engine says Black is better by 1.5 pawns (from Black's perspective)
        mate: null,
        evaluation: 'Black is slightly better',
        depth: 18,
        nodes: 800000,
        time: 1200
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'b' // Black to move
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: 150, // Inverted: Positive from White's perspective means Black is worse
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should normalize mate values from White perspective', () => {
      const engineData: EngineEvaluation = {
        score: 0,
        mate: 3, // White mates in 3
        evaluation: 'White mates in 3',
        depth: 25,
        nodes: 2000000,
        time: 2000
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'w'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: null, // No score when mate is found
        mate: 3, // Positive = White mates
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should normalize negative mate values for Black', () => {
      const engineData: EngineEvaluation = {
        score: 0,
        mate: -5, // Engine says Black gets mated in 5 (from Black's perspective)
        evaluation: 'Black gets mated in 5',
        depth: 30,
        nodes: 3000000,
        time: 2500
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'b'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: null,
        mate: 5, // Inverted: Positive = White mates
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should normalize positive mate values for Black', () => {
      const engineData: EngineEvaluation = {
        score: 0,
        mate: 3, // Engine says Black mates in 3 (from Black's perspective)
        evaluation: 'Black mates in 3',
        depth: 25,
        nodes: 2000000,
        time: 1800
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'b'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: null,
        mate: -3, // Inverted: Negative = Black mates
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should handle edge case of mate in 0', () => {
      const engineData: EngineEvaluation = {
        score: 0,
        mate: 0, // Checkmate
        evaluation: 'Checkmate',
        depth: 0,
        nodes: 0,
        time: 0
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'w'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: null,
        mate: 0,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should handle missing evaluation string gracefully', () => {
      const engineData: EngineEvaluation = {
        score: 50,
        mate: null,
        evaluation: '', // Empty evaluation
        depth: 15,
        nodes: 500000,
        time: 1000
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'w'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: 50,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });

    it('should handle extremely large scores', () => {
      const engineData: EngineEvaluation = {
        score: 9999,
        mate: null,
        evaluation: 'White has overwhelming advantage',
        depth: 40,
        nodes: 10000000,
        time: 5000
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'w'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: 9999,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: engineData
      });
    });
  });

  describe('normalizeTablebaseData', () => {
    it('should normalize a winning tablebase position', () => {
      const tablebaseData: TablebaseResult = {
        wdl: 2, // Win
        dtz: 25,
        dtm: 20,
        category: 'win',
        precise: true
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'w' // White to move
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null, // No score for tablebase
        mate: null, // Use DTM instead
        wdl: 2,
        dtm: 20,
        dtz: 25,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });

    it('should normalize a draw tablebase position', () => {
      const tablebaseData: TablebaseResult = {
        wdl: 0, // Draw
        dtz: 0,
        dtm: null,
        category: 'draw',
        precise: true
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'b'
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 0,
        dtm: null,
        dtz: 0,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });

    it('should normalize a losing tablebase position for White', () => {
      const tablebaseData: TablebaseResult = {
        wdl: -2, // Loss for White
        dtz: -30,
        dtm: -25,
        category: 'loss',
        precise: true
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'w'
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -2, // Already from White's perspective
        dtm: -25,
        dtz: -30,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });

    it('should normalize a winning tablebase position for Black', () => {
      const tablebaseData: TablebaseResult = {
        wdl: 2, // Win from Black's perspective
        dtz: 20,
        dtm: 15,
        category: 'win',
        precise: true
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'b'
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -2, // Inverted: Loss for White
        dtm: -15,
        dtz: -20,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });

    it('should handle cursed win positions', () => {
      const tablebaseData: TablebaseResult = {
        wdl: 1, // Cursed win
        dtz: 60,
        dtm: 55,
        category: 'cursed-win',
        precise: false
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'w'
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 1,
        dtm: 55,
        dtz: 60,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });

    it('should handle blessed loss positions for White', () => {
      const tablebaseData: TablebaseResult = {
        wdl: -1, // Blessed loss
        dtz: -70,
        dtm: -65,
        category: 'blessed-loss',
        precise: false
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'w' // White to move
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: -1, // No change for White
        dtm: -65,
        dtz: -70,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });

    it('should handle blessed loss positions for Black', () => {
      const tablebaseData: TablebaseResult = {
        wdl: -1, // Blessed loss from Black's perspective
        dtz: -70,
        dtm: -65,
        category: 'blessed-loss',
        precise: false
      };

      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        tablebaseData,
        'b' // Black to move
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 1, // Inverted: Blessed win for White
        dtm: 65,
        dtz: 70,
        isTablebasePosition: true,
        raw: tablebaseData
      });
    });
  });

  describe('Error handling', () => {
    it('should handle null engine data gracefully', () => {
      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        null as any,
        'w'
      );

      expect(result).toEqual({
        type: 'engine',
        scoreInCentipawns: 0,
        mate: null,
        wdl: null,
        dtm: null,
        dtz: null,
        isTablebasePosition: false,
        raw: null
      });
    });

    it('should handle undefined tablebase data gracefully', () => {
      const result: NormalizedEvaluation = normalizer.normalizeTablebaseData(
        undefined as any,
        'b'
      );

      expect(result).toEqual({
        type: 'tablebase',
        scoreInCentipawns: null,
        mate: null,
        wdl: 0,
        dtm: null,
        dtz: null,
        isTablebasePosition: true,
        raw: undefined
      });
    });

    it('should handle invalid player side gracefully', () => {
      const engineData: EngineEvaluation = {
        score: 100,
        mate: null,
        evaluation: 'Test',
        depth: 20,
        nodes: 1000000,
        time: 1500
      };

      const result: NormalizedEvaluation = normalizer.normalizeEngineData(
        engineData,
        'x' as any // Invalid side
      );

      // Should default to treating as White
      expect(result.scoreInCentipawns).toBe(100);
    });
  });
});