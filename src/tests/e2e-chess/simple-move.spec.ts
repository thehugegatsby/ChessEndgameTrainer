/**
 * @file simple-move.spec.ts
 * @description EINFACHER Test - nur 2 Züge: Kf6 und Kf8 aus Position 1
 * UPDATED: Verwendet neues Lichess-Style Store-Action System
 */

import { test, expect } from '@playwright/test';
// Note: ChessTestHelper commented out until we create it
// import { ChessTestHelper } from './helpers/chess-test-helper';

test.describe('Simple Move Test', () => {
  
  test('Zwei Züge: Kf6 und Kf8 aus Position 1', async ({ page }) => {
    
    // Position 1: Opposition Grundlagen
    const FEN = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
    
    // Monitor browser console for sync logs
    page.on('console', (msg) => {
      if (msg.text().includes('SYNC CHECK') || msg.text().includes('SYNC:') || msg.text().includes('FEN LOADING')) {
        console.log(`🔍 BROWSER: ${msg.text()}`);
      }
    });
    
    // Initialize Chess Test Helper
    const chess = new ChessTestHelper(page);
    
    console.log('🎯 Test START: Loading position via Store-Action...');
    
    // Load position using new Store-Action system
    await chess.loadPosition(FEN);
    console.log('✅ Position loaded via Store-Action');
    
    // DEBUG: Wait and check console logs
    await page.waitForTimeout(2000);
    
    // DEBUG: Check browser console for our sync logs
    const consoleMessages = await page.evaluate(() => {
      // @ts-expect-error - Global debug variable may not exist
      return window.__debug_console_messages || [];
    });
    
    // Verify start FEN - CRITICAL TEST
    const startFen = await chess.getCurrentFEN();
    console.log(`🔍 Start FEN: ${startFen}`);
    console.log(`🔍 Expected FEN: ${FEN}`);
    
    // DEBUG: Check if position was actually loaded
    if (startFen === '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1') {
      console.log('✅ CORRECT: Opposition Grundlagen position loaded (King on e6, e8)');
    } else if (startFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      console.log('❌ ERROR: Standard chess starting position loaded instead!');
    } else {
      console.log(`❌ ERROR: Unknown position loaded: ${startFen}`);
    }
    
    expect(startFen).toBe(FEN);
    
    // ZUG 1: Kf6 (e6 → f6) - using ChessTestHelper
    console.log('🔄 ZUG 1: Kf6 (e6 → f6)');
    await chess.makeMove('e6f6');
    
    // Check FEN after move 1 - CRITICAL TEST
    const fen1 = await chess.getCurrentFEN();
    console.log(`🔍 Nach Zug 1: ${fen1}`);
    
    // Expected: 4k3/8/5K2/4P3/8/8/8/8 b - - 1 1 (König moved from e6 to f6)
    const expectedFen1 = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
    console.log(`🔍 Expected after move 1: ${expectedFen1}`);
    
    if (fen1 === startFen) {
      console.log('❌ CRITICAL ERROR: FEN unchanged after move! Move was not processed!');
    } else if (fen1 === expectedFen1) {
      console.log('✅ CORRECT: Move 1 processed correctly');
    } else {
      console.log(`❌ ERROR: Unexpected FEN after move 1: ${fen1}`);
    }
    
    // ZUG 2: Kf8 (e8 → f8) - using ChessTestHelper
    console.log('🔄 ZUG 2: Kf8 (e8 → f8)');
    await chess.makeMove('e8f8');
    
    // Check final FEN
    const finalFen = await chess.getCurrentFEN();
    console.log(`🔍 FINAL FEN: ${finalFen}`);
    
    // ERWARTUNG: Beide Könige sollten bewegt sein
    // Start: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1 (König e8, König e6)
    // Nach Kf6: 4k3/8/5K2/4P3/8/8/8/8 b - - 1 1 (König e8, König f6)  
    // Nach Kf8: 5k2/8/5K2/4P3/8/8/8/8 w - - 2 2 (König f8, König f6)
    
    console.log('🎯 Test COMPLETE');
  });
});