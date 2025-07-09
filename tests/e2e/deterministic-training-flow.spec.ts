/**
 * @fileoverview Deterministic E2E Test with Mock Engine
 * @version 1.0.0
 * @description Test using deterministic engine responses for reliable E2E testing
 */

import { test, expect } from '@playwright/test';
import { TrainingPage } from './pages/TrainingPage';

test.describe('@smoke Deterministic Training Flow', () => {
  let trainingPage: TrainingPage;

  test.beforeEach(async ({ page }) => {
    trainingPage = new TrainingPage(page);
    
    // Enable console logs for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser ${msg.type()}:`, msg.text());
      }
    });
  });

  test('should follow exact move sequence with deterministic engine', async () => {
    // Navigate to Opposition training (ID 1)
    await trainingPage.goto(1);
    
    // Configure deterministic engine with fixed responses
    await trainingPage.configureEngine({
      deterministic: true,
      timeLimit: 100, // Fast response time for tests
      fixedResponses: {
        // After white Kd6, black responds with Kd8
        '4k3/8/3K4/4P3/8/8/8/8 b - - 1 1': 'Kd8',
        // After black Kd8, if white plays Ke6, black plays Ke8
        '3k4/8/4K3/4P3/8/8/8/8 b - - 3 2': 'Ke8',
        // Add more position -> move mappings as needed
      }
    });
    
    // Verify initial position
    const initialState = await trainingPage.getGameState();
    expect(initialState.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    expect(initialState.moveCount).toBe(0);
    expect(initialState.turn).toBe('w');
    
    // Make first move: Kd6 (good move for Opposition)
    const moveSuccess = await trainingPage.makeMove('e6-d6');
    expect(moveSuccess).toBe(true);
    
    // Wait for deterministic engine response
    const engineResponded = await trainingPage.waitForEngineMove(2000);
    expect(engineResponded).toBe(true);
    
    // Verify the sequence: 1. Kd6 Kd8
    const stateAfterEngine = await trainingPage.getGameState();
    expect(stateAfterEngine.moveCount).toBe(2);
    expect(stateAfterEngine.history).toEqual(['Kd6', 'Kd8']);
    expect(stateAfterEngine.turn).toBe('w'); // White to move
    
    // Make second move: Ke6
    const secondMoveSuccess = await trainingPage.makeMove('d6-e6');
    expect(secondMoveSuccess).toBe(true);
    
    // Wait for second engine response
    const secondEngineResponded = await trainingPage.waitForEngineMove(2000);
    expect(secondEngineResponded).toBe(true);
    
    // Verify the full sequence: 1. Kd6 Kd8 2. Ke6 Ke8
    const finalState = await trainingPage.getGameState();
    expect(finalState.moveCount).toBe(4);
    expect(finalState.history).toEqual(['Kd6', 'Kd8', 'Ke6', 'Ke8']);
    expect(finalState.turn).toBe('w'); // White to move again
    
    // Verify moves are displayed in UI
    const moveCount = await trainingPage.getMoveCount();
    expect(moveCount).toBeGreaterThanOrEqual(4);
    
    // Verify specific moves are displayed
    expect(await trainingPage.isMoveDisplayed('Kd6')).toBe(true);
    expect(await trainingPage.isMoveDisplayed('Kd8')).toBe(true);
    expect(await trainingPage.isMoveDisplayed('Ke6')).toBe(true);
    expect(await trainingPage.isMoveDisplayed('Ke8')).toBe(true);
  });

  test('should handle deterministic losing line', async () => {
    await trainingPage.goto(1);
    
    // Configure deterministic engine for a losing line
    await trainingPage.configureEngine({
      deterministic: true,
      timeLimit: 50,
      fixedResponses: {
        // After white Kd5 (bad move), black responds optimally with Kd7
        '4k3/8/8/3K4/4P3/8/8/8 b - - 1 1': 'Kd7',
      }
    });
    
    // Make a suboptimal move
    const moveSuccess = await trainingPage.makeMove('e6-d5'); // Loses opposition
    expect(moveSuccess).toBe(true);
    
    // Wait for engine response
    const engineResponded = await trainingPage.waitForEngineMove(2000);
    expect(engineResponded).toBe(true);
    
    // Verify engine played the optimal response
    const state = await trainingPage.getGameState();
    expect(state.moveCount).toBe(2);
    expect(state.history).toEqual(['Kd5', 'Kd7']);
    
    // Black has gained the opposition (king on d7 facing king on d5)
    // This is the optimal response to white's suboptimal Kd5
  });

  test('should work without deterministic mode (fallback)', async () => {
    await trainingPage.goto(1);
    
    // Don't configure deterministic mode - should work with real engine
    // (though this test might be less reliable)
    
    const moveSuccess = await trainingPage.makeMove('e6-d6');
    expect(moveSuccess).toBe(true);
    
    // Wait longer for real engine
    const engineResponded = await trainingPage.waitForEngineMove(5000);
    
    // Engine might or might not respond in time, but move should be registered
    const state = await trainingPage.getGameState();
    expect(state.moveCount).toBeGreaterThanOrEqual(1);
    expect(state.history[0]).toBe('Kd6');
  });

  test('should handle position not in fixedResponses gracefully', async () => {
    await trainingPage.goto(1);
    
    // Configure with limited responses
    await trainingPage.configureEngine({
      deterministic: true,
      fixedResponses: {
        // Only one response - after first move, engine won't have a fixed response
        '4k3/8/3K4/4P3/8/8/8/8 b - - 1 1': 'Kd8',
      }
    });
    
    // Make first move - should get deterministic response
    await trainingPage.makeMove('e6-d6');
    const firstEngineResponded = await trainingPage.waitForEngineMove(2000);
    expect(firstEngineResponded).toBe(true);
    
    // Make second move - no fixed response available, should gracefully continue
    const secondMoveSuccess = await trainingPage.makeMove('d6-e6');
    expect(secondMoveSuccess).toBe(true);
    
    // Engine might not respond (no fixed response), but that's OK
    const state = await trainingPage.getGameState();
    expect(state.moveCount).toBeGreaterThanOrEqual(3);
  });
});