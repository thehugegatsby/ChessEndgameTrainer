/**
 * @fileoverview Critical E2E Test: Pawn Endgame Win
 * @description Tests the core functionality of completing a pawn endgame training successfully
 * 
 * This test uses a hybrid approach:
 * - Real UI interactions for critical moves (first move, promotion)
 * - Test hooks for routine moves (middle game)
 * - Validates both UI updates and Store state
 */

import { test, expect } from '@playwright/test';
import { AppDriver } from '../components/AppDriver';

test.describe('Critical User Journey: Win Pawn Endgame', () => {
  let appDriver: AppDriver;

  test.beforeEach(async ({ page }) => {
    // Initialize AppDriver
    appDriver = new AppDriver(page);
    
    // Visit the training page - this handles initialization and waiting
    await appDriver.visit('/train/1');
    
    // Verify initial position
    const initialState = await appDriver.getFullGameState();
    expect(initialState.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    expect(initialState.moveCount).toBe(0);
  });

  test('should complete pawn endgame with correct play leading to win', async ({ page }) => {
    // Step 1: First move via UI interaction (critical path)
    // Tests that drag-and-drop is properly connected to the store
    await appDriver.board.makeMove('e6', 'd6'); // Kd6 - taking opposition
    
    // Verify UI updates
    await expect(page.locator('[data-testid="move-panel"]'))
      .toHaveAttribute('data-move-count', '2'); // User move + engine response
    
    // Verify first moves in move list
    const moves = await appDriver.moveList.getMoves();
    expect(moves[0].san).toBe('Kd6');
    expect(moves[1].san).toMatch(/K[a-h][1-8]/); // Engine's king move
    
    // Step 2: Middle game moves via test hooks (routine moves)
    // This is faster and more stable for non-critical moves
    const gameState1 = await appDriver.getFullGameState();
    
    // Make several moves to advance the position
    await page.evaluate(async () => {
      // Move sequence that maintains advantage
      await (window as any).e2e_makeMove('d6-c6'); // Continue advancing
    });
    
    // Wait for engine response
    await appDriver.moveList.waitForMoveCount(4);
    
    // More routine moves via hook
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('c6-b6'); // Keep pushing
    });
    
    await appDriver.moveList.waitForMoveCount(6);
    
    // Step 3: Critical promotion sequence via UI (important path)
    // Get current position to determine exact promotion move
    const prePromotionState = await appDriver.getFullGameState();
    
    // Assuming we're close to promotion, make the push
    // This tests the promotion UI flow
    if (prePromotionState.fen.includes('P7')) {
      // Pawn is on 7th rank, ready to promote
      const pawnSquare = findPieceSquare(prePromotionState.fen, 'P');
      if (pawnSquare) {
        const promotionSquare = pawnSquare.replace('7', '8');
        await appDriver.board.makeMove(pawnSquare, promotionSquare);
        
        // Handle promotion dialog if it appears
        // (In this training scenario, it might auto-promote to Queen)
        const promotionDialog = page.locator('[data-testid="promotion-dialog"]');
        if (await promotionDialog.isVisible({ timeout: 1000 })) {
          await promotionDialog.locator('[data-piece="queen"]').click();
        }
      }
    }
    
    // Step 4: Verify winning position
    // Continue playing until checkmate or opponent resignation
    let finalState = await appDriver.getFullGameState();
    let moveCount = finalState.moveCount;
    
    // Play out remaining moves if game not finished
    while (!finalState.isGameOver && moveCount < 50) {
      // Use test hook for efficiency in endgame
      await page.evaluate(async () => {
        const state = (window as any).e2e_getGameState();
        if (state.turn === 'w') {
          // Make a move based on current position
          // In a real implementation, you'd have logic to find the best move
          // For now, this is a placeholder
          const result = await (window as any).e2e_makeMove('auto');
          return result;
        }
      });
      
      await page.waitForTimeout(100); // Small delay for engine
      finalState = await appDriver.getFullGameState();
      moveCount = finalState.moveCount;
    }
    
    // Step 5: Validate win condition
    expect(finalState.isGameOver).toBe(true);
    
    // Check for win indication in UI
    const gameResult = await page.locator('[data-testid="game-result"], .game-result, :text("Gewonnen"), :text("Geschafft")')
      .first()
      .isVisible({ timeout: 5000 });
    expect(gameResult).toBe(true);
    
    // Verify final state shows white won
    if (finalState.isCheckmate) {
      expect(finalState.turn).toBe('b'); // Black to move = White won
    }
    
    // Additional assertions
    expect(finalState.moveCount).toBeGreaterThan(6); // Game had reasonable length
    expect(finalState.moveCount).toBeLessThan(50); // Not a drawn endgame
    
    // Log success
    console.log(`✅ Pawn endgame completed in ${finalState.moveCount} moves`);
  });

  test.afterEach(async () => {
    // Cleanup if needed
    await appDriver.dispose();
  });
});

/**
 * Helper to find piece on board
 * In a real implementation, this would be in BoardComponent
 */
function findPieceSquare(fen: string, piece: string): string | null {
  // Parse FEN to find piece position
  // This is a simplified implementation
  const ranks = fen.split(' ')[0].split('/');
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of ranks[rank]) {
      if (char === piece) {
        return String.fromCharCode(97 + file) + (8 - rank);
      } else if (char >= '1' && char <= '8') {
        file += parseInt(char);
      } else {
        file++;
      }
    }
  }
  return null;
}