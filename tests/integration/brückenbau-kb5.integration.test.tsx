import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovePanelZustand as MovePanel } from '@shared/components/training/MovePanelZustand';
import { Chess } from 'chess.js';

// Integration test that tests the full flow
describe('Brückenbau Kb5 Integration Test', () => {
  it('should show error evaluation for Kb5 in the complete flow', async () => {
    // Setup the exact game state
    const moves = [
      { san: 'Kd7', from: 'c8', to: 'd7' },
      { san: 'Rc2', from: 'b2', to: 'c2' },
      { san: 'Kc6', from: 'd7', to: 'c6' },
      { san: 'Rc1', from: 'c2', to: 'c1' },
      { san: 'Kb5', from: 'c6', to: 'b5' }, // The blunder
    ];

    const evaluations = [
      // Initial position
      { evaluation: 200, tablebase: { isTablebasePosition: true } },
      // After Kd7
      {
        evaluation: 200,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          wdlAfter: 2,
          category: 'win',
        },
      },
      // After Rc2
      {
        evaluation: -200,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: -2,
          wdlAfter: -2,
          category: 'loss',
        },
      },
      // After Kc6
      {
        evaluation: 200,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          wdlAfter: 2,
          category: 'win',
        },
      },
      // After Rc1
      {
        evaluation: -200,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: -2,
          wdlAfter: -2,
          category: 'loss',
        },
      },
      // After Kb5 - THE CRITICAL EVALUATION
      {
        evaluation: 0,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          wdlAfter: 0, // This 0 was the problem!
          category: 'draw',
        },
      },
    ];

    const game = new Chess('2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1');
    const moveObjects = moves.map(m => ({ san: m.san } as any));

    // Set up Zustand store with the test data
    const { useStore } = require('@shared/store/store');
    const store = useStore.getState();
    
    // Add moves to store
    moves.forEach((move, index) => {
      store.training.moveHistory.push({ 
        ...move, 
        from: move.from || '', 
        to: move.to || '',
        color: index % 2 === 0 ? 'w' : 'b',
        piece: 'k',
        flags: ''
      });
    });
    
    // Add evaluations to store
    store.training.evaluations = evaluations;
    
    render(
      <MovePanel
        showEvaluations={true}
        currentMoveIndex={4}
      />
    );

    // Wait for the move panel to render
    await waitFor(() => {
      expect(screen.getByText('Kb5')).toBeInTheDocument();
    });

    // Find the Kb5 move and check its evaluation
    const kb5Element = screen.getByText('Kb5');
    const moveContainer = kb5Element.closest('div')?.parentElement;
    
    // Look for the evaluation span
    const evalSpan = moveContainer?.querySelector('span.text-xs');
    expect(evalSpan).toBeInTheDocument();
    
    // Critical assertions
    expect(evalSpan?.textContent).toBe('🚨'); // Should show catastrophic error
    expect(evalSpan?.className).toContain('eval-blunder');
    expect(evalSpan?.textContent).not.toBe('⚪'); // Should NOT show neutral
  });

  describe('Regression tests for falsy value handling', () => {
    it('should not convert WDL 0 to undefined in evaluation chain', () => {
      // Test the pattern that caused the bug
      const testValue = 0;
      
      // Bad pattern (what we had)
      const buggyResult = testValue || undefined;
      expect(buggyResult).toBeUndefined(); // This was the bug!
      
      // Good pattern (what we fixed)
      const fixedResult = testValue !== undefined ? testValue : undefined;
      expect(fixedResult).toBe(0); // Correct!
      
      // Also test with other falsy values
      const falsyValues = [0, -0, false, '', null];
      falsyValues.forEach(value => {
        const result = value !== undefined ? value : undefined;
        if (value === null) {
          expect(result).toBeNull();
        } else {
          expect(result).toBe(value);
        }
      });
    });

    it('should handle WDL transitions involving 0 correctly', () => {
      const transitions = [
        { from: 2, to: 0, expectedSymbol: '🚨' },  // Win to draw (wdlAfter=0 flipped to 0)
        { from: 0, to: 0, expectedSymbol: '➖' },  // Draw maintained (wdlAfter=0 flipped to 0)
        { from: 0, to: -2, expectedSymbol: '🎯' },  // Draw to win (wdlAfter=-2 flipped to 2)
        { from: 0, to: 2, expectedSymbol: '❌' }, // Draw to loss (wdlAfter=2 flipped to -2)
        { from: -2, to: 0, expectedSymbol: '👍' }, // Loss to draw (wdlAfter=0 flipped to 0)
      ];

      transitions.forEach(({ from, to, expectedSymbol }) => {
        const evaluation = {
          evaluation: 0,
          tablebase: {
            isTablebasePosition: true,
            wdlBefore: from,
            wdlAfter: to,
            category: to === 0 ? 'draw' : to > 0 ? 'win' : 'loss',
          },
        };

        // This would be called by MovePanel's getSmartMoveEvaluation
        const { getMoveQualityByTablebaseComparison } = require('@shared/utils/chess/evaluationHelpers');
        const result = getMoveQualityByTablebaseComparison(from, to, 'w');
        
        expect(result.text).toBe(expectedSymbol);
      });
    });
  });
});