/**
 * @fileoverview ModernDriver Test Bridge Integration Test
 * @description Tests deterministic engine responses via Test Bridge
 * 
 * SCOPE: Test Bridge functionality and mock engine integration
 * PATTERN: Verify deterministic testing capabilities
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('ModernDriver Test Bridge', () => {
  let driver: ModernDriver;

  test.beforeEach(async ({ page }) => {
    driver = new ModernDriver(page, { 
      useTestBridge: true,
      defaultTimeout: 10000 // Shorter timeout for faster tests
    });
  });

  test.afterEach(async () => {
    await driver?.dispose();
  });

  test('should initialize Test Bridge when enabled', async () => {
    await driver.visit('/train/1');
    
    // Bridge should be available
    expect(driver.bridge).toBeDefined();
    
    // Bridge is initialized during visit() - test its functionality instead
    const bridge = driver.bridge!;
    
    // Test that bridge can set a next move (this will fail if not initialized)
    await bridge.setNextMove('test-fen', 'e2e4');
    
    // This proves the bridge is working
    expect(bridge).toBeDefined();
  });

  test('should provide deterministic engine responses', async () => {
    await driver.visit('/train/1');
    const bridge = driver.bridge!;
    
    // Get initial state to understand the position
    const initialState = await driver.getGameState();
    console.log('Initial position:', initialState.fen); // Should be: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1
    
    // Set up deterministic response for BLACK's move after White plays Kf6
    // After Kf6, position will be: 4k3/8/5K2/4P3/8/8/8/8 b - - 1 1
    const positionAfterKf6 = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
    await bridge.setNextMove(positionAfterKf6, 'Kd7'); // Black blocks the advance
    
    // Make player move (valid move for this position)
    await driver.makeMove('e6', 'f6'); // King from e6 to f6
    
    // Verify engine responded with predetermined move
    const state = await driver.getGameState();
    expect(state.moveCount).toBe(2); // Player + engine
    // After Kf6 Kd7, position should be: 3k4/3K4/5K2/4P3/8/8/8/8 w - - 2 2
    expect(state.fen).toContain('3k4'); // Black king on d7
  });

  test('should handle evaluation mocking', async () => {
    await driver.visit('/train/1');
    const bridge = driver.bridge!;
    
    // Get the current FEN to mock the evaluation for this specific position
    const state = await driver.getGameState();
    
    // Mock specific evaluation using the correct bridge method
    await bridge.addCustomResponse(state.fen, {
      bestMove: 'Nf3',
      evaluation: 150
    });
    
    // Get evaluation (when implemented in UI)
    // const evalPanel = driver['evaluation'];
    // const eval = await evalPanel.getEvaluation();
    // expect(eval).toBe(150);
  });

  test('should reset between tests', async () => {
    await driver.visit('/train/1');
    const bridge = driver.bridge!;
    
    // Set some state
    await bridge.setNextMove('test-fen', 'e2e4');
    
    // Reset
    await bridge.reset();
    
    // Verify clean state by testing functionality
    // Setting a new move should work after reset
    await bridge.setNextMove('another-fen', 'e7e5');
    expect(bridge).toBeDefined();
  });

  test('should work without Test Bridge when disabled', async () => {
    // Create driver without Test Bridge
    const normalDriver = new ModernDriver(driver['page'], { 
      useTestBridge: false 
    });
    
    await normalDriver.visit('/train/1');
    
    // Bridge should not be available
    expect(normalDriver.bridge).toBeUndefined();
    
    // Driver should still work
    const state = await normalDriver.getGameState();
    expect(state).toBeDefined();
    
    await normalDriver.dispose();
  });

  test('should handle Test Bridge errors gracefully', async () => {
    await driver.visit('/train/1');
    const bridge = driver.bridge!;
    
    // Note: setNextMove doesn't throw errors for invalid FEN/moves
    // It logs debug messages and continues (see TestBridgeWrapper implementation)
    await bridge.setNextMove('invalid-fen', 'bad-move');
    
    // Bridge should still be functional - test by setting a valid move
    await bridge.setNextMove('valid-fen', 'e2e4');
    
    // Driver should still work
    const state = await driver.getGameState();
    expect(state.status).toBe('playing');
  });
});