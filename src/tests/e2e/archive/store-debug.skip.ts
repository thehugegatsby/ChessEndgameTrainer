// @vitest-skip
/**
 * Debug test to check store availability
 */

import { test, expect } from '@playwright/test';

test.describe('Store Debug', () => {
  test('should check if store is exposed', async ({ page }) => {
    await page.goto('/train/1');

    // Wait for page to load
    await page.waitForSelector('[data-testid="training-board"]', { timeout: 10000 });

    // Check what's available on window
    const windowKeys = await page.evaluate(() => {
      const keys = Object.keys(window);
      const storeRelated = keys.filter(
        k => k.includes('store') || k.includes('Store') || k.includes('e2e') || k.includes('E2E')
      );

      return {
        allKeys: keys.length,
        storeKeys: storeRelated,
        hasE2EStore: Boolean((window as any).__e2e_store),
        e2eStoreType: typeof (window as any).__e2e_store,
        processEnv: (window as any).process?.env?.NEXT_PUBLIC_IS_E2E_TEST,
        nodeEnv: (window as any).process?.env?.NODE_ENV,
      };
    });

    console.log('Window inspection:', windowKeys);

    // Try to get store state
    const storeState = await page.evaluate(() => {
      const store = (window as any).__e2e_store;
      if (!store) return null;

      try {
        const state = store.getState?.();
        return {
          hasGetState: Boolean(store.getState),
          stateKeys: state ? Object.keys(state) : [],
          gameKeys: state?.game ? Object.keys(state.game) : [],
          trainingKeys: state?.training ? Object.keys(state.training) : [],
          tablebaseKeys: state?.tablebase ? Object.keys(state.tablebase) : [],
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    });

    console.log('Store state:', storeState);

    // Assert store is available
    expect(windowKeys.hasE2EStore).toBe(true);
    expect(storeState).not.toBeNull();
  });
});
