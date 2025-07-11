/**
 * Training Flow E2E Test
 * Clean architecture example using fixtures and components
 */

import { test, expect } from '../fixtures/test-fixtures';

test.describe('Training Flow - Clean Architecture', () => {
  test('Complete training session with hints', async ({ 
    authenticatedPage,
    testApi,
    positionFactory
  }) => {
    // Arrange: Create a test position
    const testPosition = positionFactory.createScenario('opposition');
    await testApi.setGameState({
      positionId: testPosition.id,
      fen: testPosition.fen,
      moveHistory: []
    });

    // Act: Navigate to position
    await authenticatedPage.navigateToPosition(testPosition.id);
    
    // Assert: Position loaded correctly
    const positionInfo = await authenticatedPage.getPositionInfo();
    expect(positionInfo.title).toBe(testPosition.title);
    expect(positionInfo.difficulty).toContain('beginner');
    
    // Assert: Board shows correct position
    const boardFEN = await authenticatedPage.chessBoard.getFEN();
    expect(boardFEN).toBe(testPosition.fen);
    
    // Act: Request hint
    const hint = await authenticatedPage.requestHint();
    expect(hint).toContain('opposition');
    
    // Act: Make the correct move
    await authenticatedPage.chessBoard.makeMove({
      from: 'e6',
      to: 'e7'
    });
    
    // Assert: Move was made
    const currentTurn = await authenticatedPage.chessBoard.getCurrentTurn();
    expect(currentTurn).toBe('black');
    
    // Act: Wait for engine response
    await authenticatedPage.chessBoard.waitForEngineMove();
    
    // Assert: Game progressed
    const moveCount = await authenticatedPage.chessBoard.getMoveCount();
    expect(moveCount).toBeGreaterThanOrEqual(2);
    
    // Assert: Check evaluation
    const evaluation = await authenticatedPage.getEvaluation();
    expect(evaluation.score).toBeGreaterThan(0); // White should be winning
  });

  test('Navigate between positions', async ({ authenticatedPage }) => {
    // Navigate to first position
    await authenticatedPage.navigateToPosition(1);
    
    // Get initial position info
    const firstPosition = await authenticatedPage.getPositionInfo();
    
    // Check navigation availability
    const navStatus = await authenticatedPage.canNavigate();
    expect(navStatus.next).toBe(true);
    
    // Navigate to next position
    await authenticatedPage.goToNextPosition();
    
    // Verify position changed
    const secondPosition = await authenticatedPage.getPositionInfo();
    expect(secondPosition.title).not.toBe(firstPosition.title);
    
    // Verify URL changed
    expect(authenticatedPage.getCurrentUrl()).toContain('/train/2');
    
    // Navigate back
    await authenticatedPage.goToPreviousPosition();
    
    // Verify we're back at first position
    const backPosition = await authenticatedPage.getPositionInfo();
    expect(backPosition.title).toBe(firstPosition.title);
  });

  test('Reset position after mistakes', async ({ authenticatedPage }) => {
    await authenticatedPage.navigateToPosition(1);
    
    // Make some moves
    await authenticatedPage.chessBoard.makeMove({ from: 'e6', to: 'd6' });
    await authenticatedPage.chessBoard.waitForEngineMove();
    
    // Verify moves were made
    const moveCountBefore = await authenticatedPage.chessBoard.getMoveCount();
    expect(moveCountBefore).toBeGreaterThan(0);
    
    // Reset position
    await authenticatedPage.resetPosition();
    
    // Verify position was reset
    const moveCountAfter = await authenticatedPage.chessBoard.getMoveCount();
    expect(moveCountAfter).toBe(0);
    
    const boardFEN = await authenticatedPage.chessBoard.getFEN();
    expect(boardFEN).toBe('4k3/8/4K3/8/8/8/8/8 w - - 0 1');
  });

  test('Show solution and verify moves', async ({ authenticatedPage }) => {
    await authenticatedPage.navigateToPosition(1);
    
    // Show solution
    const solutionMoves = await authenticatedPage.showSolution();
    
    // Verify solution contains expected moves
    expect(solutionMoves).toHaveLength(1);
    expect(solutionMoves[0]).toContain('Ke7');
    
    // Make the solution move
    await authenticatedPage.chessBoard.makeMove({
      from: 'e6',
      to: 'e7'
    });
    
    // Verify it was the correct move
    const progress = await authenticatedPage.getMoveProgress();
    expect(progress.current).toBe(1);
    expect(progress.target).toBe(1);
    expect(progress.percentage).toBe(100);
  });

  test('Visual regression - training board', async ({ authenticatedPage }) => {
    await authenticatedPage.navigateToPosition(1);
    
    // Take screenshot of the board
    const boardScreenshot = await authenticatedPage.chessBoard.takeScreenshot();
    expect(boardScreenshot).toMatchSnapshot('training-board-opposition.png');
    
    // Make a move and take another screenshot
    await authenticatedPage.chessBoard.makeMove({
      from: 'e6',
      to: 'e7'
    });
    
    const afterMoveScreenshot = await authenticatedPage.chessBoard.takeScreenshot();
    expect(afterMoveScreenshot).toMatchSnapshot('training-board-after-move.png');
  });
});

test.describe('Training with progress tracking', () => {
  test('User sees completed positions', async ({ dashboardPage, userWithProgress }) => {
    // User with progress fixture has completed positions 1, 2, 3
    const progress = await dashboardPage.getUserProgress();
    
    expect(progress.completed).toBe(3);
    expect(progress.percentage).toBeGreaterThan(0);
  });

  test('Continue from last position', async ({ 
    authenticatedPage,
    userWithProgress,
    testApi 
  }) => {
    // Set last position for user
    await testApi.setGameState({
      positionId: 2,
      fen: '8/8/4k3/8/8/4K3/8/8 w - - 0 1',
      moveHistory: ['Ke3-e4']
    });
    
    // Navigate to continue training
    await authenticatedPage.navigateToPosition(2);
    
    // Verify game state was restored
    const boardState = await authenticatedPage.chessBoard.getState();
    expect(boardState?.moveCount).toBe(1);
    expect(boardState?.moveHistory).toContain('Ke3-e4');
  });
});

test.describe('Error scenarios', () => {
  test('Handle invalid position gracefully', async ({ page }) => {
    // Navigate to non-existent position
    await page.goto('/train/99999');
    
    // Should show error message
    await expect(page.locator('text=Position not found')).toBeVisible();
    
    // Should offer navigation back
    await expect(page.locator('text=Back to Dashboard')).toBeVisible();
  });

  test('Handle network errors', async ({ authenticatedPage, page }) => {
    // Navigate to position
    await authenticatedPage.navigateToPosition(1);
    
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to make a move
    await authenticatedPage.chessBoard.makeMove({
      from: 'e6',
      to: 'e7'
    });
    
    // Should show error message
    await expect(page.locator('text=Connection error')).toBeVisible({ timeout: 5000 });
    
    // Restore connection
    await page.context().setOffline(false);
  });
});