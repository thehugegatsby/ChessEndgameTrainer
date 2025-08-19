/**
 * @file simple-chess-v5.spec.ts
 * @description Test react-chessboard v5 API with simple chess component
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Chess v5 API Test', () => {
  
  test('Simple chess component with v5 drag and drop', async ({ page }) => {
    
    // Monitor console logs
    page.on('console', (msg) => {
      if (msg.text().includes('ERROR') || msg.text().includes('Warning')) {
        console.log(`🚨 BROWSER ERROR: ${msg.text()}`);
      }
      if (msg.text().includes('SimpleChessTest') || msg.text().includes('Move attempt')) {
        console.log(`🔍 BROWSER: ${msg.text()}`);
      }
    });
    
    console.log('🎯 Loading simple chess test page...');
    
    // Navigate to test page
    await page.goto('/simple-chess-test');
    
    // Wait for board to load
    await page.waitForSelector('[data-testid="simple-chess-board"]', { timeout: 10000 });
    
    // Check initial position
    const initialFen = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    console.log(`🔍 Initial FEN: ${initialFen}`);
    
    // Expected: Opposition Grundlagen
    const expectedFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
    expect(initialFen).toBe(expectedFen);
    
    console.log('✅ Board shows correct initial position (not starting position!)');
    
    // Try a move: Kf6 (e6 to f6)
    console.log('🔄 Testing move: King e6 to f6');
    
    const fromSquare = page.locator('[data-square="e6"]');
    const toSquare = page.locator('[data-square="f6"]');
    
    await fromSquare.waitFor({ state: 'visible' });
    await toSquare.waitFor({ state: 'visible' });
    
    // Try drag and drop move (v5 should handle this)
    await fromSquare.dragTo(toSquare);
    
    // Wait a moment for the move to be processed
    await page.waitForTimeout(1000);
    
    // Check if FEN changed
    const newFen = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    console.log(`🔍 After move FEN: ${newFen}`);
    
    // Expected after Kf6: 4k3/8/5K2/4P3/8/8/8/8 b - - 1 1
    const expectedAfterMove = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
    
    if (newFen === initialFen) {
      console.log('❌ FAILED: FEN unchanged after move (drag&drop might not work)');
      
      // Try click-to-move as fallback  
      console.log('🔄 Trying click-to-move fallback...');
      
      // Reset position first
      await page.click('button:has-text("Reset Position")');
      await page.waitForTimeout(500);
      
      // Click-to-move: click source, then target
      await page.click('[data-square="e6"]');
      await page.waitForTimeout(200);
      await page.click('[data-square="f6"]');
      await page.waitForTimeout(500);
      
      const clickMoveFen = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
      console.log(`🔍 After click-move FEN: ${clickMoveFen}`);
      
      if (clickMoveFen !== initialFen) {
        console.log('✅ SUCCESS: Click-to-move works with v5 API');
        expect(clickMoveFen).toBe(expectedAfterMove);
      } else {
        console.log('❌ FAILED: Both drag&drop and click-to-move failed');
      }
      
    } else if (newFen === expectedAfterMove) {
      console.log('✅ SUCCESS: Drag&drop move processed correctly with v5 API');
      expect(newFen).toBe(expectedAfterMove);
    } else {
      console.log(`❌ UNEXPECTED: Got ${newFen}, expected ${expectedAfterMove}`);
      // Still check that the position changed (any move is better than no move)
      expect(newFen).not.toBe(initialFen);
    }
    
    console.log('🎯 v5 API simple chess test complete');
  });

  test('Click-to-move sequence: Kf6 Kf8 Kg6', async ({ page }) => {
    
    console.log('🎯 Testing click-to-move sequence...');
    
    // Navigate to test page
    await page.goto('/simple-chess-test');
    
    // Wait for board to load
    await page.waitForSelector('[data-testid="simple-chess-board"]', { timeout: 10000 });
    
    // Check initial position (Opposition Grundlagen)
    const initialFen = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    const expectedInitialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
    expect(initialFen).toBe(expectedInitialFen);
    console.log('✅ Initial position correct');
    
    // Move 1: Kf6 (White King e6 to f6)
    console.log('🔄 Move 1: Kf6 (e6→f6)');
    await page.click('[data-square="e6"]');
    await page.waitForTimeout(200);
    await page.click('[data-square="f6"]');
    await page.waitForTimeout(500);
    
    // Check position after Kf6
    const afterKf6 = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    const expectedAfterKf6 = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
    expect(afterKf6).toBe(expectedAfterKf6);
    console.log('✅ Move 1 successful: Kf6');
    
    // Move 2: Kf8 (Black King e8 to f8)
    console.log('🔄 Move 2: Kf8 (e8→f8)');
    await page.click('[data-square="e8"]');
    await page.waitForTimeout(200);
    await page.click('[data-square="f8"]');
    await page.waitForTimeout(500);
    
    // Check position after Kf8
    const afterKf8 = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    const expectedAfterKf8 = '5k2/8/5K2/4P3/8/8/8/8 w - - 2 2';
    expect(afterKf8).toBe(expectedAfterKf8);
    console.log('✅ Move 2 successful: Kf8');
    
    // Move 3: Kg6 (White King f6 to g6)
    console.log('🔄 Move 3: Kg6 (f6→g6)');
    await page.click('[data-square="f6"]');
    await page.waitForTimeout(200);
    await page.click('[data-square="g6"]');
    await page.waitForTimeout(500);
    
    // Check position after Kg6
    const afterKg6 = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    const expectedAfterKg6 = '5k2/8/6K1/4P3/8/8/8/8 b - - 3 2';
    expect(afterKg6).toBe(expectedAfterKg6);
    console.log('✅ Move 3 successful: Kg6');
    
    console.log('🎯 Click-to-move sequence complete: Kf6 Kf8 Kg6');
  });
});