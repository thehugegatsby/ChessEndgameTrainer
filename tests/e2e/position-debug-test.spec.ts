import { test, expect } from '@playwright/test';
import {
  navigateToTraining,
  makeMove,
  getGameState,
  verifyPosition,
  KNOWN_POSITIONS,
} from './helpers';

/**
 * Position Debug Test (Fixed) - Uses test hooks
 */
test.describe('Position Debug and Legal Moves', () => {
  
  test('Check starting position and test legal moves', async ({ page }) => {
    // Navigate to position 1
    await navigateToTraining(page, 1);
    await verifyPosition(page, KNOWN_POSITIONS.opposition1);

    // Get initial position info
    const initialState = await getGameState(page);
    console.log('Initial position:', {
      fen: initialState.fen,
      moveCount: initialState.moveCount,
      pgn: initialState.pgn
    });

    // Test various legal moves for the white king on e1
    const testMoves = [
      { notation: 'e1-d1', expected: 'Kd1' },
      { notation: 'e1-d2', expected: 'Kd2' },
      { notation: 'e1-e2', expected: 'Ke2' },
      { notation: 'e1-f1', expected: 'Kf1' },
      { notation: 'e1-f2', expected: 'Kf2' }
    ];

    for (const { notation, expected } of testMoves) {
      console.log(`Testing move: ${notation}`);
      
      // Try the move
      const moveResult = await makeMove(page, notation);
      
      if (moveResult.success) {
        console.log(`✅ Move ${notation} (${expected}) is legal!`);
        
        // Get the updated state
        const state = await getGameState(page);
        expect(state.pgn).toContain(expected);
        
        // Reload to reset position for next test
        await page.reload();
        await page.waitForLoadState('networkidle');
        await verifyPosition(page, KNOWN_POSITIONS.opposition1);
      } else {
        console.log(`❌ Move ${notation} is illegal`);
      }
    }

    // Test an illegal move
    const illegalMove = await makeMove(page, 'e1-a8');
    expect(illegalMove.success).toBe(false);
    console.log('✅ Illegal move e1-a8 correctly rejected');
  });

  test('Verify position IDs and their starting positions', async ({ page }) => {
    const positions = [
      { id: 1, name: 'Opposition', expectedFen: KNOWN_POSITIONS.opposition1 },
      { id: 12, name: 'Bridge Building', expectedFen: KNOWN_POSITIONS.bridgeBuilding }
    ];

    for (const { id, name, expectedFen } of positions) {
      await navigateToTraining(page, id);
      await verifyPosition(page, expectedFen);
      
      const state = await getGameState(page);
      console.log(`Position ${id} (${name}):`, {
        fen: state.fen,
        verified: state.fen === expectedFen
      });
      
      expect(state.fen).toBe(expectedFen);
    }
  });
});