/**
 * @fileoverview Unit tests for mistakeAnalyzer
 * Tests pure logic functions for chess move mistake analysis
 */

import {
  calculateCentipawnDelta,
  createAdaptiveThresholds,
  classifyMove,
  generateMistakeExplanation,
  validateConfig
} from '@shared/services/mistakeAnalysis/mistakeAnalyzer';
import type { 
  AdaptiveConfig, 
  SkillLevel,
  MistakeType,
  MistakeTheme
} from '@shared/services/mistakeAnalysis/types';

describe('mistakeAnalyzer', () => {
  const createConfig = (overrides?: Partial<AdaptiveConfig>): AdaptiveConfig => ({
    skillLevel: 'INTERMEDIATE',
    focusAreas: [],
    sensitivityThreshold: 10,
    showEngineLines: false,
    analysisDepth: 5,
    ...overrides
  });

  describe('calculateCentipawnDelta', () => {
    it('should calculate positive delta for improvement', () => {
      expect(calculateCentipawnDelta(100, 150)).toBe(50);
      expect(calculateCentipawnDelta(-50, 0)).toBe(50);
      expect(calculateCentipawnDelta(-100, -50)).toBe(50);
    });

    it('should calculate negative delta for worsening', () => {
      expect(calculateCentipawnDelta(150, 100)).toBe(-50);
      expect(calculateCentipawnDelta(0, -50)).toBe(-50);
      expect(calculateCentipawnDelta(-50, -100)).toBe(-50);
    });

    it('should return 0 for no change', () => {
      expect(calculateCentipawnDelta(100, 100)).toBe(0);
      expect(calculateCentipawnDelta(-50, -50)).toBe(0);
      expect(calculateCentipawnDelta(0, 0)).toBe(0);
    });

    it('should handle null/undefined values', () => {
      expect(calculateCentipawnDelta(null as any, 100)).toBe(0);
      expect(calculateCentipawnDelta(100, null as any)).toBe(0);
      expect(calculateCentipawnDelta(undefined as any, undefined as any)).toBe(0);
    });

    it('should handle extreme values', () => {
      expect(calculateCentipawnDelta(-10000, 10000)).toBe(20000);
      expect(calculateCentipawnDelta(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER)).toBe(1);
    });
  });

  describe('createAdaptiveThresholds', () => {
    it('should create beginner thresholds', () => {
      const thresholds = createAdaptiveThresholds('BEGINNER');
      expect(thresholds).toEqual({
        inaccuracyThreshold: 75,
        mistakeThreshold: 150,
        blunderThreshold: 350,
        criticalBlunderThreshold: 800
      });
    });

    it('should create intermediate thresholds', () => {
      const thresholds = createAdaptiveThresholds('INTERMEDIATE');
      expect(thresholds).toEqual({
        inaccuracyThreshold: 10,
        mistakeThreshold: 50,
        blunderThreshold: 200,
        criticalBlunderThreshold: 600
      });
    });

    it('should create advanced thresholds', () => {
      const thresholds = createAdaptiveThresholds('ADVANCED');
      expect(thresholds).toEqual({
        inaccuracyThreshold: 35,
        mistakeThreshold: 75,
        blunderThreshold: 200,
        criticalBlunderThreshold: 500
      });
    });

    it('should create expert thresholds', () => {
      const thresholds = createAdaptiveThresholds('EXPERT');
      expect(thresholds).toEqual({
        inaccuracyThreshold: 5,
        mistakeThreshold: 25,
        blunderThreshold: 150,
        criticalBlunderThreshold: 400
      });
    });

    it('should fallback to intermediate for invalid skill level', () => {
      const thresholds = createAdaptiveThresholds('INVALID' as SkillLevel);
      const intermediateThresholds = createAdaptiveThresholds('INTERMEDIATE');
      expect(thresholds).toEqual(intermediateThresholds);
    });
  });

  describe('classifyMove', () => {
    describe('positive evaluations', () => {
      it('should classify perfect moves', () => {
        const config = createConfig();
        const result = classifyMove(100, 200, config);
        
        expect(result.type).toBe('PERFECT');
        expect(result.centipawnDelta).toBe(100);
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.isAdaptive).toBe(false); // INTERMEDIATE level
      });

      it('should classify correct moves', () => {
        const config = createConfig();
        const result = classifyMove(100, 125, config);
        
        expect(result.type).toBe('CORRECT');
        expect(result.centipawnDelta).toBe(25);
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    describe('negative evaluations', () => {
      it('should classify inaccuracies', () => {
        const config = createConfig();
        const result = classifyMove(100, 75, config); // -25 cp loss
        
        expect(result.type).toBe('IMPRECISE');
        expect(result.centipawnDelta).toBe(-25);
        expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      });

      it('should classify mistakes', () => {
        const config = createConfig();
        const result = classifyMove(100, 0, config); // -100 cp loss
        
        expect(result.type).toBe('ERROR');
        expect(result.centipawnDelta).toBe(-100);
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should classify blunders', () => {
        const config = createConfig();
        const result = classifyMove(100, -200, config); // -300 cp loss
        
        expect(result.type).toBe('BLUNDER');
        expect(result.centipawnDelta).toBe(-300);
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      });

      it('should classify critical errors', () => {
        const config = createConfig();
        const result = classifyMove(100, -600, config); // -700 cp loss
        
        expect(result.type).toBe('CRITICAL_ERROR');
        expect(result.centipawnDelta).toBe(-700);
        expect(result.confidence).toBe(1.0);
      });
    });

    describe('adaptive behavior', () => {
      it('should adapt thresholds for beginners', () => {
        const config = createConfig({ skillLevel: 'BEGINNER' });
        const result = classifyMove(100, 0, config); // -100 cp loss
        
        // More forgiving for beginners
        expect(result.type).toBe('IMPRECISE'); // Would be ERROR for intermediate
        expect(result.isAdaptive).toBe(true);
        
        // Test that smaller losses are still acceptable for beginners
        const smallLoss = classifyMove(100, 50, config); // -50 cp loss
        expect(smallLoss.type).toBe('CORRECT'); // Under 75 threshold
      });

      it('should adapt thresholds for experts', () => {
        const config = createConfig({ skillLevel: 'EXPERT' });
        const result = classifyMove(100, 90, config); // -10 cp loss
        
        // Stricter for experts
        expect(result.type).toBe('IMPRECISE'); // Would be CORRECT for intermediate
        expect(result.isAdaptive).toBe(true);
      });

      it('should apply endgame multiplier', () => {
        const config = createConfig({ 
          focusAreas: ['ENDGAME_TECHNIQUE'] 
        });
        const result = classifyMove(100, 70, config); // -30 cp loss
        
        // Much stricter in endgames (0.5x multiplier)
        expect(result.type).toBe('ERROR'); // Would be IMPRECISE without endgame
        expect(result.context.isEndgame).toBe(true);
        expect(result.isAdaptive).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle zero evaluations', () => {
        const config = createConfig();
        const result = classifyMove(0, 0, config);
        
        expect(result.type).toBe('CORRECT');
        expect(result.centipawnDelta).toBe(0);
      });

      it('should handle very small losses', () => {
        const config = createConfig();
        const result = classifyMove(100, 95, config); // -5 cp loss
        
        expect(result.type).toBe('CORRECT'); // Below inaccuracy threshold
        expect(result.confidence).toBe(0.5);
      });

      it('should cap confidence at 1.0', () => {
        const config = createConfig();
        const result = classifyMove(100, -1000, config); // Massive loss
        
        expect(result.confidence).toBe(1.0);
      });

      it('should have minimum confidence of 0.1', () => {
        const config = createConfig();
        // Edge case that might produce very low confidence
        const result = classifyMove(0, 1, config);
        
        expect(result.confidence).toBeGreaterThanOrEqual(0.1);
      });
    });
  });

  describe('generateMistakeExplanation', () => {
    describe('basic explanations', () => {
      it('should generate perfect move explanation', () => {
        const explanation = generateMistakeExplanation(
          'PERFECT',
          100,
          [],
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Perfect choice!');
        expect(explanation).toContain('100 centipawns');
      });

      it('should generate correct move explanation', () => {
        const explanation = generateMistakeExplanation(
          'CORRECT',
          0,
          [],
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Solid move');
      });

      it('should generate error explanation', () => {
        const explanation = generateMistakeExplanation(
          'ERROR',
          -100,
          [],
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Significant mistake');
        expect(explanation).toContain('100 centipawn loss');
      });

      it('should generate blunder explanation', () => {
        const explanation = generateMistakeExplanation(
          'BLUNDER',
          -300,
          [],
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Major blunder');
        expect(explanation).toContain('300 centipawns');
      });

      it('should generate critical error explanation', () => {
        const explanation = generateMistakeExplanation(
          'CRITICAL_ERROR',
          -700,
          [],
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Critical blunder');
        expect(explanation).toContain('700 centipawn loss');
        expect(explanation).toContain('changed the game outcome');
      });
    });

    describe('beginner-friendly explanations', () => {
      it('should simplify language for beginners', () => {
        const explanation = generateMistakeExplanation(
          'PERFECT',
          100,
          [],
          'BEGINNER'
        );
        
        expect(explanation).toContain('Perfect move!');
        expect(explanation).toContain('best possible choice');
        expect(explanation).not.toContain('centipawns'); // Too technical
      });

      it('should add encouragement for beginner mistakes', () => {
        const explanation = generateMistakeExplanation(
          'BLUNDER',
          -300,
          [],
          'BEGINNER'
        );
        
        expect(explanation).toContain('Keep practicing');
        expect(explanation).toContain('mistakes are part of learning');
      });

      it('should use simple language for errors', () => {
        const explanation = generateMistakeExplanation(
          'ERROR',
          -100,
          [],
          'BEGINNER'
        );
        
        expect(explanation).toContain('weakens your position');
        expect(explanation).toContain('Take more time');
      });
    });

    describe('theme-based advice', () => {
      it('should add tactical advice', () => {
        const explanation = generateMistakeExplanation(
          'ERROR',
          -100,
          ['TACTICS'],
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('tactical');
      });

      it('should add endgame advice', () => {
        const explanation = generateMistakeExplanation(
          'ERROR',
          -100,
          ['ENDGAME_TECHNIQUE'],
          'ADVANCED'
        );
        
        expect(explanation).toContain('endgame principles');
      });

      it('should handle multiple themes', () => {
        const explanation = generateMistakeExplanation(
          'ERROR',
          -100,
          ['TACTICS', 'KING_SAFETY', 'CALCULATION'],
          'INTERMEDIATE'
        );
        
        // Should include at least 2 themes
        const themeCount = (explanation.match(/tactical|king safety|calculation/gi) || []).length;
        expect(themeCount).toBeGreaterThanOrEqual(2);
      });

      it('should adapt theme advice to skill level', () => {
        const beginnerExplanation = generateMistakeExplanation(
          'ERROR',
          -100,
          ['TACTICS'],
          'BEGINNER'
        );
        
        const expertExplanation = generateMistakeExplanation(
          'ERROR',
          -100,
          ['TACTICS'],
          'EXPERT'
        );
        
        expect(beginnerExplanation).toContain('Look for tactical opportunities');
        expect(expertExplanation).toContain('pins, forks, and discovered attacks');
      });
    });

    describe('edge cases', () => {
      it('should handle empty theme array', () => {
        const explanation = generateMistakeExplanation(
          'ERROR',
          -100,
          [],
          'INTERMEDIATE'
        );
        
        expect(explanation).toBeTruthy();
        expect(explanation.length).toBeGreaterThan(10);
      });

      it('should handle all possible mistake types', () => {
        const mistakeTypes: MistakeType[] = [
          'PERFECT', 'CORRECT', 'IMPRECISE', 'ERROR', 
          'BLUNDER', 'CRITICAL_ERROR'
        ];
        
        mistakeTypes.forEach(type => {
          const explanation = generateMistakeExplanation(
            type,
            type.startsWith('P') || type.startsWith('C') ? 50 : -100,
            [],
            'INTERMEDIATE'
          );
          
          expect(explanation).toBeTruthy();
          expect(explanation.length).toBeGreaterThan(10);
        });
      });

      it('should handle all skill levels', () => {
        const skillLevels: SkillLevel[] = [
          'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
        ];
        
        skillLevels.forEach(level => {
          const explanation = generateMistakeExplanation(
            'ERROR',
            -100,
            ['TACTICS'],
            level
          );
          
          expect(explanation).toBeTruthy();
          expect(explanation.length).toBeGreaterThan(10);
        });
      });
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = createConfig();
      expect(validateConfig(config)).toBe(true);
    });

    it('should reject null/undefined config', () => {
      expect(validateConfig(null as any)).toBe(false);
      expect(validateConfig(undefined as any)).toBe(false);
    });

    it('should reject invalid skill levels', () => {
      const config = createConfig({ skillLevel: 'INVALID' as SkillLevel });
      expect(validateConfig(config)).toBe(false);
    });

    it('should reject negative sensitivity threshold', () => {
      const config = createConfig({ sensitivityThreshold: -1 });
      expect(validateConfig(config)).toBe(false);
    });

    it('should reject sensitivity threshold > 100', () => {
      const config = createConfig({ sensitivityThreshold: 101 });
      expect(validateConfig(config)).toBe(false);
    });

    it('should reject analysis depth < 1', () => {
      const config = createConfig({ analysisDepth: 0 });
      expect(validateConfig(config)).toBe(false);
    });

    it('should reject analysis depth > 20', () => {
      const config = createConfig({ analysisDepth: 21 });
      expect(validateConfig(config)).toBe(false);
    });

    it('should accept edge case values', () => {
      const minConfig = createConfig({ 
        sensitivityThreshold: 0,
        analysisDepth: 1
      });
      expect(validateConfig(minConfig)).toBe(true);

      const maxConfig = createConfig({ 
        sensitivityThreshold: 100,
        analysisDepth: 20
      });
      expect(validateConfig(maxConfig)).toBe(true);
    });

    it('should validate all skill levels', () => {
      const skillLevels: SkillLevel[] = [
        'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
      ];
      
      skillLevels.forEach(level => {
        const config = createConfig({ skillLevel: level });
        expect(validateConfig(config)).toBe(true);
      });
    });
  });
});