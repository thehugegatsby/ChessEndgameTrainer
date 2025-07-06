/**
 * @fileoverview Unit tests for chess evaluation helpers
 * @description Tests move quality evaluation, tablebase comparison, and perspective correction
 */

import { describe, test, expect } from '@jest/globals';
import { 
  getMoveQualityDisplay, 
  getMoveQualityByTablebaseComparison 
} from '../../../shared/utils/chess/evaluationHelpers';

describe('Chess Evaluation Helpers', () => {
  describe('getMoveQualityDisplay', () => {
    describe('Mate Evaluations', () => {
      test('should_display_mate_in_favor_as_excellent', () => {
        const result = getMoveQualityDisplay(0, 3, true);
        
        expect(result.text).toBe('#3');
        expect(result.className).toBe('eval-excellent');
        expect(result.color).toBe('var(--success-text)');
        expect(result.bgColor).toBe('var(--success-bg)');
      });

      test('should_display_mate_against_as_neutral', () => {
        const result = getMoveQualityDisplay(0, -5, true);
        
        expect(result.text).toBe('#5'); // Absolute value
        expect(result.className).toBe('eval-neutral');
        expect(result.color).toBe('var(--text-secondary)');
        expect(result.bgColor).toBe('var(--bg-accent)');
      });

      test('should_handle_mate_in_one', () => {
        const result = getMoveQualityDisplay(0, 1, true);
        
        expect(result.text).toBe('#1');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_handle_distant_mate', () => {
        const result = getMoveQualityDisplay(0, 15, true);
        
        expect(result.text).toBe('#15');
        expect(result.className).toBe('eval-excellent');
      });
    });

    describe('Non-Mate Evaluations', () => {
      test('should_display_very_strong_moves_with_star', () => {
        const result = getMoveQualityDisplay(5.5, undefined, true);
        
        expect(result.text).toBe('⭐');
        expect(result.className).toBe('eval-excellent');
        expect(result.color).toBe('var(--success-text)');
        expect(result.bgColor).toBe('var(--success-bg)');
      });

      test('should_display_strong_moves_with_sparkle', () => {
        const result = getMoveQualityDisplay(3.0, undefined, true);
        
        expect(result.text).toBe('✨');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_display_good_moves_with_ok_hand', () => {
        const result = getMoveQualityDisplay(1.0, undefined, true);
        
        expect(result.text).toBe('👌');
        expect(result.className).toBe('eval-good');
        expect(result.color).toBe('var(--info-text)');
        expect(result.bgColor).toBe('var(--info-bg)');
      });

      test('should_display_neutral_moves_with_circle', () => {
        const result = getMoveQualityDisplay(0.0, undefined, true);
        
        expect(result.text).toBe('⚪');
        expect(result.className).toBe('eval-neutral');
        expect(result.color).toBe('var(--text-secondary)');
        expect(result.bgColor).toBe('var(--bg-accent)');
      });

      test('should_use_absolute_values_for_evaluation', () => {
        // Negative evaluation should still show as positive (absolute value)
        const negativeResult = getMoveQualityDisplay(-3.0, undefined, true);
        const positiveResult = getMoveQualityDisplay(3.0, undefined, true);
        
        expect(negativeResult.text).toBe(positiveResult.text);
        expect(negativeResult.className).toBe(positiveResult.className);
      });
    });

    describe('Threshold Edge Cases', () => {
      test('should_handle_exact_threshold_values', () => {
        expect(getMoveQualityDisplay(5.0, undefined, true).text).toBe('⭐');
        expect(getMoveQualityDisplay(4.9, undefined, true).text).toBe('✨');
        expect(getMoveQualityDisplay(2.0, undefined, true).text).toBe('✨');
        expect(getMoveQualityDisplay(1.9, undefined, true).text).toBe('👌');
        expect(getMoveQualityDisplay(0.5, undefined, true).text).toBe('👌');
        expect(getMoveQualityDisplay(0.4, undefined, true).text).toBe('⚪');
      });

      test('should_handle_very_large_evaluations', () => {
        const result = getMoveQualityDisplay(100.0, undefined, true);
        
        expect(result.text).toBe('⭐');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_handle_very_small_evaluations', () => {
        const result = getMoveQualityDisplay(0.01, undefined, true);
        
        expect(result.text).toBe('⚪');
        expect(result.className).toBe('eval-neutral');
      });
    });

    describe('Parameter Edge Cases', () => {
      test('should_handle_undefined_mate', () => {
        const result = getMoveQualityDisplay(1.0, undefined, true);
        
        expect(result.text).toBe('👌');
        expect(result.className).toBe('eval-good');
      });

      test('should_handle_zero_mate', () => {
        const result = getMoveQualityDisplay(1.0, 0, true);
        
        // Zero mate is undefined behavior, should fall through to evaluation
        expect(result.text).toBe('👌');
      });

      test('should_ignore_isPlayerMove_parameter', () => {
        // This parameter is legacy and unused
        const result1 = getMoveQualityDisplay(3.0, undefined, true);
        const result2 = getMoveQualityDisplay(3.0, undefined, false);
        
        expect(result1).toEqual(result2);
      });
    });
  });

  describe('getMoveQualityByTablebaseComparison', () => {
    describe('Perspective Correction', () => {
      test('should_handle_white_perspective_correctly', () => {
        // White plays a move that maintains a win
        // Before: White to move, White wins (wdl = 2)
        // After: Black to move, Black loses (wdl = -2)
        // From White's perspective: win -> win (good!)
        const result = getMoveQualityByTablebaseComparison(2, -2, 'w');
        
        expect(result.text).toBe('✅');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_handle_black_perspective_correctly', () => {
        // Black plays a move that maintains a win
        // Before: Black to move, Black wins (wdl = 2)  
        // After: White to move, White loses (wdl = -2)
        // From Black's perspective: win -> win (good!)
        const result = getMoveQualityByTablebaseComparison(2, -2, 'b');
        
        expect(result.text).toBe('✅');
        expect(result.className).toBe('eval-excellent');
      });
    });

    describe('Catastrophic Mistakes', () => {
      test('should_detect_thrown_away_win_to_draw', () => {
        // Player had a win but now it's a draw
        // Before: Player wins (wdl = 2)
        // After: Position is drawn (wdl = 0)
        const result = getMoveQualityByTablebaseComparison(2, 0, 'w');
        
        expect(result.text).toBe('🚨');
        expect(result.className).toBe('eval-blunder');
        expect(result.color).toBe('var(--error-text)');
        expect(result.bgColor).toBe('var(--error-bg)');
      });

      test('should_detect_thrown_away_win_to_loss', () => {
        // Player had a win but now loses
        // Before: Player wins (wdl = 2)
        // After: Player loses (wdl = 2, but from opponent's perspective)
        const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
        
        expect(result.text).toBe('💥');
        expect(result.className).toBe('eval-blunder');
      });

      test('should_detect_thrown_away_draw_to_loss', () => {
        // Player had a draw but now loses
        // Before: Draw (wdl = 0)
        // After: Player loses (wdl = 2, from opponent's perspective)
        const result = getMoveQualityByTablebaseComparison(0, 2, 'w');
        
        expect(result.text).toBe('❌');
        expect(result.className).toBe('eval-mistake');
      });
    });

    describe('Good Moves', () => {
      test('should_recognize_maintaining_winning_position', () => {
        // Player maintains a winning position
        const result = getMoveQualityByTablebaseComparison(2, -2, 'w');
        
        expect(result.text).toBe('✅');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_recognize_converting_draw_to_win', () => {
        // Player improves from draw to win
        const result = getMoveQualityByTablebaseComparison(0, -2, 'w');
        
        expect(result.text).toBe('🎯');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_recognize_converting_loss_to_draw', () => {
        // Player saves a losing position to a draw
        const result = getMoveQualityByTablebaseComparison(-2, 0, 'w');
        
        expect(result.text).toBe('👍');
        expect(result.className).toBe('eval-good');
      });

      test('should_recognize_converting_loss_to_win', () => {
        // Player turns a loss into a win (unlikely but possible)
        const result = getMoveQualityByTablebaseComparison(-2, -2, 'w');
        
        expect(result.text).toBe('🎯');
        expect(result.className).toBe('eval-excellent');
      });
    });

    describe('Neutral Moves', () => {
      test('should_handle_maintaining_draw', () => {
        // Player maintains a drawn position
        const result = getMoveQualityByTablebaseComparison(0, 0, 'w');
        
        expect(result.text).toBe('➖');
        expect(result.className).toBe('eval-neutral');
      });

      test('should_handle_optimal_defense_in_losing_position', () => {
        // When losing, maintaining the loss is the best defense
        const result = getMoveQualityByTablebaseComparison(-2, 2, 'w');
        
        expect(result.text).toBe('🛡️');
        expect(result.className).toBe('eval-neutral');
      });
    });

    describe('WDL Value Edge Cases', () => {
      test('should_handle_cursed_wins_as_wins', () => {
        // Cursed win (wdl = 1) should be treated as win
        const result = getMoveQualityByTablebaseComparison(1, -1, 'w');
        
        expect(result.text).toBe('✅');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_handle_blessed_losses_as_losses', () => {
        // Blessed loss (wdl = -1) should be treated as loss
        const result = getMoveQualityByTablebaseComparison(-1, 1, 'w');
        
        expect(result.text).toBe('🛡️');
        expect(result.className).toBe('eval-neutral');
      });

      test('should_handle_large_wdl_values', () => {
        // Some tablebase implementations might use values > 2
        const result = getMoveQualityByTablebaseComparison(5, -5, 'w');
        
        expect(result.text).toBe('✅');
        expect(result.className).toBe('eval-excellent');
      });

      test('should_handle_zero_wdl_values', () => {
        const result = getMoveQualityByTablebaseComparison(0, 0, 'w');
        
        expect(result.text).toBe('➖');
        expect(result.className).toBe('eval-neutral');
      });
    });

    describe('All Transitions Matrix', () => {
      const testTransition = (before: number, after: number, side: 'w' | 'b', expectedClass: string) => {
        const result = getMoveQualityByTablebaseComparison(before, after, side);
        expect(result.className).toBe(expectedClass);
      };

      test('should_handle_all_win_to_win_transitions', () => {
        testTransition(2, -2, 'w', 'eval-excellent'); // Win maintained
        testTransition(1, -1, 'w', 'eval-excellent'); // Cursed win maintained
        testTransition(2, -1, 'w', 'eval-excellent'); // Win to cursed win (still win)
      });

      test('should_handle_all_win_to_draw_transitions', () => {
        testTransition(2, 0, 'w', 'eval-blunder'); // Win to draw
        testTransition(1, 0, 'w', 'eval-blunder'); // Cursed win to draw
      });

      test('should_handle_all_win_to_loss_transitions', () => {
        testTransition(2, 2, 'w', 'eval-blunder'); // Win to loss
        testTransition(1, 1, 'w', 'eval-blunder'); // Cursed win to blessed loss
      });

      test('should_handle_all_draw_transitions', () => {
        testTransition(0, 0, 'w', 'eval-neutral');  // Draw maintained
        testTransition(0, -2, 'w', 'eval-excellent'); // Draw to win
        testTransition(0, 2, 'w', 'eval-mistake');   // Draw to loss (should be mistake, not bad)
      });

      test('should_handle_all_loss_transitions', () => {
        testTransition(-2, 2, 'w', 'eval-neutral');   // Loss maintained (defense)
        testTransition(-2, 0, 'w', 'eval-good');      // Loss to draw (salvation)
        testTransition(-2, -2, 'w', 'eval-excellent'); // Loss to win (miracle)
      });
    });

    describe('Player Side Variations', () => {
      test('should_produce_same_results_for_equivalent_positions', () => {
        // Same logical transition for different sides should have same classification
        const whiteResult = getMoveQualityByTablebaseComparison(2, -2, 'w');
        const blackResult = getMoveQualityByTablebaseComparison(2, -2, 'b');
        
        expect(whiteResult.className).toBe(blackResult.className);
      });

      test('should_handle_black_blunders_correctly', () => {
        // Black throws away a win
        const result = getMoveQualityByTablebaseComparison(2, 0, 'b');
        
        expect(result.text).toBe('🚨');
        expect(result.className).toBe('eval-blunder');
      });
    });
  });

  describe('Integration and Cross-Function Tests', () => {
    test('should_have_consistent_class_names_across_functions', () => {
      const engineExcellent = getMoveQualityDisplay(5.0, undefined, true);
      const tablebaseExcellent = getMoveQualityByTablebaseComparison(2, -2, 'w');
      
      expect(engineExcellent.className).toBe('eval-excellent');
      expect(tablebaseExcellent.className).toBe('eval-excellent');
    });

    test('should_handle_edge_case_combinations', () => {
      // Test that all functions handle edge cases gracefully
      expect(() => getMoveQualityDisplay(NaN, undefined, true)).not.toThrow();
      expect(() => getMoveQualityDisplay(Infinity, undefined, true)).not.toThrow();
      expect(() => getMoveQualityByTablebaseComparison(NaN, NaN, 'w')).not.toThrow();
    });

    test('should_provide_complete_evaluation_objects', () => {
      const result = getMoveQualityDisplay(1.0, undefined, true);
      
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('className');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('bgColor');
      
      expect(typeof result.text).toBe('string');
      expect(typeof result.className).toBe('string');
      expect(typeof result.color).toBe('string');
      expect(typeof result.bgColor).toBe('string');
    });
  });
});