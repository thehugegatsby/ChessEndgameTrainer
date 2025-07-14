/**
 * @fileoverview Unit tests for engine-based move quality evaluation
 * @description Tests getMoveQualityDisplay function with various evaluations
 */

import { describe, test, expect } from '@jest/globals';
import { getMoveQualityDisplay } from '../../../shared/utils/chess/evaluationHelpers';

describe('Engine Evaluation - Move Quality Display', () => {
  describe('Mate Evaluations', () => {
    test('should_display_mate_in_1_as_excellent', () => {
      const result = getMoveQualityDisplay(0, 1, true);
      
      expect(result.text).toBe('#1');
      expect(result.className).toBe('eval-excellent');
      expect(result.color).toBe('#10b981');
      expect(result.bgColor).toBe('#065f46');
    });
    
    test('should_display_mate_in_3_as_excellent', () => {
      const result = getMoveQualityDisplay(0, 3, true);
      
      expect(result.text).toBe('#3');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_display_mate_in_15_as_excellent', () => {
      const result = getMoveQualityDisplay(0, 15, true);
      
      expect(result.text).toBe('#15');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_display_being_mated_as_neutral', () => {
      const result = getMoveQualityDisplay(0, -5, true);
      
      expect(result.text).toBe('#5');
      expect(result.className).toBe('eval-neutral');
      expect(result.color).toBe('var(--text-secondary)');
      expect(result.bgColor).toBe('var(--bg-accent)');
    });
    
    test('should_use_absolute_value_for_negative_mate', () => {
      const result = getMoveQualityDisplay(0, -1, true);
      
      expect(result.text).toBe('#1');
      expect(result.className).toBe('eval-neutral');
    });
  });
  
  describe('Positional Evaluations', () => {
    test('should_display_dominating_position_with_star', () => {
      // >= 5.0 pawns advantage
      const result = getMoveQualityDisplay(5.5, undefined, true);
      
      expect(result.text).toBe('⭐');
      expect(result.className).toBe('eval-excellent');
      expect(result.color).toBe('#10b981');
      expect(result.bgColor).toBe('#065f46');
    });
    
    test('should_display_excellent_position_with_sparkles', () => {
      // >= 2.0 pawns advantage
      const result = getMoveQualityDisplay(3.0, undefined, true);
      
      expect(result.text).toBe('✨');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_display_good_position_with_ok_hand', () => {
      // >= 0.5 pawns advantage
      const result = getMoveQualityDisplay(1.0, undefined, true);
      
      expect(result.text).toBe('👌');
      expect(result.className).toBe('eval-good');
      expect(result.color).toBe('#3b82f6');
      expect(result.bgColor).toBe('#1e40af');
    });
    
    test('should_display_neutral_position_with_circle', () => {
      // Near 0 evaluation
      const result = getMoveQualityDisplay(0.1, undefined, true);
      
      expect(result.text).toBe('⚪');
      expect(result.className).toBe('eval-neutral');
      expect(result.color).toBe('var(--text-secondary)');
      expect(result.bgColor).toBe('var(--bg-accent)');
    });
  });
  
  describe('Threshold Tests', () => {
    test('should_handle_exact_5_0_threshold', () => {
      const result = getMoveQualityDisplay(5.0, undefined, true);
      expect(result.text).toBe('⭐');
    });
    
    test('should_handle_just_below_5_0_threshold', () => {
      const result = getMoveQualityDisplay(4.99, undefined, true);
      expect(result.text).toBe('✨');
    });
    
    test('should_handle_exact_2_0_threshold', () => {
      const result = getMoveQualityDisplay(2.0, undefined, true);
      expect(result.text).toBe('✨');
    });
    
    test('should_handle_just_below_2_0_threshold', () => {
      const result = getMoveQualityDisplay(1.99, undefined, true);
      expect(result.text).toBe('👌');
    });
    
    test('should_handle_exact_0_5_threshold', () => {
      const result = getMoveQualityDisplay(0.5, undefined, true);
      expect(result.text).toBe('👌');
    });
    
    test('should_handle_just_below_0_5_threshold', () => {
      const result = getMoveQualityDisplay(0.49, undefined, true);
      expect(result.text).toBe('⚪');
    });
  });
  
  describe('Absolute Value Handling', () => {
    test('should_use_absolute_value_for_negative_evaluations', () => {
      const negativeResult = getMoveQualityDisplay(-3.0, undefined, true);
      const positiveResult = getMoveQualityDisplay(3.0, undefined, true);
      
      expect(negativeResult.text).toBe(positiveResult.text);
      expect(negativeResult.className).toBe(positiveResult.className);
    });
    
    test('should_treat_minus_5_same_as_plus_5', () => {
      const result = getMoveQualityDisplay(-5.0, undefined, true);
      
      expect(result.text).toBe('⭐');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_treat_minus_1_same_as_plus_1', () => {
      const result = getMoveQualityDisplay(-1.0, undefined, true);
      
      expect(result.text).toBe('👌');
      expect(result.className).toBe('eval-good');
    });
  });
  
  describe('Edge Cases', () => {
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
    
    test('should_handle_zero_evaluation', () => {
      const result = getMoveQualityDisplay(0.0, undefined, true);
      
      expect(result.text).toBe('⚪');
      expect(result.className).toBe('eval-neutral');
    });
    
    test('should_handle_zero_mate_as_normal_evaluation', () => {
      // Zero mate is undefined behavior, falls through to evaluation
      const result = getMoveQualityDisplay(1.0, 0, true);
      
      expect(result.text).toBe('👌');
      expect(result.className).toBe('eval-good');
    });
    
    test('should_handle_NaN_gracefully', () => {
      const result = getMoveQualityDisplay(NaN, undefined, true);
      
      // NaN >= checks will be false, so it falls through to default
      expect(result.text).toBe('⚪');
      expect(result.className).toBe('eval-neutral');
    });
    
    test('should_handle_Infinity', () => {
      const result = getMoveQualityDisplay(Infinity, undefined, true);
      
      expect(result.text).toBe('⭐');
      expect(result.className).toBe('eval-excellent');
    });
    
    test('should_handle_negative_Infinity', () => {
      const result = getMoveQualityDisplay(-Infinity, undefined, true);
      
      expect(result.text).toBe('⭐');
      expect(result.className).toBe('eval-excellent');
    });
  });
  
  describe('Legacy Parameter', () => {
    test('should_ignore_isPlayerMove_parameter', () => {
      const withTrue = getMoveQualityDisplay(3.0, undefined, true);
      const withFalse = getMoveQualityDisplay(3.0, undefined, false);
      
      expect(withTrue).toEqual(withFalse);
    });
  });
  
  describe('Complete Display Object', () => {
    test('should_return_all_required_properties', () => {
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