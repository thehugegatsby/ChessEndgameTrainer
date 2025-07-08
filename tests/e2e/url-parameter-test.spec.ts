import { test, expect } from '@playwright/test';

/**
 * Test für URL-Parameter Ansatz bei automatisierten Zügen
 * Verwendet ?moves=e2-e4,d7-d5 Parameter für automatische Züge
 */

test.describe('URL Parameter Automated Moves', () => {
  
  test('Einfacher Zug via URL Parameter', async ({ page }) => {
    // Navigiere mit URL Parameter für einen Zug
    await page.goto('/train/1?moves=e2-e4');
    
    // Warte auf vollständiges Laden
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Warte auf automatischen Zug
    
    // Prüfe ob der Zug in der Historie erscheint
    const moveHistoryText = await page.textContent('body');
    console.log('Page content after move:', moveHistoryText?.substring(0, 500));
    
    // "Noch keine Züge gespielt" sollte nicht mehr da sein
    const noMovesText = page.locator('text=Noch keine Züge gespielt');
    await expect(noMovesText).not.toBeVisible();
    
    // Es sollte mindestens einen Zug in der Historie geben
    const moveElements = await page.locator('.font-mono').count();
    console.log('Move elements found:', moveElements);
    expect(moveElements).toBeGreaterThan(0);
    
    // Screenshot für visuelle Verifikation
    await page.screenshot({ 
      path: 'url-parameter-single-move.png', 
      fullPage: true 
    });
  });
  
  test('Mehrere Züge via URL Parameter', async ({ page }) => {
    // Navigiere mit mehreren Zügen
    await page.goto('/train/1?moves=e2-e4,d7-d5,e4-e5');
    
    // Warte länger für mehrere Züge (3 Züge * 1s + Buffer)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Prüfe Zugliste
    const moveElements = await page.locator('.font-mono').count();
    console.log('Move elements after multiple moves:', moveElements);
    
    // Sollte mindestens 3 Züge haben
    expect(moveElements).toBeGreaterThanOrEqual(3);
    
    // Screenshot
    await page.screenshot({ 
      path: 'url-parameter-multiple-moves.png', 
      fullPage: true 
    });
  });
  
  test('Brückenbau Position mit URL Parametern', async ({ page }) => {
    // Teste Brückenbau Position (12) mit bekannten Zügen
    await page.goto('/train/12?moves=c8-d7,d7-c6');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    
    // Prüfe dass wir auf der richtigen Position sind
    const title = await page.textContent('h2');
    console.log('Training title:', title);
    expect(title).toContain('Brückenbau');
    
    // Prüfe Züge
    const moveElements = await page.locator('.font-mono').count();
    console.log('Brückenbau move elements:', moveElements);
    expect(moveElements).toBeGreaterThanOrEqual(2);
    
    // Screenshot
    await page.screenshot({ 
      path: 'url-parameter-brueckenbau.png', 
      fullPage: true 
    });
  });
  
  test('Ungültige Züge via URL Parameter werden ignoriert', async ({ page }) => {
    // Console Logs abfangen für Logger-Ausgaben
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Test move failed')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Ungültiger Zug
    await page.goto('/train/1?moves=a1-h8,e2-e4');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    
    // Der erste ungültige Zug sollte einen Fehler loggen
    console.log('Console logs:', consoleLogs);
    
    // Der zweite gültige Zug sollte funktionieren
    const moveElements = await page.locator('.font-mono').count();
    console.log('Move elements after invalid move:', moveElements);
    
    // Sollte mindestens einen Zug haben (e2-e4)
    expect(moveElements).toBeGreaterThanOrEqual(1);
    
    // Screenshot
    await page.screenshot({ 
      path: 'url-parameter-invalid-moves.png', 
      fullPage: true 
    });
  });
  
  test('Ohne URL Parameter - normaler Betrieb', async ({ page }) => {
    // Kontrolltest ohne URL Parameter
    await page.goto('/train/1');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Sollte "Noch keine Züge gespielt" zeigen
    const noMovesText = page.locator('text=Noch keine Züge gespielt');
    await expect(noMovesText).toBeVisible();
    
    // Keine automatischen Züge
    const moveElements = await page.locator('.font-mono').count();
    console.log('Move elements without URL params:', moveElements);
    
    // Screenshot
    await page.screenshot({ 
      path: 'url-parameter-normal-operation.png', 
      fullPage: true 
    });
  });
});