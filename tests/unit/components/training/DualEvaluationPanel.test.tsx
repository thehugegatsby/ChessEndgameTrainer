/**
 * Unit tests for DualEvaluationPanel component
 * Tests for bug #14: Engine moves not showing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DualEvaluationPanel } from '@shared/components/training/DualEvaluationPanel';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { useBatchMoveQuality } from '@shared/hooks/useBatchMoveQuality';

// Mock the hooks
jest.mock('@shared/hooks/useEvaluation');
jest.mock('@shared/hooks/useBatchMoveQuality');
jest.mock('@shared/components/tablebase/TablebasePanel', () => ({
  TablebasePanel: () => (
    <div data-testid="tablebase-panel">TablebasePanel</div>
  )
}));
jest.mock('@shared/components/analysis/MoveQualityDisplay', () => ({
  MoveQualityDisplay: () => (
    <span data-testid="move-quality">MoveQuality</span>
  )
}));

describe('DualEvaluationPanel', () => {
  const mockUseEvaluation = useEvaluation as jest.MockedFunction<typeof useEvaluation>;
  const mockUseBatchMoveQuality = useBatchMoveQuality as jest.MockedFunction<typeof useBatchMoveQuality>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for batch move quality
    mockUseBatchMoveQuality.mockReturnValue({
      results: new Map(),
      isLoading: false,
      error: null,
      progress: { completed: 0, total: 0, percentage: 0 },
      analyzeMoveBatch: jest.fn(),
      clearResults: jest.fn()
    });
  });

  describe('Engine moves display (Bug #14)', () => {
    it('should display engine moves when multiPvResults are available', async () => {
      // Mock evaluation with multiPvResults
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 150,
          multiPvResults: [
            { move: 'e2e4', san: 'e4', score: { type: 'cp', value: 150 }, pv: ['e2e4'], rank: 1 },
            { move: 'g1f3', san: 'Nf3', score: { type: 'cp', value: 120 }, pv: ['g1f3'], rank: 2 },
            { move: 'd2d4', san: 'd4', score: { type: 'cp', value: 100 }, pv: ['d2d4'], rank: 3 }
          ]
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );

      // Check that engine section is present
      expect(screen.getByTestId('engine-evaluation-panel')).toBeInTheDocument();
      
      // Check that engine moves are displayed
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
      expect(screen.getByText('d4')).toBeInTheDocument();
      
      // Check that scores are displayed
      expect(screen.getByText('+1.50')).toBeInTheDocument();
      expect(screen.getByText('+1.20')).toBeInTheDocument();
      expect(screen.getByText('+1.00')).toBeInTheDocument();
      
      // Should NOT show "Warte auf Multi-PV Analyse..."
      expect(screen.queryByText('Warte auf Multi-PV Analyse...')).not.toBeInTheDocument();
    });

    it('should show waiting message when multiPvResults is empty', () => {
      // Mock evaluation without multiPvResults
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 0,
          multiPvResults: [] // Empty array
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );

      // Should show waiting message
      expect(screen.getByText('Warte auf Multi-PV Analyse...')).toBeInTheDocument();
    });

    it('should show waiting message when multiPvResults is undefined', () => {
      // Mock evaluation without multiPvResults property
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 0,
          // multiPvResults is undefined
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );

      // Should show waiting message
      expect(screen.getByText('Warte auf Multi-PV Analyse...')).toBeInTheDocument();
    });

    it('should handle mate scores correctly', () => {
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 0,
          multiPvResults: [
            { move: 'd1h5', san: 'Qh5', score: { type: 'mate', value: 3 }, pv: ['d1h5'], rank: 1 },
            { move: 'd1f3', san: 'Qf3', score: { type: 'mate', value: 5 }, pv: ['d1f3'], rank: 2 }
          ]
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );

      // Check mate notation
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('should show analyzing message when isEvaluating is true', () => {
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: null,
        isEvaluating: true,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );

      // Should show analyzing message
      expect(screen.getByText('🔄 Analysiert...')).toBeInTheDocument();
    });

    it('should display error message when error occurs', () => {
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: null,
        isEvaluating: false,
        error: 'Engine initialization failed',
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );

      // Should show error message
      expect(screen.getByText('❌ Engine initialization failed')).toBeInTheDocument();
    });
  });

  describe('Component visibility', () => {
    it('should not render when isVisible is false', () => {
      mockUseEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      const { container } = render(
        <DualEvaluationPanel
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});