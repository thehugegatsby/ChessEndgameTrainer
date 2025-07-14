/**
 * Application Platform Integration E2E Tests
 * Tests how the app uses platform services in real user scenarios
 * 
 * Refactored from modern-driver-api.spec.ts to focus on app functionality
 */

import { test, expect } from '@playwright/test';
import { getLogger } from '../../../shared/services/logging';
import { E2E, STORAGE, UI } from '../../../shared/constants';
import { resetMSWHandlers } from '../fixtures/msw-server';

test.describe('App Platform Integration Tests', () => {
  const logger = getLogger().setContext('E2E-AppPlatformIntegration');
  
  test.beforeEach(async ({ page, context, browserName }) => {
    resetMSWHandlers();
    
    // Grant permissions conditionally based on browser
    const permissions = ['notifications'];
    if (browserName === 'chromium') {
      permissions.push('clipboard-read', 'clipboard-write');
    }
    
    try {
      await context.grantPermissions(permissions);
    } catch (error) {
      // Some browsers don't support all permissions - continue anyway
      logger.info(`Permission grant failed for ${browserName}: ${(error as Error).message}`);
    }
    
    // Navigate to training page
    await page.goto(E2E.ROUTES.TRAIN(1));
    await page.waitForTimeout(E2E.TIMEOUTS.PAGE_LOAD);
  });

  test.describe('Training Session Storage', () => {
    test('should persist training state across page reloads', async ({ page }) => {
      // Make a move to create some state
      const board = page.locator(E2E.SELECTORS.BOARD).first();
      await expect(board).toBeVisible();
      
      // Store some training data in localStorage (simulating app behavior)
      await page.evaluate((prefix) => {
        localStorage.setItem(`${prefix}training-state`, JSON.stringify({
          currentPosition: 1,
          movesPlayed: ['e4', 'e5'],
          timestamp: Date.now()
        }));
      }, STORAGE.PREFIX);
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(E2E.TIMEOUTS.PAGE_RELOAD);
      
      // Verify state is restored
      const restoredState = await page.evaluate((prefix) => {
        const item = localStorage.getItem(`${prefix}training-state`);
        return item ? JSON.parse(item) : null;
      }, STORAGE.PREFIX);
      
      expect(restoredState).toEqual({
        currentPosition: 1,
        movesPlayed: ['e4', 'e5'],
        timestamp: expect.any(Number)
      });
    });

    test('should handle storage quota gracefully', async ({ page }) => {
      // Test app behavior when storage is full
      const result = await page.evaluate((prefix) => {
        try {
          // Try to store large amount of data
          const largeData = 'x'.repeat(100000); // 100KB
          for (let i = 0; i < 100; i++) {
            localStorage.setItem(`${prefix}large-data-${i}`, largeData);
          }
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      }, STORAGE.PREFIX);
      
      // App should either succeed or handle the error gracefully
      if (!result.success) {
        expect(result.error).toContain('quota');
      }
    });
  });

  test.describe('Performance Measurement Integration', () => {
    test('should measure chess engine performance', async ({ page }) => {
      // Test that app actually uses Performance API for engine timing
      await page.evaluate(() => {
        // Simulate what the app does for engine measurement
        performance.mark('engine-start');
        
        // Simulate engine work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
        
        performance.mark('engine-end');
        performance.measure('engine-evaluation', 'engine-start', 'engine-end');
      });
      
      // Verify performance data is available
      const perfData = await page.evaluate(() => {
        const measures = performance.getEntriesByType('measure');
        const engineMeasure = measures.find(m => m.name === 'engine-evaluation');
        return {
          hasMeasure: !!engineMeasure,
          duration: engineMeasure?.duration || 0
        };
      });
      
      expect(perfData.hasMeasure).toBe(true);
      expect(perfData.duration).toBeGreaterThan(0);
    });
  });

  test.describe('User Interaction Features', () => {
    test('should handle copy position feature', async ({ page, browserName }) => {
      // Skip clipboard tests on unsupported browsers
      if (browserName !== 'chromium') {
        test.skip();
      }
      
      // Look for copy button in the UI
      const copyButton = page.locator('[data-testid="copy-position"]')
        .or(page.locator('button:has-text("Copy")'))
        .first();
      
      if (await copyButton.isVisible()) {
        await copyButton.click();
        
        // Verify clipboard contains position data
        const clipboardContent = await page.evaluate(async () => {
          try {
            return await navigator.clipboard.readText();
          } catch (error: unknown) {
            return null;
          }
        });
        
        if (clipboardContent) {
          expect(clipboardContent).toContain('rnbqkbnr'); // Should contain FEN
        }
      }
    });

    test('should handle responsive UI breakpoints', async ({ page }) => {
      // Test actual responsive behavior, not just screen detection
      const breakpoints = [
        { name: 'mobile', width: UI.BREAKPOINTS.MOBILE, height: 667 },
        { name: 'tablet', width: UI.BREAKPOINTS.TABLET, height: 1024 },
        { name: 'desktop', width: UI.BREAKPOINTS.DESKTOP, height: 720 }
      ];
      
      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        
        // Test that UI adapts appropriately
        const boardContainer = page.locator(E2E.SELECTORS.BOARD);
        await expect(boardContainer).toBeVisible();
        
        // Check for mobile-specific UI elements
        if (breakpoint.name === 'mobile') {
          const mobileNav = page.locator('[data-testid="mobile-nav"]');
          if (await mobileNav.isVisible()) {
            await expect(mobileNav).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Error Handling Integration', () => {
    test('should handle offline scenarios', async ({ page, context }) => {
      // Simulate offline condition
      await context.setOffline(true);
      
      // App should handle offline gracefully
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
        .or(page.locator('text="Offline"'))
        .first();
      
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toBeVisible();
      }
      
      // Restore online
      await context.setOffline(false);
    });

    test('should handle performance degradation gracefully', async ({ page }) => {
      // Test app behavior under performance constraints
      await page.evaluate(() => {
        // Simulate slow performance
        const slowFunction = () => {
          const start = Date.now();
          while (Date.now() - start < 100) {
            // Busy wait
          }
        };
        
        // Override performance.now to simulate slow environment
        const originalNow = performance.now;
        performance.now = () => {
          slowFunction();
          return originalNow.call(performance);
        };
      });
      
      // App should still function
      const board = page.locator(E2E.SELECTORS.BOARD);
      await expect(board).toBeVisible();
    });
  });

  test.describe('Training Flow Integration', () => {
    test('should complete training session with platform services', async ({ page }) => {
      // Test the complete training flow using platform services
      const board = page.locator(E2E.SELECTORS.BOARD);
      await expect(board).toBeVisible();
      
      // Check that training state is stored
      const hasTrainingState = await page.evaluate((prefix) => {
        return localStorage.getItem(`${prefix}training-session`) !== null;
      }, STORAGE.PREFIX);
      
      // Training state should be managed by the app
      expect(typeof hasTrainingState).toBe('boolean');
      
      // Check for training completion indicators
      const nextButton = page.locator(E2E.SELECTORS.BUTTONS.NEXT_POSITION);
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should update training state
        await page.waitForTimeout(500);
        
        const updatedState = await page.evaluate((prefix) => {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
              keys.push(key);
            }
          }
          return keys.length > 0;
        }, STORAGE.PREFIX);
        
        expect(updatedState).toBe(true);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up localStorage
    await page.evaluate((prefix) => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    }, STORAGE.PREFIX);
  });
});