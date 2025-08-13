import { vi } from 'vitest';
/**
 * Comprehensive Unit Tests for FeatureFlagService
 * Tests the Strangler Fig Pattern Feature Flag System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FeatureFlagService, { FeatureFlag } from '../../shared/services/FeatureFlagService';

// Mock localStorage and window globally for this test file
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const windowMock = {
  localStorage: localStorageMock,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

// Make window available globally for tests
if (typeof global !== 'undefined') {
  (global as any).window = windowMock;
  (global as any).localStorage = localStorageMock;
}

describe.skip('FeatureFlagService - TODO: Fix memory leak with global mocks', () => {
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
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Reset event listener mocks
    windowMock.addEventListener.mockClear();
    windowMock.removeEventListener.mockClear();
    windowMock.dispatchEvent.mockClear();
    
    // Set default environment
    process.env.NODE_ENV = 'test';
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up singleton using the proper method
    FeatureFlagService.resetForTesting();
  });
  
  describe('Singleton Pattern', () => {
    it('should always return the same instance', () => {
      const instance1 = FeatureFlagService.getInstance();
      const instance2 = FeatureFlagService.getInstance();
      const instance3 = FeatureFlagService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
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
      FeatureFlagService.resetForTesting();
      
      service = FeatureFlagService.getInstance();
      
      // Chess core was rolled back due to UI/UX issues
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(service.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(false);
    });
  });
  
  describe('Environment Variable Loading', () => {
    it('should load flags from NEXT_PUBLIC_FF_ environment variables', () => {
      process.env.NEXT_PUBLIC_FF_USE_NEW_CHESS_CORE = 'true';
      process.env.NEXT_PUBLIC_FF_USE_NEW_TABLEBASE_SERVICE = 'true';
      
      service = FeatureFlagService.getInstance();
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_LOGIC)).toBe(false);
    });
    
    it('should ignore non-feature-flag environment variables', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_FF_USE_NEW_CHESS_CORE = 'true';
      
      service = FeatureFlagService.getInstance();
      
      const allFlags = service.getAllFlags();
      expect(allFlags[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
      expect(Object.keys(allFlags)).toHaveLength(Object.values(FeatureFlag).length);
    });
  });
  
  describe('LocalStorage Integration', () => {
    it('should load flags from localStorage if available', () => {
      const storedFlags = {
        [FeatureFlag.USE_NEW_CHESS_CORE]: true,
        [FeatureFlag.USE_NEW_MOVE_VALIDATION]: true,
      };
      
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(storedFlags)
      );
      
      service = FeatureFlagService.getInstance();
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TRAINING_LOGIC)).toBe(false);
    });
    
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
      
      // Should not throw
      expect(() => {
        service = FeatureFlagService.getInstance();
      }).not.toThrow();
      
      // Should still work with defaults (chess core disabled in dev due to rollback)
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      
      consoleSpy.mockRestore();
    });
    
    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json {');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
      
      // Should not throw
      expect(() => {
        service = FeatureFlagService.getInstance();
      }).not.toThrow();
      
      // Should still work with defaults (chess core disabled in dev due to rollback)
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load feature flags'),
        expect.any(Error)
      );
      
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
      // Set initial value
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      
      // Override again
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
    });
  });
  
  describe('Runtime Overrides', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should override flag values at runtime', () => {
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
    });
    
    it('should update internal flags object when overriding', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      const allFlags = service.getAllFlags();
      expect(allFlags[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
    });
    
    it('should persist overrides to localStorage', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'featureFlags',
        expect.any(String)
      );
      
      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
    });
    
    it('should dispatch custom event when flag changes', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      expect(windowMock.dispatchEvent).toHaveBeenCalled();
      
      const dispatchCall = windowMock.dispatchEvent.mock.calls[0][0];
      expect(dispatchCall).toBeInstanceOf(CustomEvent);
      expect(dispatchCall.detail).toEqual({
        flag: FeatureFlag.USE_NEW_CHESS_CORE,
        enabled: true
      });
    });
    
    it('should handle localStorage errors during override gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
      
      // Should not throw
      expect(() => {
        service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      }).not.toThrow();
      
      // Should still update the flag in memory
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to persist feature flag'),
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
      
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
      
      service.clearOverrides();
      
      // Flags should revert to defaults
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(false);
    });
    
    it('should remove flags from localStorage when clearing', () => {
      service.clearOverrides();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('featureFlags');
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
      service.enablePhase('chess');
      
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });
    
    it('should dispatch events for each flag in a phase', () => {
      service.enablePhase('chess');
      
      expect(windowMock.dispatchEvent).toHaveBeenCalledTimes(2);
      
      const calls = windowMock.dispatchEvent.mock.calls;
      const flags = calls.map((call: any[]) => call[0].detail.flag);
      
      expect(flags).toContain(FeatureFlag.USE_NEW_CHESS_CORE);
      expect(flags).toContain(FeatureFlag.USE_NEW_MOVE_VALIDATION);
    });
  });
  
  describe('getAllFlags', () => {
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    it('should return all flag states', () => {
      const allFlags = service.getAllFlags();
      
      // Should include all defined flags
      Object.values(FeatureFlag).forEach(flag => {
        expect(allFlags).toHaveProperty(flag);
        expect(typeof allFlags[flag]).toBe('boolean');
      });
    });
    
    it('should reflect current state including overrides', () => {
      service.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      service.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      
      const allFlags = service.getAllFlags();
      
      expect(allFlags[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
      expect(allFlags[FeatureFlag.USE_NEW_TABLEBASE_SERVICE]).toBe(true);
      expect(allFlags[FeatureFlag.USE_NEW_TRAINING_LOGIC]).toBe(false);
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
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(storedFlags)
      );
      
      service = FeatureFlagService.getInstance();
      
      // Both should be enabled
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(service.isEnabled(FeatureFlag.USE_NEW_TABLEBASE_SERVICE)).toBe(true);
    });
    
    it('should prioritize localStorage over environment variables', () => {
      // Set environment variable to true
      process.env.NEXT_PUBLIC_FF_USE_NEW_CHESS_CORE = 'true';
      
      // Set localStorage to false for the same flag
      const storedFlags = {
        [FeatureFlag.USE_NEW_CHESS_CORE]: false,
      };
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(storedFlags)
      );
      
      service = FeatureFlagService.getInstance();
      
      // localStorage value should win
      expect(service.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
    });
  });
});