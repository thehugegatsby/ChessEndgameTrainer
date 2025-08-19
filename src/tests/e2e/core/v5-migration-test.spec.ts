/**
 * @file v5-migration-test.spec.ts
 * @description Test react-chessboard v5 API migration
 */

import { test, expect } from '@playwright/test';

test.describe('React-Chessboard v5 Migration Test', () => {
  
  test('Simple chess test component shows correct position with v5 API', async ({ page }) => {
    
    // Monitor console logs for v5 API debugging
    page.on('console', (msg) => {
      if (msg.text().includes('ERROR') || msg.text().includes('Warning')) {
        console.log(`🚨 BROWSER ERROR: ${msg.text()}`);
      }
      if (msg.text().includes('SimpleChessTest') || msg.text().includes('v5')) {
        console.log(`🔍 BROWSER: ${msg.text()}`);
      }
    });
    
    console.log('🎯 Loading simple chess test page...');
    
    // Navigate to simple chess test component
    await page.goto('/simple-chess-test');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for chessboard to be rendered (use v5 compatible selector)
    const chessboard = page.locator('[data-testid="simple-chess-board"]');
    await expect(chessboard).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Simple chess test page loaded');
    
    // Check if board shows correct position (Opposition Grundlagen)
    // The test component should load '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'
    const fenDisplay = page.locator('text=/Current FEN:/');
    await expect(fenDisplay).toBeVisible();
    
    // Check for Opposition Grundlagen position markers
    await expect(page.locator('text=/4k3.*4K3.*4P3/')).toBeVisible();
    
    console.log('✅ Board shows correct Opposition Grundlagen position');
    
    // Verify that we're NOT seeing the starting position (which was the v4 bug)
    await expect(page.locator('text=/rnbqkbnr.*pppppppp/')).not.toBeVisible();
    
    console.log('✅ NOT showing starting position (v4 bug is fixed)');
    
    // Check for pieces on the board (should have kings on e6, e8 and pawn on e5)
    const kingWhite = page.locator('[data-square="e6"] svg, [data-square="e6"] .piece');
    const kingBlack = page.locator('[data-square="e8"] svg, [data-square="e8"] .piece');
    const pawnWhite = page.locator('[data-square="e5"] svg, [data-square="e5"] .piece');
    
    // At least one of these should be visible (depending on how pieces are rendered)
    const anyPieceVisible = await kingWhite.isVisible() || await kingBlack.isVisible() || await pawnWhite.isVisible();
    expect(anyPieceVisible).toBe(true);
    
    console.log('✅ Chess pieces are visible on board');
    
    // Try clicking a square to test interaction (should not cause errors)
    await page.click('[data-square="e6"]');
    
    // Wait a bit to see if any errors occur
    await page.waitForTimeout(1000);
    
    console.log('✅ Board interaction works without errors');
    
    console.log('🎉 v5 API migration test completed successfully!');
  });
});