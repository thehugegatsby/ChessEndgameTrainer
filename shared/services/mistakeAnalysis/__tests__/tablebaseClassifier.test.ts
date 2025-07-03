import {
  classifyMoveTablebaseFirst,
  generateTablebaseExplanation,
  hasTablebaseCoverage,
  createTablebaseResult,
  createEngineTablebaseResult
} from '../tablebaseClassifier';
import type { TablebaseResult, MistakeType } from '../types';

describe('tablebaseClassifier', () => {
  describe('classifyMoveTablebaseFirst', () => {
    describe('Position type changes', () => {
      test('should classify win to loss as CRITICAL_ERROR', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('loss', 15);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CRITICAL_ERROR');
      });

      test('should classify win to draw as BLUNDER', () => {
        const before = createTablebaseResult('win', 20);
        const after = createTablebaseResult('draw', 0);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('BLUNDER');
      });

      test('should classify draw to loss as BLUNDER', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('loss', 25);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('BLUNDER');
      });
    });

    describe('Winning position optimization', () => {
      test('should classify optimal winning moves as PERFECT', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 9);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('PERFECT');
      });

      test('should classify slightly suboptimal winning moves as CORRECT', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 12);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should classify moderately suboptimal winning moves as SUBOPTIMAL', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 18);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('SUBOPTIMAL');
      });

      test('should classify significantly suboptimal winning moves as ERROR', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 25);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('ERROR');
      });

      test('should classify extremely suboptimal winning moves as BLUNDER', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 35);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('BLUNDER');
      });
    });

    describe('Drawing position moves', () => {
      test('should classify maintained draws as CORRECT', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('draw', 0);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should classify improved defensive draws as CORRECT', () => {
        const before = createTablebaseResult('draw', 5);
        const after = createTablebaseResult('draw', 8);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should classify slightly weakened draws as CORRECT', () => {
        const before = createTablebaseResult('draw', 10);
        const after = createTablebaseResult('draw', 8);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should classify moderately weakened draws as SUBOPTIMAL', () => {
        const before = createTablebaseResult('draw', 10);
        const after = createTablebaseResult('draw', 5);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('SUBOPTIMAL');
      });

      test('should classify significantly weakened draws as ERROR', () => {
        const before = createTablebaseResult('draw', 10);
        const after = createTablebaseResult('draw', 2);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('ERROR');
      });
    });

    describe('Losing position defense', () => {
      test('should classify extended losses as CORRECT', () => {
        const before = createTablebaseResult('loss', 10);
        const after = createTablebaseResult('loss', 15);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should classify shortened losses as SUBOPTIMAL', () => {
        const before = createTablebaseResult('loss', 15);
        const after = createTablebaseResult('loss', 10);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('SUBOPTIMAL');
      });
    });

    describe('Position improvements', () => {
      test('should classify loss to draw as CORRECT', () => {
        const before = createTablebaseResult('loss', 20);
        const after = createTablebaseResult('draw', 0);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should classify loss to win as PERFECT', () => {
        const before = createTablebaseResult('loss', 15);
        const after = createTablebaseResult('win', 10);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('PERFECT');
      });

      test('should classify draw to win (short) as PERFECT', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('win', 8);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('PERFECT');
      });

      test('should classify draw to win (long) as CORRECT', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('win', 20);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });
    });

    describe('Fallback to engine evaluation', () => {
      test('should use engine evaluation when tablebase unavailable', () => {
        const before: TablebaseResult = { result: 'win', isTablebase: false };
        const after: TablebaseResult = { result: 'win', isTablebase: false };
        
        const result = classifyMoveTablebaseFirst(before, after, 100, 50);
        expect(result).toBe('SUBOPTIMAL');
      });

      test('should classify engine improvements', () => {
        const before: TablebaseResult = { result: 'draw', isTablebase: false };
        const after: TablebaseResult = { result: 'draw', isTablebase: false };
        
        expect(classifyMoveTablebaseFirst(before, after, 0, 150)).toBe('PERFECT');
        expect(classifyMoveTablebaseFirst(before, after, 0, 50)).toBe('CORRECT');
        expect(classifyMoveTablebaseFirst(before, after, 0, -30)).toBe('SUBOPTIMAL');
        expect(classifyMoveTablebaseFirst(before, after, 0, -100)).toBe('ERROR');
        expect(classifyMoveTablebaseFirst(before, after, 0, -300)).toBe('BLUNDER');
        expect(classifyMoveTablebaseFirst(before, after, 0, -500)).toBe('CRITICAL_ERROR');
      });
    });

    describe('Edge cases', () => {
      test('should handle undefined DTM values', () => {
        const before = createTablebaseResult('win', undefined);
        const after = createTablebaseResult('win', undefined);
        
        expect(classifyMoveTablebaseFirst(before, after)).toBe('CORRECT');
      });

      test('should handle mixed tablebase availability', () => {
        const before = createTablebaseResult('win', 10);
        const after: TablebaseResult = { result: 'draw', isTablebase: false };
        
        expect(classifyMoveTablebaseFirst(before, after, 500, 0)).toBe('BLUNDER');
      });
    });
  });

  describe('generateTablebaseExplanation', () => {
    describe('Position type changes', () => {
      test('should explain win to loss for beginners', () => {
        const before = createTablebaseResult('win', 15);
        const after = createTablebaseResult('loss', 20);
        
        const explanation = generateTablebaseExplanation(
          'CRITICAL_ERROR',
          before,
          after,
          'BEGINNER'
        );
        
        expect(explanation).toContain('loses a winning position completely');
        expect(explanation).toContain('Take your time');
      });

      test('should explain win to loss for advanced players', () => {
        const before = createTablebaseResult('win', 15);
        const after = createTablebaseResult('loss', 20);
        
        const explanation = generateTablebaseExplanation(
          'CRITICAL_ERROR',
          before,
          after,
          'ADVANCED'
        );
        
        expect(explanation).toContain('Critical error');
        expect(explanation).toContain('DTM was 15');
        expect(explanation).toContain('now lost');
      });

      test('should explain win to draw', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('draw', 0);
        
        const explanation = generateTablebaseExplanation(
          'BLUNDER',
          before,
          after,
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Blunder');
        expect(explanation).toContain('escape');
        expect(explanation).toContain('theoretical draw');
      });

      test('should explain draw to loss', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('loss', 15);
        
        const explanation = generateTablebaseExplanation(
          'BLUNDER',
          before,
          after,
          'BEGINNER'
        );
        
        expect(explanation).toContain('loses from an equal position');
      });
    });

    describe('Position improvements', () => {
      test('should explain loss to draw', () => {
        const before = createTablebaseResult('loss', 20);
        const after = createTablebaseResult('draw', 0);
        
        const explanation = generateTablebaseExplanation(
          'CORRECT',
          before,
          after,
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Excellent defense');
        expect(explanation).toContain('theoretical draw');
      });

      test('should explain draw to win', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('win', 12);
        
        const explanation = generateTablebaseExplanation(
          'PERFECT',
          before,
          after,
          'BEGINNER'
        );
        
        expect(explanation).toContain('Excellent');
        expect(explanation).toContain('way to win from an equal position');
      });
    });

    describe('Same position type', () => {
      test('should explain optimal winning moves', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 9);
        
        const explanation = generateTablebaseExplanation(
          'PERFECT',
          before,
          after,
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Optimal move');
        expect(explanation).toContain('shortest path');
        expect(explanation).toContain('DTM 9');
      });

      test('should explain suboptimal winning moves', () => {
        const before = createTablebaseResult('win', 10);
        const after = createTablebaseResult('win', 18);
        
        const explanation = generateTablebaseExplanation(
          'SUBOPTIMAL',
          before,
          after,
          'BEGINNER'
        );
        
        expect(explanation).toContain('still wins, but takes longer');
      });

      test('should explain draw maintenance', () => {
        const before = createTablebaseResult('draw', 0);
        const after = createTablebaseResult('draw', 0);
        
        const explanation = generateTablebaseExplanation(
          'CORRECT',
          before,
          after,
          'INTERMEDIATE'
        );
        
        expect(explanation).toContain('maintains the theoretical draw');
      });
    });

    describe('Skill level differences', () => {
      test('should provide simpler explanations for beginners', () => {
        const before = createTablebaseResult('win', 15);
        const after = createTablebaseResult('win', 13);
        
        const beginnerExplanation = generateTablebaseExplanation(
          'CORRECT',
          before,
          after,
          'BEGINNER'
        );
        
        const expertExplanation = generateTablebaseExplanation(
          'CORRECT',
          before,
          after,
          'EXPERT'
        );
        
        expect(beginnerExplanation.length).toBeLessThan(expertExplanation.length);
        expect(beginnerExplanation).not.toContain('DTM');
        expect(expertExplanation).toContain('DTM');
      });
    });

    describe('Edge cases', () => {
      test('should handle undefined DTM in explanations', () => {
        const before = createTablebaseResult('win', undefined);
        const after = createTablebaseResult('win', undefined);
        
        const explanation = generateTablebaseExplanation(
          'CORRECT',
          before,
          after
        );
        
        expect(explanation).toBeDefined();
        expect(explanation.length).toBeGreaterThan(0);
      });

      test('should provide default explanation for unhandled cases', () => {
        const before = createTablebaseResult('loss', 10);
        const after = createTablebaseResult('loss', 15);
        
        const explanation = generateTablebaseExplanation(
          'CORRECT',
          before,
          after
        );
        
        expect(explanation).toBe('Position analysis complete.');
      });
    });
  });

  describe('hasTablebaseCoverage', () => {
    test('should return true for 7 or fewer pieces', () => {
      expect(hasTablebaseCoverage(2)).toBe(true);
      expect(hasTablebaseCoverage(3)).toBe(true);
      expect(hasTablebaseCoverage(6)).toBe(true);
      expect(hasTablebaseCoverage(7)).toBe(true);
    });

    test('should return false for more than 7 pieces', () => {
      expect(hasTablebaseCoverage(8)).toBe(false);
      expect(hasTablebaseCoverage(10)).toBe(false);
      expect(hasTablebaseCoverage(32)).toBe(false);
    });
  });

  describe('createTablebaseResult', () => {
    test('should create tablebase result with DTM', () => {
      const result = createTablebaseResult('win', 15);
      
      expect(result).toEqual({
        result: 'win',
        dtm: 15,
        isTablebase: true
      });
    });

    test('should create tablebase result without DTM', () => {
      const result = createTablebaseResult('draw');
      
      expect(result).toEqual({
        result: 'draw',
        dtm: undefined,
        isTablebase: true
      });
    });
  });

  describe('createEngineTablebaseResult', () => {
    test('should classify winning evaluations', () => {
      const result = createEngineTablebaseResult(300);
      
      expect(result).toEqual({
        result: 'win',
        dtm: undefined,
        isTablebase: false
      });
    });

    test('should classify losing evaluations', () => {
      const result = createEngineTablebaseResult(-250);
      
      expect(result).toEqual({
        result: 'loss',
        dtm: undefined,
        isTablebase: false
      });
    });

    test('should classify drawing evaluations', () => {
      expect(createEngineTablebaseResult(100)).toEqual({
        result: 'draw',
        dtm: undefined,
        isTablebase: false
      });

      expect(createEngineTablebaseResult(-150)).toEqual({
        result: 'draw',
        dtm: undefined,
        isTablebase: false
      });

      expect(createEngineTablebaseResult(0)).toEqual({
        result: 'draw',
        dtm: undefined,
        isTablebase: false
      });
    });

    test('should handle boundary values', () => {
      expect(createEngineTablebaseResult(200).result).toBe('draw');
      expect(createEngineTablebaseResult(201).result).toBe('win');
      expect(createEngineTablebaseResult(-200).result).toBe('draw');
      expect(createEngineTablebaseResult(-201).result).toBe('loss');
    });
  });
});