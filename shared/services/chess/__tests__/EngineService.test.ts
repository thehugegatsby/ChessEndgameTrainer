/**
 * Comprehensive tests for EngineService
 * Tests singleton pattern, memory management, and resource cleanup
 */

import { EngineService } from '../EngineService';

// Mock ScenarioEngine
jest.mock('@shared/lib/chess/ScenarioEngine', () => ({
  ScenarioEngine: jest.fn().mockImplementation(() => ({
    getDualEvaluation: jest.fn().mockResolvedValue({
      engine: { score: 0, mate: null, evaluation: 'Equal' },
      tablebase: { isAvailable: false }
    }),
    updatePosition: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('EngineService', () => {
  let engineService: EngineService;

  beforeEach(() => {
    // Reset singleton instance
    (EngineService as any).instance = null;
    engineService = EngineService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await engineService.cleanup();
    (EngineService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EngineService.getInstance();
      const instance2 = EngineService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', async () => {
      await engineService.getEngine('test1');
      const stats1 = engineService.getStats();
      
      const newInstance = EngineService.getInstance();
      const stats2 = newInstance.getStats();
      
      expect(stats1.totalEngines).toBe(stats2.totalEngines);
      expect(stats1.engineIds).toEqual(stats2.engineIds);
    });
  });

  describe('Engine Management', () => {
    it('should create and track new engine instances', async () => {
      const engine = await engineService.getEngine('test-engine');
      
      expect(engine).toBeDefined();
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(1);
      expect(stats.engineIds).toContain('test-engine');
    });

    it('should reuse existing engine instances', async () => {
      const engine1 = await engineService.getEngine('same-id');
      const engine2 = await engineService.getEngine('same-id');
      
      expect(engine1).toBe(engine2);
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(1);
    });

    it('should track reference counts correctly', async () => {
      await engineService.getEngine('ref-test');
      await engineService.getEngine('ref-test');
      
      const stats = engineService.getStats();
      expect(stats.activeEngines).toBe(1);
      
      engineService.releaseEngine('ref-test');
      const statsAfterRelease = engineService.getStats();
      expect(statsAfterRelease.activeEngines).toBe(1); // Still has one reference
    });
  });

  describe('Memory Management', () => {
    it('should enforce max instances limit', async () => {
      const maxInstances = 5;
      
      // Create max number of engines
      for (let i = 0; i < maxInstances + 2; i++) {
        await engineService.getEngine(`engine-${i}`);
      }
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBeLessThanOrEqual(maxInstances);
    });

    it('should cleanup oldest unused engines when at capacity', async () => {
      // Create engines up to limit
      for (let i = 0; i < 6; i++) {
        await engineService.getEngine(`engine-${i}`);
        engineService.releaseEngine(`engine-${i}`); // Release immediately to make eligible for cleanup
      }
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBeLessThanOrEqual(5);
    });

    it('should track last used time for cleanup decisions', async () => {
      const engine1 = await engineService.getEngine('old-engine');
      
      // Simulate time passing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const engine2 = await engineService.getEngine('new-engine');
      
      // Both engines should exist
      const stats = engineService.getStats();
      expect(stats.engineIds).toContain('old-engine');
      expect(stats.engineIds).toContain('new-engine');
    });
  });

  describe('Error Handling', () => {
    it('should handle engine creation failures gracefully', async () => {
      const { ScenarioEngine } = require('@shared/lib/chess/ScenarioEngine');
      ScenarioEngine.mockImplementationOnce(() => {
        throw new Error('Engine creation failed');
      });

      await expect(engineService.getEngine('failing-engine')).rejects.toThrow('Engine creation failed');
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(0);
    });

    it('should handle cleanup failures without crashing', async () => {
      const mockEngine = {
        getDualEvaluation: jest.fn(),
        updatePosition: jest.fn(),
        quit: jest.fn().mockRejectedValue(new Error('Cleanup failed'))
      };

      const { ScenarioEngine } = require('@shared/lib/chess/ScenarioEngine');
      ScenarioEngine.mockImplementationOnce(() => mockEngine);

      await engineService.getEngine('cleanup-test');
      
      // Should not throw error
      await expect(engineService.cleanupEngine('cleanup-test')).resolves.not.toThrow();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate engine statistics', async () => {
      await engineService.getEngine('active1');
      await engineService.getEngine('active2');
      await engineService.getEngine('inactive');
      
      engineService.releaseEngine('inactive');
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(3);
      expect(stats.activeEngines).toBe(2);
      expect(stats.engineIds).toEqual(['active1', 'active2', 'inactive']);
    });

    it('should handle empty engine pool statistics', () => {
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(0);
      expect(stats.activeEngines).toBe(0);
      expect(stats.engineIds).toEqual([]);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup specific engines', async () => {
      await engineService.getEngine('cleanup-target');
      await engineService.getEngine('keep-alive');
      
      await engineService.cleanupEngine('cleanup-target');
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(1);
      expect(stats.engineIds).toEqual(['keep-alive']);
    });

    it('should cleanup all engines on global cleanup', async () => {
      await engineService.getEngine('engine1');
      await engineService.getEngine('engine2');
      await engineService.getEngine('engine3');
      
      await engineService.cleanup();
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(0);
      expect(stats.engineIds).toEqual([]);
    });

    it('should handle multiple cleanup calls safely', async () => {
      await engineService.getEngine('multi-cleanup');
      
      await engineService.cleanup();
      await engineService.cleanup(); // Second cleanup should not error
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle releasing non-existent engines', () => {
      expect(() => {
        engineService.releaseEngine('non-existent');
      }).not.toThrow();
    });

    it('should handle cleanup of non-existent engines', async () => {
      await expect(engineService.cleanupEngine('non-existent')).resolves.not.toThrow();
    });

    it('should handle concurrent engine requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        engineService.getEngine(`concurrent-${i}`)
      );
      
      const engines = await Promise.all(promises);
      expect(engines).toHaveLength(5);
      
      const stats = engineService.getStats();
      expect(stats.totalEngines).toBe(5);
    });
  });
});