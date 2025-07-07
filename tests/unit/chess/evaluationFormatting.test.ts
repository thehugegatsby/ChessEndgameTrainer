/**
 * @fileoverview Unit tests for evaluation formatting functions
 * @description Tests formatEvaluation, getEvaluationColor, and getEvaluationBarWidth
 */

import { describe, test, expect } from '@jest/globals';
import { 
  formatEvaluation, 
  getEvaluationColor, 
  getEvaluationBarWidth,
  getCategory 
} from '../../../shared/utils/chess/evaluationHelpers';
import { EvaluationData } from '../../../shared/types/evaluation';

describe('Evaluation Formatting Functions', () => {
  describe('formatEvaluation', () => {
    test('should_return_default_for_undefined_data', () => {
      expect(formatEvaluation(undefined)).toBe('0.00');
    });
    
    test('should_format_mate_evaluations', () => {
      const mateIn3: EvaluationData = {
        evaluation: 0,
        mateInMoves: 3
      };
      expect(formatEvaluation(mateIn3)).toBe('#3');
      
      const mateInNeg5: EvaluationData = {
        evaluation: 0,
        mateInMoves: -5
      };
      expect(formatEvaluation(mateInNeg5)).toBe('#5');
    });
    
    test('should_format_near_zero_evaluations', () => {
      const tinyEval: EvaluationData = {
        evaluation: 0.05
      };
      expect(formatEvaluation(tinyEval)).toBe('0.0');
      
      const negTinyEval: EvaluationData = {
        evaluation: -0.09
      };
      expect(formatEvaluation(negTinyEval)).toBe('0.0');
    });
    
    test('should_format_positive_evaluations_with_plus', () => {
      const positiveEval: EvaluationData = {
        evaluation: 2.5
      };
      expect(formatEvaluation(positiveEval)).toBe('+2.5');
      
      const smallPositive: EvaluationData = {
        evaluation: 0.15
      };
      expect(formatEvaluation(smallPositive)).toBe('+0.1');
    });
    
    test('should_format_negative_evaluations', () => {
      const negativeEval: EvaluationData = {
        evaluation: -3.7
      };
      expect(formatEvaluation(negativeEval)).toBe('-3.7');
    });
    
    test('should_handle_edge_cases', () => {
      const exactlyZero: EvaluationData = {
        evaluation: 0
      };
      expect(formatEvaluation(exactlyZero)).toBe('0.0');
      
      const threshold: EvaluationData = {
        evaluation: 0.1
      };
      expect(formatEvaluation(threshold)).toBe('+0.1');
    });
  });
  
  describe('getEvaluationColor', () => {
    test('should_return_default_gray_for_undefined', () => {
      expect(getEvaluationColor(undefined)).toBe('text-gray-600');
    });
    
    test('should_color_mate_evaluations', () => {
      const whiteMate: EvaluationData = {
        evaluation: 0,
        mateInMoves: 5
      };
      expect(getEvaluationColor(whiteMate)).toBe('text-green-700');
      
      const blackMate: EvaluationData = {
        evaluation: 0,
        mateInMoves: -3
      };
      expect(getEvaluationColor(blackMate)).toBe('text-red-700');
    });
    
    test('should_color_based_on_evaluation_thresholds', () => {
      // Strong white advantage
      const strongWhite: EvaluationData = { evaluation: 3.5 };
      expect(getEvaluationColor(strongWhite)).toBe('text-green-700');
      
      // Moderate white advantage
      const moderateWhite: EvaluationData = { evaluation: 1.2 };
      expect(getEvaluationColor(moderateWhite)).toBe('text-green-600');
      
      // Equal position
      const equal: EvaluationData = { evaluation: 0.3 };
      expect(getEvaluationColor(equal)).toBe('text-gray-600');
      
      // Slight black advantage
      const slightBlack: EvaluationData = { evaluation: -1.0 };
      expect(getEvaluationColor(slightBlack)).toBe('text-orange-600');
      
      // Strong black advantage
      const strongBlack: EvaluationData = { evaluation: -2.5 };
      expect(getEvaluationColor(strongBlack)).toBe('text-red-600');
    });
    
    test('should_handle_exact_thresholds', () => {
      expect(getEvaluationColor({ evaluation: 2.0 })).toBe('text-green-600');
      expect(getEvaluationColor({ evaluation: 0.5 })).toBe('text-gray-600');
      expect(getEvaluationColor({ evaluation: -0.5 })).toBe('text-orange-600');
      expect(getEvaluationColor({ evaluation: -2.0 })).toBe('text-red-600');
    });
  });
  
  describe('getEvaluationBarWidth', () => {
    test('should_return_50_for_undefined', () => {
      expect(getEvaluationBarWidth(undefined)).toBe(50);
    });
    
    test('should_return_50_for_zero_evaluation', () => {
      expect(getEvaluationBarWidth(0)).toBe(50);
    });
    
    test('should_calculate_width_for_positive_evaluations', () => {
      expect(getEvaluationBarWidth(1)).toBe(60);  // 50 + (1 * 10)
      expect(getEvaluationBarWidth(2.5)).toBe(75); // 50 + (2.5 * 10)
      expect(getEvaluationBarWidth(5)).toBe(100);  // Clamped at 100
    });
    
    test('should_calculate_width_for_negative_evaluations', () => {
      expect(getEvaluationBarWidth(-1)).toBe(40);  // 50 + (-1 * 10)
      expect(getEvaluationBarWidth(-3)).toBe(20);  // 50 + (-3 * 10)
      expect(getEvaluationBarWidth(-5)).toBe(0);   // Clamped at 0
    });
    
    test('should_clamp_extreme_values', () => {
      expect(getEvaluationBarWidth(10)).toBe(100);
      expect(getEvaluationBarWidth(-10)).toBe(0);
      expect(getEvaluationBarWidth(100)).toBe(100);
      expect(getEvaluationBarWidth(-100)).toBe(0);
    });
  });
  
  describe('getCategory', () => {
    test('should_categorize_wins', () => {
      expect(getCategory(2)).toBe('win');     // Clear win
      expect(getCategory(1)).toBe('win');     // Cursed win
      expect(getCategory(1.5)).toBe('win');   // Any value >= 1
    });
    
    test('should_categorize_losses', () => {
      expect(getCategory(-2)).toBe('loss');   // Clear loss
      expect(getCategory(-1)).toBe('loss');   // Blessed loss
      expect(getCategory(-1.5)).toBe('loss'); // Any value <= -1
    });
    
    test('should_categorize_draws', () => {
      expect(getCategory(0)).toBe('draw');
      expect(getCategory(0.5)).toBe('draw');
      expect(getCategory(-0.5)).toBe('draw');
      expect(getCategory(0.99)).toBe('draw');
      expect(getCategory(-0.99)).toBe('draw');
    });
  });
});