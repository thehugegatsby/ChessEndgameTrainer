/**
 * @fileoverview Smoke Test Suite using Component Object Model Architecture
 * @description Critical user journeys implemented with the new COM architecture
 * Replaces the legacy smoke-suite.spec.ts with superior test design
 */

import { test, expect } from '@playwright/test';
import { AppDriver } from './components/AppDriver';
import { aGameState, aPosition } from './builders';
import { getTestFen, TestPositions } from './helpers/testData';

test.describe('@smoke Critical User Journeys (COM)', () => {
  let app: AppDriver;

  test.beforeEach(async ({ page }) => {
    app = new AppDriver(page, { verbose: true });
  });

  test.afterEach(async () => {
    await app.dispose();
  });

  test('1. Basic Training Flow - Complete a session', async () => {
    // User journey: Start training → Make moves → Complete successfully
    
    // Navigate to opposition training position
    await app.visit('/train/1');
    
    // Verify initial position
    const initialState = await app.getFullGameState();
    expect(initialState.fen).toBe(getTestFen(TestPositions.OPPOSITION_BASICS));
    expect(initialState.moveCount).toBe(0);
    
    // Make a valid move and wait for engine response
    await app.makeMoveAndAwaitUpdate('e6', 'd6');
    
    // Verify game progressed (player move + engine move)
    const finalState = await app.getFullGameState();
    expect(finalState.moveCount).toBeGreaterThanOrEqual(2);
    expect(finalState.lastMove).toBeDefined();
  });

  test('2. Navigation - Switch between positions', async () => {
    // User journey: Position 1 → Position 12 → Back to 1
    
    // Start at position 1
    await app.visit('/train/1');
    let state = await app.board.getPosition();
    expect(state).toBe(getTestFen(TestPositions.OPPOSITION_BASICS));
    
    // Navigate to Bridge Building (position 12)
    await app.visit('/train/12');
    state = await app.board.getPosition();
    expect(state).toBe(getTestFen(TestPositions.BRIDGE_BUILDING));
    
    // Navigate back to position 1
    await app.visit('/train/1');
    state = await app.board.getPosition();
    expect(state).toBe(getTestFen(TestPositions.OPPOSITION_BASICS));
    
    // Verify fresh start (no moves)
    const gameState = await app.getFullGameState();
    expect(gameState.moveCount).toBe(0);
  });

  test('3. Move Validation - Handle invalid moves', async () => {
    // User journey: Try illegal move → Get feedback → Try valid move
    
    await app.visit('/train/1');
    
    // Try invalid move (king to a1 is illegal)
    let errorOccurred = false;
    try {
      await app.board.makeMove('e6', 'a1');
    } catch (error) {
      errorOccurred = true;
    }
    expect(errorOccurred).toBe(true);
    
    // Verify state unchanged
    const stateAfterInvalid = await app.getFullGameState();
    expect(stateAfterInvalid.moveCount).toBe(0);
    expect(stateAfterInvalid.fen).toBe(getTestFen(TestPositions.OPPOSITION_BASICS));
    
    // Valid move should work
    await app.board.makeMove('e6', 'd6');
    
    // Verify move was made
    const stateAfterValid = await app.getFullGameState();
    expect(stateAfterValid.moveCount).toBeGreaterThan(0);
  });

  test('4. Complete Game with Result Detection', async () => {
    // User journey: Play a winning sequence
    
    // Mock a position near checkmate
    const nearMatePosition = aPosition()
      .withFen('7k/6R1/5K2/8/8/8/8/8 w - - 0 1')
      .withId(99)
      .build();
    
    // Pass the FEN string, not the position object
    await app.setupAndSolvePuzzle(nearMatePosition.fen, ['Rg8#']);
    
    // Verify checkmate was achieved
    const finalState = await app.getFullGameState();
    expect(finalState.isCheckmate).toBe(true);
    expect(finalState.gameOverReason).toContain('checkmate');
  });

  test('5. Engine Integration - Get evaluation and best move', async () => {
    // User journey: Make move → See evaluation → Get hint
    
    await app.visit('/train/1');
    
    // Configure engine for deterministic responses using test bridge
    await app.page.evaluate((oppositionFen) => {
      const constants = (window as any).__E2E_TEST_CONSTANTS__;
      const bridgeName = constants?.TEST_BRIDGE?.BRIDGE_NAME || '__E2E_TEST_BRIDGE__';
      const bridge = (window as any)[bridgeName];
      
      bridge?.engine?.setEvaluation(oppositionFen, 0.5);
      bridge?.engine?.setNextMove('4k3/8/3K4/4P3/8/8/8/8 b - - 1 1', 'Kd8');
    }, getTestFen(TestPositions.OPPOSITION_BASICS));
    
    // Make a move
    await app.makeMoveAndAwaitUpdate('e6', 'd6');
    
    // Get engine analysis
    const analysis = await app.getEngineAnalysis();
    expect(analysis.evaluation).toBeDefined();
    expect(analysis.bestMove).toBeDefined();
    expect(analysis.depth).toBeGreaterThan(0);
    
    // Verify evaluation is displayed in UI
    const evalPanel = await app.evaluationPanel.getEvaluationInfo();
    expect(evalPanel.evaluation).toBeDefined();
    expect(evalPanel.evaluation).not.toBe('...');
  });
});