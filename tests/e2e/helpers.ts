import { Page } from '@playwright/test';

/**
 * Centralized test helpers for E2E tests
 * Uses the test hooks exposed by TrainingBoardZustand
 */

/**
 * Make a chess move using the test hook
 * @param page - Playwright page object
 * @param move - Move in format 'from-to' (e.g., 'c8-d7') or SAN notation
 * @returns Promise with success status and optional error
 */
export async function makeMove(page: Page, move: string) {
  const result = await page.evaluate((m) => {
    return (window as any).e2e_makeMove?.(m);
  }, move);
  
  if (!result) {
    throw new Error('Test hooks not available');
  }
  
  return result;
}

/**
 * Get the current game state
 * @param page - Playwright page object
 * @returns Game state including FEN, turn, move count, and PGN
 */
export async function getGameState(page: Page) {
  const state = await page.evaluate(() => {
    return (window as any).e2e_getGameState?.();
  });
  
  if (!state) {
    throw new Error('Test hooks not available');
  }
  
  return state;
}

/**
 * Wait for the engine to respond with a move
 * @param page - Playwright page object
 * @param expectedMoveCount - The move count to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 */
export async function waitForEngineResponse(page: Page, expectedMoveCount: number, timeout: number = 10000) {
  await page.waitForFunction(
    (count) => {
      const state = (window as any).e2e_getGameState?.();
      return state && state.moveCount >= count;
    },
    expectedMoveCount,
    { timeout, polling: 200 }
  );
  
  // Small additional wait for any UI animations
  await page.waitForTimeout(300);
}

/**
 * Wait for a specific element to be visible
 * Useful for waiting for UI updates after moves
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5000) {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

/**
 * Reset the game using the reset button
 */
export async function resetGame(page: Page) {
  await page.locator('button:has-text("Reset")').click();
  await page.waitForTimeout(500); // Allow time for reset
}

/**
 * Navigate to a specific training position and wait for it to load
 */
export async function navigateToTraining(page: Page, positionId: number) {
  await page.goto(`/train/${positionId}`);
  
  // Wait for the chessboard to be visible
  await page.locator('[data-square="a1"]').waitFor({ state: 'visible', timeout: 10000 });
  
  // Wait for engine initialization and test hooks to be ready
  await page.waitForFunction(() => (window as any).e2e_getGameState, null, { timeout: 5000 });
  await page.waitForTimeout(500); // Extra buffer
  
  // Verify we're in the right position by checking the game state
  const state = await getGameState(page);
  if (!state) {
    throw new Error('Failed to load training position');
  }
  
  return state;
}

/**
 * Common position FENs for reference
 */
export const KNOWN_POSITIONS = {
  // Opposition positions
  opposition1: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  // Bridge building (Brückenbau) positions
  // FEN for training ID 12: White K on c8, P on c7, R on e4. Black K on f7, R on b2.
  bridgeBuilding: '2K2k2/2P5/8/8/4R3/8/1r6/8 w - - 0 1',
  
  // Add more positions as needed
};

/**
 * Verify that we're at the expected position
 */
export async function verifyPosition(page: Page, expectedFen: string) {
  const state = await getGameState(page);
  if (state.fen !== expectedFen) {
    throw new Error(`Wrong position. Expected: ${expectedFen}, Got: ${state.fen}`);
  }
}