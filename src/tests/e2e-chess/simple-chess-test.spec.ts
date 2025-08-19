/**
 * @file simple-chess-test.spec.ts
 * @description Test minimal chess.js + react-chessboard integration
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Chess Integration Test', () => {
  
  test('Minimal chess.js + react-chessboard test', async ({ page }) => {
    
    // Monitor console logs
    page.on('console', (msg) => {
      console.log(`🔍 BROWSER: ${msg.text()}`);
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
    
    // Try a move: Kf6 (e6 to f6)
    console.log('🔄 Testing move: King e6 to f6');
    
    const fromSquare = page.locator('[data-square="e6"]');
    const toSquare = page.locator('[data-square="f6"]');
    
    await fromSquare.waitFor({ state: 'visible' });
    await toSquare.waitFor({ state: 'visible' });
    
    // Drag and drop move
    await fromSquare.dragTo(toSquare);
    
    // Wait a moment for the move to be processed
    await page.waitForTimeout(500);
    
    // Check if FEN changed
    const newFen = await page.getAttribute('[data-testid="simple-chess-board"]', 'data-fen');
    console.log(`🔍 After move FEN: ${newFen}`);
    
    // Expected after Kf6: 4k3/8/5K2/4P3/8/8/8/8 b - - 1 1
    const expectedAfterMove = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
    
    if (newFen === initialFen) {
      console.log('❌ FAILED: FEN unchanged after move');
    } else if (newFen === expectedAfterMove) {
      console.log('✅ SUCCESS: Move processed correctly');
    } else {
      console.log(`❌ UNEXPECTED: Got ${newFen}, expected ${expectedAfterMove}`);
    }
    
    expect(newFen).toBe(expectedAfterMove);
    
    console.log('🎯 Simple chess test complete');
  });
});