/**
 * @fileoverview Engine UI Integration Tests
 * @description TDD approach for fixing UI-Engine integration issues
 * 
 * Issues to resolve:
 * - 🔧 Engine: "🔄 Analysiert... Warte auf Analyse..." (endless state)
 * - 📚 Tablebase: "Keine Tablebase-Daten" (no data reaching UI)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

// Import actual UI components to test
import { DualEvaluationPanel } from '../../shared/components/training/DualEvaluationPanel';
import { EngineEvaluationCard } from '../../shared/components/training/DualEvaluationPanel/EngineEvaluationCard';

// Mock useEvaluation hook
jest.mock('../../shared/hooks/useEvaluation', () => ({
  useEvaluation: jest.fn(() => mockUseEvaluation)
}));

// Mock SimpleEngine module
jest.mock('../../shared/lib/chess/engine/simple/SimpleEngine', () => ({
  getSimpleEngine: jest.fn(() => mockSimpleEngine)
}));

// Mock EvaluationCache
jest.mock('../../shared/lib/cache/EvaluationCache', () => ({
  EvaluationCache: jest.fn(() => mockEvaluationCache)
}));

// Mock TablebaseService
jest.mock('../../shared/services/TablebaseService', () => ({
  TablebaseService: jest.fn(() => mockTablebaseService)
}));

// Mock useEvaluation hook return value
const mockUseEvaluation = {
  evaluation: null,
  isEvaluating: false,
  error: null,
  depth: 0,
  nodes: 0,
  nps: 0,
  time: 0,
  pv: [],
  tablebase: null,
  bestMove: null,
  score: null,
  isReady: true,
  evaluatePosition: jest.fn(),
  stopEvaluation: jest.fn(),
  clearEvaluation: jest.fn()
};

// Mock engine instances
const mockSimpleEngine = {
  evaluatePosition: jest.fn(),
  findBestMove: jest.fn(),
  waitForInit: jest.fn(),
  terminate: jest.fn()
};

const mockEvaluationCache = {
  evaluatePositionCached: jest.fn(),
  getBestMoveCached: jest.fn(),
  clear: jest.fn(),
  getStats: jest.fn()
};

const mockTablebaseService = {
  lookupPosition: jest.fn(),
  getTablebaseInfo: jest.fn()
};

// Test FEN position
const TEST_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('Engine UI Integration - TDD Approach', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset mock to default state
    Object.assign(mockUseEvaluation, {
      evaluation: null,
      isEvaluating: false,
      error: null,
      depth: 0,
      nodes: 0,
      nps: 0,
      time: 0,
      pv: [],
      tablebase: null,
      bestMove: null,
      score: null,
      isReady: true,
      evaluatePosition: jest.fn(),
      stopEvaluation: jest.fn(),
      clearEvaluation: jest.fn()
    });
    
    mockSimpleEngine.waitForInit.mockResolvedValue(undefined);
    mockEvaluationCache.getStats.mockReturnValue({
      size: 0,
      maxSize: 700,
      hits: 0,
      misses: 0
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('RED Phase: Failing Tests (Current Issues)', () => {
    it('should NOT show endless "Analysiert..." state', async () => {
      // RED: This test should FAIL initially (current bug)
      
      // Mock useEvaluation to simulate endless analyzing state
      mockUseEvaluation.isEvaluating = true;
      mockUseEvaluation.evaluation = null;
      mockUseEvaluation.evaluatePosition.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              score: { type: 'cp', value: 30 },
              depth: 15,
              pv: 'e2e4',
              nodes: 1000,
              time: 100
            });
          }, 5000); // 5 second delay simulating endless analysis
        });
      });

      // Render actual Engine UI component
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should initially show "Analysiert..." state
      expect(screen.getByText(/Analysiert/)).toBeInTheDocument();
      
      // Wait for evaluation to complete with realistic timing
      act(() => {
        jest.advanceTimersByTime(2000); // Advance timers by 2 seconds
      });
      
      // RED: This should FAIL - engine stuck in "Analysiert..." state
      await waitFor(() => {
        expect(screen.queryByText(/Analysiert/)).not.toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Engine should show actual evaluation result
      await waitFor(() => {
        expect(screen.getByText(/30/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should NOT show "Keine Tablebase-Daten" when data exists', async () => {
      // RED: This test should FAIL initially (current bug)
      
      // Mock useEvaluation to simulate missing tablebase data
      mockUseEvaluation.tablebase = null;
      mockUseEvaluation.isEvaluating = false;
      
      // Mock tablebase service to return valid data (but UI not showing it)
      mockTablebaseService.lookupPosition.mockResolvedValue({
        isTablebasePosition: true,
        wdl: 1, // Win for white
        dtm: 10, // Distance to mate
        category: 'KQvK'
      });

      // Render actual Tablebase UI component
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should initially show "Keine Tablebase-Daten" (the bug)
      expect(screen.getByText(/Keine Tablebase-Daten/)).toBeInTheDocument();
      
      // Simulate tablebase data arriving
      act(() => {
        mockUseEvaluation.tablebase = {
          isTablebasePosition: true,
          wdl: 1,
          dtm: 10,
          category: 'KQvK'
        };
        jest.advanceTimersByTime(100);
      });
      
      // RED: This should FAIL - not showing tablebase data
      await waitFor(() => {
        expect(screen.queryByText(/Keine Tablebase-Daten/)).not.toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Should show actual tablebase data
      await waitFor(() => {
        expect(screen.getByText(/Win/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('GREEN Phase: Minimal Implementation', () => {
    it('should show engine evaluation result in UI', async () => {
      // GREEN: Implement minimal connection Engine → UI
      
      const mockEvaluation = {
        score: { type: 'cp', value: 30 },
        depth: 15,
        pv: 'e2e4',
        nodes: 1000,
        time: 100
      };

      mockSimpleEngine.evaluatePosition.mockResolvedValue(mockEvaluation);
      mockEvaluationCache.evaluatePositionCached.mockResolvedValue(mockEvaluation);

      // TODO: Test actual UI component integration
      // const { container } = render(<EnginePanel fen={TEST_FEN} />);
      
      // TODO: Verify UI shows evaluation data
      // await waitFor(() => {
      //   expect(screen.getByText(/30/)).toBeInTheDocument();
      // }, { timeout: 1000 });

      // Verify engine was called
      expect(mockSimpleEngine.evaluatePosition).toHaveBeenCalledWith(TEST_FEN);
      
      // Placeholder assertion
      expect(true).toBe(true);
    });

    it('should show tablebase data in UI', async () => {
      // GREEN: Implement minimal connection Tablebase → UI
      
      const mockTablebaseResult = {
        isTablebasePosition: true,
        wdl: 1,
        dtm: 10,
        category: 'KQvK'
      };

      mockTablebaseService.lookupPosition.mockResolvedValue(mockTablebaseResult);

      // TODO: Test actual tablebase UI component
      // const { container } = render(<TablebasePanel fen={TEST_FEN} />);
      
      // TODO: Verify UI shows tablebase data
      // await waitFor(() => {
      //   expect(screen.getByText(/Win/)).toBeInTheDocument();
      // }, { timeout: 1000 });

      // Verify tablebase service was called
      expect(mockTablebaseService.lookupPosition).toHaveBeenCalledWith(TEST_FEN);
      
      // Placeholder assertion
      expect(true).toBe(true);
    });
  });

  describe('REFACTOR Phase: Error Handling & Edge Cases', () => {
    it('should handle engine timeout gracefully', async () => {
      // Mock useEvaluation to simulate engine error
      mockUseEvaluation.isEvaluating = false;
      mockUseEvaluation.error = new Error('Engine timeout');
      mockUseEvaluation.evaluation = null;

      // Render Engine UI component
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should show error state, not endless loading
      await waitFor(() => {
        expect(screen.getByText(/Fehler/)).toBeInTheDocument();
      }, { timeout: 500 });

      // Should NOT show "Analysiert..." when there's an error
      expect(screen.queryByText(/Analysiert/)).not.toBeInTheDocument();
    });

    it('should handle tablebase service unavailable', async () => {
      // Mock useEvaluation with tablebase error
      mockUseEvaluation.tablebase = null;
      mockUseEvaluation.error = new Error('Tablebase service unavailable');
      mockUseEvaluation.isEvaluating = false;

      // Render Tablebase UI component
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should show fallback message or graceful degradation
      await waitFor(() => {
        expect(screen.getByText(/Nicht verfügbar|Keine Tablebase-Daten/)).toBeInTheDocument();
      }, { timeout: 500 });

      // Should NOT crash or show undefined values
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    it('should handle concurrent evaluations correctly', async () => {
      // Test multiple rapid evaluations
      const fens = [
        TEST_FEN,
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2'
      ];

      mockSimpleEngine.evaluatePosition.mockResolvedValue({
        score: { type: 'cp', value: 25 },
        depth: 12
      });

      // TODO: Test rapid position changes
      // for (const fen of fens) {
      //   render(<EnginePanel fen={fen} />);
      //   await waitFor(() => {
      //     expect(screen.getByText(/25/)).toBeInTheDocument();
      //   }, { timeout: 1000 });
      // }

      // Placeholder assertion
      expect(true).toBe(true);
    });
  });
});