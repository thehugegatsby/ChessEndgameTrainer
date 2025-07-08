import { test, expect } from '@playwright/test';

/**
 * Funktionierender URL Parameter Test mit legalen Zügen
 */

test.describe('Working URL Parameter Test', () => {
  
  test('Test mit Brückenbau Position - bekannte legale Züge', async ({ page }) => {
    // Console logs abfangen
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    // Brückenbau Position (12) - hier kennen wir legale Züge
    console.log('Testing Brückenbau position with known legal moves...');
    await page.goto('/train/12?moves=Kc7-Kd6,Kd6-Ke5');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Warte auf 2 automatische Züge
    
    // Prüfe ob Züge funktionierten
    const result = await page.evaluate(() => {
      return {
        noMovesVisible: document.body.textContent?.includes('Noch keine Züge gespielt') || false,
        moveElements: document.querySelectorAll('.font-mono').length,
        bodyText: document.body.textContent?.substring(0, 300)
      };
    });
    
    console.log('Brückenbau result:', result);
    
    // Erwarte dass "Noch keine Züge gespielt" verschwunden ist
    expect(result.noMovesVisible).toBe(false);
    expect(result.moveElements).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'working-brueckenbau-test.png', fullPage: true });
  });
  
  test('Test mit einfacheren Koordinaten-Zügen', async ({ page }) => {
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    // Verwende einfache Koordinaten für Opposition
    console.log('Testing simple coordinate moves...');
    await page.goto('/train/1?moves=Ke2-Ke3');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    
    const result = await page.evaluate(() => {
      return {
        noMovesVisible: document.body.textContent?.includes('Noch keine Züge gespielt') || false,
        moveElements: document.querySelectorAll('.font-mono').length
      };
    });
    
    console.log('Simple coordinate result:', result);
    
    if (!result.noMovesVisible) {
      console.log('SUCCESS: Coordinate move worked!');
    }
    
    await page.screenshot({ path: 'working-coordinate-test.png', fullPage: true });
  });
  
  test('Debug: Zeige alle möglichen Züge für Position 1', async ({ page }) => {
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Versuche alle möglichen King moves systematisch
    const kingMoves = [
      'Ke1-Kd1', 'Ke1-Ke2', 'Ke1-Kf1',
      'Ke1-Kd2', 'Ke1-Kf2',
      'Ke2-Kd1', 'Ke2-Kd2', 'Ke2-Kd3',
      'Ke2-Ke1', 'Ke2-Ke3',
      'Ke2-Kf1', 'Ke2-Kf2', 'Ke2-Kf3'
    ];
    
    for (const move of kingMoves) {
      console.log(`\n=== Testing move: ${move} ===`);
      
      await page.goto(`/train/1?moves=${move}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const worked = await page.evaluate(() => {
        return !document.body.textContent?.includes('Noch keine Züge gespielt');
      });
      
      console.log(`Move ${move}: ${worked ? 'SUCCESS!' : 'failed'}`);
      
      if (worked) {
        console.log(`🎉 FOUND WORKING MOVE: ${move}`);
        await page.screenshot({ path: `working-move-${move.replace('-', '_')}.png`, fullPage: true });
        break; // Stop at first working move
      }
    }
  });
  
});