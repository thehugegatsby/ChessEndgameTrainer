/**
 * Tests for DiscrepancyMonitor
 */

import { DiscrepancyMonitor, EvaluationResult } from '../DiscrepancyMonitor';
import { FEATURE_FLAGS } from '../../../constants';

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

global.console = mockConsole as any;

// Mock feature flags
jest.mock('../../../constants', () => ({
  FEATURE_FLAGS: {
    LOG_EVALUATION_DISCREPANCIES: true
  }
}));

describe('DiscrepancyMonitor', () => {
  let monitor: DiscrepancyMonitor;
  
  beforeEach(() => {
    monitor = DiscrepancyMonitor.getInstance();
    monitor.clear();
  });
  
  describe('compareResults', () => {
    it('should return null when no discrepancies', () => {
      const legacy: EvaluationResult = {
        score: 100,
        mate: null,
        bestMove: 'e4'
      };
      
      const unified: EvaluationResult = {
        score: 100,
        mate: null,
        bestMove: 'e4'
      };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result).toBeNull();
    });
    
    it('should detect score differences > 10 centipawns', () => {
      const legacy: EvaluationResult = {
        score: 100,
        mate: null
      };
      
      const unified: EvaluationResult = {
        score: 120,
        mate: null
      };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result).not.toBeNull();
      expect(result?.discrepancies.scoreDiff).toBe(20);
      expect(result?.severity).toBe('low');
    });
    
    it('should detect mate differences as critical', () => {
      const legacy: EvaluationResult = {
        score: 100,
        mate: 3
      };
      
      const unified: EvaluationResult = {
        score: 100,
        mate: null
      };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result).not.toBeNull();
      expect(result?.discrepancies.mateDiff).toBe(true);
      expect(result?.severity).toBe('critical');
    });
    
    it('should detect best move differences with significant score diff', () => {
      const legacy: EvaluationResult = {
        score: 100,
        bestMove: 'e4'
      };
      
      const unified: EvaluationResult = {
        score: 200,
        bestMove: 'd4'
      };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result).not.toBeNull();
      expect(result?.discrepancies.bestMoveDiff).toBe(true);
      expect(result?.severity).toBe('high');
    });
    
    it('should detect tablebase WDL differences as critical', () => {
      const legacy: EvaluationResult = {
        wdl: 2, // Win
        isTablebase: true
      };
      
      const unified: EvaluationResult = {
        wdl: 0, // Draw
        isTablebase: true
      };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result).not.toBeNull();
      expect(result?.discrepancies.wdlDiff).toBe(true);
      expect(result?.severity).toBe('critical');
    });
    
    it('should return null when monitoring is disabled', () => {
      // Temporarily disable monitoring
      (FEATURE_FLAGS as any).LOG_EVALUATION_DISCREPANCIES = false;
      
      const legacy: EvaluationResult = { score: 100 };
      const unified: EvaluationResult = { score: 200 };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result).toBeNull();
      
      // Re-enable
      (FEATURE_FLAGS as any).LOG_EVALUATION_DISCREPANCIES = true;
    });
  });
  
  describe('severity calculation', () => {
    it('should classify as low for small score differences', () => {
      const legacy: EvaluationResult = { score: 100 };
      const unified: EvaluationResult = { score: 140 };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result?.severity).toBe('low');
    });
    
    it('should classify as medium for moderate score differences', () => {
      const legacy: EvaluationResult = { score: 100 };
      const unified: EvaluationResult = { score: 180 };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result?.severity).toBe('medium');
    });
    
    it('should classify as high for large score differences', () => {
      const legacy: EvaluationResult = { score: 100 };
      const unified: EvaluationResult = { score: 350 };
      
      const result = monitor.compareResults('test-fen', legacy, unified);
      expect(result?.severity).toBe('high');
    });
  });
  
  describe('statistics', () => {
    it('should track discrepancy statistics', () => {
      // Add some discrepancies
      monitor.compareResults('fen1', { score: 100 }, { score: 120 }); // low
      monitor.compareResults('fen2', { score: 100 }, { score: 200 }); // medium
      monitor.compareResults('fen3', { mate: 3 }, { mate: null }); // critical
      
      const stats = monitor.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.bySeverity.medium).toBe(1);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.recentDiscrepancies).toHaveLength(3);
    });
    
    it('should limit stored discrepancies to maxDiscrepancies', () => {
      // Add many discrepancies
      for (let i = 0; i < 1100; i++) {
        monitor.compareResults(`fen${i}`, { score: 100 }, { score: 120 });
      }
      
      const stats = monitor.getStatistics();
      expect(stats.total).toBeLessThanOrEqual(1000);
    });
  });
  
  describe('export functionality', () => {
    it('should export all discrepancies', () => {
      monitor.compareResults('fen1', { score: 100 }, { score: 120 });
      monitor.compareResults('fen2', { score: 200 }, { score: 300 });
      
      const exported = monitor.exportDiscrepancies();
      expect(exported).toHaveLength(2);
      expect(exported[0].fen).toBe('fen1');
      expect(exported[1].fen).toBe('fen2');
    });
  });
});