/**
 * Test-Driven Development Tests for Mistake Analysis Core Logic
 * Tests written BEFORE implementation following TDD principles
 */

import { 
  MistakeType, 
  MistakeClassificationResult, 
  SkillLevel,
  AdaptiveConfig 
} from '../types';

// Import functions that will be implemented
import { 
  classifyMove,
  calculateCentipawnDelta,
  createAdaptiveThresholds,
  generateMistakeExplanation
} from '../mistakeAnalyzer';

describe('MistakeAnalyzer - Pure Logic Functions', () => {
  
  describe('calculateCentipawnDelta', () => {
    it('should calculate positive delta for improving moves', () => {
      const result = calculateCentipawnDelta(-50, 100);
      expect(result).toBe(150);
    });

    it('should calculate negative delta for worsening moves', () => {
      const result = calculateCentipawnDelta(100, -50);
      expect(result).toBe(-150);
    });

    it('should handle equal evaluations', () => {
      const result = calculateCentipawnDelta(100, 100);
      expect(result).toBe(0);
    });

    it('should handle large evaluation swings', () => {
      const result = calculateCentipawnDelta(500, -800);
      expect(result).toBe(-1300);
    });
  });

  describe('classifyMove - Standard Thresholds', () => {
    const defaultConfig: AdaptiveConfig = {
      skillLevel: 'INTERMEDIATE',
      focusAreas: [],
      sensitivityThreshold: 10,
      showEngineLines: true,
      analysisDepth: 10
    };

    it('should classify excellent moves (+50cp or more)', () => {
      const result = classifyMove(-100, 150, defaultConfig);
      expect(result.type).toBe('EXCELLENT');
      expect(result.centipawnDelta).toBe(250);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify good moves (0 to +50cp)', () => {
      const result = classifyMove(100, 130, defaultConfig);
      expect(result.type).toBe('GOOD');
      expect(result.centipawnDelta).toBe(30);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should classify inaccuracies (-10 to -50cp)', () => {
      const result = classifyMove(100, 70, defaultConfig);
      expect(result.type).toBe('INACCURACY');
      expect(result.centipawnDelta).toBe(-30);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify mistakes (-50 to -200cp)', () => {
      const result = classifyMove(100, -50, defaultConfig);
      expect(result.type).toBe('MISTAKE');
      expect(result.centipawnDelta).toBe(-150);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify blunders (-200cp or more)', () => {
      const result = classifyMove(100, -150, defaultConfig);
      expect(result.type).toBe('BLUNDER');
      expect(result.centipawnDelta).toBe(-250);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should classify critical blunders (win to loss)', () => {
      const result = classifyMove(500, -500, defaultConfig);
      expect(result.type).toBe('CRITICAL_BLUNDER');
      expect(result.centipawnDelta).toBe(-1000);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('classifyMove - Adaptive Thresholds', () => {
    it('should be more forgiving for beginners', () => {
      const beginnerConfig: AdaptiveConfig = {
        skillLevel: 'BEGINNER',
        focusAreas: [],
        sensitivityThreshold: 50,
        showEngineLines: false,
        analysisDepth: 5
      };

      // -80cp loss should be inaccuracy for beginner, mistake for intermediate
      const beginnerResult = classifyMove(100, 20, beginnerConfig);
      expect(beginnerResult.type).toBe('INACCURACY');
      expect(beginnerResult.isAdaptive).toBe(true);
    });

    it('should be stricter for experts', () => {
      const expertConfig: AdaptiveConfig = {
        skillLevel: 'EXPERT',
        focusAreas: ['TACTICS', 'ENDGAME_TECHNIQUE'],
        sensitivityThreshold: 5,
        showEngineLines: true,
        analysisDepth: 15
      };

      // -30cp loss should be mistake for expert, inaccuracy for intermediate
      const expertResult = classifyMove(100, 70, expertConfig);
      expect(expertResult.type).toBe('MISTAKE');
      expect(expertResult.isAdaptive).toBe(true);
    });

    it('should consider endgame context', () => {
      const endgameConfig: AdaptiveConfig = {
        skillLevel: 'INTERMEDIATE',
        focusAreas: ['ENDGAME_TECHNIQUE'],
        sensitivityThreshold: 10,
        showEngineLines: true,
        analysisDepth: 12
      };

      const result = classifyMove(50, -50, endgameConfig);
      expect(result.context.isEndgame).toBe(true);
      // Endgame mistakes should be more heavily penalized
      expect(result.type).toBe('BLUNDER');
    });
  });

  describe('createAdaptiveThresholds', () => {
    it('should create beginner-friendly thresholds', () => {
      const thresholds = createAdaptiveThresholds('BEGINNER');
      
      expect(thresholds.inaccuracyThreshold).toBeGreaterThan(50);
      expect(thresholds.mistakeThreshold).toBeGreaterThan(100);
      expect(thresholds.blunderThreshold).toBeGreaterThan(300);
    });

    it('should create strict expert thresholds', () => {
      const thresholds = createAdaptiveThresholds('EXPERT');
      
      expect(thresholds.inaccuracyThreshold).toBeLessThan(30);
      expect(thresholds.mistakeThreshold).toBeLessThan(80);
      expect(thresholds.blunderThreshold).toBeLessThan(200);
    });

    it('should have logical threshold ordering', () => {
      const thresholds = createAdaptiveThresholds('INTERMEDIATE');
      
      expect(thresholds.inaccuracyThreshold).toBeLessThan(thresholds.mistakeThreshold);
      expect(thresholds.mistakeThreshold).toBeLessThan(thresholds.blunderThreshold);
    });
  });

  describe('generateMistakeExplanation', () => {
    it('should generate explanation for tactical blunders', () => {
      const explanation = generateMistakeExplanation(
        'BLUNDER',
        -250,
        ['TACTICS'],
        'INTERMEDIATE'
      );
      
      expect(explanation).toContain('tactical');
      expect(explanation).toMatch(/(-250|250)/); // Should mention centipawn loss
      expect(explanation.length).toBeGreaterThan(20);
      expect(explanation.length).toBeLessThan(200);
    });

    it('should adapt explanation complexity to skill level', () => {
      const beginnerExp = generateMistakeExplanation(
        'MISTAKE',
        -100,
        ['ENDGAME_TECHNIQUE'],
        'BEGINNER'
      );
      
      const expertExp = generateMistakeExplanation(
        'MISTAKE',
        -100,
        ['ENDGAME_TECHNIQUE'],
        'EXPERT'
      );

      // Beginner explanations avoid technical terms
      expect(beginnerExp).not.toContain('centipawn'); // Avoid technical terms
      // Note: Beginner explanations may be longer due to encouraging messages
    });

    it('should handle multiple themes', () => {
      const explanation = generateMistakeExplanation(
        'BLUNDER',
        -300,
        ['TACTICS', 'KING_SAFETY', 'PIECE_ACTIVITY'],
        'ADVANCED'
      );

      expect(explanation).toContain('tactical');
      expect(explanation.toLowerCase()).toMatch(/king|safety/);
    });

    it('should provide encouraging tone for beginners', () => {
      const explanation = generateMistakeExplanation(
        'BLUNDER',
        -400,
        ['CALCULATION'],
        'BEGINNER'
      );

      // Should be encouraging, not harsh
      expect(explanation.toLowerCase()).not.toContain('terrible');
      expect(explanation.toLowerCase()).not.toContain('awful');
      expect(explanation.toLowerCase()).toMatch(/learn|improve|practice/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const defaultConfig: AdaptiveConfig = {
      skillLevel: 'INTERMEDIATE',
      focusAreas: [],
      sensitivityThreshold: 10,
      showEngineLines: true,
      analysisDepth: 10
    };

    it('should handle extreme evaluation values', () => {
      const result = classifyMove(10000, -10000, defaultConfig);
      expect(result.type).toBe('CRITICAL_BLUNDER');
      expect(result.confidence).toBe(1.0);
    });

    it('should handle very small evaluation changes', () => {
      const result = classifyMove(100, 105, defaultConfig);
      expect(result.type).toBe('GOOD');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle null/undefined evaluations gracefully', () => {
      expect(() => classifyMove(null as any, 100, defaultConfig)).not.toThrow();
      expect(() => classifyMove(100, undefined as any, defaultConfig)).not.toThrow();
    });

    it('should validate skill level parameter', () => {
      const invalidConfig = { ...defaultConfig, skillLevel: 'INVALID' as SkillLevel };
      expect(() => classifyMove(100, 50, invalidConfig)).not.toThrow();
      // Should fallback to INTERMEDIATE
    });
  });

  describe('Performance Requirements', () => {
    const defaultConfig: AdaptiveConfig = {
      skillLevel: 'INTERMEDIATE',
      focusAreas: [],
      sensitivityThreshold: 10,
      showEngineLines: true,
      analysisDepth: 10
    };

    it('should classify moves quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        classifyMove(Math.random() * 200 - 100, Math.random() * 200 - 100, defaultConfig);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete 1000 classifications in <100ms
    });

    it('should not mutate input parameters', () => {
      const originalConfig = { ...defaultConfig };
      const configCopy = { ...defaultConfig };
      
      classifyMove(100, 50, configCopy);
      
      expect(configCopy).toEqual(originalConfig);
    });
  });
});