/**
 * @fileoverview ModernDriver Lifecycle Test
 * @description Tests initialization, disposal, and error handling of ModernDriver
 * 
 * SCOPE: Core driver functionality - no business logic
 * PATTERN: Direct API testing with minimal UI interaction
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('ModernDriver Lifecycle', () => {
  test('should initialize with default configuration', async ({ page }) => {
    const driver = new ModernDriver(page);
    
    // Verify driver is created
    expect(driver).toBeDefined();
    
    // Verify default config
    expect(driver['config'].defaultTimeout).toBe(30000);
    expect(driver['config'].useTestBridge).toBe(true); // Default is true in test env
    
    await driver.dispose();
  });

  test('should initialize with custom configuration', async ({ page }) => {
    const driver = new ModernDriver(page, {
      defaultTimeout: 60000,
      useTestBridge: true,
      baseUrl: 'http://custom.local'
    });
    
    expect(driver['config'].defaultTimeout).toBe(60000);
    expect(driver['config'].useTestBridge).toBe(true);
    expect(driver['config'].baseUrl).toBe('http://custom.local');
    
    await driver.dispose();
  });

  test('should handle multiple initialization and disposal cycles', async ({ page }) => {
    // First cycle
    let driver = new ModernDriver(page);
    await driver.visit('/');
    await driver.dispose();
    
    // Second cycle - should work without issues
    driver = new ModernDriver(page);
    await driver.visit('/');
    await driver.dispose();
    
    // Verify no memory leaks or hanging resources
    expect(driver['_board']).toBeUndefined();
    expect(driver['_moveList']).toBeUndefined();
  });

  test('should handle errors gracefully during initialization', async ({ page }) => {
    const driver = new ModernDriver(page);
    
    // Try to visit invalid URL
    await expect(driver.visit('not-a-valid-url')).rejects.toThrow();
    
    // Driver should still be functional after error
    await driver.visit('/');
    const state = await driver.getGameState();
    expect(state).toBeDefined();
    
    await driver.dispose();
  });

  test('should clean up Test Bridge on disposal', async ({ page }) => {
    const driver = new ModernDriver(page, { useTestBridge: true });
    await driver.visit('/');
    
    // Verify Test Bridge is initialized
    expect(driver.bridge).toBeDefined();
    
    // Dispose and verify cleanup
    await driver.dispose();
    expect(driver['_bridge']).toBeUndefined();
  });
});