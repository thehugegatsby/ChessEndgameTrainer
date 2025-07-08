import { test, expect } from '@playwright/test';

/**
 * Debug test für URL Parameter - mit Console Logs
 */

test.describe('URL Parameter Debug', () => {
  
  test('Debug URL Parameter mit Console Logs', async ({ page }) => {
    // Console logs abfangen
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log(`Browser console [${msg.type()}]:`, text);
      consoleLogs.push(text);
    });
    
    // Error logs abfangen
    page.on('pageerror', error => {
      console.log('Page error:', error.toString());
    });
    
    // Navigiere mit URL Parameter
    console.log('Navigating to /train/1?moves=e2-e4');
    await page.goto('/train/1?moves=e2-e4');
    
    // Warte auf vollständiges Laden
    await page.waitForLoadState('networkidle');
    
    // Warte länger für automatischen Zug und Logs
    console.log('Waiting for automated move...');
    await page.waitForTimeout(5000);
    
    // Sammle Browser-Info
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        search: window.location.search,
        hasGame: document.querySelectorAll('[data-square]').length === 64,
        noMovesVisible: document.body.textContent?.includes('Noch keine Züge gespielt') || false,
        moveElements: document.querySelectorAll('.font-mono').length,
        bodyText: document.body.textContent?.substring(0, 1000)
      };
    });
    
    console.log('Page info:', pageInfo);
    console.log('All console logs:', consoleLogs);
    
    // Check basic page functionality
    expect(pageInfo.hasGame).toBe(true);
    expect(pageInfo.url).toContain('moves=e2-e4');
    
    // Screenshot für visuelle Inspektion
    await page.screenshot({ 
      path: 'url-debug-test.png', 
      fullPage: true 
    });
    
    // Log final state
    console.log('Test completed - check logs above for debug info');
  });
  
});