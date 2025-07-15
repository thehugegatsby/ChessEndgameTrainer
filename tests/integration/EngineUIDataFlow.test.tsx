/**
 * Integration Test: Engine UI Data Flow
 * Tests the complete flow from engine evaluation to UI display
 * Focus: Multi-PV engine moves and tablebase moves display
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SimpleEvaluationDisplay } from '@shared/components/training/SimpleEvaluationDisplay';

// Mock the evaluation hook
jest.mock('@shared/hooks/useEvaluation');

// Mock the SimpleEngine
jest.mock('@shared/lib/chess/engine/simple/SimpleEngine', () => ({
  getSimpleEngine: jest.fn(() => ({
    evaluatePositionMultiPV: jest.fn(),
    evaluatePosition: jest.fn(),
    terminate: jest.fn()
  }))
}));

// Mock tablebase service
jest.mock('@shared/services/TablebaseService', () => ({
  tablebaseService: {
    getTopMoves: jest.fn(),
    getEvaluation: jest.fn()
  }
}));

const TEST_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('Engine UI Integration - Multi-Move Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Engine Multi-PV Display', () => {
    it('should display 3 engine moves when multi-PV data is available', async () => {
      // Mock the useEvaluation hook
      const { useEvaluation } = require('@shared/hooks/useEvaluation');
      useEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 30,
          multiPvResults: [
            {
              san: 'e4',
              score: { type: 'cp', value: 30 },
              pv: ['e2e4', 'e7e5'],
              rank: 1,
              move: 'e2e4'
            },
            {
              san: 'd4',
              score: { type: 'cp', value: 25 },
              pv: ['d2d4', 'd7d5'],
              rank: 2,
              move: 'd2d4'
            },
            {
              san: 'Nf3',
              score: { type: 'cp', value: 20 },
              pv: ['g1f3', 'g8f6'],
              rank: 3,
              move: 'g1f3'
            }
          ]
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(<SimpleEvaluationDisplay fen={TEST_FEN} />);

      // Wait for the component to render
      await waitFor(() => {
        // Should display all 3 engine moves
        expect(screen.getByText('e4')).toBeInTheDocument();
        expect(screen.getByText('d4')).toBeInTheDocument();
        expect(screen.getByText('Nf3')).toBeInTheDocument();
        
        // Should display scores
        expect(screen.getByText('+0.30')).toBeInTheDocument();
        expect(screen.getByText('+0.25')).toBeInTheDocument();
        expect(screen.getByText('+0.20')).toBeInTheDocument();
      });
    });

    it('should display loading state when evaluating', async () => {
      const { useEvaluation } = require('@shared/hooks/useEvaluation');
      useEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: null,
        isEvaluating: true,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(<SimpleEvaluationDisplay fen={TEST_FEN} />);

      // Should show loading state
      expect(screen.getByText(/Analysiert.../)).toBeInTheDocument();
    });

    it('should display single engine move when multi-PV is not available', async () => {
      const { useEvaluation } = require('@shared/hooks/useEvaluation');
      useEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 30,
          multiPvResults: [
            {
              san: 'e4',
              score: { type: 'cp', value: 30 },
              pv: ['e2e4', 'e7e5'],
              rank: 1,
              move: 'e2e4'
            }
          ]
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(<SimpleEvaluationDisplay fen={TEST_FEN} />);

      await waitFor(() => {
        // Should display only 1 engine move
        expect(screen.getByText('e4')).toBeInTheDocument();
        expect(screen.getByText('+0.30')).toBeInTheDocument();
        
        // Should not display other moves
        expect(screen.queryByText('d4')).not.toBeInTheDocument();
        expect(screen.queryByText('Nf3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tablebase Move Display', () => {
    it('should display 3 tablebase moves when available', async () => {
      const { useEvaluation } = require('@shared/hooks/useEvaluation');
      useEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 0,
          tablebase: {
            isTablebasePosition: true,
            wdlAfter: 2,
            category: 'win',
            dtz: 15,
            topMoves: [
              {
                move: 'e1d1',
                san: 'Kd1',
                dtz: 15,
                dtm: 20,
                wdl: 2,
                category: 'win'
              },
              {
                move: 'e1f1',
                san: 'Kf1',
                dtz: 17,
                dtm: 22,
                wdl: 2,
                category: 'win'
              },
              {
                move: 'a1b1',
                san: 'Rb1',
                dtz: 19,
                dtm: 24,
                wdl: 2,
                category: 'win'
              }
            ]
          }
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(<SimpleEvaluationDisplay fen={TEST_FEN} />);

      await waitFor(() => {
        // Should display all 3 tablebase moves
        expect(screen.getByText('Kd1')).toBeInTheDocument();
        expect(screen.getByText('Kf1')).toBeInTheDocument();
        expect(screen.getByText('Rb1')).toBeInTheDocument();
        
        // Should display DTZ values
        expect(screen.getByText('DTZ 15')).toBeInTheDocument();
        expect(screen.getByText('DTZ 17')).toBeInTheDocument();
        expect(screen.getByText('DTZ 19')).toBeInTheDocument();
      });
    });

    it('should show no tablebase data when position is not in tablebase', async () => {
      const { useEvaluation } = require('@shared/hooks/useEvaluation');
      useEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 30,
          tablebase: undefined
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      render(<SimpleEvaluationDisplay fen={TEST_FEN} />);

      // Should show no tablebase data message
      expect(screen.getByText(/Keine Tablebase-Daten/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should fail test when moves are not shown despite data being available', async () => {
      const { useEvaluation } = require('@shared/hooks/useEvaluation');
      
      // Mock data with moves available
      useEvaluation.mockReturnValue({
        evaluations: [],
        lastEvaluation: {
          evaluation: 30,
          multiPvResults: [
            {
              san: 'e4',
              score: { type: 'cp', value: 30 },
              pv: ['e2e4', 'e7e5'],
              rank: 1,
              move: 'e2e4'
            },
            {
              san: 'd4',
              score: { type: 'cp', value: 25 },
              pv: ['d2d4', 'd7d5'],
              rank: 2,
              move: 'd2d4'
            },
            {
              san: 'Nf3',
              score: { type: 'cp', value: 20 },
              pv: ['g1f3', 'g8f6'],
              rank: 3,
              move: 'g1f3'
            }
          ]
        },
        isEvaluating: false,
        error: null,
        addEvaluation: jest.fn(),
        clearEvaluations: jest.fn()
      });

      // Mock a broken component that doesn't display moves
      const BrokenEngineCard = () => <div>🔧 Engine 🔄 Analysiert... Warte auf Analyse...</div>;
      
      render(<BrokenEngineCard />);

      // This test should fail because moves are not displayed
      await waitFor(() => {
        // Verify the broken state is shown
        expect(screen.getByText(/Analysiert... Warte auf Analyse.../)).toBeInTheDocument();
        
        // These assertions should fail, demonstrating the bug
        expect(() => screen.getByText('e4')).toThrow();
        expect(() => screen.getByText('d4')).toThrow();
        expect(() => screen.getByText('Nf3')).toThrow();
      });
    });
  });
});