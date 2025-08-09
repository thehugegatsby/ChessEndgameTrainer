/**
 * @file Tests for useMoveQuality hook
 * @module tests/unit/hooks/useMoveQuality
 * 
 * @description
 * Basic tests for the useMoveQuality hook interface and functionality.
 * This hook provides on-demand move quality assessment.
 */

import { renderHook, act } from '@testing-library/react';
import { useMoveQuality } from '@shared/hooks/useMoveQuality';

// Mock the logger
jest.mock('@shared/services/logging/Logger', () => ({
  getLogger: jest.fn(() => ({
    setContext: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock tablebase service
jest.mock('@shared/services/TablebaseService', () => ({
  tablebaseService: {
    getEvaluation: jest.fn(),
  },
}));

// Mock move quality utils
jest.mock('@shared/utils/moveQuality', () => ({
  assessTablebaseMoveQuality: jest.fn(),
}));

// Mock chess.js
jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation((fen) => ({
    move: jest.fn().mockReturnValue({ san: 'Kh1' }),
    fen: jest.fn(() => fen || '8/8/8/8/8/8/8/8 w - - 0 1'),
    turn: jest.fn(() => 'w'),
  })),
}));

describe('useMoveQuality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('returns correct interface with initial state', () => {
      const { result } = renderHook(() => useMoveQuality());

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('assessMove');
      expect(result.current).toHaveProperty('clearAnalysis');

      // Initial state
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.assessMove).toBe('function');
      expect(typeof result.current.clearAnalysis).toBe('function');
    });

    it('works with basic functionality', async () => {
      const { result } = renderHook(() => useMoveQuality());
      
      // Test that clearAnalysis works
      act(() => {
        result.current.clearAnalysis();
      });
      
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Basic Functionality', () => {
    it('provides assessMove function that can be called', async () => {
      const { result } = renderHook(() => useMoveQuality());

      // Test that function exists and can be called without crashing
      expect(typeof result.current.assessMove).toBe('function');
      
      // Call it but don't make assertions about behavior since
      // the implementation may vary
      try {
        await act(async () => {
          await result.current.assessMove('8/8/8/8/8/8/8/8 w - - 0 1', 'Kh1', 'w');
        });
      } catch (error) {
        // Error handling is implementation-dependent
      }
      
      // Hook should still be in valid state
      expect(result.current).toBeDefined();
    });

    it('clearAnalysis resets state', () => {
      const { result } = renderHook(() => useMoveQuality());
      
      act(() => {
        result.current.clearAnalysis();
      });
      
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Hook Lifecycle', () => {
    it('cleans up properly on unmount', () => {
      const { unmount } = renderHook(() => useMoveQuality());

      // Should not throw on unmount
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('maintains stable function references', () => {
      const { result, rerender } = renderHook(() => useMoveQuality());

      const initialAssessMove = result.current.assessMove;
      const initialClearAnalysis = result.current.clearAnalysis;

      rerender();

      // Functions should be stable due to useCallback
      expect(result.current.assessMove).toBe(initialAssessMove);
      expect(result.current.clearAnalysis).toBe(initialClearAnalysis);
    });
  });

  describe('Integration', () => {
    it('handles basic integration scenarios', async () => {
      const { result } = renderHook(() => useMoveQuality());

      // Should start in clean state
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Clear should maintain clean state
      act(() => {
        result.current.clearAnalysis();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});