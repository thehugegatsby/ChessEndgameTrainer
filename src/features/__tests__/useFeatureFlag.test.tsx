/**
 * Unit tests for useFeatureFlag hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags, useFeatureFlagControls } from '../../shared/hooks/useFeatureFlag';
import { FeatureFlag, featureFlags } from '../../shared/services/FeatureFlagService';

describe('useFeatureFlag hooks', () => {
  beforeEach(() => {
    // Reset all feature flags
    Object.values(FeatureFlag).forEach(flag => {
      featureFlags.override(flag, false);
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('useFeatureFlag', () => {
    it('should return initial flag state', () => {
      const { result } = renderHook(() => 
        useFeatureFlag(FeatureFlag.USE_NEW_CHESS_CORE)
      );
      
      expect(result.current).toBe(false);
    });
    
    it('should update when flag changes', async () => {
      const { result } = renderHook(() => 
        useFeatureFlag(FeatureFlag.USE_NEW_CHESS_CORE)
      );
      
      expect(result.current).toBe(false);
      
      act(() => {
        featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      });
      
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
    
    it('should not re-render for unrelated flag changes', async () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useFeatureFlag(FeatureFlag.USE_NEW_CHESS_CORE);
      });
      
      const initialRenderCount = renderCount;
      
      act(() => {
        featureFlags.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, true);
      });
      
      // Wait a bit to ensure no re-render happens
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(renderCount).toBe(initialRenderCount);
      expect(result.current).toBe(false);
    });
    
    it('should handle SSR with fallback value', () => {
      // Mock SSR environment
      const originalWindow = global.window;
      // @ts-expect-error - Mocking window for SSR test
      delete global.window;
      
      const { result } = renderHook(() => 
        useFeatureFlag(FeatureFlag.USE_NEW_CHESS_CORE)
      );
      
      expect(result.current).toBe(false);
      
      // Restore window
      global.window = originalWindow;
    });
  });
  
  describe('useFeatureFlags', () => {
    it('should return multiple flag states', () => {
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      featureFlags.override(FeatureFlag.USE_NEW_TABLEBASE_SERVICE, false);
      
      const { result } = renderHook(() => 
        useFeatureFlags(
          FeatureFlag.USE_NEW_CHESS_CORE,
          FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
          FeatureFlag.USE_NEW_TRAINING_LOGIC
        )
      );
      
      expect(result.current[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
      expect(result.current[FeatureFlag.USE_NEW_TABLEBASE_SERVICE]).toBe(false);
      expect(result.current[FeatureFlag.USE_NEW_TRAINING_LOGIC]).toBe(false);
    });
    
    it('should update when any tracked flag changes', async () => {
      const { result } = renderHook(() => 
        useFeatureFlags(
          FeatureFlag.USE_NEW_CHESS_CORE,
          FeatureFlag.USE_NEW_TABLEBASE_SERVICE
        )
      );
      
      expect(result.current[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(false);
      
      act(() => {
        featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      });
      
      await waitFor(() => {
        expect(result.current[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
      });
    });
    
    it('should not re-render for untracked flag changes', async () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useFeatureFlags(FeatureFlag.USE_NEW_CHESS_CORE);
      });
      
      const initialRenderCount = renderCount;
      
      act(() => {
        featureFlags.override(FeatureFlag.USE_NEW_PROGRESS_TRACKING, true);
      });
      
      // Wait a bit to ensure no re-render happens
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(renderCount).toBe(initialRenderCount + 1); // Only initial effect
      expect(result.current[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(false);
    });
    
    it('should handle dynamic flag list changes', () => {
      const { result, rerender } = renderHook(
        ({ flags }) => useFeatureFlags(...flags),
        {
          initialProps: {
            flags: [FeatureFlag.USE_NEW_CHESS_CORE] as FeatureFlag[],
          },
        }
      );
      
      expect(Object.keys(result.current)).toHaveLength(1);
      
      rerender({
        flags: [
          FeatureFlag.USE_NEW_CHESS_CORE,
          FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
        ] as FeatureFlag[],
      });
      
      expect(Object.keys(result.current)).toHaveLength(2);
    });
  });
  
  describe('useFeatureFlagControls', () => {
    it('should provide control functions', () => {
      const { result } = renderHook(() => useFeatureFlagControls());
      
      expect(result.current.isEnabled).toBeDefined();
      expect(result.current.toggle).toBeDefined();
      expect(result.current.enable).toBeDefined();
      expect(result.current.disable).toBeDefined();
      expect(result.current.enablePhase).toBeDefined();
      expect(result.current.disablePhase).toBeDefined();
      expect(result.current.getAllFlags).toBeDefined();
    });
    
    it('should toggle flag state', () => {
      const { result } = renderHook(() => useFeatureFlagControls());
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      
      act(() => {
        result.current.toggle(FeatureFlag.USE_NEW_CHESS_CORE);
      });
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      
      act(() => {
        result.current.toggle(FeatureFlag.USE_NEW_CHESS_CORE);
      });
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
    });
    
    it('should enable and disable flags', () => {
      const { result } = renderHook(() => useFeatureFlagControls());
      
      act(() => {
        result.current.enable(FeatureFlag.USE_NEW_MOVE_QUALITY);
      });
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_MOVE_QUALITY)).toBe(true);
      
      act(() => {
        result.current.disable(FeatureFlag.USE_NEW_MOVE_QUALITY);
      });
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_MOVE_QUALITY)).toBe(false);
    });
    
    it('should enable and disable phases', () => {
      const { result } = renderHook(() => useFeatureFlagControls());
      
      act(() => {
        result.current.enablePhase('chess');
      });
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(true);
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(true);
      
      act(() => {
        result.current.disablePhase('chess');
      });
      
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_CHESS_CORE)).toBe(false);
      expect(result.current.isEnabled(FeatureFlag.USE_NEW_MOVE_VALIDATION)).toBe(false);
    });
    
    it('should get all flag states', () => {
      const { result } = renderHook(() => useFeatureFlagControls());
      
      act(() => {
        result.current.enable(FeatureFlag.USE_NEW_CHESS_CORE);
        result.current.enable(FeatureFlag.USE_NEW_TABLEBASE_SERVICE);
      });
      
      const allFlags = result.current.getAllFlags();
      
      expect(allFlags[FeatureFlag.USE_NEW_CHESS_CORE]).toBe(true);
      expect(allFlags[FeatureFlag.USE_NEW_TABLEBASE_SERVICE]).toBe(true);
      expect(allFlags[FeatureFlag.USE_NEW_TRAINING_LOGIC]).toBe(false);
    });
    
    it('should trigger re-render when flags change', async () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useFeatureFlagControls();
      });
      
      const initialRenderCount = renderCount;
      
      act(() => {
        result.current.enable(FeatureFlag.USE_NEW_CHESS_CORE);
      });
      
      await waitFor(() => {
        expect(renderCount).toBeGreaterThan(initialRenderCount);
      });
    });
  });
});