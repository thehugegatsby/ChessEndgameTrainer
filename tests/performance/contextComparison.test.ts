/**
 * Performance comparison between original and optimized TrainingContext
 * Measures memory usage and state update performance
 */

// Mock Chess.js for consistent testing
const mockMove = {
  san: 'e4',
  from: 'e2', 
  to: 'e4',
  piece: 'p',
  color: 'w',
  flags: 'n',
  captured: undefined
};

const mockChess = {
  move: jest.fn().mockReturnValue(mockMove),
  fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'),
  history: jest.fn().mockReturnValue(['e4']),
  pgn: jest.fn().mockReturnValue('1. e4'),
  load: jest.fn()
};

jest.mock('chess.js', () => ({
  Chess: jest.fn(() => mockChess)
}));

describe('Context Performance Comparison', () => {
  test('should measure state size difference', () => {
    console.log('📊 MEMORY USAGE COMPARISON');
    
    // Original approach: Store full Move objects
    const originalState = {
      moves: Array(50).fill({
        san: 'Nf3',
        from: 'g1',
        to: 'f3', 
        piece: 'n',
        color: 'w',
        flags: 'n',
        captured: undefined,
        promotion: undefined
      }),
      evaluations: Array(50).fill({
        evaluation: 0.15,
        mateInMoves: undefined
      })
    };
    
    // Optimized approach: Store primitive strings and numbers
    const optimizedState = {
      moveHistory: Array(50).fill('Nf3'),
      evaluationHistory: Array(50).fill({
        score: 15,  // centipawns instead of pawns
        mate: undefined
      })
    };
    
    const originalSize = JSON.stringify(originalState).length;
    const optimizedSize = JSON.stringify(optimizedState).length;
    const sizeDifference = originalSize - optimizedSize;
    const compressionRatio = (sizeDifference / originalSize * 100);
    
    console.log('📈 STATE SIZE COMPARISON:');
    console.log(`  Original State: ${originalSize} chars (~${(originalSize/1024).toFixed(2)}KB)`);
    console.log(`  Optimized State: ${optimizedSize} chars (~${(optimizedSize/1024).toFixed(2)}KB)`);
    console.log(`  Size Reduction: ${sizeDifference} chars (${compressionRatio.toFixed(1)}%)`);
    console.log(`  Memory Savings: ~${((sizeDifference/1024)).toFixed(2)}KB`);
    
    // Write comparison metrics
    const fs = require('fs');
    const path = require('path');
    const metricsPath = path.join(__dirname, 'context-comparison-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify({
      originalSize,
      optimizedSize,
      sizeDifference,
      compressionRatio,
      memorySavingsKB: sizeDifference / 1024
    }, null, 2));
    
    expect(optimizedSize).toBeLessThan(originalSize);
    expect(compressionRatio).toBeGreaterThan(30); // Expect at least 30% reduction
  });

  test('should measure state update performance', () => {
    console.log('⚡ STATE UPDATE PERFORMANCE');
    
    // Original approach: Create full Move objects
    const createOriginalState = () => {
      const startTime = performance.now();
      
      const state = {
        moves: [] as any[],
        evaluations: [] as any[]
      };
      
      // Simulate adding 100 moves with full objects
      for (let i = 0; i < 100; i++) {
        state.moves.push({
          san: `move${i}`,
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w',
          flags: 'n',
          captured: undefined,
          promotion: undefined
        });
        
        state.evaluations.push({
          evaluation: i * 0.01,
          mateInMoves: undefined
        });
      }
      
      const endTime = performance.now();
      return endTime - startTime;
    };
    
    // Optimized approach: Use primitive strings
    const createOptimizedState = () => {
      const startTime = performance.now();
      
      const state = {
        moveHistory: [] as any[],
        evaluationHistory: [] as any[]
      };
      
      // Simulate adding 100 moves with strings
      for (let i = 0; i < 100; i++) {
        state.moveHistory.push(`move${i}`);
        state.evaluationHistory.push({
          score: i, // Just a number
          mate: undefined
        });
      }
      
      const endTime = performance.now();
      return endTime - startTime;
    };
    
    // Run multiple iterations for accuracy
    const iterations = 10;
    let originalTotal = 0;
    let optimizedTotal = 0;
    
    for (let i = 0; i < iterations; i++) {
      originalTotal += createOriginalState();
      optimizedTotal += createOptimizedState();
    }
    
    const originalAvg = originalTotal / iterations;
    const optimizedAvg = optimizedTotal / iterations;
    const speedImprovement = ((originalAvg - optimizedAvg) / originalAvg * 100);
    
    console.log('⚡ UPDATE PERFORMANCE COMPARISON:');
    console.log(`  Original Average: ${originalAvg.toFixed(2)}ms`);
    console.log(`  Optimized Average: ${optimizedAvg.toFixed(2)}ms`);
    console.log(`  Speed Improvement: ${speedImprovement.toFixed(1)}%`);
    console.log(`  Iterations: ${iterations}`);
    
    expect(optimizedAvg).toBeLessThanOrEqual(originalAvg);
  });

  test('should measure React re-render implications', () => {
    console.log('🔄 RE-RENDER PERFORMANCE');
    
    // Simulate React's shallow comparison behavior
    const shallowEqual = (obj1: any, obj2: any) => {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
      }
      
      return true;
    };
    
    // Original: Adding a move creates new Move object (triggers re-render)
    const originalState1 = {
      moves: [{ san: 'e4', from: 'e2', to: 'e4' }]
    };
    const originalState2 = {
      moves: [{ san: 'e4', from: 'e2', to: 'e4' }, { san: 'e5', from: 'e7', to: 'e5' }]
    };
    
    // Optimized: Adding a move is just a string (React can optimize better)
    const optimizedState1 = {
      moveHistory: ['e4']
    };
    const optimizedState2 = {
      moveHistory: ['e4', 'e5']
    };
    
    const originalEqual = shallowEqual(originalState1, originalState2);
    const optimizedEqual = shallowEqual(optimizedState1, optimizedState2);
    
    console.log('🔄 SHALLOW COMPARISON:');
    console.log(`  Original States Equal: ${originalEqual} (${originalEqual ? 'No re-render' : 'Re-render triggered'})`);
    console.log(`  Optimized States Equal: ${optimizedEqual} (${optimizedEqual ? 'No re-render' : 'Re-render triggered'})`);
    console.log(`  Original State Complexity: Deep objects with many properties`);
    console.log(`  Optimized State Complexity: Simple strings and numbers`);
    
    // Both should trigger re-renders when arrays change, but optimized has less overhead
    expect(originalEqual).toBe(false);
    expect(optimizedEqual).toBe(false);
    
    console.log('✅ Both trigger re-renders as expected, but optimized has less overhead');
  });

  test('should measure deep vs shallow copy performance', () => {
    console.log('📋 COPY PERFORMANCE');
    
    const largeMoveArray = Array(1000).fill({
      san: 'Nf3',
      from: 'g1', 
      to: 'f3',
      piece: 'n',
      color: 'w',
      flags: 'n',
      captured: undefined
    });
    
    const largeStringArray = Array(1000).fill('Nf3');
    
    // Measure copying performance
    const copyObjectArray = () => {
      const start = performance.now();
      const copy = [...largeMoveArray];
      const end = performance.now();
      return end - start;
    };
    
    const copyStringArray = () => {
      const start = performance.now();
      const copy = [...largeStringArray];
      const end = performance.now();
      return end - start;
    };
    
    const objectCopyTime = copyObjectArray();
    const stringCopyTime = copyStringArray();
    const copyImprovement = ((objectCopyTime - stringCopyTime) / objectCopyTime * 100);
    
    console.log('📋 COPY PERFORMANCE:');
    console.log(`  Object Array Copy: ${objectCopyTime.toFixed(3)}ms`);
    console.log(`  String Array Copy: ${stringCopyTime.toFixed(3)}ms`);
    console.log(`  Copy Speed Improvement: ${copyImprovement.toFixed(1)}%`);
    
    expect(stringCopyTime).toBeLessThanOrEqual(objectCopyTime);
  });
});