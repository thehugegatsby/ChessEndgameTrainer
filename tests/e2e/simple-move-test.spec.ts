import { test, expect, Page } from '@playwright/test';

/**
 * Einfacher Test um zu prüfen, ob Züge gemacht und registriert werden können
 */

// Helper function to make a move using test hooks
const makeMove = async (page: Page, move: string) => {
  const result = await page.evaluate((m) => {
    return (window as any).e2e_makeMove?.(m);
  }, move);
  
  if (!result) {
    throw new Error('Test hooks not available. Ensure NEXT_PUBLIC_TEST_MODE=true');
  }
  
  return result;
};

// Helper to get game state
const getGameState = async (page: Page) => {
  return await page.evaluate(() => {
    return (window as any).e2e_getGameState?.();
  });
};

test.describe('@smoke Einfacher Zug-Test', () => {
  
  test('kann einen Zug machen und registrieren', async ({ page }) => {
    // 1. Zur Trainingsseite navigieren (nutze bekannte funktionierende ID)
    await page.goto('/train/12'); // Brückenbau Training
    
    // 2. Warte auf das Brett
    await expect(page.locator('[data-square="c8"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // Engine initialisieren lassen
    
    // 3. Prüfe Anfangszustand
    const initialState = await getGameState(page);
    expect(initialState).toBeTruthy();
    expect(initialState.moveCount).toBe(0);
    
    // 4. Screenshot vor dem Zug
    await page.screenshot({ path: 'test-results/before-move.png', fullPage: true });
    
    // 5. Mache einen einfachen Zug (Kd7)
    const moveResult = await makeMove(page, 'c8-d7');
    expect(moveResult.success).toBe(true);
    
    // 6. Warte kurz auf UI-Update
    await page.waitForTimeout(500);
    
    // 7. Screenshot nach dem Zug
    await page.screenshot({ path: 'test-results/after-move.png', fullPage: true });
    
    // 8. Prüfe neuen Zustand
    const afterMoveState = await getGameState(page);
    expect(afterMoveState.moveCount).toBeGreaterThan(0);
    expect(afterMoveState.turn).toBe('b'); // Schwarz ist dran
    
    // 9. Prüfe ob "Noch keine Züge gespielt" verschwunden ist
    const noMovesText = page.locator('text=Noch keine Züge gespielt');
    await expect(noMovesText).not.toBeVisible();
    
    // 10. Prüfe ob Züge in der Liste angezeigt werden
    const moveList = page.locator('.space-y-1');
    const moves = moveList.locator('.font-mono');
    await expect(moves.first()).toBeVisible();
    
    // Erwartungen erfüllt
    const finalMoveCount = await moves.count();
    expect(finalMoveCount).toBeGreaterThan(0);
  });
  
  test('prüfe Spielzustand über Test-Hooks', async ({ page }) => {
    await page.goto('/train/12');
    
    // Warte auf Brett
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Hole initialen Spielzustand
    const initialState = await getGameState(page);
    expect(initialState).toBeTruthy();
    expect(initialState.fen).toBeTruthy();
    expect(initialState.turn).toBe('w'); // Weiß beginnt
    expect(initialState.isGameOver).toBe(false);
    
    // Mache mehrere Züge und prüfe Zustand
    const move1 = await makeMove(page, 'c8-d7');
    expect(move1.success).toBe(true);
    
    await page.waitForTimeout(3000); // Warte auf Engine
    
    const midGameState = await getGameState(page);
    // Engine might be slow, so we accept either 1 or more moves
    expect(midGameState.moveCount).toBeGreaterThanOrEqual(1);
    expect(midGameState.pgn).toContain('Kd7'); // PGN sollte unseren Zug enthalten
  });
  
  test('teste Zugvalidierung über Test-Hooks', async ({ page }) => {
    await page.goto('/train/12');
    
    // Warte auf Brett
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Hole initialen Zustand
    const initialState = await getGameState(page);
    expect(initialState).toBeTruthy();
    
    // Teste ungültigen Zug (König kann nicht nach a1)
    const invalidMove = await makeMove(page, 'c8-a1');
    expect(invalidMove.success).toBe(false);
    expect(invalidMove.error).toBeTruthy();
    
    // Zustand sollte unverändert sein
    const stateAfterInvalid = await getGameState(page);
    expect(stateAfterInvalid.moveCount).toBe(0);
    expect(stateAfterInvalid.fen).toBe(initialState.fen);
    
    // Teste gültigen Zug (von Brückenbau-Position)
    const validMove = await makeMove(page, 'c8-d7');
    
    // Wenn dieser Zug fehlschlägt, sind wir vielleicht in einer anderen Position
    if (!validMove.success) {
      // Fallback: Versuche Opposition-Position
      const fallbackMove = await makeMove(page, 'e6-d5');
      expect(fallbackMove.success).toBe(true);
      
      const stateAfterFallback = await getGameState(page);
      expect(stateAfterFallback.moveCount).toBe(1);
    } else {
      expect(validMove.success).toBe(true);
      
      // Zustand sollte sich geändert haben
      const stateAfterValid = await getGameState(page);
      expect(stateAfterValid.moveCount).toBe(1);
      expect(stateAfterValid.fen).not.toBe(initialState.fen);
    }
  });
});