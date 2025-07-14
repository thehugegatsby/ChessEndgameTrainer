/**
 * REAL Integration Test for DualEvaluationPanel - Issue #49 Outside-In TDD
 * 
 * This test uses the REAL useEvaluation hook and will FAIL until we implement:
 * 1. Multi-PV engine service in useEvaluation hook
 * 2. Tablebase top moves service in useEvaluation hook
 * 
 * This is proper TDD - tests should fail first, then drive implementation.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DualEvaluationPanel } from '@shared/components/training/DualEvaluationPanel';

// NO MOCKING - use real useEvaluation hook to expose missing functionality
describe('DualEvaluationPanel - REAL Integration Test', () => {
  
  describe('Top-3 Engine Moves Integration (EXPECTED TO FAIL)', () => {
    
    it('should display Top-3 Engine moves like Lichess: Kd7 Matt in 17, Kd8 Matt in 19, Tc4 Matt in 21', async () => {
      // GIVEN: Real mate position that should show Top-3 engine moves
      const matePositionFen = "8/3k4/8/8/8/2R5/2K5/8 w - - 0 1"; // Mate in X position
      
      // WHEN: Component renders with REAL useEvaluation hook
      render(
        <DualEvaluationPanel 
          fen={matePositionFen}
          isVisible={true}
        />
      );
      
      // THEN: Should display Top-3 engine moves (WILL FAIL until we implement Multi-PV)
      await waitFor(() => {
        // Check for Top-3 header
        expect(screen.getByText('Top 3 Engine-Züge')).toBeInTheDocument();
        
        // Check for specific moves user wants to see
        expect(screen.getByText('Kd7')).toBeInTheDocument();
        expect(screen.getByText('Matt in 17')).toBeInTheDocument();
        
        expect(screen.getByText('Kd8')).toBeInTheDocument();
        expect(screen.getByText('Matt in 19')).toBeInTheDocument();
        
        expect(screen.getByText('Tc4')).toBeInTheDocument();
        expect(screen.getByText('Matt in 21')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Top-3 Tablebase Moves Integration (EXPECTED TO FAIL)', () => {
    
    it('should display Top-3 Tablebase moves like Lichess: Kd7 DTZ 10 DTM 30, etc.', async () => {
      // GIVEN: Real tablebase position that should show Top-3 tablebase moves
      const tablebaseFen = "8/3k4/8/8/8/2R5/2K5/8 w - - 0 1"; // 7-piece tablebase position
      
      // WHEN: Component renders with REAL useEvaluation hook
      render(
        <DualEvaluationPanel 
          fen={tablebaseFen}
          isVisible={true}
        />
      );
      
      // THEN: Should display Top-3 tablebase moves (WILL FAIL until we implement tablebase multi-move)
      await waitFor(() => {
        // Check for Top-3 header
        expect(screen.getByText('Top 3 Tablebase-Züge')).toBeInTheDocument();
        
        // Check for specific moves user wants to see
        expect(screen.getByText('Kd7')).toBeInTheDocument();
        expect(screen.getByText('DTZ 10')).toBeInTheDocument();
        expect(screen.getByText('DTM 30')).toBeInTheDocument();
        
        expect(screen.getByText('Kd8')).toBeInTheDocument();
        expect(screen.getByText('DTZ 12')).toBeInTheDocument();
        expect(screen.getByText('DTM 34')).toBeInTheDocument();
        
        expect(screen.getByText('Te1')).toBeInTheDocument();
        expect(screen.getByText('DTZ 10')).toBeInTheDocument();
        expect(screen.getByText('DTM 38')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Current Basic Functionality (SHOULD PASS)', () => {
    
    it('should render basic evaluation data that currently exists', async () => {
      // GIVEN: Basic position
      const basicFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen={basicFen}
          isVisible={true}
        />
      );
      
      // THEN: Should show basic evaluation that currently works
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
        expect(screen.getByTestId('engine-evaluation-panel')).toBeInTheDocument();
        expect(screen.getByTestId('tablebase-evaluation-panel')).toBeInTheDocument();
        expect(screen.getByText('Engine-Bewertung')).toBeInTheDocument();
        expect(screen.getByText('Tablebase-Bewertung')).toBeInTheDocument();
      });
    });
  });
});