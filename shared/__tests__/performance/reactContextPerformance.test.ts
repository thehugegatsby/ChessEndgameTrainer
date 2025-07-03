/**
 * Performance test for React Context optimization
 * Measures re-render performance before and after FEN-based state
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { TrainingProvider, useTraining } from '../../contexts/TrainingContext';

// Mock Chess.js
const mockChess = {
  move: jest.fn().mockReturnValue({ san: 'e4', from: 'e2', to: 'e4' }),
  fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'),
  history: jest.fn().mockReturnValue(['e4']),
  pgn: jest.fn().mockReturnValue('1. e4')
};

jest.mock('chess.js', () => ({
  Chess: jest.fn(() => mockChess)
}));

// Test component that uses TrainingContext
const TestComponent = () => {
  const { state, dispatch } = useTraining();
  
  React.useEffect(() => {
    // Simulate adding moves (current heavy approach)
    for (let i = 0; i < 10; i++) {
      dispatch({
        type: 'ADD_MOVE',
        payload: {
          san: `move${i}`,
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w'
        } as any
      });
    }
  }, [dispatch]);
  
  return (
    <div>
      <span data-testid="move-count">{state.moves.length}</span>
      <span data-testid="current-fen">{state.currentFen}</span>
    </div>
  );
};

describe('React Context Performance - BASELINE', () => {
  test('should measure current context performance with Move objects', async () => {
    console.log('🔍 BASELINE: React Context with Move Objects');
    
    const renderStart = performance.now();
    
    const { getByTestId, rerender } = render(
      <TrainingProvider>
        <TestComponent />
      </TrainingProvider>
    );
    
    const renderEnd = performance.now();
    const initialRenderTime = renderEnd - renderStart;
    
    // Measure re-render performance
    const rerenderStart = performance.now();
    
    await act(async () => {
      rerender(
        <TrainingProvider>
          <TestComponent />
        </TrainingProvider>
      );
    });
    
    const rerenderEnd = performance.now();
    const rerenderTime = rerenderEnd - rerenderStart;
    
    console.log('📊 BASELINE CONTEXT METRICS:');
    console.log(`  Initial Render: ${initialRenderTime.toFixed(2)}ms`);
    console.log(`  Re-render Time: ${rerenderTime.toFixed(2)}ms`);
    console.log(`  Move Objects: ${getByTestId('move-count').textContent}`);
    console.log(`  Context Size: ~${JSON.stringify({
      moves: Array(10).fill({ san: 'e4', from: 'e2', to: 'e4', piece: 'p', color: 'w' }),
      evaluations: [],
      currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }).length} chars`);
    
    // Store baseline metrics
    const baselineMetrics = {
      initialRenderTime,
      rerenderTime,
      moveCount: parseInt(getByTestId('move-count').textContent || '0'),
      contextComplexity: 'high' // Move objects with all properties
    };

    // Write metrics for comparison
    const fs = require('fs');
    const path = require('path');
    const metricsPath = path.join(__dirname, 'context-baseline-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(baselineMetrics, null, 2));

    expect(initialRenderTime).toBeGreaterThan(0);
    expect(rerenderTime).toBeGreaterThan(0);
  });

  test('should measure memory usage with complex state', () => {
    console.log('🧠 BASELINE: Memory Usage with Complex Objects');
    
    // Simulate large state with many Move objects
    const complexState = {
      moves: Array(100).fill({
        san: 'Nf3',
        from: 'g1',
        to: 'f3',
        piece: 'n',
        color: 'w',
        flags: 'n',
        captured: undefined
      }),
      evaluations: Array(100).fill({
        evaluation: 0.15,
        mateInMoves: undefined
      }),
      currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentPgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'
    };
    
    const stateSize = JSON.stringify(complexState).length;
    console.log(`📊 COMPLEX STATE METRICS:`);
    console.log(`  State Size: ${stateSize} characters`);
    console.log(`  Move Objects: ${complexState.moves.length}`);
    console.log(`  Evaluation Objects: ${complexState.evaluations.length}`);
    console.log(`  Estimated Memory: ~${(stateSize / 1024).toFixed(2)}KB`);
    
    expect(stateSize).toBeGreaterThan(10000); // Should be substantial
  });
});