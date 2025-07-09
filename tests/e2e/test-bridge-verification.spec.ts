/**
 * @fileoverview Test Bridge Verification
 * @description Verifies that the Test Bridge is properly initialized and functional
 */

import { test, expect, Page } from '@playwright/test';

// Extend Window interface for test flag
declare global {
  interface Window {
    IS_E2E_TEST?: boolean;
  }
}

test.describe('Test Bridge Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set HTTP header to signal E2E test mode
    // This ensures both server-side and client-side are in sync
    await page.setExtraHTTPHeaders({ 'x-e2e-test-mode': 'true' });
    
    // Navigate to the training page (using valid numeric ID)
    await page.goto('http://localhost:3002/train/1');
    
    // Wait for engine to be ready
    await page.waitForSelector('[data-engine-status="ready"]', { timeout: 10000 });
  });

  test('Test Bridge should be available in test mode', async ({ page }) => {
    // Check if Test Bridge is available
    const hasBridge = await page.evaluate(() => {
      return typeof window.__E2E_TEST_BRIDGE__ !== 'undefined';
    });
    
    expect(hasBridge).toBe(true);
  });

  test('Test Bridge should have all required methods', async ({ page }) => {
    const bridgeStructure = await page.evaluate(() => {
      const bridge = window.__E2E_TEST_BRIDGE__;
      if (!bridge) return null;
      
      return {
        hasEngine: typeof bridge.engine === 'object',
        hasWaitForReady: typeof bridge.waitForReady === 'function',
        hasEnableDebugLogging: typeof bridge.enableDebugLogging === 'function',
        hasDisableDebugLogging: typeof bridge.disableDebugLogging === 'function',
        engineMethods: {
          hasSetNextMove: typeof bridge.engine?.setNextMove === 'function',
          hasSetEvaluation: typeof bridge.engine?.setEvaluation === 'function',
          hasAddCustomResponse: typeof bridge.engine?.addCustomResponse === 'function',
          hasClearCustomResponses: typeof bridge.engine?.clearCustomResponses === 'function',
          hasReset: typeof bridge.engine?.reset === 'function',
        }
      };
    });
    
    expect(bridgeStructure).not.toBeNull();
    expect(bridgeStructure?.hasEngine).toBe(true);
    expect(bridgeStructure?.hasWaitForReady).toBe(true);
    expect(bridgeStructure?.hasEnableDebugLogging).toBe(true);
    expect(bridgeStructure?.hasDisableDebugLogging).toBe(true);
    
    // Check all engine methods
    expect(bridgeStructure?.engineMethods.hasSetNextMove).toBe(true);
    expect(bridgeStructure?.engineMethods.hasSetEvaluation).toBe(true);
    expect(bridgeStructure?.engineMethods.hasAddCustomResponse).toBe(true);
    expect(bridgeStructure?.engineMethods.hasClearCustomResponses).toBe(true);
    expect(bridgeStructure?.engineMethods.hasReset).toBe(true);
  });

  test('Test Bridge waitForReady should work', async ({ page }) => {
    const isReady = await page.evaluate(async () => {
      const bridge = window.__E2E_TEST_BRIDGE__;
      if (!bridge) return false;
      
      try {
        await bridge.waitForReady(5000);
        return true;
      } catch (error) {
        console.error('waitForReady failed:', error);
        return false;
      }
    });
    
    expect(isReady).toBe(true);
  });

  test('Test Bridge should accept mock engine configuration', async ({ page }) => {
    // Wait for Test Bridge to be available
    await page.waitForFunction(() => typeof window.__E2E_TEST_BRIDGE__ !== 'undefined', { timeout: 5000 });
    
    // This is a smoke test - verify we can call Test Bridge methods without errors
    const configurationSuccessful = await page.evaluate(() => {
      try {
        const bridge = window.__E2E_TEST_BRIDGE__;
        if (!bridge) throw new Error('Test Bridge not available');
        
        // Enable debug logging
        bridge.enableDebugLogging?.();
        
        // Test that we can call the configuration methods
        bridge.engine.setNextMove('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', 'Kf6');
        bridge.engine.setEvaluation('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', 123);
        bridge.engine.addCustomResponse('test-fen', {
          evaluation: 100,
          bestMove: 'e4',
          depth: 20,
          timeMs: 50
        });
        
        // If we get here without errors, configuration was successful
        return true;
      } catch (error) {
        console.error('Test Bridge configuration failed:', error);
        return false;
      }
    });
    
    expect(configurationSuccessful).toBe(true);
  });
});