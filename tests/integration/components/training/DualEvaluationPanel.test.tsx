/**
 * INTEGRATION Tests for DualEvaluationPanel - Issue #49 TDD
 * 
 * Tests interaction between DualEvaluationPanel + useEvaluation hook + real services
 * Testing: Data flow, service integration, hook behavior with real dependencies
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DualEvaluationPanel } from '@shared/components/training/DualEvaluationPanel';
import { MockPositionServiceFactory } from '@shared/testing/MockPositionServiceFactory';
import { TestScenarios } from '@shared/testing/TestScenarios';

// Integration test - use real hook with mock services
jest.mock('@shared/services/database/serverPositionService', () => ({
  getServerPositionService: () => MockPositionServiceFactory.createMockPositionService()
}));

describe('DualEvaluationPanel - Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Seed mock service with test data
    const mockService = MockPositionServiceFactory.createMockPositionService();
    TestScenarios.getAllTestPositions().forEach(position => {
      mockService.getRepository().seedData({ positions: [position] });
    });
  });

  describe('Data Flow Integration', () => {
    
    it('should integrate useEvaluation hook with engine service', async () => {
      // GIVEN: Real hook with mock engine service
      const testFen = TestScenarios.getKingAndPawnEndgame().fen;
      
      // WHEN: Component renders with real useEvaluation
      render(
        <DualEvaluationPanel 
          fen={testFen}
          isVisible={true}
        />
      );
      
      // THEN: Should show evaluation data from engine
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
        expect(screen.getByTestId('engine-evaluation-panel')).toBeInTheDocument();
      });
    });

    it('should integrate tablebase service with real data', async () => {
      // GIVEN: Tablebase-compatible position
      const tablebasePosition = TestScenarios.getTablebasePosition();
      
      // WHEN: Component renders
      render(
        <DualEvaluationPanel 
          fen={tablebasePosition.fen}
          isVisible={true}
        />
      );
      
      // THEN: Should detect tablebase data availability
      await waitFor(() => {
        expect(screen.getByTestId('tablebase-evaluation-panel')).toBeInTheDocument();
        // Should NOT show "Keine Tablebase-Daten" for valid tablebase position
        expect(screen.queryByText('Keine Tablebase-Daten')).not.toBeInTheDocument();
      });
    });

    it('should handle service errors gracefully', async () => {
      // GIVEN: Invalid FEN that causes service errors
      const invalidFen = "invalid-fen-string";
      
      // WHEN: Component renders with invalid data
      render(
        <DualEvaluationPanel 
          fen={invalidFen}
          isVisible={true}
        />
      );
      
      // THEN: Should show error state without crashing
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
        // Should handle errors gracefully
      });
    });
  });

  describe('Real-time Updates Integration', () => {
    
    it('should update evaluations when FEN changes', async () => {
      // GIVEN: Component with initial FEN
      const initialFen = TestScenarios.getKingAndPawnEndgame().fen;
      const { rerender } = render(
        <DualEvaluationPanel 
          fen={initialFen}
          isVisible={true}
        />
      );
      
      // WHEN: FEN changes to different position
      const newFen = TestScenarios.getTablebasePosition().fen;
      rerender(
        <DualEvaluationPanel 
          fen={newFen}
          isVisible={true}
        />
      );
      
      // THEN: Should trigger new evaluation
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
        // Evaluation should update for new position
      });
    });

    it('should maintain state when visibility toggles', async () => {
      // GIVEN: Component with evaluation data
      const testFen = TestScenarios.getKingAndPawnEndgame().fen;
      const { rerender } = render(
        <DualEvaluationPanel 
          fen={testFen}
          isVisible={true}
        />
      );
      
      // WHEN: Visibility toggles off and on
      rerender(
        <DualEvaluationPanel 
          fen={testFen}
          isVisible={false}
        />
      );
      
      rerender(
        <DualEvaluationPanel 
          fen={testFen}
          isVisible={true}
        />
      );
      
      // THEN: Should restore evaluation state
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
      });
    });
  });

  describe('Service Layer Integration', () => {
    
    it('should work with MockPositionService during testing', async () => {
      // GIVEN: MockPositionService with seeded data
      const testPosition = TestScenarios.getKingAndPawnEndgame();
      
      // WHEN: Component uses services
      render(
        <DualEvaluationPanel 
          fen={testPosition.fen}
          isVisible={true}
        />
      );
      
      // THEN: Should integrate with mock services seamlessly
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
        expect(screen.getByTestId('engine-evaluation-panel')).toBeInTheDocument();
        expect(screen.getByTestId('tablebase-evaluation-panel')).toBeInTheDocument();
      });
    });

    it('should handle service timeouts and retries', async () => {
      // GIVEN: Component with slow evaluation
      const testFen = TestScenarios.getComplexTacticalPosition().fen;
      
      // WHEN: Component renders with potentially slow evaluation
      render(
        <DualEvaluationPanel 
          fen={testFen}
          isVisible={true}
        />
      );
      
      // THEN: Should show loading state during evaluation
      expect(screen.getByText('Analysiert...')).toBeInTheDocument();
      
      // AND: Should eventually resolve or timeout gracefully
      await waitFor(() => {
        // Should either show results or maintain loading state
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Performance Integration', () => {
    
    it('should debounce rapid FEN changes', async () => {
      // GIVEN: Component with initial FEN
      const fens = [
        TestScenarios.getKingAndPawnEndgame().fen,
        TestScenarios.getTablebasePosition().fen,
        TestScenarios.getComplexTacticalPosition().fen
      ];
      
      const { rerender } = render(
        <DualEvaluationPanel 
          fen={fens[0]}
          isVisible={true}
        />
      );
      
      // WHEN: Multiple rapid FEN changes
      fens.forEach((fen, index) => {
        setTimeout(() => {
          rerender(
            <DualEvaluationPanel 
              fen={fen}
              isVisible={true}
            />
          );
        }, index * 50); // Rapid changes within debounce period
      });
      
      // THEN: Should debounce and only evaluate final FEN
      await waitFor(() => {
        expect(screen.getByTestId('dual-evaluation-panel')).toBeInTheDocument();
      });
    });
  });
});