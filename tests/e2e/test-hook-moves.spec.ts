import { test, expect } from '@playwright/test';

/**
 * Test mit den neuen Test-Hooks für E2E Move Testing
 * Verwendet window.e2e_makeMove und window.e2e_getGameState
 */

test.describe('Chess Moves via Test Hooks', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setze TEST_MODE environment variable
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Warte auf Initialisierung
  });
  
  test('Kann Züge über Test-Hook ausführen', async ({ page }) => {
    // Prüfe initialen Zustand
    const initialState = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    console.log('Initial state:', initialState);
    expect(initialState).toBeTruthy();
    expect(initialState.moveCount).toBe(0);
    expect(initialState.turn).toBe('w'); // Weiß beginnt
    
    // Opposition Position: König auf e6, Bauer auf e5
    // Führe ersten Zug aus: e6-d6 (König bewegt sich)
    const moveResult1 = await page.evaluate(() => {
      return (window as any).e2e_makeMove?.('e6-d6');
    });
    
    console.log('Move 1 result:', moveResult1);
    expect(moveResult1).toBeTruthy();
    expect(moveResult1.success).toBe(true);
    
    // Warte kurz auf State-Update
    await page.waitForTimeout(500);
    
    // Prüfe Zustand nach erstem Zug
    const stateAfterMove1 = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    expect(stateAfterMove1.moveCount).toBe(1);
    expect(stateAfterMove1.turn).toBe('b'); // Schwarz ist dran
    
    // Führe zweiten Zug aus: e8-d8 (schwarzer König bewegt sich)
    const moveResult2 = await page.evaluate(() => {
      return (window as any).e2e_makeMove?.('e8-d8');
    });
    
    console.log('Move 2 result:', moveResult2);
    expect(moveResult2.success).toBe(true);
    
    // Prüfe finalen Zustand
    const finalState = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    expect(finalState.moveCount).toBe(2);
    expect(finalState.turn).toBe('w'); // Wieder Weiß
    expect(finalState.pgn).toContain('1. Kd6 Kd8');
    
    // UI sollte aktualisiert sein
    const noMovesText = await page.locator('text=Noch keine Züge gespielt').isVisible();
    expect(noMovesText).toBe(false);
    
    // Screenshot des Erfolgs
    await page.screenshot({ path: 'test-hook-success.png', fullPage: true });
  });
  
  test('Erkennt ungültige Züge', async ({ page }) => {
    // Versuche ungültigen Zug (König auf illegales Feld)
    const invalidMove = await page.evaluate(() => {
      return (window as any).e2e_makeMove?.('e6-a1'); // König kann nicht so weit springen
    });
    
    console.log('Invalid move result:', invalidMove);
    expect(invalidMove.success).toBe(false);
    expect(invalidMove.error).toContain('Move rejected');
    
    // Zustand sollte unverändert sein
    const state = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    expect(state.moveCount).toBe(0);
  });
  
  test('Kann verschiedene Zugnotationen verarbeiten', async ({ page }) => {
    // Test ohne Bindestrich
    const move1 = await page.evaluate(() => {
      return (window as any).e2e_makeMove?.('e6d6');
    });
    
    expect(move1.success).toBe(true);
    
    // Warte auf State-Update
    await page.waitForTimeout(500);
    
    // Test mit Bindestrich
    const move2 = await page.evaluate(() => {
      return (window as any).e2e_makeMove?.('e8-d8');
    });
    
    expect(move2.success).toBe(true);
    
    const state = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    expect(state.moveCount).toBe(2);
  });
  
  test('Funktioniert mit Brückenbau Position', async ({ page }) => {
    // Navigiere zu Brückenbau
    await page.goto('/train/12');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Prüfe Position
    const initialState = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    console.log('Brückenbau initial:', initialState);
    
    // Führe typische Brückenbau-Züge aus (König steht auf c8, Bauer auf c7)
    // Kd7 ist der korrekte Zug (Kb8 illegal wegen Tb2)
    const moves = ['c8-d7', 'f7-e7', 'c7-c8Q'];
    
    for (const move of moves) {
      const result = await page.evaluate((m) => {
        return (window as any).e2e_makeMove?.(m);
      }, move);
      
      console.log(`Move ${move} result:`, result);
      
      if (!result.success) {
        console.log('Move failed, trying alternative...');
        break;
      }
    }
    
    const finalState = await page.evaluate(() => {
      return (window as any).e2e_getGameState?.();
    });
    
    console.log('Brückenbau final:', finalState);
    expect(finalState.moveCount).toBeGreaterThan(0);
  });
  
});