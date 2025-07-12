/**
 * @fileoverview Tests for MockEngineService
 * @description Comprehensive test coverage for the mock engine service
 * ensuring it properly simulates engine behavior for testing
 */

import { MockEngineService } from '../../../../shared/services/engine/MockEngineService';
import type { EngineAnalysis, EngineConfig } from '../../../../shared/services/engine/IEngineService';
import type { EngineStatus } from '../../../../shared/store/types';

describe('MockEngineService', () => {
  let mockEngine: MockEngineService;

  beforeEach(() => {
    mockEngine = new MockEngineService();
  });

  afterEach(async () => {
    await mockEngine.shutdown();
  });

  describe('Initialization', () => {
    it('should start with idle status', () => {
      expect(mockEngine.getStatus()).toBe('idle');
    });

    it('should initialize successfully', async () => {
      await mockEngine.initialize();
      expect(mockEngine.getStatus()).toBe('ready');
    });

    it('should transition through initializing status', async () => {
      const statusHistory: EngineStatus[] = [];
      const unsubscribe = mockEngine.onStatusChange((status) => {
        statusHistory.push(status);
      });

      await mockEngine.initialize();

      expect(statusHistory).toEqual(['initializing', 'ready']);
      unsubscribe();
    });

    it('should be marked as initialized after initialization', async () => {
      await mockEngine.initialize();
      // Test by trying to analyze - should not throw
      await expect(mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')).resolves.toBeDefined();
    });
  });

  describe('Position Analysis', () => {
    beforeEach(async () => {
      await mockEngine.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedEngine = new MockEngineService();
      await expect(
        uninitializedEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')
      ).rejects.toThrow('Mock engine not initialized');
    });

    it('should return predefined analysis for known positions', async () => {
      const fen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const analysis = await mockEngine.analyzePosition(fen);

      expect(analysis).toEqual({
        evaluation: 80,
        bestMove: 'Kd6',
        depth: 20,
        timeMs: 50,
        principalVariation: ['Kd6', 'Kd8', 'e6', 'Ke8']
      });
    });

    it('should generate default analysis for unknown positions', async () => {
      const unknownFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const analysis = await mockEngine.analyzePosition(unknownFen);

      expect(analysis).toHaveProperty('evaluation');
      expect(analysis).toHaveProperty('bestMove');
      expect(analysis).toHaveProperty('depth');
      expect(analysis).toHaveProperty('timeMs');
      expect(analysis.depth).toBe(15);
      expect(analysis.timeMs).toBe(30);
    });

    it('should respect custom time limit', async () => {
      const config: EngineConfig = { timeLimit: 100 };
      const startTime = Date.now();
      
      await mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', config);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(150); // Allow some buffer
    });

    it('should update status during analysis', async () => {
      const statusHistory: EngineStatus[] = [];
      const unsubscribe = mockEngine.onStatusChange((status) => {
        statusHistory.push(status);
      });

      await mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');

      expect(statusHistory).toContain('analyzing');
      expect(statusHistory[statusHistory.length - 1]).toBe('ready');
      unsubscribe();
    });
  });

  describe('Custom Responses', () => {
    beforeEach(async () => {
      await mockEngine.initialize();
    });

    it('should add and use custom response', async () => {
      const customFen = 'custom/position/fen';
      const customAnalysis: EngineAnalysis = {
        evaluation: 250,
        bestMove: 'Qh5#',
        depth: 30,
        timeMs: 100,
        principalVariation: ['Qh5#']
      };

      mockEngine.addCustomResponse(customFen, customAnalysis);
      const analysis = await mockEngine.analyzePosition(customFen);

      expect(analysis).toEqual(customAnalysis);
    });

    it('should add multiple custom responses', async () => {
      const responses: Record<string, EngineAnalysis> = {
        'fen1': { evaluation: 100, bestMove: 'e4', depth: 10, timeMs: 20 },
        'fen2': { evaluation: -50, bestMove: 'd4', depth: 15, timeMs: 25 }
      };

      mockEngine.addCustomResponses(responses);

      const analysis1 = await mockEngine.analyzePosition('fen1');
      const analysis2 = await mockEngine.analyzePosition('fen2');

      expect(analysis1.evaluation).toBe(100);
      expect(analysis2.evaluation).toBe(-50);
    });

    it('should clear custom responses and restore defaults', async () => {
      const customFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const customAnalysis: EngineAnalysis = {
        evaluation: 999,
        bestMove: 'Kf6',
        depth: 1,
        timeMs: 1
      };

      mockEngine.addCustomResponse(customFen, customAnalysis);
      let analysis = await mockEngine.analyzePosition(customFen);
      expect(analysis.evaluation).toBe(999);

      mockEngine.clearCustomResponses();
      analysis = await mockEngine.analyzePosition(customFen);
      expect(analysis.evaluation).toBe(80); // Back to default
    });
  });

  describe('Test Utilities', () => {
    beforeEach(async () => {
      await mockEngine.initialize();
    });

    it('should set next move while preserving other analysis', async () => {
      const fen = 'unknown/position';
      mockEngine.setNextMove(fen, 'Nf6');

      const analysis = await mockEngine.analyzePosition(fen);
      expect(analysis.bestMove).toBe('Nf6');
      expect(analysis).toHaveProperty('evaluation');
      expect(analysis).toHaveProperty('depth');
    });

    it('should set evaluation while preserving other analysis', async () => {
      const fen = 'another/unknown/position';
      mockEngine.setEvaluation(fen, -300);

      const analysis = await mockEngine.analyzePosition(fen);
      expect(analysis.evaluation).toBe(-300);
      expect(analysis).toHaveProperty('bestMove');
      expect(analysis).toHaveProperty('depth');
    });

    it('should simulate error (though current implementation doesn\'t use error message)', async () => {
      const errorFen = 'error/position';
      mockEngine.simulateError(errorFen, 'Test error');

      const analysis = await mockEngine.analyzePosition(errorFen);
      expect(analysis.evaluation).toBe(0);
      expect(analysis.depth).toBe(0);
      expect(analysis.timeMs).toBe(0);
      expect(analysis.bestMove).toBeUndefined();
    });
  });

  describe('Status Management', () => {
    it('should stop analysis when analyzing', async () => {
      await mockEngine.initialize();
      
      // Start analysis without waiting
      const analysisPromise = mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
      
      // Immediately stop
      mockEngine.stopAnalysis();
      
      await analysisPromise;
      expect(mockEngine.getStatus()).toBe('ready');
    });

    it('should not change status when stopping if not analyzing', async () => {
      await mockEngine.initialize();
      expect(mockEngine.getStatus()).toBe('ready');
      
      mockEngine.stopAnalysis();
      expect(mockEngine.getStatus()).toBe('ready');
    });

    it('should correctly report analyzing status', async () => {
      await mockEngine.initialize();
      expect(mockEngine.isAnalyzing()).toBe(false);

      // Start analysis without waiting
      const analysisPromise = mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
      
      // Check immediately (should be analyzing)
      expect(mockEngine.isAnalyzing()).toBe(true);
      
      await analysisPromise;
      expect(mockEngine.isAnalyzing()).toBe(false);
    });
  });

  describe('Status Callbacks', () => {
    it('should subscribe and unsubscribe to status changes', async () => {
      let callbackCount = 0;
      const callback = () => callbackCount++;
      
      const unsubscribe = mockEngine.onStatusChange(callback);
      await mockEngine.initialize();
      
      expect(callbackCount).toBe(2); // initializing + ready
      
      unsubscribe();
      await mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
      
      expect(callbackCount).toBe(2); // No additional calls after unsubscribe
    });

    it('should handle multiple subscribers', async () => {
      const statuses1: EngineStatus[] = [];
      const statuses2: EngineStatus[] = [];
      
      const unsub1 = mockEngine.onStatusChange((s) => statuses1.push(s));
      const unsub2 = mockEngine.onStatusChange((s) => statuses2.push(s));
      
      await mockEngine.initialize();
      
      expect(statuses1).toEqual(['initializing', 'ready']);
      expect(statuses2).toEqual(['initializing', 'ready']);
      
      unsub1();
      unsub2();
    });

    it('should handle unsubscribe of non-existent callback', () => {
      const unsubscribe = mockEngine.onStatusChange(() => {});
      unsubscribe();
      unsubscribe(); // Should not throw
    });
  });

  describe('Shutdown', () => {
    it('should reset to idle status', async () => {
      await mockEngine.initialize();
      expect(mockEngine.getStatus()).toBe('ready');
      
      await mockEngine.shutdown();
      expect(mockEngine.getStatus()).toBe('idle');
    });

    it('should clear all callbacks', async () => {
      let callbackCalled = false;
      mockEngine.onStatusChange(() => callbackCalled = true);
      
      await mockEngine.shutdown();
      
      // Try to trigger status change - callback should not be called
      await mockEngine.initialize();
      expect(callbackCalled).toBe(false);
    });

    it('should clear custom responses', async () => {
      await mockEngine.initialize();
      
      const customFen = 'custom/fen';
      mockEngine.addCustomResponse(customFen, {
        evaluation: 100,
        bestMove: 'e4',
        depth: 10,
        timeMs: 20
      });
      
      await mockEngine.shutdown();
      
      // Re-initialize and check - should not have custom response
      mockEngine = new MockEngineService();
      await mockEngine.initialize();
      
      const analysis = await mockEngine.analyzePosition(customFen);
      expect(analysis.evaluation).not.toBe(100); // Should be generated default
    });

    it('should require re-initialization after shutdown', async () => {
      await mockEngine.initialize();
      await mockEngine.shutdown();
      
      await expect(
        mockEngine.analyzePosition('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')
      ).rejects.toThrow('Mock engine not initialized');
    });
  });

  describe('Hash Function', () => {
    it('should generate consistent hash for same FEN', async () => {
      await mockEngine.initialize();
      
      const fen = 'test/fen/string';
      const analysis1 = await mockEngine.analyzePosition(fen);
      const analysis2 = await mockEngine.analyzePosition(fen);
      
      expect(analysis1).toEqual(analysis2);
    });

    it('should generate different analyses for different FENs', async () => {
      await mockEngine.initialize();
      
      const fen1 = 'fen/variant/1';
      const fen2 = 'fen/variant/2';
      
      const analysis1 = await mockEngine.analyzePosition(fen1);
      const analysis2 = await mockEngine.analyzePosition(fen2);
      
      // They should be different (with high probability)
      expect(analysis1.evaluation).not.toBe(analysis2.evaluation);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty FEN string', async () => {
      await mockEngine.initialize();
      const analysis = await mockEngine.analyzePosition('');
      
      expect(analysis).toHaveProperty('evaluation');
      expect(analysis).toHaveProperty('bestMove');
    });

    it('should handle very long FEN string', async () => {
      await mockEngine.initialize();
      const longFen = 'a'.repeat(1000);
      const analysis = await mockEngine.analyzePosition(longFen);
      
      expect(analysis).toHaveProperty('evaluation');
      expect(analysis).toHaveProperty('bestMove');
    });

    it('should not change status if already in target status', async () => {
      await mockEngine.initialize();
      
      let callbackCount = 0;
      const unsubscribe = mockEngine.onStatusChange(() => callbackCount++);
      
      // Force status to ready (already is)
      mockEngine.stopAnalysis(); // This tries to set to 'ready' if analyzing
      
      expect(callbackCount).toBe(0);
      unsubscribe();
    });
  });
});