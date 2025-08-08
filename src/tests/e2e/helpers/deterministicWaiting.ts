/**
 * Deterministic waiting helpers for E2E tests
 * 
 * Replaces hardcoded waitForTimeout() patterns with store-based waiting.
 * Part of Phase 3 E2E optimization - bulk migration from timeout-based to deterministic waiting.
 */

import { Page } from '@playwright/test';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('E2E-DeterministicWaiting');

/**
 * Wait for page to be fully loaded and interactive
 * Replaces: await page.waitForTimeout(E2E.TIMEOUTS.PAGE_LOAD)
 */
export async function waitForPageReady(page: Page): Promise<void> {
  logger.info("⏳ Waiting for page to be ready");
  
  // Wait for training board to be visible
  await page.waitForSelector('[data-testid="training-board"]', { 
    state: 'visible',
    timeout: 30000 
  });
  
  // Wait for store to be initialized
  await page.waitForFunction(
    () => {
      const store = (window as any).__e2e_store;
      if (!store) return false;
      const state = store.getState?.();
      // Check that game is initialized
      return state?.game?.currentFen !== undefined;
    },
    { timeout: 15000 }
  );
  
  logger.info("✅ Page ready");
}

/**
 * Wait for tablebase to be initialized and ready
 * Replaces: await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT)
 */
export async function waitForTablebaseInit(page: Page): Promise<void> {
  logger.info("⏳ Waiting for tablebase initialization");
  
  await page.waitForFunction(
    () => {
      const store = (window as any).__e2e_store;
      if (!store) return false;
      const state = store.getState?.();
      // Tablebase is ready when not loading
      return state?.tablebase?.analysisStatus !== 'loading';
    },
    { timeout: 15000 }
  );
  
  logger.info("✅ Tablebase initialized");
}

/**
 * Wait for UI overlays to disappear
 * Replaces: await page.waitForTimeout(1000) // Wait for overlays
 */
export async function waitForUIReady(page: Page): Promise<void> {
  logger.info("⏳ Waiting for UI to be ready");
  
  // Check for common overlays/modals
  const overlaySelectors = [
    '[data-testid="loading-overlay"]',
    '[data-testid="modal"]',
    '.modal-backdrop',
    '[role="dialog"]'
  ];
  
  for (const selector of overlaySelectors) {
    try {
      await page.waitForSelector(selector, { 
        state: 'hidden', 
        timeout: 5000 
      });
    } catch {
      // Selector might not exist, that's ok
    }
  }
  
  // Also check store for UI state
  await page.waitForFunction(
    () => {
      const store = (window as any).__e2e_store;
      if (!store) return true;
      const state = store.getState?.();
      // Check no modals are open
      return !state?.ui?.modal?.isOpen;
    },
    { timeout: 5000 }
  );
  
  logger.info("✅ UI ready");
}

/**
 * Wait for move animation to complete
 * Replaces: await page.waitForTimeout(300/500) // Animation
 */
export async function waitForMoveAnimation(page: Page): Promise<void> {
  // Check if move is being processed
  await page.waitForFunction(
    () => {
      const store = (window as any).__e2e_store;
      if (!store) return true;
      const state = store.getState?.();
      return state?.tablebase?.analysisStatus !== 'loading';
    },
    { timeout: 5000 }
  );
}

/**
 * Wait for toast message to appear and disappear
 * Replaces: await page.waitForTimeout(2000) // Toast
 */
export async function waitForToast(page: Page): Promise<void> {
  // Wait for toast to appear
  const toastSelector = '[data-testid^="toast-"]';
  try {
    await page.waitForSelector(toastSelector, { 
      state: 'visible', 
      timeout: 5000 
    });
    // Wait for it to disappear
    await page.waitForSelector(toastSelector, { 
      state: 'hidden', 
      timeout: 10000 
    });
  } catch {
    // No toast appeared, that's ok
  }
}

/**
 * Wait for opponent move to complete
 * Replaces: await page.waitForTimeout(E2E.TIMEOUTS.OPPONENT_MOVE)
 */
export async function waitForOpponentMove(page: Page): Promise<void> {
  logger.info("⏳ Waiting for opponent move");
  
  await page.waitForFunction(
    () => {
      const store = (window as any).__e2e_store;
      if (!store) return false;
      const state = store.getState?.();
      // Opponent is done when it's player's turn
      return state?.training?.isPlayerTurn === true &&
             state?.tablebase?.analysisStatus !== 'loading';
    },
    { timeout: 15000 }
  );
  
  logger.info("✅ Opponent move complete");
}

/**
 * Wait for network idle (all requests finished)
 * Replaces: await page.waitForTimeout(X) // Wait for network
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Combined wait for common test setup
 * Replaces multiple sequential waitForTimeout calls at test start
 */
export async function waitForTestReady(page: Page): Promise<void> {
  await waitForPageReady(page);
  await waitForTablebaseInit(page);
  await waitForUIReady(page);
}

/**
 * Smart wait that checks multiple conditions
 * Use when you're not sure what exactly to wait for
 */
export async function waitForStableState(page: Page): Promise<void> {
  await Promise.all([
    waitForUIReady(page),
    waitForMoveAnimation(page),
    page.waitForLoadState('domcontentloaded')
  ]);
}