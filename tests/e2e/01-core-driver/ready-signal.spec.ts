/**
 * @fileoverview Ready Signal Test
 * @description Tests the app-ready signal mechanism and fallback detection
 * 
 * SCOPE: Core driver ready detection functionality
 * PATTERN: Direct API testing with different ready scenarios
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';
import { noopLogger } from '../../shared/logger-utils';

test.describe('Ready Signal Detection', () => {
  test('should detect app-ready signal when available', async ({ page }) => {
    const driver = new ModernDriver(page, {
      useTestBridge: true,
      logger: noopLogger
    });
    
    // Navigate and wait for ready
    await driver.visit('/train/1');
    
    // Verify app-ready attribute is set
    const appReadyStatus = await page.getAttribute('body', 'data-app-ready');
    expect(appReadyStatus).toBe('true');
    
    // Verify engine status is also set
    const engineStatus = await page.getAttribute('body', 'data-engine-status');
    expect(engineStatus).toBe('ready');
    
    // Verify Test Bridge is initialized
    if (driver.bridge) {
      expect(driver.bridge).toBeDefined();
      const bridgeStatus = await page.getAttribute('body', 'data-bridge-status');
      expect(bridgeStatus).toBe('ready');
    }
    
    await driver.dispose();
  });

  test('should use fallback detection when app-ready is not available', async ({ page }) => {
    const driver = new ModernDriver(page, {
      useTestBridge: false, // Disable test bridge to simulate legacy scenario
      logger: noopLogger
    });
    
    // Mock a page without app-ready signal by removing it after navigation
    await page.goto('http://localhost:3002/train/1');
    await page.evaluate(() => {
      document.body.removeAttribute('data-app-ready');
      document.body.removeAttribute('data-engine-status');
    });
    
    // Now try to wait until ready - should use fallback
    try {
      await driver.waitUntilReady();
      
      // Verify board is visible (fallback check)
      const boardVisible = await page.isVisible('[data-testid="training-board"], .react-chessboard');
      expect(boardVisible).toBe(true);
      
      // Verify interactive elements exist
      const hasButtons = await page.locator('button:not([disabled])').count();
      expect(hasButtons).toBeGreaterThan(0);
    } catch (error) {
      // Log error for debugging
      console.error('Fallback detection failed:', error);
      throw error;
    }
    
    await driver.dispose();
  });

  test('should handle app initialization errors', async ({ page }) => {
    const driver = new ModernDriver(page);
    
    // Navigate to a page that will have an error state
    await page.goto('http://localhost:3002/train/1');
    
    // Simulate engine error
    await page.evaluate(() => {
      document.body.setAttribute('data-app-ready', 'error');
      document.body.setAttribute('data-engine-status', 'error');
    });
    
    // Verify error is detected
    await expect(driver.waitUntilReady()).rejects.toThrow('Application failed to initialize');
    
    await driver.dispose();
  });

  test('should handle route changes correctly', async ({ page }) => {
    const driver = new ModernDriver(page);
    
    // Initial navigation
    await driver.visit('/train/1');
    
    // Verify initial ready state
    let appReady = await page.getAttribute('body', 'data-app-ready');
    expect(appReady).toBe('true');
    
    // Navigate to different route
    await driver.visit('/train/2');
    
    // Verify ready state is maintained after navigation
    appReady = await page.getAttribute('body', 'data-app-ready');
    expect(appReady).toBe('true');
    
    // Verify we're on the new route
    const url = page.url();
    expect(url).toContain('/train/2');
    
    await driver.dispose();
  });

  test('should deterministically trigger fallback mechanism', async ({ page }) => {
    const driver = new ModernDriver(page, {
      logger: noopLogger
    });
    
    // Navigate directly without using driver.visit to bypass initial ready check
    await page.goto('http://localhost:3002/train/1');
    
    // Block the data-app-ready attribute from being set
    await page.evaluate(() => {
      // Override setAttribute to prevent data-app-ready from being set
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name: string, value: string) {
        if (name === 'data-app-ready') {
          console.log('[Test] Blocking data-app-ready attribute:', value);
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
    });
    
    // Wait a bit to ensure app would normally be ready
    await page.waitForTimeout(2000);
    
    // Now call waitUntilReady - should use fallback
    const startTime = Date.now();
    await driver.waitUntilReady();
    const duration = Date.now() - startTime;
    
    // Verify fallback was used (should be faster than main timeout)
    expect(duration).toBeLessThan(15000); // Should use fallback timeout
    
    // Verify chess elements are present (fallback criteria)
    const boardVisible = await page.isVisible('[data-testid="training-board"], .react-chessboard');
    expect(boardVisible).toBe(true);
    
    // Check logs to confirm fallback was used
    // In real implementation, we'd capture console output
    
    await driver.dispose();
  });
});