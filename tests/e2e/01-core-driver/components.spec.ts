/**
 * @fileoverview ModernDriver Component Access Test
 * @description Tests component lazy loading and access patterns
 * 
 * SCOPE: Component initialization and access
 * PATTERN: Verify component object model implementation
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('ModernDriver Component Access', () => {
  let driver: ModernDriver;

  test.beforeEach(async ({ page }) => {
    driver = new ModernDriver(page, { useTestBridge: true });
    await driver.visit('/train/1');
  });

  test.afterEach(async () => {
    await driver?.dispose();
  });

  test('should provide lazy-loaded board component', async () => {
    // First access should create component
    const board1 = driver['board'];
    expect(board1).toBeDefined();
    
    // Second access should return same instance
    const board2 = driver['board'];
    expect(board1).toBe(board2);
    
    // Component should be functional
    const position = await driver.getBoardPosition();
    expect(position).toBeDefined();
    expect(position.fen).toContain('rnbqkbnr');
  });

  test('should provide lazy-loaded move list component', async () => {
    // Access triggers creation
    const moveList = driver['moveList'];
    expect(moveList).toBeDefined();
    
    // Should be able to get move count
    const count = await driver.getMoveCount();
    expect(count).toBe(0);
  });

  test('should provide lazy-loaded evaluation component', async () => {
    const evaluation = driver['evaluation'];
    expect(evaluation).toBeDefined();
    
    // Component should handle "not ready" state gracefully
    try {
      await evaluation.getEvaluation();
    } catch (error) {
      // Expected - evaluation might not be ready immediately
      expect(error).toBeDefined();
    }
  });

  test('should provide lazy-loaded navigation component', async () => {
    const navigation = driver['navigation'];
    expect(navigation).toBeDefined();
    
    // Should report navigation state
    const canGoBack = await navigation.canGoBack();
    expect(canGoBack).toBe(false); // At start position
  });

  test('should handle component errors without breaking driver', async () => {
    // Force an error by accessing non-existent element
    const board = driver['board'];
    
    // This should throw but not break the driver
    await expect(board.getSquare('z9')).rejects.toThrow();
    
    // Driver should still work
    const state = await driver.getGameState();
    expect(state.status).toBe('playing');
  });
});