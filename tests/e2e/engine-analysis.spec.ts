/**
 * E2E Tests for Engine Analysis Feature
 * Tests that engine moves are properly displayed to users
 * Following TDD approach - these tests should fail initially
 */

import { test, expect } from '@playwright/test';
import { 
  navigateToTrainingPage, 
  waitForBoardLoad, 
  enableAnalysisPanel,
  makeMove,
  waitForEngineResponse 
} from './helpers';

test.describe('Engine Analysis - Issue #14', () => {
  test('should display engine moves when analysis panel is enabled', async ({ page }) => {
    // ARRANGE: Navigate to a training position
    await navigateToTrainingPage(page, 1);
    await waitForBoardLoad(page);
    
    // ACT: Enable analysis panel to show engine moves
    await enableAnalysisPanel(page);
    
    // ASSERT: Check that engine moves are displayed
    const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    await expect(evaluationPanel).toBeVisible();
    
    // Wait for engine to calculate moves
    await waitForEngineResponse(page);
    
    // Check for engine moves in BestMovesDisplay component
    const engineMovesSection = evaluationPanel.locator('.flex-1').first();
    
    // Check that we don't see "No engine moves" message
    const noMovesMessage = engineMovesSection.locator('text="No engine moves"');
    await expect(noMovesMessage).not.toBeVisible();
    
    // Check for actual move display (chess notation)
    const moveElements = engineMovesSection.locator('[class*="font-medium"][class*="text-gray-200"]');
    const moveCount = await moveElements.count();
    
    // Should have at least one move
    expect(moveCount).toBeGreaterThan(0);
    
    // Verify first move matches chess notation pattern
    if (moveCount > 0) {
      const firstMove = await moveElements.first().textContent();
      const chessNotationRegex = /^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8]|O-O(-O)?)[+#]?$/;
      expect(firstMove).toMatch(chessNotationRegex);
    }
  });

  test('should update engine moves after user makes a move', async ({ page }) => {
    // Navigate and setup - Position 1 is Opposition Basics (TestPositions.POSITION_1_OPPOSITION_BASICS)
    // FEN: 4k3/8/4K3/8/8/8/8/8 w - - 0 1 (White to move)
    await navigateToTrainingPage(page, 1);
    await waitForBoardLoad(page);
    await enableAnalysisPanel(page);
    
    // Wait for initial engine analysis
    await waitForEngineResponse(page);
    
    // Get initial engine move (should be Ke7 from TestPositions.POSITION_1_OPPOSITION_BASICS)
    const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    const engineMovesSection = evaluationPanel.locator('.flex-1').first();
    const moveElements = engineMovesSection.locator('[class*="font-medium"][class*="text-gray-200"]');
    
    const initialMove = await moveElements.first().textContent();
    expect(initialMove).toBeTruthy();
    console.log('Initial engine move:', initialMove);
    
    // Make the expected user move: Ke7 (from TestPositions.POSITION_1_OPPOSITION_BASICS)
    // This should trigger the engine to respond with Kd8 for Black
    await makeMove(page, 'e6', 'e7');
    
    // Wait for engine to analyze new position
    await page.waitForTimeout(1000); // Brief wait for move animation
    await waitForEngineResponse(page);
    
    // Engine should show a different move now (should be Kd8 from TestPositions interactions)
    const newMove = await moveElements.first().textContent();
    expect(newMove).toBeTruthy();
    console.log('New engine move:', newMove);
    expect(newMove).not.toBe(initialMove);
    
    // New move should still be valid chess notation
    const chessNotationRegex = /^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8]|O-O(-O)?)[+#]?$/;
    expect(newMove).toMatch(chessNotationRegex);
  });

  test('should show evaluation score alongside moves', async ({ page }) => {
    await navigateToTrainingPage(page, 1);
    await waitForBoardLoad(page);
    await enableAnalysisPanel(page);
    await waitForEngineResponse(page);
    
    const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    const engineMovesSection = evaluationPanel.locator('.flex-1').first();
    
    // Check for evaluation scores (like +0.3 or M5)
    const evalElements = engineMovesSection.locator('[class*="font-mono"][class*="font-bold"]');
    const evalCount = await evalElements.count();
    
    expect(evalCount).toBeGreaterThan(0);
    
    // Check first evaluation format
    const firstEval = await evalElements.first().textContent();
    // Should match patterns like +0.3, -1.2, M5, etc.
    const evalPattern = /^[+-]?\d+\.?\d*$|^M\d+$/;
    expect(firstEval).toMatch(evalPattern);
  });

  test('should handle positions with no legal moves gracefully', async ({ page }) => {
    // This would require navigating to a checkmate/stalemate position
    // For now, we'll test that the UI doesn't break in edge cases
    
    await navigateToTrainingPage(page, 1);
    await waitForBoardLoad(page);
    await enableAnalysisPanel(page);
    
    // The evaluation panel should still be visible
    const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    await expect(evaluationPanel).toBeVisible();
    
    // TODO: Once we can set specific positions, test checkmate/stalemate scenarios
  });

  test('should display multiple engine move suggestions', async ({ page }) => {
    await navigateToTrainingPage(page, 1);
    await waitForBoardLoad(page);
    await enableAnalysisPanel(page);
    await waitForEngineResponse(page);
    
    const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    const engineMovesSection = evaluationPanel.locator('.flex-1').first();
    const moveElements = engineMovesSection.locator('[class*="font-medium"][class*="text-gray-200"]');
    
    const moveCount = await moveElements.count();
    
    // Engine typically shows top 3 moves
    expect(moveCount).toBeGreaterThanOrEqual(1);
    expect(moveCount).toBeLessThanOrEqual(3);
    
    // All moves should be valid notation
    const chessNotationRegex = /^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8]|O-O(-O)?)[+#]?$/;
    for (let i = 0; i < moveCount; i++) {
      const move = await moveElements.nth(i).textContent();
      expect(move).toMatch(chessNotationRegex);
    }
  });
});