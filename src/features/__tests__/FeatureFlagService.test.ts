/**
 * Comprehensive Unit Tests for FeatureFlagService
 * Tests the Strangler Fig Pattern Feature Flag System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FeatureFlagService, { FeatureFlag } from '../../shared/services/FeatureFlagService';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset singleton instance before each test
    (FeatureFlagService as any).instance = undefined;
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset localStorage mock
    const localStorage = window.localStorage as any;
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    
    // Reset event listener mocks
    (window.addEventListener as any).mockClear();
    (window.removeEventListener as any).mockClear();
    (window.dispatchEvent as any).mockClear();
    
    // Set default environment
    process.env.NODE_ENV = 'test';
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up singleton
    (FeatureFlagService as any).instance = undefined;
  });
  
  describe('Singleton Pattern', () => {
    it('should always return the same instance', () => {
      const instance1 = FeatureFlagService.getInstance();
      const instance2 = FeatureFlagService.getInstance();
      const instance3 = FeatureFlagService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBeInstanceOf(FeatureFlagService);
    });
    
    it('should maintain state across getInstance calls', () => {
      const instance1 = FeatureFlagService.getInstance();
      instance1.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      const instance2 = FeatureFlagService.getInstance();
      expect(instance2.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
    });
  });
  
  describe('Feature Flag Defaults', () => {
    it('should default all flags to false', () => {
      service = FeatureFlagService.getInstance();
      
      Object.values(FeatureFlag).forEach(flag => {
        expect(service.isEnabled(flag)).toBe(false);
      });
    });
    
    it('should apply development defaults when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      service = FeatureFlagService.getInstance();
      
      // All flags should still default to false in development
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(false);
    });
  });
  
  describe('Environment Variable Loading', () => {
    it('should load flags from NEXT_PUBLIC_FF_ environment variables', () => {
      process.env.NEXT_PUBLIC_FF_USE_NEW_CHESS_CORE = 'true';
      process.env.NEXT_PUBLIC_FF_USE_NEW_TABLEBASE_SERVICE = 'true';
      process.env.NEXT_PUBLIC_FF_USE_NEW_TRAINING_LOGIC = 'false';
      
      service = FeatureFlagService.getInstance();
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_LOGIC)).toBe(false);
    });
    
    it('should ignore non-feature-flag environment variables', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      process.env.DATABASE_URL = 'postgres://localhost';
      
      service = FeatureFlagService.getInstance();
      
      const allFlags = service.getAllFlags();
      expect(Object.keys(allFlags)).not.toContain('api_url');
      expect(Object.keys(allFlags)).not.toContain('database_url');
    });
  });
  
  describe('LocalStorage Integration', () => {
    it('should load flags from localStorage if available', () => {
      const storedFlags = {
        [FeatureFlag.USE_NEW_CHESS_CORE]: true,
        [FeatureFlag.USE_NEW_MOVE_VALIDATION]: true,
      };
      
      (window.localStorage.getItem as any).mockReturnValue(
        JSON.stringify(storedFlags)
      );
      
      service = FeatureFlagService.getInstance();
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(false);
    });
    
    it('should handle localStorage errors gracefully', () => {
      (window.localStorage.getItem as any).mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
      
      // Should not throw
      expect(() => {
        service = FeatureFlagService.getInstance();
      }).not.toThrow();
      
      // Should use defaults
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      
      // Should log warning in development
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load feature flags from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should handle invalid JSON in localStorage', () => {
      (window.localStorage.getItem as any).mockReturnValue('invalid json {');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
      
      service = FeatureFlagService.getInstance();
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('isEnabled and isDisabled', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should correctly report enabled state', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isDisabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
    });
    
    it('should correctly report disabled state', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(service.isDisabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
    });
    
    it('should prioritize runtime overrides over stored flags', () => {
      // Set initial state
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      
      // Override at runtime (this sets both override and flag)
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
    });
  });
  
  describe('Runtime Overrides', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should override flag values at runtime', () => {
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_LOGIC)).toBe(false);
      
      service.override(FeatureFlag.USE_NEW_TRAINING_LOGIC, true);
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_LOGIC)).toBe(true);
    });
    
    it('should update internal flags object when overriding', () => {
      service.override(FeatureFlag.USE_NEW_MOVE_QUALITY, true);
      
      const allFlags = service.getAllFlags();
      expect(allFlags[FeatureFlag.USE_NEW_MOVE_QUALITY]).toBe(true);
    });
    
    it('should persist overrides to localStorage', () => {
      service.override(FeatureFlag.USE_NEW_PROGRESS_TRACKING, true);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'featureFlags',
        expect.stringContaining(FeatureFlag.USE_NEW_PROGRESS_TRACKING)
      );
      
      const savedData = (window.localStorage.setItem as any).mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed[FeatureFlag.USE_NEW_PROGRESS_TRACKING]).toBe(true);
    });
    
    it('should dispatch custom event when flag changes', () => {
      service.override(FeatureFlag.USE_NEW_COMPONENT_LIBRARY, true);
      
      expect(window.dispatchEvent).toHaveBeenCalled();
      
      const dispatchCall = (window.dispatchEvent as any).mock.calls[0][0];
      expect(dispatchCall).toBeInstanceOf(CustomEvent);
      expect(dispatchCall.type).toBe('featureFlagChanged');
      expect(dispatchCall.detail).toEqual({
        flag: FeatureFlag.USE_NEW_COMPONENT_LIBRARY,
        enabled: true,
      });
    });
    
    it('should handle localStorage errors during override gracefully', () => {
      (window.localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
      
      // Should not throw
      expect(() => {
        service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      }).not.toThrow();
      
      // Flag should still be set in memory
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      
      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist feature flag override:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Clear Overrides', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should clear all runtime overrides', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      service.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      service.clearOverrides();
      
      // Overrides should be cleared, but flags remain
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
    });
    
    it('should remove flags from localStorage when clearing', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      service.clearOverrides();
      
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('featureFlags');
    });
  });
  
  describe('Phase Management', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should enable all chess phase flags', () => {
      service.enablePhase('chess');
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(true);
    });
    
    it('should enable all tablebase phase flags', () => {
      service.enablePhase('tablebase');
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_UI)).toBe(true);
    });
    
    it('should enable all training phase flags', () => {
      service.enablePhase('training');
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_LOGIC)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_BOARD)).toBe(true);
    });
    
    it('should enable move-quality phase flag', () => {
      service.enablePhase('move-quality');
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_MOVE_QUALITY)).toBe(true);
    });
    
    it('should enable progress phase flag', () => {
      service.enablePhase('progress');
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_PROGRESS_TRACKING)).toBe(true);
    });
    
    it('should disable phase flags', () => {
      service.enablePhase('chess');
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      
      service.disablePhase('chess');
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(service.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(false);
    });
    
    it('should persist phase changes to localStorage', () => {
      service.enablePhase('tablebase');
      
      // Should have called setItem for each flag in the phase
      expect(window.localStorage.setItem).toHaveBeenCalledTimes(2);
    });
    
    it('should dispatch events for each flag in a phase', () => {
      service.enablePhase('training');
      
      // Should dispatch event for each flag
      expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
      
      const calls = (window.dispatchEvent as any).mock.calls;
      const flags = calls.map((call: any[]) => call[0].detail.flag);
      
      expect(flags).toContain(FeatureFlag.USE_NEW_TRAINING_LOGIC);
      expect(flags).toContain(FeatureFlag.USE_NEW_TRAINING_BOARD);
    });
  });
  
  describe('getAllFlags', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should return all flag states', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      service.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      
      const allFlags = service.getAllFlags();
      
      // Should include all defined flags
      expect(Object.keys(allFlags)).toHaveLength(Object.values(FeatureFlag).length);
      
      // Check specific values
      expect(allFlags[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
      expect(allFlags[FeatureFlag.USE_NEW_TABLEBASE_SERVICE]).toBe(false);
      expect(allFlags[FeatureFlag.USE_NEW_TRAINING_LOGIC]).toBe(false);
    });
    
    it('should reflect current state including overrides', () => {
      service.override(FeatureFlag.USE_NEW_MOVE_QUALITY, true);
      
      let allFlags = service.getAllFlags();
      expect(allFlags[FeatureFlag.USE_NEW_MOVE_QUALITY]).toBe(true);
      
      service.override(FeatureFlag.USE_NEW_MOVE_QUALITY, false);
      
      allFlags = service.getAllFlags();
      expect(allFlags[FeatureFlag.USE_NEW_MOVE_QUALITY]).toBe(false);
    });
  });
  
  describe('Priority and Merging', () => {
    it('should merge environment variables and localStorage correctly', () => {
      // Set environment variable
      process.env.NEXT_PUBLIC_FF_USE_NEW_CHESS_CORE = 'true';
      
      // Set localStorage with different flags
      const storedFlags = {
        [FeatureFlag.USE_NEW_TABLEBASE_SERVICE]: true,
      };
      (window.localStorage.getItem as any).mockReturnValue(
        JSON.stringify(storedFlags)
      );
      
      service = FeatureFlagService.getInstance();
      
      // Both should be enabled
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
    });
    
    it('should prioritize localStorage over environment variables', () => {
      // Set conflicting values
      process.env.NEXT_PUBLIC_FF_USE_NEW_CHESS_CORE = 'false';
      
      const storedFlags = {
        [FeatureFlag.USE_NEW_CHESS_CORE]: true,
      };
      (window.localStorage.getItem as any).mockReturnValue(
        JSON.stringify(storedFlags)
      );
      
      service = FeatureFlagService.getInstance();
      
      // localStorage should win
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
    });
  });
});