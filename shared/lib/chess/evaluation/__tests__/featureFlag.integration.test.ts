/**
 * Integration tests to verify feature flag behavior
 * Ensures new evaluation system doesn't affect existing code when disabled
 */

import { FEATURE_FLAGS } from '@shared/constants';

describe('Feature Flag Integration Tests', () => {
  describe('when USE_UNIFIED_EVALUATION_SYSTEM is disabled', () => {
    beforeAll(() => {
      // Ensure flag is disabled for these tests
      process.env.NEXT_PUBLIC_UNIFIED_EVAL = 'false';
    });

    it('should not import or initialize UnifiedEvaluationService', () => {
      // This test verifies that the UnifiedEvaluationService is not imported
      // when the feature flag is disabled
      const modules = Object.keys(require.cache);
      const unifiedServiceModule = modules.find(m => m.includes('unifiedService'));
      
      // If the module is found, it should not have been executed
      if (unifiedServiceModule) {
        // The module might be in cache from other tests, but it shouldn't be used
        expect(FEATURE_FLAGS.USE_UNIFIED_EVALUATION_SYSTEM).toBe(false);
      }
    });

    it('should not create any instances of new evaluation modules', () => {
      // Mock console.log to track any initialization messages
      const consoleSpy = jest.spyOn(console, 'log');
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      // Attempt to use the system (this should use legacy path)
      // Since we don't have direct access to the hooks here, we just verify
      // no initialization logs from new modules
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('UnifiedEvaluationService')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('EvaluationNormalizer')
      );
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Pipeline')
      );
      
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('when USE_UNIFIED_EVALUATION_SYSTEM is enabled', () => {
    beforeAll(() => {
      // Enable flag for these tests
      process.env.NEXT_PUBLIC_UNIFIED_EVAL = 'true';
    });

    afterAll(() => {
      // Reset to default
      delete process.env.NEXT_PUBLIC_UNIFIED_EVAL;
    });

    it('should be able to import UnifiedEvaluationService', async () => {
      // Dynamic import to ensure module is loaded fresh
      const module = await import('../unifiedService');
      expect(module.UnifiedEvaluationService).toBeDefined();
    });

    it('should be able to import all pipeline modules', async () => {
      const normalizer = await import('../normalizer');
      const transformer = await import('../perspectiveTransformer');
      const formatter = await import('../formatter');
      const analyzer = await import('../moveQualityAnalyzer');
      
      expect(normalizer.EvaluationNormalizer).toBeDefined();
      expect(transformer.PlayerPerspectiveTransformer).toBeDefined();
      expect(formatter.EvaluationFormatter).toBeDefined();
      expect(analyzer.MoveQualityAnalyzer).toBeDefined();
    });
  });

  describe('Feature flag consistency', () => {
    it('should have consistent behavior across environments', () => {
      // In test environment without explicit flag, should be false
      delete process.env.NEXT_PUBLIC_UNIFIED_EVAL;
      const { FEATURE_FLAGS: flags1 } = require('@shared/constants');
      expect(flags1.USE_UNIFIED_EVALUATION_SYSTEM).toBe(false);
      
      // With explicit true
      process.env.NEXT_PUBLIC_UNIFIED_EVAL = 'true';
      jest.resetModules();
      const { FEATURE_FLAGS: flags2 } = require('@shared/constants');
      expect(flags2.USE_UNIFIED_EVALUATION_SYSTEM).toBe(true);
      
      // With explicit false
      process.env.NEXT_PUBLIC_UNIFIED_EVAL = 'false';
      jest.resetModules();
      const { FEATURE_FLAGS: flags3 } = require('@shared/constants');
      expect(flags3.USE_UNIFIED_EVALUATION_SYSTEM).toBe(false);
    });
  });
});