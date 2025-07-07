/**
 * Unit tests for smart move evaluation that prioritizes tablebase over engine
 */

import { describe, test, expect } from '@jest/globals';
import { getSmartMoveEvaluation, MoveEvaluation } from '../../../shared/utils/chess/evaluation/smartEvaluation';

describe('getSmartMoveEvaluation', () => {
  describe('Tablebase Priority', () => {
    test('should use tablebase evaluation when available', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 2.5, // Engine says good
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2, // Win
          wdlAfter: 0,  // Draw - catastrophic!
          category: 'draw'
        }
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      // Should show catastrophic symbol despite positive engine eval
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });

    test('should handle optimal tablebase move', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 0.5,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 0, // Draw
          wdlAfter: 2,  // Win - perfect!
          category: 'win'
        }
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      expect(result.text).toBe('❌');
      expect(result.className).toBe('eval-mistake');
    });

    test('should handle Black perspective correctly', () => {
      const evaluation: MoveEvaluation = {
        evaluation: -2.5,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: -2, // Loss for White = Win for Black
          wdlAfter: 0,   // Draw
          category: 'draw'
        }
      };

      const result = getSmartMoveEvaluation(evaluation, false, 0);
      
      // Black improved from loss to draw
      expect(result.text).toBe('👍');
      expect(result.className).toBe('eval-good');
    });
  });

  describe('Engine Fallback', () => {
    test('should fall back to engine when no tablebase data', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 3.5,
        mateInMoves: undefined
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      // Should use engine evaluation
      expect(result.text).toBe('✨');
      expect(result.className).toBe('eval-excellent');
    });

    test('should fall back when tablebase incomplete', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 1.5,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          // wdlAfter missing!
          category: 'win'
        }
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      // Should use engine evaluation due to missing data
      expect(result.text).toBe('👌');
      expect(result.className).toBe('eval-good');
    });

    test('should handle mate evaluations', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 0,
        mateInMoves: 3
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      expect(result.text).toBe('#3');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('Edge Cases', () => {
    test('should handle position not in tablebase', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 0.8,
        tablebase: {
          isTablebasePosition: false,
          wdlBefore: undefined,
          wdlAfter: undefined
        }
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      // Should use engine evaluation
      expect(result.text).toBe('👌');
      expect(result.className).toBe('eval-good');
    });

    test('should handle zero evaluation', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 0
      };

      const result = getSmartMoveEvaluation(evaluation, true, 0);
      
      expect(result.text).toBe('⚪');
      expect(result.className).toBe('eval-neutral');
    });

    test('should handle negative evaluation for Black', () => {
      const evaluation: MoveEvaluation = {
        evaluation: -4.0 // Good for Black
      };

      const result = getSmartMoveEvaluation(evaluation, false, 0);
      
      expect(result.text).toBe('✨');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('Move Index Parameter', () => {
    test('should accept moveIndex parameter', () => {
      const evaluation: MoveEvaluation = {
        evaluation: 1.0
      };

      // Test with different move indices
      const result1 = getSmartMoveEvaluation(evaluation, true, 0);
      const result2 = getSmartMoveEvaluation(evaluation, true, 5);
      const result3 = getSmartMoveEvaluation(evaluation, true, 10);
      
      // Currently moveIndex is not used, but should be accepted
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});