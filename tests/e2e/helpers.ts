/**
 * E2E Test Helpers
 * Common helper functions for Playwright E2E tests
 * Uses test constants and existing utilities for reliability
 */

import { Page } from '@playwright/test';
// @ts-ignore - JS constants file
import { SELECTORS, TIMEOUTS, TEST_BRIDGE, ERROR_MESSAGES, NAVIGATION_CONFIG, ANIMATION } from './config/constants';
import { waitForCondition, withRetry } from './firebase/firebase.utils';

/**
 * Navigate to the home page
 */
export async function navigateToHomePage(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Wait for a key element to ensure app is ready
  await page.waitForSelector('body', { timeout: TIMEOUTS.WAIT_FOR_SELECTOR });
}

/**
 * Navigate to a specific training position with retry logic
 */
export async function navigateToTrainingPage(page: Page, positionId: number = 1): Promise<void> {
  await withRetry(
    async () => {
      await page.goto(`/train/${positionId}`, { 
        timeout: TIMEOUTS.NAVIGATION,
        waitUntil: 'domcontentloaded' 
      });
      // Verify navigation succeeded by checking for board
      const boardSelector = SELECTORS.BOARD.split(', ')[0];
      await page.waitForSelector(boardSelector, { 
        timeout: TIMEOUTS.WAIT_FOR_SELECTOR,
        state: 'visible'
      });
    },
    NAVIGATION_CONFIG.RETRIES,
    NAVIGATION_CONFIG.DELAY_MS
  );
}

/**
 * Wait for the chess board to load
 * Handles multiple possible board selectors
 */
export async function waitForBoardLoad(page: Page): Promise<void> {
  const boardSelectors = SELECTORS.BOARD.split(', ');
  
  // Try each selector with proper timeout
  for (const selector of boardSelectors) {
    try {
      await page.waitForSelector(selector.trim(), { 
        timeout: TIMEOUTS.WAIT_FOR_SELECTOR,
        state: 'visible'
      });
      console.log(`Board found using selector: ${selector}`);
      return;
    } catch {
      // Try next selector
    }
  }
  
  throw new Error(ERROR_MESSAGES.BOARD_NOT_FOUND);
}

/**
 * Enable the analysis panel if not already enabled
 */
export async function enableAnalysisPanel(page: Page): Promise<void> {
  const analysisButton = page.locator('[data-testid="toggle-analysis"]');
  
  // Check if analysis is already on by looking at button text
  const buttonText = await analysisButton.textContent();
  if (buttonText?.includes('AN')) {
    console.log('[E2E Helper] Clicking analysis button to enable analysis panel');
    await analysisButton.click();
    
    // Wait for panel to be visible instead of fixed timeout
    const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    await evaluationPanel.waitFor({ 
      state: 'visible', 
      timeout: TIMEOUTS.ANIMATION 
    });
    console.log('[E2E Helper] Analysis panel is now visible');
  } else {
    console.log('[E2E Helper] Analysis panel is already enabled');
  }
}

/**
 * Make a chess move using test bridge with DOM fallback
 * Logs which method was used for transparency
 */
export async function makeMove(page: Page, from: string, to: string): Promise<void> {
  // Try test bridge first for speed and reliability
  const bridgeSuccess = await page.evaluate(
    ({ fn, from, to }) => {
      if (typeof (window as any)[fn] === 'function') {
        try {
          return (window as any)[fn](from, to);
        } catch (error) {
          console.error('Test bridge move failed:', error);
          return false;
        }
      }
      return false;
    },
    { fn: TEST_BRIDGE.FUNCTIONS.MAKE_MOVE, from, to }
  );
  
  if (bridgeSuccess) {
    console.log(`Move ${from}-${to} executed via test bridge`);
  } else {
    console.log(`Move ${from}-${to} falling back to DOM clicks`);
    // Fallback to click method
    await page.locator(`[data-square="${from}"]`).click();
    await page.locator(`[data-square="${to}"]`).click();
  }
  
  // Wait for move animation to complete
  // Use a deterministic wait instead of fixed timeout
  await waitForMoveCompletion(page);
}

/**
 * Wait for a move to complete by checking board state
 */
async function waitForMoveCompletion(page: Page): Promise<void> {
  // Wait for any move animations to complete
  await page.waitForTimeout(ANIMATION.MOVE_DURATION);
  
  // Then wait for board to be interactive again
  // This could be improved by waiting for a specific state change
  await waitForCondition(
    async () => {
      // Check if board is accepting input (no pending animations)
      const board = page.locator(SELECTORS.BOARD.split(', ')[0]);
      const isReady = await board.evaluate(el => {
        // Check if element has any animation classes or disabled state
        return !el.classList.contains('animating') && 
               !el.classList.contains('disabled') &&
               !el.hasAttribute('data-animating');
      }).catch(() => true); // Default to ready if check fails
      return isReady;
    },
    TIMEOUTS.ANIMATION
  );
}

/**
 * Get the current FEN position using test bridge
 */
export async function getCurrentFen(page: Page): Promise<string> {
  const fen = await page.evaluate((getFenFn) => {
    if (typeof (window as any)[getFenFn] === 'function') {
      try {
        return (window as any)[getFenFn]();
      } catch (error) {
        console.error('Test bridge getFEN failed:', error);
      }
    }
    // Fallback: try to get from game state if available
    if ((window as any).gameState?.fen) {
      return (window as any).gameState.fen;
    }
    return '';
  }, TEST_BRIDGE.FUNCTIONS.GET_FEN);
  
  if (!fen) {
    console.warn('Could not retrieve FEN position');
  }
  
  return fen;
}

/**
 * Wait for engine response with proper error handling
 */
export async function waitForEngineResponse(page: Page): Promise<void> {
  const evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
  
  // First ensure panel is visible
  await evaluationPanel.waitFor({ 
    state: 'visible', 
    timeout: TIMEOUTS.WAIT_FOR_SELECTOR 
  });
  
  // Then wait for engine moves to appear
  await waitForCondition(
    async () => {
      // Check if we have engine moves (not "No engine moves")
      const noMovesVisible = await evaluationPanel
        .locator('text="No engine moves"')
        .isVisible()
        .catch(() => false);
      
      // Also check if we have actual moves
      const hasMovesDisplayed = await evaluationPanel
        .locator('[class*="font-medium"][class*="text-gray-200"]')
        .count()
        .then(count => count > 0)
        .catch(() => false);
      
      return !noMovesVisible && hasMovesDisplayed;
    },
    TIMEOUTS.ENGINE_RESPONSE,
    500 // Poll every 500ms
  );
}

/**
 * Get board element with index support for multiple boards
 */
export async function getBoardElement(page: Page, index: number = 0): Promise<any> {
  const boardSelectors = SELECTORS.BOARD.split(', ');
  
  for (const selector of boardSelectors) {
    const elements = page.locator(selector.trim());
    const count = await elements.count();
    
    if (count > index) {
      console.log(`Board element found using selector: ${selector} at index ${index}`);
      return elements.nth(index);
    }
  }
  
  throw new Error(`${ERROR_MESSAGES.BOARD_NOT_FOUND} at index ${index}`);
}

/**
 * Set position using test bridge
 */
export async function setPosition(page: Page, fen: string): Promise<boolean> {
  return await page.evaluate(
    ({ fn, fen }) => {
      if (typeof (window as any)[fn] === 'function') {
        try {
          (window as any)[fn](fen);
          return true;
        } catch (error) {
          console.error('Test bridge setPosition failed:', error);
          return false;
        }
      }
      return false;
    },
    { fn: TEST_BRIDGE.FUNCTIONS.SET_POSITION, fen }
  );
}