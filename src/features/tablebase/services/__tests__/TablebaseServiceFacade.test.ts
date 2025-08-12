/**
 * Tests for TablebaseServiceFacade - Strangler Fig Pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TablebaseServiceFacade, LegacyTablebaseService } from '../TablebaseServiceFacade';
import { TablebaseService } from '../TablebaseService';
import FeatureFlagService, { FeatureFlag } from '../../../../shared/services/FeatureFlagService';
import type { TablebaseEvaluation, TablebaseMove } from '../../types/interfaces';

// Mock the services
vi.mock('../TablebaseService');
vi.mock('../../../../shared/services/logging/Logger', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    })
  })
}));

describe('TablebaseServiceFacade', () => {
  let facade: TablebaseServiceFacade;
  let legacyService: LegacyTablebaseService;
  let newService: TablebaseService;
  let featureFlagService: FeatureFlagService;
  
  const mockEvaluation: TablebaseEvaluation = {
    outcome: 'win',
    dtm: 5
  };
  
  const mockMoves: TablebaseMove[] = [
    {
      uci: 'e2e4',
      san: 'e4',
      outcome: 'win',
      dtm: 4
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock services
    legacyService = new LegacyTablebaseService();
    newService = new TablebaseService();
    featureFlagService = FeatureFlagService.getInstance();
    
    // Mock service methods
    vi.spyOn(legacyService, 'evaluate').mockResolvedValue(mockEvaluation);
    vi.spyOn(legacyService, 'getBestMoves').mockResolvedValue(mockMoves);
    vi.spyOn(newService, 'evaluate').mockResolvedValue(mockEvaluation);
    vi.spyOn(newService, 'getBestMoves').mockResolvedValue(mockMoves);
    
    // Create facade with mocked services
    facade = new TablebaseServiceFacade(
      legacyService,
      newService,
      featureFlagService
    );
  });

  afterEach(() => {
    // Clean up feature flags
    featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
  });

  describe('Feature Flag Routing', () => {
    it('should use legacy service when feature flag is disabled', async () => {
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      
      try {
        await facade.evaluate('test-fen');
      } catch {
        // Expected to throw since legacy is not implemented
      }
      
      expect(legacyService.evaluate).toHaveBeenCalledWith('test-fen');
      expect(newService.evaluate).not.toHaveBeenCalled();
    });

    it('should use new service when feature flag is enabled', async () => {
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      const result = await facade.evaluate('test-fen');
      
      expect(result).toEqual(mockEvaluation);
      expect(newService.evaluate).toHaveBeenCalledWith('test-fen');
      expect(legacyService.evaluate).not.toHaveBeenCalled();
    });

    it('should route getBestMoves to correct service based on flag', async () => {
      // Test with flag disabled
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      
      try {
        await facade.getBestMoves('test-fen', 3);
      } catch {
        // Expected
      }
      
      expect(legacyService.getBestMoves).toHaveBeenCalledWith('test-fen', 3);
      expect(newService.getBestMoves).not.toHaveBeenCalled();
      
      // Clear calls
      vi.clearAllMocks();
      
      // Test with flag enabled
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      const result = await facade.getBestMoves('test-fen', 3);
      
      expect(result).toEqual(mockMoves);
      expect(newService.getBestMoves).toHaveBeenCalledWith('test-fen', 3);
      expect(legacyService.getBestMoves).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from legacy service', async () => {
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      const error = new Error('Legacy service error');
      vi.spyOn(legacyService, 'evaluate').mockRejectedValue(error);
      
      await expect(facade.evaluate('test-fen')).rejects.toThrow('Legacy service error');
    });

    it('should propagate errors from new service', async () => {
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      const error = new Error('New service error');
      vi.spyOn(newService, 'evaluate').mockRejectedValue(error);
      
      await expect(facade.evaluate('test-fen')).rejects.toThrow('New service error');
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should report active service in metrics', () => {
      // Test with flag disabled
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      let metrics = facade.getMetrics();
      
      expect(metrics).toEqual({
        activeService: 'legacy',
        featureFlagEnabled: false
      });
      
      // Test with flag enabled
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      metrics = facade.getMetrics();
      
      expect(metrics).toEqual({
        activeService: 'new',
        featureFlagEnabled: true
      });
    });
  });

  describe('Testing Utilities', () => {
    it('should allow forcing legacy service', async () => {
      // Start with new service
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      // Force legacy
      facade.forceService('legacy');
      
      try {
        await facade.evaluate('test-fen');
      } catch {
        // Expected
      }
      
      expect(legacyService.evaluate).toHaveBeenCalled();
      expect(newService.evaluate).not.toHaveBeenCalled();
    });

    it('should allow forcing new service', async () => {
      // Start with legacy
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      
      // Force new
      facade.forceService('new');
      
      const result = await facade.evaluate('test-fen');
      
      expect(result).toEqual(mockEvaluation);
      expect(newService.evaluate).toHaveBeenCalled();
      expect(legacyService.evaluate).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work with default services when none provided', () => {
      const defaultFacade = new TablebaseServiceFacade();
      expect(defaultFacade).toBeDefined();
      expect(defaultFacade.getMetrics()).toBeDefined();
    });

    it('should handle concurrent requests correctly', async () => {
      featureFlagService.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      // Make concurrent requests
      const promises = [
        facade.evaluate('fen1'),
        facade.evaluate('fen2'),
        facade.getBestMoves('fen3'),
        facade.getBestMoves('fen4', 5)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      expect(newService.evaluate).toHaveBeenCalledTimes(2);
      expect(newService.getBestMoves).toHaveBeenCalledTimes(2);
    });
  });
});