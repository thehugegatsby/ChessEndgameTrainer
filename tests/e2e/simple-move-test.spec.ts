import { test, expect } from '@playwright/test';
import { 
  makeMove, 
  getGameState, 
  waitForEngineResponse, 
  navigateToTraining,
  KNOWN_POSITIONS 
} from './helpers';

/**
 * Fixed version of simple-move-test.spec.ts using centralized helpers
 * This serves as a template for fixing other tests
 */

test.describe('@smoke Simple Move Tests (Fixed)', () => {
  
  test('can make a move and register it correctly', async ({ page }) => {
    // 1. Navigate to Bridge Building training (ID 12)
    const initialState = await navigateToTraining(page, 12);
    
    // 2. Verify initial state
    expect(initialState).toBeTruthy();
    expect(initialState.moveCount).toBe(0);
    expect(initialState.turn).toBe('w'); // White to move
    expect(initialState.fen).toBe(KNOWN_POSITIONS.bridgeBuilding);
    
    // 3. Verify "No moves played" text is visible
    await expect(page.locator('text=Noch keine Züge gespielt')).toBeVisible();
    
    // 4. Make the first move (Kd7)
    const moveResult = await makeMove(page, 'c8-d7');
    expect(moveResult.success).toBe(true);
    
    // 5. Wait for engine response (move count should be 2)
    await waitForEngineResponse(page, 2);
    
    // 6. Verify game state after engine response
    const afterMoveState = await getGameState(page);
    expect(afterMoveState.moveCount).toBe(2); // User move + engine move
    expect(afterMoveState.turn).toBe('w'); // White's turn again
    
    // 7. Verify "No moves played" text is gone
    await expect(page.locator('text=Noch keine Züge gespielt')).not.toBeVisible();
    
    // 8. Verify moves are displayed in the move list
    // Use a more specific selector to avoid ambiguity
    const movePanel = page.locator('div:has(> .font-mono)').first();
    const moves = movePanel.locator('.font-mono');
    await expect(moves.first()).toBeVisible();
    
    // Should show at least "1. Kd7" in the move list
    await expect(movePanel).toContainText('Kd7');
  });
  
  test('validates illegal moves correctly', async ({ page }) => {
    // 1. Navigate to Bridge Building training
    const initialState = await navigateToTraining(page, 12);
    
    // 2. Try an illegal move (King to a1 - not possible)
    const invalidMove = await makeMove(page, 'c8-a1');
    expect(invalidMove.success).toBe(false);
    expect(invalidMove.error).toBeTruthy();
    
    // 3. Verify game state unchanged
    const stateAfterInvalid = await getGameState(page);
    expect(stateAfterInvalid.moveCount).toBe(0);
    expect(stateAfterInvalid.fen).toBe(initialState.fen);
    
    // 4. Make a valid move to confirm the game still works
    const validMove = await makeMove(page, 'c8-d7');
    expect(validMove.success).toBe(true);
    
    // 5. Wait for engine and verify
    await waitForEngineResponse(page, 2);
    const finalState = await getGameState(page);
    expect(finalState.moveCount).toBe(2);
  });
  
  test('handles rapid move sequences correctly', async ({ page }) => {
    // Navigate to position
    await navigateToTraining(page, 12);
    
    // Make first move
    await makeMove(page, 'c8-d7');
    await waitForEngineResponse(page, 2);
    
    // Make second move (from d7)
    const state2 = await getGameState(page);
    console.log('Position after first exchange:', state2.fen);
    
    // Try Kc6 or Kd6 depending on where the king is
    let move2Result = await makeMove(page, 'd7-c6');
    if (!move2Result.success) {
      move2Result = await makeMove(page, 'd7-d6');
    }
    expect(move2Result.success).toBe(true);
    
    // Wait for second engine response
    await waitForEngineResponse(page, 4);
    
    // Verify final state
    const finalState = await getGameState(page);
    expect(finalState.moveCount).toBe(4);
    expect(finalState.pgn).toContain('Kd7');
  });
});

test.describe('Opposition Training Tests', () => {
  
  test('can play moves in opposition training', async ({ page }) => {
    // Navigate to Opposition training (ID 1)
    const initialState = await navigateToTraining(page, 1);
    
    // Verify it's the opposition position
    expect(initialState.fen).toBe(KNOWN_POSITIONS.opposition1);
    
    // In opposition, white king is on e6, try Kd5
    const moveResult = await makeMove(page, 'e6-d5');
    expect(moveResult.success).toBe(true);
    
    // Wait for black's response
    await waitForEngineResponse(page, 2);
    
    // Verify the game progressed
    const afterMove = await getGameState(page);
    expect(afterMove.moveCount).toBe(2);
    expect(afterMove.pgn).toContain('Kd5');
  });
});