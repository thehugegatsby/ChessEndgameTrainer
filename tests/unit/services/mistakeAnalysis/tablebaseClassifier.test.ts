/**
 * @fileoverview Unit tests for tablebaseClassifier
 * Tests tablebase-first move classification for endgame training
 */

import {
  classifyMoveTablebaseFirst,
  generateTablebaseExplanation,
  hasTablebaseCoverage,
  createTablebaseResult,
  createEngineTablebaseResult
} from '@shared/services/mistakeAnalysis/tablebaseClassifier';
import type { TablebaseResult, AdaptiveConfig } from '@shared/services/mistakeAnalysis/types';

describe('tablebaseClassifier', () => {
  // Helper to create tablebase results
  const createTB = (
    result: 'win' | 'draw' | 'loss', 
    dtm?: number, 
    isTablebase = true
  ): TablebaseResult => ({
    result,
    dtm,
    isTablebase
  });

  const createConfig = (overrides?: Partial<AdaptiveConfig>): AdaptiveConfig => ({
    skillLevel: 'INTERMEDIATE',
    focusAreas: [],
    sensitivityThreshold: 10,
    showEngineLines: false,
    analysisDepth: 5,
    ...overrides
  });

  describe('classifyMoveTablebaseFirst', () => {
    describe('position type changes', () => {
      it('should classify win to loss as CRITICAL_ERROR', () => {
        const beforeTB = createTB('win', 15);
        const afterTB = createTB('loss', -20);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CRITICAL_ERROR');
      });

      it('should classify win to draw as BLUNDER', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('draw', undefined);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('BLUNDER');
      });

      it('should classify draw to loss as BLUNDER', () => {
        const beforeTB = createTB('draw');
        const afterTB = createTB('loss', -15);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('BLUNDER');
      });

      it('should classify loss to draw as CORRECT', () => {
        const beforeTB = createTB('loss', -20);
        const afterTB = createTB('draw');
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });

      it('should classify draw to win as PERFECT or CORRECT', () => {
        // Fast win
        const beforeTB = createTB('draw');
        const afterTB = createTB('win', 8);
        
        let result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('PERFECT');
        
        // Slower win
        const afterTBSlow = createTB('win', 15);
        result = classifyMoveTablebaseFirst(beforeTB, afterTBSlow);
        expect(result).toBe('CORRECT');
      });

      it('should classify loss to win as PERFECT', () => {
        const beforeTB = createTB('loss', -30);
        const afterTB = createTB('win', 20);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('PERFECT');
      });
    });

    describe('winning position optimality', () => {
      it('should classify optimal winning moves as PERFECT', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 9); // Progressing
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('PERFECT');
      });

      it('should classify minor delays as CORRECT', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 12); // +2 delay
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });

      it('should classify moderate delays as SUBOPTIMAL', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 17); // +7 delay
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('SUBOPTIMAL');
      });

      it('should classify major delays as ERROR', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 25); // +15 delay
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('ERROR');
      });

      it('should classify extreme delays as BLUNDER', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 35); // +25 delay
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('BLUNDER');
      });

      it('should handle undefined DTM values', () => {
        const beforeTB = createTB('win');
        const afterTB = createTB('win');
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });
    });

    describe('drawing position handling', () => {
      it('should classify maintaining draw as CORRECT', () => {
        const beforeTB = createTB('draw', 0);
        const afterTB = createTB('draw', 0);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });

      it('should classify improving defensive position as CORRECT', () => {
        const beforeTB = createTB('draw', 10);
        const afterTB = createTB('draw', 15); // Better defensive position
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });

      it('should classify minor defensive concessions as CORRECT', () => {
        const beforeTB = createTB('draw', 15);
        const afterTB = createTB('draw', 13); // -2 defensive loss
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });

      it('should classify moderate defensive weakening as SUBOPTIMAL', () => {
        const beforeTB = createTB('draw', 20);
        const afterTB = createTB('draw', 16); // -4 defensive loss
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('SUBOPTIMAL');
      });

      it('should classify significant defensive weakening as ERROR', () => {
        const beforeTB = createTB('draw', 20);
        const afterTB = createTB('draw', 10); // -10 defensive loss
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('ERROR');
      });
    });

    describe('losing position handling', () => {
      it('should classify extending the loss as CORRECT', () => {
        const beforeTB = createTB('loss', -20);
        const afterTB = createTB('loss', -15); // -15 > -20, defending longer
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT');
      });

      it('should classify shortening the loss as SUBOPTIMAL', () => {
        const beforeTB = createTB('loss', -20);
        const afterTB = createTB('loss', -25); // -25 < -20, losing faster
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('SUBOPTIMAL');
      });
    });

    describe('fallback to engine evaluation', () => {
      it('should use engine when neither position has tablebase', () => {
        const beforeTB = createTB('win', undefined, false);
        const afterTB = createTB('win', undefined, false);
        
        const result = classifyMoveTablebaseFirst(
          beforeTB, afterTB, 300, 250 // -50 cp loss
        );
        expect(result).toBe('SUBOPTIMAL');
      });

      it('should detect blunder when losing winning tablebase position', () => {
        const beforeTB = createTB('win', 10, true);
        const afterTB = createTB('win', undefined, false); // Out of tablebase
        
        const result = classifyMoveTablebaseFirst(
          beforeTB, afterTB, 500, 100 // -400 cp loss
        );
        expect(result).toBe('BLUNDER');
      });

      it('should use engine thresholds for 8+ piece positions', () => {
        const beforeTB = createTB('win', undefined, false);
        const afterTB = createTB('win', undefined, false);
        
        // Test different engine deltas
        expect(classifyMoveTablebaseFirst(beforeTB, afterTB, 100, 250)).toBe('PERFECT'); // +150
        expect(classifyMoveTablebaseFirst(beforeTB, afterTB, 100, 150)).toBe('CORRECT'); // +50
        expect(classifyMoveTablebaseFirst(beforeTB, afterTB, 100, 75)).toBe('SUBOPTIMAL'); // -25
        expect(classifyMoveTablebaseFirst(beforeTB, afterTB, 100, -10)).toBe('ERROR'); // -110
        expect(classifyMoveTablebaseFirst(beforeTB, afterTB, 100, -200)).toBe('BLUNDER'); // -300
        expect(classifyMoveTablebaseFirst(beforeTB, afterTB, 100, -400)).toBe('CRITICAL_ERROR'); // -500
      });
    });

    describe('edge cases', () => {
      it('should handle missing engine values in fallback', () => {
        const beforeTB = createTB('win', undefined, false);
        const afterTB = createTB('win', undefined, false);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT'); // 0 delta
      });

      it('should handle mixed tablebase availability', () => {
        const beforeTB = createTB('draw', undefined, false);
        const afterTB = createTB('win', 10, true);
        
        const result = classifyMoveTablebaseFirst(beforeTB, afterTB);
        expect(result).toBe('CORRECT'); // Engine fallback
      });
    });
  });

  describe('generateTablebaseExplanation', () => {
    describe('position type changes', () => {
      it('should explain win to loss for intermediate', () => {
        const beforeTB = createTB('win', 15);
        const afterTB = createTB('loss', -20);
        
        const explanation = generateTablebaseExplanation(
          'CRITICAL_ERROR', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Critical error');
        expect(explanation).toContain('throws away a winning position');
        expect(explanation).toContain('DTM was 15');
      });

      it('should simplify win to loss for beginners', () => {
        const beforeTB = createTB('win', 15);
        const afterTB = createTB('loss', -20);
        
        const explanation = generateTablebaseExplanation(
          'CRITICAL_ERROR', beforeTB, afterTB, 'BEGINNER'
        );
        
        expect(explanation).toContain('loses a winning position completely');
        expect(explanation).toContain('Take your time');
        expect(explanation).not.toContain('DTM');
      });

      it('should explain win to draw', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('draw');
        
        const explanation = generateTablebaseExplanation(
          'BLUNDER', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Blunder');
        expect(explanation).toContain('escape from a lost position');
      });

      it('should explain draw to loss', () => {
        const beforeTB = createTB('draw');
        const afterTB = createTB('loss', -15);
        
        const explanation = generateTablebaseExplanation(
          'BLUNDER', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('loses from a drawn position');
      });

      it('should praise defensive saves', () => {
        const beforeTB = createTB('loss', -20);
        const afterTB = createTB('draw');
        
        const explanation = generateTablebaseExplanation(
          'CORRECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Excellent defense');
        expect(explanation).toContain('converted a losing position');
      });

      it('should praise conversions to wins', () => {
        const beforeTB = createTB('draw');
        const afterTB = createTB('win', 12);
        
        const explanation = generateTablebaseExplanation(
          'PERFECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Perfect technique');
        expect(explanation).toContain('converted a drawn position');
      });
    });

    describe('winning position explanations', () => {
      it('should explain perfect winning moves', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 9);
        
        const explanation = generateTablebaseExplanation(
          'PERFECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('Optimal move');
        expect(explanation).toContain('shortest path');
      });

      it('should explain correct but slower wins', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 12);
        
        const explanation = generateTablebaseExplanation(
          'CORRECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('maintains the win');
        expect(explanation).toContain('+2 moves');
      });

      it('should explain suboptimal winning moves', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 18);
        
        const explanation = generateTablebaseExplanation(
          'SUBOPTIMAL', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('significantly extends the win');
        expect(explanation).toContain('forcing continuations');
      });
    });

    describe('drawing position explanations', () => {
      it('should explain maintaining draws', () => {
        const beforeTB = createTB('draw');
        const afterTB = createTB('draw');
        
        const explanation = generateTablebaseExplanation(
          'CORRECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toContain('maintains the theoretical draw');
      });

      it('should use simpler language for beginners', () => {
        const beforeTB = createTB('draw');
        const afterTB = createTB('draw');
        
        const explanation = generateTablebaseExplanation(
          'CORRECT', beforeTB, afterTB, 'BEGINNER'
        );
        
        expect(explanation).toContain('maintains the balance');
        expect(explanation).not.toContain('theoretical');
      });
    });

    describe('skill level adaptation', () => {
      const skillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
      
      it('should generate explanations for all skill levels', () => {
        const beforeTB = createTB('win', 10);
        const afterTB = createTB('win', 9);
        
        skillLevels.forEach(level => {
          const explanation = generateTablebaseExplanation(
            'PERFECT', beforeTB, afterTB, level
          );
          
          expect(explanation).toBeTruthy();
          expect(explanation.length).toBeGreaterThan(10);
        });
      });
    });

    describe('edge cases', () => {
      it('should handle undefined DTM values', () => {
        const beforeTB = createTB('win');
        const afterTB = createTB('win');
        
        const explanation = generateTablebaseExplanation(
          'CORRECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toBeTruthy();
        expect(explanation).not.toContain('undefined');
      });

      it('should provide fallback explanation', () => {
        const beforeTB = createTB('loss', -10);
        const afterTB = createTB('loss', -15);
        
        const explanation = generateTablebaseExplanation(
          'CORRECT', beforeTB, afterTB, 'INTERMEDIATE'
        );
        
        expect(explanation).toBe('Position analysis complete.');
      });
    });
  });

  describe('hasTablebaseCoverage', () => {
    it('should return true for 7 or fewer pieces', () => {
      expect(hasTablebaseCoverage(2)).toBe(true);
      expect(hasTablebaseCoverage(3)).toBe(true);
      expect(hasTablebaseCoverage(4)).toBe(true);
      expect(hasTablebaseCoverage(5)).toBe(true);
      expect(hasTablebaseCoverage(6)).toBe(true);
      expect(hasTablebaseCoverage(7)).toBe(true);
    });

    it('should return false for 8 or more pieces', () => {
      expect(hasTablebaseCoverage(8)).toBe(false);
      expect(hasTablebaseCoverage(10)).toBe(false);
      expect(hasTablebaseCoverage(32)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(hasTablebaseCoverage(0)).toBe(true);
      expect(hasTablebaseCoverage(1)).toBe(true);
      expect(hasTablebaseCoverage(-1)).toBe(true); // Invalid but still < 7
    });
  });

  describe('createTablebaseResult', () => {
    it('should create win result with DTM', () => {
      const result = createTablebaseResult('win', 15);
      
      expect(result).toEqual({
        result: 'win',
        dtm: 15,
        isTablebase: true
      });
    });

    it('should create draw result without DTM', () => {
      const result = createTablebaseResult('draw');
      
      expect(result).toEqual({
        result: 'draw',
        dtm: undefined,
        isTablebase: true
      });
    });

    it('should create loss result with negative DTM', () => {
      const result = createTablebaseResult('loss', -20);
      
      expect(result).toEqual({
        result: 'loss',
        dtm: -20,
        isTablebase: true
      });
    });
  });

  describe('createEngineTablebaseResult', () => {
    it('should classify high positive evaluation as win', () => {
      const result = createEngineTablebaseResult(350);
      
      expect(result).toEqual({
        result: 'win',
        dtm: undefined,
        isTablebase: false
      });
    });

    it('should classify high negative evaluation as loss', () => {
      const result = createEngineTablebaseResult(-350);
      
      expect(result).toEqual({
        result: 'loss',
        dtm: undefined,
        isTablebase: false
      });
    });

    it('should classify near-zero evaluation as draw', () => {
      const result = createEngineTablebaseResult(50);
      
      expect(result).toEqual({
        result: 'draw',
        dtm: undefined,
        isTablebase: false
      });
      
      const result2 = createEngineTablebaseResult(-150);
      expect(result2.result).toBe('draw');
    });

    it('should handle boundary values', () => {
      expect(createEngineTablebaseResult(200).result).toBe('draw');
      expect(createEngineTablebaseResult(201).result).toBe('win');
      expect(createEngineTablebaseResult(-200).result).toBe('draw');
      expect(createEngineTablebaseResult(-201).result).toBe('loss');
    });

    it('should handle zero evaluation', () => {
      const result = createEngineTablebaseResult(0);
      
      expect(result.result).toBe('draw');
      expect(result.isTablebase).toBe(false);
    });
  });
});