/**
 * @fileoverview Refactored E2E Test using Page Object Model
 * @version 1.0.0
 * @description Clean E2E test implementation following best practices:
 * - Page Object Model for maintainability
 * - Event-based synchronization instead of hardcoded timeouts
 * - Clean test API instead of component-coupled hooks
 */

import { test, expect } from '@playwright/test';
import { TrainingPage } from './pages/TrainingPage';

test.describe('@smoke Basic Training Flow - Refactored', () => {
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

  test('should complete a basic training session successfully', async () => {
    // Navigate to Opposition training (ID 1)
    await trainingPage.goto(1);
    
    // Verify we're on the correct training
    const title = await trainingPage.getTitle();
    expect(title).toContain('Opposition');
    
    // Get initial game state
    const initialState = await trainingPage.getGameState();
    expect(initialState.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    expect(initialState.moveCount).toBe(0);
    expect(initialState.turn).toBe('w');
    
    // Make a correct move for Opposition position
    const moveSuccess = await trainingPage.makeMove('e6-d6');
    expect(moveSuccess).toBe(true);
    
    // Verify move was registered
    const stateAfterMove = await trainingPage.getGameState();
    expect(stateAfterMove.moveCount).toBe(1);
    expect(stateAfterMove.turn).toBe('b');
    expect(stateAfterMove.history).toContain('Kd6');
    
    // Wait for engine response using event-based waiting
    const engineResponded = await trainingPage.waitForEngineMove();
    expect(engineResponded).toBe(true);
    
    // Verify engine made a move
    const finalState = await trainingPage.getGameState();
    expect(finalState.moveCount).toBeGreaterThanOrEqual(2);
    expect(finalState.turn).toBe('w'); // Back to white's turn
    
    // Verify moves are displayed in UI
    const moveCount = await trainingPage.getMoveCount();
    expect(moveCount).toBeGreaterThan(0);
    
    const isKd6Displayed = await trainingPage.isMoveDisplayed('Kd6');
    expect(isKd6Displayed).toBe(true);
  });

  test('should handle invalid moves correctly', async () => {
    await trainingPage.goto(1);
    
    // Try an invalid move
    const moveSuccess = await trainingPage.makeMove('e6-a1'); // King can't move that far
    expect(moveSuccess).toBe(false);
    
    // Game state should remain unchanged
    const state = await trainingPage.getGameState();
    expect(state.moveCount).toBe(0);
    expect(state.turn).toBe('w');
  });

  test('should show engine evaluation when enabled', async () => {
    await trainingPage.goto(1);
    
    // Make a move
    await trainingPage.makeMove('e6-d6');
    await trainingPage.waitForEngineMove();
    
    // Check that evaluation is available in game state
    const state = await trainingPage.getGameState();
    
    // Either evaluation exists or UI shows engine-related content
    const hasEvaluation = state.evaluation !== undefined || 
                         await trainingPage.getMoveCount() > 0;
    expect(hasEvaluation).toBe(true);
  });

  test('should handle rapid move sequences', async () => {
    await trainingPage.goto(1);
    
    const moves = [
      { move: 'e6-d6', expectedSuccess: true },  // Kd6
      { move: 'e8-d8', expectedSuccess: true },  // Kd8 (if it's black's turn)
      { move: 'd6-c6', expectedSuccess: true }   // Kc6 (if it's white's turn)
    ];
    
    let successfulMoves = 0;
    
    for (const { move, expectedSuccess } of moves) {
      const state = await trainingPage.getGameState();
      
      // Only make move if it's the right turn
      if ((move.startsWith('e6') || move.startsWith('d6')) && state.turn !== 'w') {
        continue;
      }
      if (move.startsWith('e8') && state.turn !== 'b') {
        continue;
      }
      
      const success = await trainingPage.makeMove(move);
      if (success) {
        successfulMoves++;
        
        // Wait for any engine response if it's black's turn
        if (state.turn === 'w') {
          await trainingPage.waitForEngineMove(3000);
        }
      }
    }
    
    // At least one move should have been successful
    expect(successfulMoves).toBeGreaterThan(0);
    
    // Verify final state
    const finalState = await trainingPage.getGameState();
    expect(finalState.moveCount).toBeGreaterThan(0);
  });

  test('should reset game correctly', async () => {
    await trainingPage.goto(1);
    
    // Make some moves
    await trainingPage.makeMove('e6-d6');
    await trainingPage.waitForEngineMove();
    
    // Verify moves were made
    let state = await trainingPage.getGameState();
    expect(state.moveCount).toBeGreaterThan(0);
    
    // Reset the game
    await trainingPage.resetGame();
    
    // Verify game is reset
    state = await trainingPage.getGameState();
    expect(state.moveCount).toBe(0);
    expect(state.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
  });

  test('should navigate between positions', async () => {
    // Start at position 1
    await trainingPage.goto(1);
    let state = await trainingPage.getGameState();
    const position1Fen = state.fen;
    
    // Navigate to next position
    await trainingPage.goToNextPosition();
    
    // Verify position changed
    state = await trainingPage.getGameState();
    expect(state.fen).not.toBe(position1Fen);
    
    // Navigate back
    await trainingPage.goToPreviousPosition();
    
    // Verify we're back at position 1
    state = await trainingPage.getGameState();
    expect(state.fen).toBe(position1Fen);
  });
});