/**
 * @fileoverview Unit tests for tablebase evaluation with concrete FEN positions
 * @description Tests specific endgame positions and their move evaluations
 */

import { describe, test, expect } from '@jest/globals';
import { getMoveQualityByTablebaseComparison } from '../../../shared/utils/chess/evaluationHelpers';

describe('Tablebase Evaluation - Concrete Positions', () => {
  describe('Brückenbau Position', () => {
    // FEN: 2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1
    const BRUECKENBAU_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
    
    test('should_evaluate_Kd7_as_winning_move', () => {
      // Before: White to move, White wins (wdl = 2)
      // After Kd7: Black to move, Black loses (wdl = -2)
      const result = getMoveQualityByTablebaseComparison(2, -2, 'w');
      
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
      expect(result.color).toBe('var(--success-text)');
      expect(result.bgColor).toBe('var(--success-bg)');
    });
    
    test('should_evaluate_Rd2_check_as_best_defense_for_black', () => {
      // After White plays Kd7, Black plays Rd2+
      // Before: Black to move, Black loses (wdl = -2)
      // After Rd2+: White to move, White wins (wdl = 2)
      const result = getMoveQualityByTablebaseComparison(-2, 2, 'b');
      
      expect(result.text).toBe('🛡️');
      expect(result.className).toBe('eval-neutral');
      expect(result.color).toBe('var(--text-secondary)');
      expect(result.bgColor).toBe('var(--bg-accent)');
    });
    
    test('should_evaluate_Kc6_as_maintaining_win', () => {
      // After ...Rd2+, White plays Kc6
      // Before: White to move, White wins (wdl = 2)
      // After Kc6: Black to move, Black loses (wdl = -2)
      const result = getMoveQualityByTablebaseComparison(2, -2, 'w');
      
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_evaluate_Rc2_check_as_best_defense_for_black', () => {
      // After Kc6, Black plays Rc2+
      // Before: Black to move, Black loses (wdl = -2)
      // After Rc2+: White to move, White wins (wdl = 2)
      const result = getMoveQualityByTablebaseComparison(-2, 2, 'b');
      
      expect(result.text).toBe('🛡️');
      expect(result.className).toBe('eval-neutral');
    });
    
    test('should_evaluate_Kb5_as_blunder_throwing_away_win', () => {
      // After ...Rc2+, White plays Kb5 (bad!)
      // Before: White to move, White wins (wdl = 2)
      // After Kb5: Black to move, position is drawn (wdl = 0)
      const result = getMoveQualityByTablebaseComparison(2, 0, 'w');
      
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
      expect(result.color).toBe('var(--error-text)');
      expect(result.bgColor).toBe('var(--error-bg)');
    });
    
    test('should_evaluate_Rxc7_as_holding_draw', () => {
      // After Kb5 blunder, Black plays Rxc7
      // Before: Black to move, position is drawn (wdl = 0)
      // After Rxc7: White to move, still drawn (wdl = 0)
      const result = getMoveQualityByTablebaseComparison(0, 0, 'b');
      
      expect(result.text).toBe('➖');
      expect(result.className).toBe('eval-neutral');
    });
  });
  
  describe('Philidor Position', () => {
    // FEN: 4k3/7R/r3P3/5K2/8/8/8/8 b - - 0 1
    const PHILIDOR_FEN = '4k3/7R/r3P3/5K2/8/8/8/8 b - - 0 1';
    
    test('should_evaluate_Ra1_as_drawing_move', () => {
      // Before: Black to move, position is drawn (wdl = 0)
      // After Ra1: White to move, still drawn (wdl = 0)
      const result = getMoveQualityByTablebaseComparison(0, 0, 'b');
      
      expect(result.text).toBe('➖');
      expect(result.className).toBe('eval-neutral');
      expect(result.color).toBe('var(--text-secondary)');
      expect(result.bgColor).toBe('var(--bg-accent)');
    });
    
    test('should_evaluate_Ra8_as_losing_move', () => {
      // Before: Black to move, position is drawn (wdl = 0)
      // After Ra8: White to move, White wins (wdl = 2)
      const result = getMoveQualityByTablebaseComparison(0, 2, 'b');
      
      expect(result.text).toBe('❌');
      expect(result.className).toBe('eval-mistake');
      expect(result.color).toBe('#fb923c');
      expect(result.bgColor).toBe('#c2410c');
    });
    
    test('should_evaluate_Ra7_as_losing_move_draw_to_loss', () => {
      // Before: Black to move, position is drawn (wdl = 0)
      // After Ra7: White to move, White wins (wdl = 2)
      const result = getMoveQualityByTablebaseComparison(0, 2, 'b');
      
      expect(result.text).toBe('❌');
      expect(result.className).toBe('eval-mistake');
    });
    
    test('should_evaluate_Rb7_as_catastrophic_blunder', () => {
      // Assuming position after Ra7, White plays Rb7
      // Before: White to move, White wins (wdl = 2)
      // After Rb7: Black to move, Black wins! (wdl = 2 from Black's perspective)
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
      
      expect(result.text).toBe('💥');
      expect(result.className).toBe('eval-blunder');
      expect(result.color).toBe('var(--error-text)');
      expect(result.bgColor).toBe('var(--error-bg)');
    });
  });
  
  describe('Special Cases and Transitions', () => {
    test('should_evaluate_loss_to_win_as_brilliant_move', () => {
      // Miracle save: from losing to winning
      // Before: Player loses (wdl = -2)
      // After: Player wins (wdl = -2 from opponent perspective)
      const result = getMoveQualityByTablebaseComparison(-2, -2, 'w');
      
      expect(result.text).toBe('🎯');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_evaluate_draw_to_win_as_excellent', () => {
      // Improving from draw to win
      // Before: Draw (wdl = 0)
      // After: Player wins (wdl = -2 from opponent perspective)
      const result = getMoveQualityByTablebaseComparison(0, -2, 'w');
      
      expect(result.text).toBe('🎯');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_evaluate_loss_to_draw_as_good_defense', () => {
      // Saving a losing position
      // Before: Player loses (wdl = -2)
      // After: Draw (wdl = 0)
      const result = getMoveQualityByTablebaseComparison(-2, 0, 'w');
      
      expect(result.text).toBe('👍');
      expect(result.className).toBe('eval-good');
      expect(result.color).toBe('var(--info-text)');
      expect(result.bgColor).toBe('var(--info-bg)');
    });
    
    test('should_evaluate_improved_win_as_star', () => {
      // Win to better win (cursed win to normal win)
      // Before: Cursed win (wdl = 1)
      // After: Clear win (wdl = -2 from opponent perspective)
      const result = getMoveQualityByTablebaseComparison(1, -2, 'w');
      
      expect(result.text).toBe('🌟');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_evaluate_worse_loss_as_weak_defense', () => {
      // Making a loss worse
      // Before: Loss (wdl = -1)
      // After: Worse loss (wdl = 2 from opponent perspective)
      const result = getMoveQualityByTablebaseComparison(-1, 2, 'w');
      
      expect(result.text).toBe('🔻');
      expect(result.className).toBe('eval-inaccurate');
      expect(result.color).toBe('var(--warning-text)');
      expect(result.bgColor).toBe('var(--warning-bg)');
    });
  });
  
  describe('Perspective Tests', () => {
    test('should_handle_white_perspective_correctly', () => {
      // White maintains win
      const whiteWin = getMoveQualityByTablebaseComparison(2, -2, 'w');
      expect(whiteWin.text).toBe('✅');
      
      // White throws away win
      const whiteBlunder = getMoveQualityByTablebaseComparison(2, 0, 'w');
      expect(whiteBlunder.text).toBe('🚨');
    });
    
    test('should_handle_black_perspective_correctly', () => {
      // Black maintains win
      const blackWin = getMoveQualityByTablebaseComparison(2, -2, 'b');
      expect(blackWin.text).toBe('✅');
      
      // Black throws away win
      const blackBlunder = getMoveQualityByTablebaseComparison(2, 0, 'b');
      expect(blackBlunder.text).toBe('🚨');
    });
    
    test('should_treat_optimal_defense_equally_for_both_colors', () => {
      // White's optimal defense in losing position
      const whiteDefense = getMoveQualityByTablebaseComparison(-2, 2, 'w');
      expect(whiteDefense.text).toBe('🛡️');
      
      // Black's optimal defense in losing position
      const blackDefense = getMoveQualityByTablebaseComparison(-2, 2, 'b');
      expect(blackDefense.text).toBe('🛡️');
    });
  });
  
  describe('Edge Cases', () => {
    test('should_handle_fractional_wdl_values_as_draw', () => {
      // Fractional WDL values (0.5) should be treated as draw
      const result = getMoveQualityByTablebaseComparison(0.5, 0.5, 'w');
      
      expect(result.text).toBe('➖'); // Draw maintained
      expect(result.className).toBe('eval-neutral');
    });
    
    test('should_handle_cursed_wins_correctly', () => {
      // Cursed win (1) to normal win (2)
      const improvedWin = getMoveQualityByTablebaseComparison(1, -2, 'w');
      expect(improvedWin.text).toBe('🌟');
      
      // Cursed win maintained
      const maintainedCursedWin = getMoveQualityByTablebaseComparison(1, -1, 'w');
      expect(maintainedCursedWin.text).toBe('✅');
    });
    
    test('should_handle_blessed_losses_correctly', () => {
      // Blessed loss (-1) maintained
      const maintainedBlessedLoss = getMoveQualityByTablebaseComparison(-1, 1, 'w');
      expect(maintainedBlessedLoss.text).toBe('🛡️');
    });
  });
});