/**
 * @fileoverview Minimal Smoke Test Suite
 * @description Critical user journeys that must work - runs in <30 seconds
 * Uses MockEngineService for instant, deterministic responses
 */

import { test, expect } from '@playwright/test';
import { TrainingPage } from './pages/TrainingPage';
import { KNOWN_POSITIONS } from './helpers';

test.describe('@smoke Critical User Journeys', () => {
  let trainingPage: TrainingPage;

  test.beforeEach(async ({ page }) => {
    trainingPage = new TrainingPage(page);
  });

  test('1. Basic Training Flow - Complete a session', async () => {
    // User journey: Start training → Make moves → Complete successfully
    await trainingPage.goto(1); // Opposition position
    
    // Verify initial position
    const initialState = await trainingPage.getGameState();
    expect(initialState.fen).toBe(KNOWN_POSITIONS.opposition1);
    expect(initialState.moveCount).toBe(0);
    
    // Make a valid move
    const moveSuccess = await trainingPage.makeMove('e6-d6');
    expect(moveSuccess).toBe(true);
    
    // Verify engine responds quickly (MockEngineService)
    const engineResponded = await trainingPage.waitForEngineMove(1000);
    expect(engineResponded).toBe(true);
    
    // Verify game progressed
    const finalState = await trainingPage.getGameState();
    expect(finalState.moveCount).toBeGreaterThanOrEqual(2);
  });

  test('2. Navigation - Switch between positions', async () => {
    // User journey: Position 1 → Position 12 → Back to 1
    await trainingPage.goto(1);
    let state = await trainingPage.getGameState();
    expect(state.fen).toBe(KNOWN_POSITIONS.opposition1);
    
    // Navigate to Bridge Building
    await trainingPage.goto(12);
    state = await trainingPage.getGameState();
    expect(state.fen).toBe(KNOWN_POSITIONS.bridgeBuilding);
    
    // Navigate back
    await trainingPage.goto(1);
    state = await trainingPage.getGameState();
    expect(state.fen).toBe(KNOWN_POSITIONS.opposition1);
    expect(state.moveCount).toBe(0); // Fresh start
  });

  test('3. Move Validation - Handle invalid moves', async () => {
    // User journey: Try illegal move → Get feedback → Try valid move
    await trainingPage.goto(1);
    
    // Try invalid move
    const invalidMove = await trainingPage.makeMove('e6-a1');
    expect(invalidMove).toBe(false);
    
    // State should be unchanged
    const state = await trainingPage.getGameState();
    expect(state.moveCount).toBe(0);
    
    // Valid move should work
    const validMove = await trainingPage.makeMove('e6-d6');
    expect(validMove).toBe(true);
  });

  test('4. URL Parameters - Load position with moves', async () => {
    // User journey: Share position link → Moves replay automatically
    await trainingPage.page.goto('/train/1?moves=Kd6');
    
    // Wait for automatic move execution
    await trainingPage.page.waitForTimeout(2000);
    
    // Verify move was played
    const state = await trainingPage.getGameState();
    expect(state.moveCount).toBeGreaterThan(0);
    expect(state.history).toContain('Kd6');
  });

  test('5. Engine Integration - Get evaluation and best move', async () => {
    // User journey: Make move → See evaluation → Get hint
    await trainingPage.goto(1);
    
    // Verify engine is ready (data attribute check)
    await expect(trainingPage.page.locator('[data-engine-status="ready"]')).toBeVisible({ timeout: 5000 });
    
    // Make a move
    await trainingPage.makeMove('e6-d6');
    await trainingPage.waitForEngineMove(1000);
    
    // Check evaluation is displayed
    const evaluationElement = trainingPage.page.locator('[data-testid="evaluation"]');
    await expect(evaluationElement).toBeVisible();
    
    // Evaluation should be a number (not "...")
    const evalText = await evaluationElement.textContent();
    expect(evalText).toMatch(/[-+]?\d+\.\d+/);
  });
});