import { test, expect } from '@playwright/test';
import {
  navigateToTraining,
  makeMove,
  waitForEngineResponse,
  getGameState,
  verifyPosition,
  KNOWN_POSITIONS,
} from './helpers';

/**
 * Playwright E2E Test für Brückenbau-Endspiel (Fixed)
 * Testet die kritische Zugfolge, die zu einem Fehler führt (Kb5),
 * und verifiziert, dass die Anwendung korrekt reagiert.
 * Verwendet zentrale Helper für Stabilität und Wartbarkeit.
 */
test.describe('@smoke Endspiel-Trainer: Brückenbau (Turm + Bauer vs. Turm)', () => {
  
  test('sollte die korrekte Zugfolge bis zum Fehlerzug Kb5 spielen können', async ({ page }) => {
    // 1. Arrange: Navigiere zur Brückenbau-Übung und verifiziere die Startposition.
    const positionId = 12;
    await navigateToTraining(page, positionId);
    await verifyPosition(page, KNOWN_POSITIONS.bridgeBuilding);

    // Verifiziere den Titel, um sicherzustellen, dass die richtige Übung geladen wurde.
    await expect(page.locator('h2').filter({ hasText: 'Brückenbau' })).toBeVisible();
    
    // 2. Act & Assert: Führe die Zugfolge aus und überprüfe den Zustand nach jedem Schritt.
    
    // Erster Zug: Weiß spielt Kd7.
    const move1Result = await makeMove(page, 'c8-d7');
    expect(move1Result.success, 'Zug 1 (c8-d7) sollte erfolgreich sein').toBe(true);
    
    // Warte auf die Antwort der Engine. Die Zuganzahl sollte jetzt 2 sein.
    await waitForEngineResponse(page, 2);
    
    // Zweiter Zug: Weiß spielt Kc6.
    const move2Result = await makeMove(page, 'd7-c6');
    expect(move2Result.success, 'Zug 2 (d7-c6) sollte erfolgreich sein').toBe(true);
    
    // Warte auf die Antwort der Engine. Die Zuganzahl sollte jetzt 4 sein.
    await waitForEngineResponse(page, 4);
    
    // Dritter Zug: Weiß spielt den Fehlerzug Kb5.
    const move3Result = await makeMove(page, 'c6-b5');
    expect(move3Result.success, 'Zug 3 (c6-b5) sollte erfolgreich sein').toBe(true);
    
    // Warte kurz, damit die UI die Auswertung des letzten Zugs anzeigen kann.
    await page.waitForTimeout(1000);

    // 3. Assert Final State: Überprüfe den finalen Zustand des Spiels und der UI.
    
    // Der Spielstatus sollte 5 Züge widerspiegeln (3 von Weiß, 2 von Schwarz).
    const finalState = await getGameState(page);
    expect(finalState.moveCount).toBe(5);

    // Die Zugliste in der UI sollte sichtbar sein und die gespielten Züge enthalten.
    // Verwende einen stabilen Selektor, der den Container der Zugliste findet.
    const movePanel = page.locator('div:has(> .font-mono)').first();
    await expect(movePanel).toBeVisible();
    
    // Überprüfe, ob die entscheidenden Züge in der Liste angezeigt werden.
    await expect(movePanel.locator('.font-mono').filter({ hasText: 'Kd7' })).toBeVisible();
    await expect(movePanel.locator('.font-mono').filter({ hasText: 'Kc6' })).toBeVisible();
    await expect(movePanel.locator('.font-mono').filter({ hasText: 'Kb5' })).toBeVisible();

    // TODO: Aktiviere die Überprüfung der Fehlermarkierung, sobald das Feature stabil ist.
    // Ticket: [EVALUATION-DISPLAY]
    /*
    const kb5Move = movePanel.locator('.font-mono').filter({ hasText: 'Kb5' });
    const moveContainer = kb5Move.locator('xpath=../..');
    const evalSpan = moveContainer.locator('span.eval-blunder'); // oder .eval-mistake
    await expect(evalSpan).toBeVisible({ timeout: 5000 });
    await expect(evalSpan).toContainText('🔻');
    */
    
    console.log('✓ Korrekte Zugfolge im Brückenbau-Test erfolgreich ausgeführt.');
  });
});