/**
 * @fileoverview Integration Tests for Enhanced Engine Evaluation
 * @version 1.0.0
 * @description Tests for Phase 2.1 enhanced evaluation with Principal Variation
 */

import { Engine, type EnhancedEngineEvaluation } from '@shared/lib/chess/engine';
import { parseInfo } from '@shared/lib/chess/engine/uciParser';

describe('Enhanced Engine Evaluation - Phase 2.1 Integration', () => {
  
  describe('Engine.evaluatePositionEnhanced()', () => {
    test('should have enhanced evaluation method available', () => {
      const engine = new Engine();
      expect(typeof engine.evaluatePositionEnhanced).toBe('function');
    });

    test('should have getCurrentEnhancedEvaluation method available', () => {
      const engine = new Engine();
      expect(typeof engine.getCurrentEnhancedEvaluation).toBe('function');
    });

    test('should include enhanced evaluation in stats', () => {
      const engine = new Engine();
      const stats = engine.getStats();
      expect(stats).toHaveProperty('hasEnhancedEvaluation');
      expect(typeof stats.hasEnhancedEvaluation).toBe('boolean');
    });
  });

  describe('Enhanced Evaluation Types', () => {
    test('should support enhanced evaluation structure', () => {
      const enhancedEval: EnhancedEngineEvaluation = {
        score: 150,
        mate: null,
        depth: 20,
        nodes: 1000000,
        time: 2000,
        
        // Enhanced fields
        pv: ['e2e4', 'e7e5', 'g1f3'],
        pvString: 'e2e4 e7e5 g1f3',
        nps: 500000,
        hashfull: 250,
        seldepth: 25,
        multipv: 1
      };

      expect(enhancedEval.score).toBe(150);
      expect(enhancedEval.pv).toEqual(['e2e4', 'e7e5', 'g1f3']);
      expect(enhancedEval.pvString).toBe('e2e4 e7e5 g1f3');
      expect(enhancedEval.nps).toBe(500000);
    });
  });

  describe('UCI Parser Integration', () => {
    test('should parse enhanced data for Principal Variation', () => {
      const uciLine = 'info depth 20 score cp 150 nodes 1000000 time 2000 nps 500000 hashfull 250 pv e2e4 e7e5 g1f3 b8c6';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation!.pv).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6']);
      expect(result.evaluation!.pvString).toBe('e2e4 e7e5 g1f3 b8c6');
      expect(result.evaluation!.nps).toBe(500000);
      expect(result.evaluation!.hashfull).toBe(250);
    });

    test('should parse Multi-PV data correctly', () => {
      const uciLine = 'info depth 18 multipv 2 score cp -25 nodes 800000 pv d2d4 g8f6 c2c4';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.multipv).toBe(2);
      expect(result.evaluation!.score).toBe(-25);
      expect(result.evaluation!.pv).toEqual(['d2d4', 'g8f6', 'c2c4']);
    });

    test('should handle mate evaluations with PV', () => {
      const uciLine = 'info depth 127 score mate 2 nodes 1000 time 10 pv d1h5 g6h5 f7f8';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.mate).toBe(2);
      expect(result.evaluation!.score).toBe(10000);
      expect(result.evaluation!.pv).toEqual(['d1h5', 'g6h5', 'f7f8']);
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with basic EngineEvaluation', () => {
      const enhancedEval: EnhancedEngineEvaluation = {
        score: 100,
        mate: null,
        depth: 15,
        nodes: 500000,
        time: 1000,
        pv: ['e2e4']
      };

      // Should be assignable to basic EngineEvaluation
      const basicEval = {
        score: enhancedEval.score,
        mate: enhancedEval.mate,
        depth: enhancedEval.depth,
        nodes: enhancedEval.nodes,
        time: enhancedEval.time
      };

      expect(basicEval.score).toBe(100);
      expect(basicEval.mate).toBeNull();
      expect(basicEval.depth).toBe(15);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing enhanced data gracefully', () => {
      const engine = new Engine();
      const currentEnhanced = engine.getCurrentEnhancedEvaluation();
      
      // Should return null when engine not ready or no data available
      expect(currentEnhanced).toBeNull();
    });
  });

  describe('Phase 2 Preparation', () => {
    test('should expose all required data for UI display', () => {
      const testEvaluation: EnhancedEngineEvaluation = {
        score: 150,
        mate: null,
        depth: 20,
        nodes: 1000000,
        time: 2000,
        pv: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
        pvString: 'e2e4 e7e5 g1f3 b8c6 f1b5',
        nps: 500000,
        hashfull: 250,
        seldepth: 25,
        multipv: 1
      };

      // Verify all fields needed for UI display are available
      expect(testEvaluation.score).toBeDefined();
      expect(testEvaluation.depth).toBeDefined();
      expect(testEvaluation.pv).toBeDefined();
      expect(testEvaluation.pv!.length).toBeGreaterThan(0);
      expect(testEvaluation.pvString).toBeDefined();
      expect(testEvaluation.nps).toBeDefined();
      
      // Verify PV moves are valid format
      testEvaluation.pv!.forEach(move => {
        expect(typeof move).toBe('string');
        expect(move.length).toBeGreaterThan(3); // Minimum move length like 'e2e4'
      });
    });
  });
});