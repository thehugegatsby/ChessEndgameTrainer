/**
 * @file Unit tests for tablebase ranking utilities
 * @module tests/utils/tablebase/tablebaseRanking
 *
 * @description
 * Pure function tests for hierarchical tablebase move ranking.
 * Tests the core ranking logic without API dependencies.
 */

import { describe, it, expect } from 'vitest';
import { compareTablebaseMoves, sortTablebaseMoves } from '../../../shared/utils/tablebase/tablebaseRanking';
import { TablebaseTestScenarios } from '../../../shared/testing/TablebaseTestScenarios';
import type { TablebaseMoveInternal } from '../../../shared/utils/tablebase/tablebaseRanking';

describe('tablebaseRanking', () => {
  describe('compareTablebaseMoves', () => {
    it('should prioritize WDL as primary criterion', () => {
      const winMove: TablebaseMoveInternal = {
        uci: 'e2e4',
        san: 'e4',
        wdl: 2,
        dtz: 50,
        dtm: 50,
        category: 'win'
      };
      
      const lossMove: TablebaseMoveInternal = {
        uci: 'e2e3',
        san: 'e3',
        wdl: -2,
        dtz: 1,
        dtm: 1,
        category: 'loss'
      };

      // Win should come before loss regardless of better DTZ/DTM on loss
      expect(compareTablebaseMoves(winMove, lossMove)).toBeLessThan(0);
      expect(compareTablebaseMoves(lossMove, winMove)).toBeGreaterThan(0);
    });

    it('should prioritize DTM over DTZ when WDL is equal', () => {
      const fasterMate: TablebaseMoveInternal = {
        uci: 'move1',
        san: 'Move1',
        wdl: 2,
        dtz: 10, // Worse DTZ
        dtm: 5,  // Better DTM
        category: 'win'
      };
      
      const slowerMate: TablebaseMoveInternal = {
        uci: 'move2', 
        san: 'Move2',
        wdl: 2,
        dtz: 5,  // Better DTZ
        dtm: 15, // Worse DTM
        category: 'win'
      };

      // Faster mate (better DTM) should win despite worse DTZ
      expect(compareTablebaseMoves(fasterMate, slowerMate)).toBeLessThan(0);
    });

    it('should use DTZ as final tiebreaker when WDL and DTM are equal', () => {
      const betterDtz: TablebaseMoveInternal = {
        uci: 'move1',
        san: 'Move1',
        wdl: 2,
        dtz: 5,  // Better DTZ
        dtm: 10, // Same DTM
        category: 'win'
      };
      
      const worseDtz: TablebaseMoveInternal = {
        uci: 'move2',
        san: 'Move2', 
        wdl: 2,
        dtz: 15, // Worse DTZ
        dtm: 10, // Same DTM
        category: 'win'
      };

      expect(compareTablebaseMoves(betterDtz, worseDtz)).toBeLessThan(0);
    });

    it('should handle defensive strategy for losing positions', () => {
      const longerResistance: TablebaseMoveInternal = {
        uci: 'defensive',
        san: 'Defensive',
        wdl: -2,
        dtz: -20,
        dtm: -30, // Higher absolute DTM = better defense
        category: 'loss'
      };
      
      const shorterResistance: TablebaseMoveInternal = {
        uci: 'quick',
        san: 'Quick',
        wdl: -2,
        dtz: -20,
        dtm: -10, // Lower absolute DTM = worse defense
        category: 'loss'
      };

      // Longer resistance should be preferred
      expect(compareTablebaseMoves(longerResistance, shorterResistance)).toBeLessThan(0);
    });

    it('should handle null DTM values', () => {
      const withDtm: TablebaseMoveInternal = {
        uci: 'move1',
        san: 'Move1',
        wdl: 2,
        dtz: 10,
        dtm: 5,
        category: 'win'
      };
      
      const withoutDtm: TablebaseMoveInternal = {
        uci: 'move2',
        san: 'Move2',
        wdl: 2,
        dtz: 10,
        dtm: null, // Null DTM (treated as 0)
        category: 'win'
      };

      // Should not throw and should handle gracefully
      expect(() => compareTablebaseMoves(withDtm, withoutDtm)).not.toThrow();
    });
  });

  describe('sortTablebaseMoves', () => {
    it('should sort moves correctly and not mutate original array', () => {
      const moves: TablebaseMoveInternal[] = [
        { uci: 'c', san: 'C', wdl: -2, dtz: -5, dtm: -10, category: 'loss' },
        { uci: 'a', san: 'A', wdl: 2, dtz: 5, dtm: 10, category: 'win' },
        { uci: 'b', san: 'B', wdl: 0, dtz: 0, dtm: null, category: 'draw' }
      ];
      
      const originalLength = moves.length;
      const sorted = sortTablebaseMoves(moves);
      
      // Should not mutate original
      expect(moves.length).toBe(originalLength);
      expect(moves[0].uci).toBe('c'); // Original order preserved
      
      // Should return correctly sorted array
      expect(sorted[0].uci).toBe('a'); // Win first
      expect(sorted[1].uci).toBe('b'); // Draw second  
      expect(sorted[2].uci).toBe('c'); // Loss last
    });
  });

  describe('Integration with TablebaseTestScenarios', () => {
    it('should correctly rank DTM priority conflict scenario', () => {
      const scenario = TablebaseTestScenarios.DTM_PRIORITY_CONFLICT;
      const moves: TablebaseMoveInternal[] = scenario.moves.map(move => ({
        uci: move.uci,
        san: move.san,
        wdl: move.wdl,
        dtz: move.dtz,
        dtm: move.dtm,
        category: move.category || 'win',
        zeroing: false
      }));

      const sorted = sortTablebaseMoves(moves);
      const ranking = sorted.map(move => move.uci);
      
      expect(ranking).toEqual(scenario.expectedRanking);
    });

    it('should correctly rank WDL priority scenario', () => {
      const scenario = TablebaseTestScenarios.ROOK_ENDGAME_WDL_PRIORITY;
      const moves: TablebaseMoveInternal[] = scenario.moves.map(move => ({
        uci: move.uci,
        san: move.san,
        wdl: move.wdl,
        dtz: move.dtz,
        dtm: move.dtm,
        category: move.category || 'win',
        zeroing: false
      }));

      const sorted = sortTablebaseMoves(moves);
      
      // First move should be the winning one
      expect(sorted[0].wdl).toBeGreaterThan(0);
      expect(sorted[0].uci).toBe('e2b2'); // The winning move
    });

    it('should correctly rank defensive strategy scenario', () => {
      const scenario = TablebaseTestScenarios.DEFENSIVE_STRATEGY_LOSING_POSITION;
      const moves: TablebaseMoveInternal[] = scenario.moves.map(move => ({
        uci: move.uci,
        san: move.san,
        wdl: move.wdl,
        dtz: move.dtz,
        dtm: move.dtm,
        category: move.category || 'loss',
        zeroing: false
      }));

      const sorted = sortTablebaseMoves(moves);
      const ranking = sorted.map(move => move.uci);
      
      expect(ranking).toEqual(scenario.expectedRanking);
      
      // Verify defensive logic: best moves have highest absolute DTM
      expect(Math.abs(sorted[0].dtm!)).toBeGreaterThanOrEqual(Math.abs(sorted[sorted.length - 1].dtm!));
    });

    it('should correctly rank DTM tiebreaker scenario', () => {
      const scenario = TablebaseTestScenarios.DTM_TIEBREAKER_SAME_DTZ;
      const moves: TablebaseMoveInternal[] = scenario.moves.map(move => ({
        uci: move.uci,
        san: move.san,
        wdl: move.wdl,
        dtz: move.dtz,
        dtm: move.dtm,
        category: move.category || 'win',
        zeroing: false
      }));

      const sorted = sortTablebaseMoves(moves);
      const ranking = sorted.map(move => move.uci);
      
      expect(ranking).toEqual(scenario.expectedRanking);
      
      // Verify DTM tiebreaker: better DTM comes first when DTZ is same
      expect(Math.abs(sorted[0].dtm!)).toBeLessThanOrEqual(Math.abs(sorted[1].dtm!));
    });
  });
});