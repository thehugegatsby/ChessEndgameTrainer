/**
 * @fileoverview ModernDriver Navigation Test
 * @description Tests page navigation and routing functionality
 * 
 * SCOPE: URL navigation and page readiness
 * PATTERN: Verify navigation patterns and error handling
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('ModernDriver Navigation', () => {
  let driver: ModernDriver;

  test.beforeEach(async ({ page }) => {
    driver = new ModernDriver(page, { useTestBridge: true });
  });

  test.afterEach(async () => {
    await driver?.dispose();
  });

  test('should navigate to training page', async () => {
    await driver.visit('/train/1');
    
    // Verify URL
    expect(driver['page'].url()).toContain('/train/1');
    
    // Verify page is ready
    const state = await driver.getGameState();
    expect(state).toBeDefined();
    expect(state.status).toBe('playing');
  });

  test('should navigate to different scenarios', async () => {
    // Scenario 1
    await driver.visit('/train/1');
    let state = await driver.getGameState();
    expect(state.scenario).toBe(1);
    
    // Scenario 2
    await driver.visit('/train/2');
    state = await driver.getGameState();
    expect(state.scenario).toBe(2);
  });

  test('should handle absolute URLs', async () => {
    const baseUrl = driver['config'].baseUrl;
    await driver.visit(`${baseUrl}/train/1`);
    
    expect(driver['page'].url()).toContain('/train/1');
  });

  test('should wait for app readiness', async () => {
    // Visit page
    const startTime = Date.now();
    await driver.visit('/train/1');
    const loadTime = Date.now() - startTime;
    
    // Should have waited for ready state
    const bodyReady = await driver['page'].locator('body').getAttribute('data-app-ready');
    expect(bodyReady).toBe('true');
    
    // Load time should be reasonable
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle navigation errors', async () => {
    // Invalid route
    await expect(driver.visit('/invalid-route-12345')).rejects.toThrow();
    
    // Driver should still be functional
    await driver.visit('/train/1');
    const state = await driver.getGameState();
    expect(state).toBeDefined();
  });

  test('should inject E2E test mode flag', async () => {
    await driver.visit('/train/1');
    
    // Check if test mode flag is set
    const testMode = await driver['page'].evaluate(() => {
      return (window as any).__E2E_TEST_MODE__;
    });
    
    expect(testMode).toBe(true);
  });

  test('should handle rapid navigation', async () => {
    // Navigate multiple times quickly
    await driver.visit('/train/1');
    await driver.visit('/train/2');
    await driver.visit('/train/3');
    
    // Final state should be correct
    const state = await driver.getGameState();
    expect(state.scenario).toBe(3);
    expect(driver['page'].url()).toContain('/train/3');
  });

  test('should provide navigation timing info', async ({ page }) => {
    // Create driver with custom logger to capture timing
    let capturedLog: any;
    const customLogger = {
      info: (msg: string, data?: any) => {
        if (msg.includes('Application is ready')) {
          capturedLog = data;
        }
      },
      debug: () => {},
      warn: () => {},
      error: () => {}
    };
    
    const timedDriver = new ModernDriver(page, { 
      useTestBridge: true,
      logger: customLogger as any
    });
    
    await timedDriver.visit('/train/1');
    
    // Should have captured timing
    expect(capturedLog).toBeDefined();
    expect(capturedLog.totalDuration).toMatch(/\d+ms/);
    
    await timedDriver.dispose();
  });
});