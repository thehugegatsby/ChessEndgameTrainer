import { test, expect } from '@playwright/test';

/**
 * Debug test to understand the starting position and legal moves
 */

test.describe('Position Debug', () => {
  
  test('Check starting position and legal moves', async ({ page }) => {
    // Console logs abfangen
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });
    
    // Navigiere zur Position ohne URL Parameter
    console.log('Navigating to /train/1');
    await page.goto('/train/1');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Sammle Position Info
    const positionInfo = await page.evaluate(() => {
      // Try to access game state through various methods
      const info: any = {
        windowProperties: Object.keys(window).filter(key => key.includes('chess') || key.includes('game')),
        hasChessSquares: document.querySelectorAll('[data-square]').length,
        squareData: []
      };
      
      // Sammle data-square Informationen
      const squares = document.querySelectorAll('[data-square]');
      squares.forEach((square: any, index) => {
        if (index < 10) { // Nur erste 10 für Debug
          const squareName = square.getAttribute('data-square');
          const hasChild = square.children.length > 0;
          const innerHTML = square.innerHTML.substring(0, 100);
          info.squareData.push({ squareName, hasChild, innerHTML });
        }
      });
      
      return info;
    });
    
    console.log('Position info:', JSON.stringify(positionInfo, null, 2));
    
    // Test verschiedene Züge
    const testMoves = ['Kd1', 'Kd3', 'Kf1', 'Kf3', 'Ke1', 'Ke3'];
    
    for (const moveNotation of testMoves) {
      console.log(`Testing move: ${moveNotation}`);
      
      // Teste mit URL Parameter
      await page.goto(`/train/1?moves=${moveNotation}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if move worked
      const moveWorked = await page.evaluate(() => {
        return {
          noMovesVisible: document.body.textContent?.includes('Noch keine Züge gespielt') || false,
          moveElements: document.querySelectorAll('.font-mono').length,
          bodyContainsMove: document.body.textContent?.includes('1.') || false
        };
      });
      
      console.log(`Move ${moveNotation} result:`, moveWorked);
      
      if (!moveWorked.noMovesVisible || moveWorked.moveElements > 0) {
        console.log(`SUCCESS: Move ${moveNotation} worked!`);
        break;
      }
    }
    
    // Screenshot final state
    await page.screenshot({ 
      path: 'position-debug-test.png', 
      fullPage: true 
    });
  });
  
});