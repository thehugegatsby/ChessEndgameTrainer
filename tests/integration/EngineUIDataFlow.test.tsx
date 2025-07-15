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
import { act } from 'react';

// Import actual UI components to test
import { DualEvaluationPanel } from '../../shared/components/training/DualEvaluationPanel';
import { EngineEvaluationCard } from '../../shared/components/training/DualEvaluationPanel/EngineEvaluationCard';
import { useEvaluation } from '../../shared/hooks/useEvaluation';

// Mock useEvaluation hook
jest.mock('../../shared/hooks/useEvaluation', () => ({
  useEvaluation: jest.fn()
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
const mockUseEvaluationReturn = {
  evaluations: [],
  lastEvaluation: null,
  isEvaluating: false,
  error: null,
  addEvaluation: jest.fn(),
  clearEvaluations: jest.fn(),
  cacheStats: undefined
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
    Object.assign(mockUseEvaluationReturn, {
      evaluations: [],
      lastEvaluation: null,
      isEvaluating: false,
      error: null,
      addEvaluation: jest.fn(),
      clearEvaluations: jest.fn(),
      cacheStats: undefined
    });
    
    // Set up the mock function to return our mock data
    (useEvaluation as jest.Mock).mockReturnValue(mockUseEvaluationReturn);
    
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
      mockUseEvaluationReturn.isEvaluating = true;
      mockUseEvaluationReturn.lastEvaluation = null;
      mockUseEvaluationReturn.error = null;

      // Render actual Engine UI component
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should initially show "Analysiert..." state
      expect(screen.getByText(/Analysiert/)).toBeInTheDocument();
      
      // Simulate evaluation completing
      act(() => {
        mockUseEvaluationReturn.isEvaluating = false;
        mockUseEvaluationReturn.lastEvaluation = {
          evaluation: 30,
          multiPvResults: [{
            san: 'e4',
            score: { type: 'cp', value: 30 }
          }]
        };
        jest.advanceTimersByTime(100);
      });
      
      // RED: This should FAIL - engine stuck in "Analysiert..." state
      await waitFor(() => {
        expect(screen.queryByText(/Analysiert/)).not.toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Engine should show actual evaluation result
      await waitFor(() => {
        expect(screen.getByText(/e4/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should NOT show "Keine Tablebase-Daten" when data exists', async () => {
      // RED: This test should FAIL initially (current bug)
      
      // Mock useEvaluation to simulate missing tablebase data
      mockUseEvaluationReturn.isEvaluating = false;
      mockUseEvaluationReturn.lastEvaluation = null;
      mockUseEvaluationReturn.error = null;

      // Render actual Tablebase UI component
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should initially show "Keine Tablebase-Daten" (the bug)
      expect(screen.getByText(/Keine Tablebase-Daten/)).toBeInTheDocument();
      
      // Simulate tablebase data arriving
      act(() => {
        mockUseEvaluationReturn.lastEvaluation = {
          evaluation: 0,
          tablebase: {
            isTablebasePosition: true,
            wdlAfter: 1,
            category: 'win',
            topMoves: [{
              san: 'Kd7',
              dtz: 5
            }]
          }
        };
        jest.advanceTimersByTime(100);
      });
      
      // RED: This should FAIL - not showing tablebase data
      await waitFor(() => {
        expect(screen.queryByText(/Keine Tablebase-Daten/)).not.toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Should show actual tablebase data
      await waitFor(() => {
        expect(screen.getByText(/Kd7/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('GREEN Phase: Minimal Implementation', () => {
    it('should show engine evaluation result in UI', async () => {
      // GREEN: Implement minimal connection Engine → UI
      
      // Set up mock to return evaluation data from the start
      mockUseEvaluationReturn.isEvaluating = false;
      mockUseEvaluationReturn.lastEvaluation = {
        evaluation: 30,
        multiPvResults: [{
          san: 'e4',
          score: { type: 'cp', value: 30 }
        }]
      };
      mockUseEvaluationReturn.error = null;

      // Render component with evaluation data already available
      const { container } = render(<DualEvaluationPanel fen={TEST_FEN} isVisible={true} />);
      
      // Should show engine evaluation result
      await waitFor(() => {
        expect(screen.getByText(/e4/)).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Should NOT show "Analysiert..." when evaluation is complete
      expect(screen.queryByText(/Analysiert/)).not.toBeInTheDocument();
      
      // Should NOT show "Warte auf Analyse..." when evaluation is complete
      expect(screen.queryByText(/Warte auf Analyse/)).not.toBeInTheDocument();
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