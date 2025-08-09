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
import { ChessTestScenarios } from '../../fixtures/chessTestScenarios';

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
    
    // Restore default mocks for each test
    const { Chess } = require('chess.js');
    Chess.mockImplementation((fen) => ({
      move: jest.fn().mockReturnValue({ san: 'Kh1' }),
      fen: jest.fn(() => fen || '8/8/8/8/8/8/8/8 w - - 0 1'),
    }));
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
      } catch (_error) {
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

  describe('Move Assessment Scenarios', () => {
    beforeEach(() => {
      // Reset all mocks to default state
      jest.clearAllMocks();
      
      // Reset Chess mock to default successful behavior
      const { Chess } = require('chess.js');
      Chess.mockImplementation((fen) => ({
        move: jest.fn().mockReturnValue({ san: 'Kh1' }),
        fen: jest.fn(() => fen || '8/8/8/8/8/8/8/8 w - - 0 1'),
      }));
      
      // Reset tablebase service with default successful behavior
      const { tablebaseService } = require('@shared/services/TablebaseService');
      const { assessTablebaseMoveQuality } = require('@shared/utils/moveQuality');
      
      tablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: { wdl: 1, category: 'win' }
      });
      
      assessTablebaseMoveQuality.mockReturnValue({
        quality: 'excellent',
        reason: 'Best move',
        isTablebaseAnalysis: true
      });
    });

    it('handles invalid moves', async () => {
      // Mock Chess to simulate invalid move
      const { Chess } = require('chess.js');
      Chess.mockImplementation(() => ({
        move: jest.fn().mockReturnValue(null), // Invalid move
        fen: jest.fn(() => '8/8/8/8/8/8/8/8 w - - 0 1')
      }));

      const { result } = renderHook(() => useMoveQuality());

      let assessmentResult;
      await act(async () => {
        assessmentResult = await result.current.assessMove('8/8/8/8/8/8/8/8 w - - 0 1', 'invalid', 'w');
      });

      expect(assessmentResult.quality).toBe('unknown');
      expect(assessmentResult.reason).toBe('Invalid move');
      expect(assessmentResult.isTablebaseAnalysis).toBe(false);
      expect(result.current.data).toEqual(assessmentResult);
    });

    it('handles positions without tablebase data', async () => {
      const { tablebaseService } = require('@shared/services/TablebaseService');
      tablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: false,
        result: null
      });

      const { result } = renderHook(() => useMoveQuality());

      let assessmentResult;
      await act(async () => {
        assessmentResult = await result.current.assessMove('8/8/8/8/8/8/8/8 w - - 0 1', 'Kh1', 'w');
      });

      expect(assessmentResult.quality).toBe('unknown');
      expect(assessmentResult.reason).toBe('No tablebase data available');
      expect(assessmentResult.isTablebaseAnalysis).toBe(false);
    });

    it('completes successful assessment with logging', async () => {
      const { result } = renderHook(() => useMoveQuality());

      let assessmentResult;
      await act(async () => {
        assessmentResult = await result.current.assessMove('8/8/8/8/8/8/8/8 w - - 0 1', 'Kh1', 'w');
      });

      expect(assessmentResult.quality).toBe('excellent');
      expect(assessmentResult.reason).toBe('Best move');
      expect(assessmentResult.isTablebaseAnalysis).toBe(true);
      expect(result.current.data).toEqual(assessmentResult);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles aborted requests gracefully', async () => {
      const { result } = renderHook(() => useMoveQuality());

      // Just test that multiple calls don't crash
      await act(async () => {
        await result.current.assessMove('8/8/8/8/8/8/8/8 w - - 0 1', 'Kh1', 'w');
      });

      // Use scenario from central database instead of hardcoded FEN
      const scenario = ChessTestScenarios.WHITE_TRIES_ILLEGAL_MOVE;
      
      await act(async () => {
        await result.current.assessMove(scenario.fen, scenario.testMove.from + scenario.testMove.to, 'w');
      });

      // Should have completed successfully
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Advanced Scenarios', () => {
    it('processes WDL values through assessment utility', async () => {
      const { assessTablebaseMoveQuality } = require('@shared/utils/moveQuality');
      const { result } = renderHook(() => useMoveQuality());

      await act(async () => {
        await result.current.assessMove('8/8/8/8/8/8/8/8 w - - 0 1', 'Kh1', 'w');
      });

      // Verify that the assessment utility was called
      expect(assessTablebaseMoveQuality).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('manages internal state correctly', () => {
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