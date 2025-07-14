/**
 * UNIT Tests for DualEvaluationPanel - Issue #49 TDD
 * 
 * Pure component tests - no external dependencies
 * Testing: Props → DOM output, CSS classes, rendering logic
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DualEvaluationPanel } from '@shared/components/training/DualEvaluationPanel';
import { useEvaluation } from '@shared/hooks/useEvaluation';

// Mock the useEvaluation hook for unit testing
jest.mock('@shared/hooks/useEvaluation');
const mockUseEvaluation = useEvaluation as jest.MockedFunction<typeof useEvaluation>;

describe('DualEvaluationPanel - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    
    it('should render dual evaluation grid layout', () => {
      // GIVEN: Basic mock data
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should have proper DOM structure
      expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
      expect(document.querySelector('.dual-evaluation-grid')).toBeInTheDocument();
    });

    it('should render engine and tablebase panels', () => {
      // GIVEN: Mock data
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should have both evaluation panels
      expect(screen.getByTestId('engine-evaluation-panel')).toBeInTheDocument();
      expect(screen.getByTestId('tablebase-evaluation-panel')).toBeInTheDocument();
      expect(screen.getByText('Engine-Bewertung')).toBeInTheDocument();
      expect(screen.getByText('Tablebase-Bewertung')).toBeInTheDocument();
    });

    it('should use proper dark theme styling without white backgrounds', () => {
      // GIVEN: Mock data
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should not have white/light backgrounds
      const enginePanel = screen.getByTestId('engine-evaluation-panel');
      const tablebasePanel = screen.getByTestId('tablebase-evaluation-panel');
      
      expect(enginePanel).not.toHaveClass('bg-gray-50', 'bg-blue-50', 'bg-white');
      expect(tablebasePanel).not.toHaveClass('bg-gray-50', 'bg-blue-50', 'bg-white');
    });
  });

  describe('Visibility Control', () => {
    
    it('should not render when isVisible is false', () => {
      // GIVEN: Component with isVisible=false
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders with isVisible=false
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={false}
        />
      );
      
      // THEN: Should not render anything
      expect(screen.queryByTestId('dual-evaluation-panel')).not.toBeInTheDocument();
    });

    it('should render when isVisible is true', () => {
      // GIVEN: Component with isVisible=true
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders with isVisible=true
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should render the panel
      expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    
    it('should display error message when evaluation fails', () => {
      // GIVEN: Evaluation error
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: 'Engine analysis failed',
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders with error
      render(
        <DualEvaluationPanel 
          fen="invalid-fen"
          isVisible={true}
        />
      );
      
      // THEN: Should show error message in engine panel
      expect(screen.getByText('Engine analysis failed')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    
    it('should show loading indicator when evaluating', () => {
      // GIVEN: Evaluating state
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: true,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders while evaluating
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should show loading indicator
      expect(screen.getByText('Analysiert...')).toBeInTheDocument();
    });

    it('should show waiting state when no evaluation available', () => {
      // GIVEN: No evaluation data
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: null,
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders without data
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/8/8 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should show waiting message
      expect(screen.getByText('Warte auf Analyse...')).toBeInTheDocument();
    });
  });

  describe('Top-3-Züge Feature - TDD Red Phase', () => {
    
    it('should render top 3 engine moves when evaluation is available', () => {
      // GIVEN: Mock hook returns valid engine evaluation with top 3 moves
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          engine: {
            bestMove: 'e2e4',
            evaluation: { value: 50, type: 'cp' },
            principalVariation: ['e2e4', 'e7e5', 'g1f3'],
            top3: [
              { move: 'e2e4', score: { value: 50, type: 'cp' }, san: 'e4' },
              { move: 'd2d4', score: { value: 45, type: 'cp' }, san: 'd4' },
              { move: 'g1f3', score: { value: 40, type: 'cp' }, san: 'Nf3' }
            ]
          },
          tablebase: null
        },
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should display the top 3 moves and scores in engine panel
      const enginePanel = screen.getByTestId('engine-evaluation-panel');
      
      // Top-3 moves should be visible
      expect(enginePanel).toHaveTextContent('e4');
      expect(enginePanel).toHaveTextContent('+0.50');
      expect(enginePanel).toHaveTextContent('d4');
      expect(enginePanel).toHaveTextContent('+0.45');
      expect(enginePanel).toHaveTextContent('Nf3');
      expect(enginePanel).toHaveTextContent('+0.40');
      
      // Should have proper structure for top 3 moves
      expect(screen.getByText('Top 3 Engine-Züge')).toBeInTheDocument();
    });

    it('should render top 3 tablebase moves when tablebase data is available', () => {
      // GIVEN: Mock hook returns valid tablebase evaluation with top 3 moves
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: {
          fen: '8/8/8/8/8/8/3k4/4K3 w - - 0 1', // Simple endgame
          engine: null,
          tablebase: {
            bestMove: 'Kd2',
            wdl: 1, // Win
            dtz: 15, // Distance to zero
            top3: [
              { move: 'Kd2', category: 'win', san: 'Kd2', dtz: 15 },
              { move: 'Ke2', category: 'draw', san: 'Ke2', dtz: 0 },
              { move: 'Kf2', category: 'loss', san: 'Kf2', dtz: -8 }
            ]
          }
        },
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/3k4/4K3 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should display tablebase moves and categories
      const tablebasePanel = screen.getByTestId('tablebase-evaluation-panel');
      
      // Top-3 tablebase moves should be visible
      expect(tablebasePanel).toHaveTextContent('Kd2');
      expect(tablebasePanel).toHaveTextContent('Gewinn');
      expect(tablebasePanel).toHaveTextContent('Ke2');
      expect(tablebasePanel).toHaveTextContent('Remis');
      expect(tablebasePanel).toHaveTextContent('Kf2');
      expect(tablebasePanel).toHaveTextContent('Verlust');
      
      // Should have proper structure for top 3 moves
      expect(screen.getByText('Top 3 Tablebase-Züge')).toBeInTheDocument();
    });

    it('should show "Keine Tablebase-Daten" when tablebase data is not available', () => {
      // GIVEN: Engine data available but no tablebase data
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          engine: {
            bestMove: 'e2e4',
            evaluation: { value: 50, type: 'cp' },
            top3: [
              { move: 'e2e4', score: { value: 50, type: 'cp' }, san: 'e4' }
            ]
          },
          tablebase: null // No tablebase data for opening position
        },
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should show no tablebase data message
      const tablebasePanel = screen.getByTestId('tablebase-evaluation-panel');
      expect(tablebasePanel).toHaveTextContent('Keine Tablebase-Daten');
    });

    it('should display both engine and tablebase data when both are available', () => {
      // GIVEN: Both engine and tablebase data available
      mockUseEvaluation.mockReturnValue({
        lastEvaluation: {
          fen: '8/8/8/8/8/8/3k4/4K3 w - - 0 1',
          engine: {
            bestMove: 'Kd2',
            evaluation: { value: 200, type: 'cp' },
            top3: [
              { move: 'Kd2', score: { value: 200, type: 'cp' }, san: 'Kd2' }
            ]
          },
          tablebase: {
            bestMove: 'Kd2',
            wdl: 1,
            top3: [
              { move: 'Kd2', category: 'win', san: 'Kd2' }
            ]
          }
        },
        isEvaluating: false,
        error: null,
        evaluations: [],
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen="8/8/8/8/8/8/3k4/4K3 w - - 0 1"
          isVisible={true}
        />
      );
      
      // THEN: Should display both engine and tablebase data
      const enginePanel = screen.getByTestId('engine-evaluation-panel');
      const tablebasePanel = screen.getByTestId('tablebase-evaluation-panel');
      
      // Engine data
      expect(enginePanel).toHaveTextContent('Kd2');
      expect(enginePanel).toHaveTextContent('+2.00');
      
      // Tablebase data
      expect(tablebasePanel).toHaveTextContent('Kd2');
      expect(tablebasePanel).toHaveTextContent('Gewinn');
    });
  });
});