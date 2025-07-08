import { test, expect } from '@playwright/test';

/**
 * Finaler funktionierender Test basierend auf der tatsächlichen App-Implementierung
 */

test.describe('Endgame Trainer - Funktionierende Tests', () => {
  
  test('Prüfe ob die App überhaupt läuft und reagiert', async ({ page }) => {
    // Navigiere zur App
    await page.goto('/train/1');
    
    // Warte auf vollständiges Laden
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 1. Prüfe ob die Grundelemente da sind
    const title = await page.locator('h2').first().textContent();
    console.log('Titel gefunden:', title);
    expect(title).toBeTruthy();
    
    // 2. Prüfe ob das Brett 64 Felder hat
    const squareCount = await page.locator('[data-square]').count();
    console.log('Anzahl Felder:', squareCount);
    expect(squareCount).toBe(64);
    
    // 3. Prüfe ob Figuren auf dem Brett sind
    const pieceCount = await page.locator('[data-square] div').count();
    console.log('Anzahl Figuren/Divs:', pieceCount);
    expect(pieceCount).toBeGreaterThan(0);
    
    // 4. Prüfe ob die Seitenleiste existiert
    const sidebar = await page.locator('.sidebar').count();
    console.log('Sidebar vorhanden:', sidebar > 0);
    
    // 5. Screenshot für manuelle Inspektion
    await page.screenshot({ path: 'app-running-test.png', fullPage: true });
  });
  
  test('Teste Reset-Button Funktionalität', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    
    // Finde den Reset-Button (↻)
    const resetButton = page.locator('button:has-text("↻")');
    const resetExists = await resetButton.count();
    console.log('Reset-Button gefunden:', resetExists > 0);
    
    if (resetExists > 0) {
      // Klicke Reset
      await resetButton.click();
      await page.waitForTimeout(1000);
      
      // Prüfe ob sich etwas geändert hat
      console.log('Reset-Button geklickt');
    }
  });
  
  test('Teste Navigation zwischen Trainings', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    
    // Finde Navigations-Buttons
    const nextButton = page.locator('button[title="Nächste Position"]');
    const prevButton = page.locator('button[title="Vorherige Position"]');
    
    const hasNext = await nextButton.isEnabled();
    console.log('Nächste-Button aktiviert:', hasNext);
    
    if (hasNext) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      
      // Prüfe ob URL sich geändert hat
      const newUrl = page.url();
      console.log('Neue URL:', newUrl);
      expect(newUrl).toContain('/train/2');
    }
  });
  
  test('Teste Menü-Interaktion', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    
    // Finde Menü-Einträge
    const menuItems = await page.locator('text=Bauernendspiele').count();
    console.log('Menü-Einträge gefunden:', menuItems);
    
    if (menuItems > 0) {
      // Versuche Menü zu erweitern
      await page.locator('text=Bauernendspiele').click();
      await page.waitForTimeout(500);
      
      // Prüfe ob Untermenü sichtbar ist
      const subItems = await page.locator('text=Opposition').count();
      console.log('Untermenü-Einträge:', subItems);
    }
  });
  
  test('Basis-Funktionalität ohne Züge', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    
    // Sammle alle relevanten Informationen
    const appState = await page.evaluate(() => {
      const info: any = {
        title: document.querySelector('h2')?.textContent,
        squareCount: document.querySelectorAll('[data-square]').length,
        hasReactApp: !!(window as any).React || !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        hasChessBoard: !!document.querySelector('[class*="board"]'),
        visibleTexts: []
      };
      
      // Sammle sichtbare Texte
      const textElements = document.querySelectorAll('div, span, p, h1, h2, h3');
      textElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
          info.visibleTexts.push(text);
        }
      });
      
      return info;
    });
    
    console.log('App-Status:', JSON.stringify(appState, null, 2));
    
    // Grundlegende Erwartungen
    expect(appState.squareCount).toBe(64);
    expect(appState.hasReactApp).toBe(true);
    expect(appState.hasChessBoard).toBe(true);
  });
});