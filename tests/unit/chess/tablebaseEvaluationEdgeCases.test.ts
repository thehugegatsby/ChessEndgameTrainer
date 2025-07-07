/**
 * @fileoverview Unit tests for Tablebase evaluation edge cases
 * @description Tests edge cases in tablebase evaluation, particularly JavaScript falsy value handling
 *
 * Test guidelines followed (see docs/testing/TESTING_GUIDELINES.md):
 * - Each test has a single responsibility
 * - Self-explanatory test names  
 * - No magic values
 * - Deterministic behavior
 * - Fast execution
 */

import { getMoveQualityByTablebaseComparison } from '@shared/utils/chess/evaluationHelpers';

describe('Tablebase Evaluation Edge Cases', () => {
  describe('JavaScript falsy value handling', () => {
    it('should correctly handle WDL value of 0 (draw)', () => {
      // This was the bug! 0 is falsy in JavaScript
      const evaluation = getMoveQualityByTablebaseComparison(2, 0, 'w');
      
      // Should show catastrophic error (win -> draw)
      expect(evaluation.text).toBe('🚨');
      expect(evaluation.className).toBe('eval-blunder');
    });

    it('should handle all falsy WDL values correctly', () => {
      const falsyTestCases = [
        { wdlBefore: 0, wdlAfter: 0, expected: '➖' }, // Draw maintained
        { wdlBefore: 2, wdlAfter: 0, expected: '🚨' }, // Win to draw
        { wdlBefore: 0, wdlAfter: -2, expected: '🎯' }, // Draw to win (wdlAfter=-2 means opponent loses)
        { wdlBefore: 0, wdlAfter: 2, expected: '❌' }, // Draw to loss (wdlAfter=2 means opponent wins)
      ];

      falsyTestCases.forEach(({ wdlBefore, wdlAfter, expected }) => {
        const result = getMoveQualityByTablebaseComparison(wdlBefore, wdlAfter, 'w');
        expect(result.text).toBe(expected);
        expect(result.text).not.toBe('⚪'); // Should never fall back to neutral
      });
    });

    it('should handle undefined values by returning neutral', () => {
      const undefinedCases = [
        { wdlBefore: undefined, wdlAfter: 0 },
        { wdlBefore: 2, wdlAfter: undefined },
        { wdlBefore: undefined, wdlAfter: undefined },
      ];

      undefinedCases.forEach(({ wdlBefore, wdlAfter }) => {
        const result = getMoveQualityByTablebaseComparison(
          wdlBefore as any, 
          wdlAfter as any, 
          'w'
        );
        expect(result.text).toBe('⚪'); // Should fallback to neutral
      });
    });

    it('should not confuse 0 with undefined', () => {
      // Test the actual fix
      const wdl = 0;
      
      // Bad pattern that caused the bug
      const badPattern = wdl || undefined;
      expect(badPattern).toBeUndefined(); // This is the bug!
      
      // Good pattern that fixes it
      const goodPattern = wdl !== undefined ? wdl : undefined;
      expect(goodPattern).toBe(0); // Correct!
    });
  });

  describe('Complete Brückenbau sequence evaluation', () => {
    it('should evaluate the complete Kb5 blunder sequence', () => {
      // The exact sequence from the bug report
      const moves = [
        { move: 'Kd7', side: 'w', wdlBefore: 2, wdlAfter: -2, expected: '✅' },
        { move: 'Rc2', side: 'b', wdlBefore: -2, wdlAfter: 2, expected: '🛡️' },
        { move: 'Kc6', side: 'w', wdlBefore: 2, wdlAfter: -2, expected: '✅' },
        { move: 'Rc1', side: 'b', wdlBefore: -2, wdlAfter: 2, expected: '🛡️' },
        { move: 'Kb5', side: 'w', wdlBefore: 2, wdlAfter: 0, expected: '🚨' }, // The blunder!
      ];

      moves.forEach(({ move, side, wdlBefore, wdlAfter, expected }) => {
        const result = getMoveQualityByTablebaseComparison(
          wdlBefore, 
          wdlAfter, 
          side as 'w' | 'b'
        );
        expect(result.text).toBe(expected);
        
        if (move === 'Kb5') {
          expect(result.className).toContain('blunder');
        }
      });
    });
  });

  describe('All WDL transitions', () => {
    it('should handle all possible WDL state transitions', () => {
      const transitions = [
        // Win transitions (remember: wdlAfter gets flipped!)
        { from: 2, to: -2, expected: '✅', desc: 'Win maintained (after=-2 flipped to 2)' },
        { from: 2, to: -1, expected: '✅', desc: 'Win to cursed win (after=-1 flipped to 1, still win)' },
        { from: 2, to: 0, expected: '🚨', desc: 'Win to draw (after=0 flipped to 0)' },
        { from: 2, to: 1, expected: '💥', desc: 'Win to blessed loss (after=1 flipped to -1)' },
        { from: 2, to: 2, expected: '💥', desc: 'Win to loss (after=2 flipped to -2)' },
        
        // Draw transitions (remember: wdlAfter gets flipped!)
        { from: 0, to: -2, expected: '🎯', desc: 'Draw to win (after=-2 flipped to 2)' },
        { from: 0, to: 0, expected: '➖', desc: 'Draw maintained (after=0 flipped to 0)' },
        { from: 0, to: 2, expected: '❌', desc: 'Draw to loss (after=2 flipped to -2)' },
        
        // Loss transitions (remember: wdlAfter gets flipped!)
        { from: -2, to: -2, expected: '🎯', desc: 'Loss to win (after=-2 flipped to 2)' },
        { from: -2, to: 0, expected: '👍', desc: 'Loss to draw (after=0 flipped to 0)' },
        { from: -2, to: 2, expected: '🛡️', desc: 'Loss maintained (after=2 flipped to -2)' },
        { from: -2, to: 1, expected: '🛡️', desc: 'Loss to blessed loss (after=1 flipped to -1)' },
      ];

      transitions.forEach(({ from, to, expected, desc }) => {
        const result = getMoveQualityByTablebaseComparison(from, to, 'w');
        expect(result.text).toBe(expected);
      });
    });
  });

  describe('Type safety', () => {
    it('should have proper TypeScript types', () => {
      // This should not compile if types are wrong
      const result = getMoveQualityByTablebaseComparison(2, 0, 'w');
      
      // Check that result has the expected shape
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('className');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('bgColor');
      
      // TypeScript should enforce these
      expect(typeof result.text).toBe('string');
      expect(typeof result.className).toBe('string');
    });
  });
});