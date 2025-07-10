import { Page } from '@playwright/test';

/**
 * Centralized test helpers for E2E tests
 * Uses the test hooks exposed by TrainingBoardZustand
 */

/**
 * Get the test API metadata from window object, checking all known patterns
 * @param page - Playwright page object
 * @returns Metadata about available test API
 */
export async function getTestApi(page: Page) {
  return await page.evaluate(() => {
    const win = window as any;
    
    // Check all known patterns in order of preference
    // Pattern 1: Direct e2e_ functions (currently used)
    if (win.e2e_makeMove && win.e2e_getGameState) {
      return {
        pattern: 'e2e_functions',
        hasWaitForEngine: !!win.e2e_waitForEngine,
        hasConfigureEngine: !!win.e2e_configureEngine
      };
    }
    
    // Pattern 2: __testApi object (for future use)
    if (win.__testApi) {
      return {
        pattern: '__testApi',
        hasWaitForEngine: !!win.__testApi.waitForEngine,
        hasConfigureEngine: !!win.__testApi.configureEngine
      };
    }
    
    // Pattern 3: makeTestMove (alternative pattern)
    if (win.makeTestMove) {
      return {
        pattern: 'makeTestMove',
        hasWaitForEngine: !!win.waitForTestEngine,
        hasConfigureEngine: !!win.configureTestEngine
      };
    }
    
    return null;
  });
}

/**
 * Make a chess move using the test hook
 * @param page - Playwright page object
 * @param move - Move in format 'from-to' (e.g., 'c8-d7') or SAN notation
 * @returns Promise with success status and optional error
 */
export async function makeMove(page: Page, move: string) {
  // Ensure engine is ready before making moves
  await waitForEngineReady(page);
  
  // First check if the test hook is available
  const hookAvailable = await page.evaluate(() => {
    return typeof (window as any).e2e_makeMove === 'function';
  });
  
  if (!hookAvailable) {
    throw new Error('e2e_makeMove function not found on window object');
  }
  
  // Execute the move
  const result = await page.evaluate(async (m) => {
    const moveFunc = (window as any).e2e_makeMove;
    try {
      const res = await moveFunc(m);
      return res;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, move);
  
  if (!result) {
    throw new Error('makeMove returned null/undefined');
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
 * Wait for the engine to be ready before making moves.
 * This ensures the ScenarioEngine is initialized and ready to handle moves.
 * @param page - The Playwright page object
 * @param timeout - Maximum time to wait in milliseconds (default: 10000ms)
 */
export async function waitForEngineReady(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForSelector('[data-testid="training-board"][data-engine-status="ready"]', { timeout });
}

/**
 * Wait for the engine to respond with a move
 * @param page - Playwright page object
 * @param expectedMoveCount - The move count to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 */
export async function waitForEngineResponse(page: Page, expectedMoveCount: number, timeout: number = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const state = await getGameState(page);
      if (state && state.moveCount >= expectedMoveCount) {
        // Small additional wait for any UI animations
        await page.waitForTimeout(300);
        return;
      }
    } catch (error) {
      // API might not be ready yet, continue polling
    }
    
    await page.waitForTimeout(200); // Poll interval
  }
  
  throw new Error(`Engine did not respond within ${timeout}ms. Expected move count: ${expectedMoveCount}`);
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
  
  // Wait for engine to be ready before proceeding
  await waitForEngineReady(page);
  
  // Wait for test hooks to be ready
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
  bridgeBuilding: '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1',
  
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

/**
 * Configure the engine for testing
 * @param page - Playwright page object
 * @param config - Engine configuration
 */
export async function configureEngine(page: Page, config: {
  deterministic?: boolean;
  fixedResponses?: Record<string, string>;
  timeLimit?: number;
}) {
  await page.evaluate((cfg) => {
    const win = window as any;
    
    // Check if configureEngine is available
    if (!win.__testApi?.configureEngine) {
      throw new Error('configureEngine not available');
    }
    
    // Convert object to Map if needed for compatibility
    const apiConfig = {
      ...cfg,
      fixedResponses: cfg.fixedResponses ? new Map(Object.entries(cfg.fixedResponses)) : undefined
    };
    
    return win.__testApi.configureEngine(apiConfig);
  }, config);
}

/**
 * Wait for engine to be ready (alternative to waitForEngineResponse)
 * @param page - Playwright page object  
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForEngine(page: Page, timeout: number = 10000): Promise<boolean> {
  // Check if __testApi.waitForEngine is available
  const hasWaitForEngine = await page.evaluate(() => {
    return !!(window as any).__testApi?.waitForEngine;
  });
  
  if (!hasWaitForEngine) {
    // Fallback to checking move count
    const initialState = await getGameState(page);
    const initialMoveCount = initialState.moveCount;
    
    // Wait for exactly one more move (the engine's response)
    await waitForEngineResponse(page, initialMoveCount + 1, timeout);
    return true;
  }
  
  return await page.evaluate(async (t) => {
    return await (window as any).__testApi.waitForEngine(t);
  }, timeout);
}