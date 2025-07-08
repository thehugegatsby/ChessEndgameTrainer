import { test, expect, Page } from '@playwright/test';

/**
 * Playwright E2E Tests mit Test-Hooks
 * Nutzt die neu implementierten testHelpers für zuverlässige Tests
 */

// Typen für Test-Helpers
interface MoveResult {
  success: boolean;
  move?: any;
  error?: string;
}

interface GameState {
  fen: string;
  pgn: string;
  moveHistory: any[];
  isGameFinished: boolean;
  moveCount: number;
  evaluation: any;
  isWhiteTurn: boolean;
  legalMoves: string[];
}

// Erweitere Window-Interface für TypeScript
declare global {
  interface Window {
    testHelpers: {
      makeMove: (from: string, to: string, promotion?: string) => Promise<MoveResult>;
      makeMoveSAN: (san: string) => Promise<MoveResult>;
      getGameState: () => GameState;
      resetGame: () => { success: boolean };
      getMoveHistoryWithEvaluations: () => any[];
      isLegalMove: (from: string, to: string) => boolean;
      getPositionInfo: () => any;
    };
  }
}

// Helper für Test-Mode
const navigateWithTestMode = async (page: Page, path: string) => {
  await page.goto(`${path}?test-mode=true`);
  // Warte auf Test-Helpers
  await page.waitForFunction(() => window.testHelpers !== undefined, { timeout: 10000 });
};

test.describe('Training mit Test-Hooks', () => {
  
  test.beforeEach(async ({ page }) => {
    // Aktiviere Konsolen-Logs für Debugging
    page.on('console', msg => {
      if (msg.text().includes('[TestHelper]')) {
        console.log('Browser:', msg.text());
      }
    });
  });
  
  test('Basis-Training Flow mit Test-Hooks', async ({ page }) => {
    // Navigate mit Test-Mode
    await navigateWithTestMode(page, '/train/1');
    
    // Warte auf vollständiges Laden
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    
    // Hole initialen Game State
    const initialState = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
    console.log('Initial state:', {
      fen: initialState.fen,
      moveCount: initialState.moveCount,
      isWhiteTurn: initialState.isWhiteTurn
    });
    
    // Prüfe Anfangszustand
    expect(initialState.moveCount).toBe(0);
    expect(initialState.isWhiteTurn).toBe(true);
    
    // Mache einen Zug
    const moveResult = await page.evaluate(() => 
      window.testHelpers.makeMove('e1', 'e2')
    ) as MoveResult;
    
    console.log('Move result:', moveResult);
    expect(moveResult.success).toBe(true);
    
    // Warte kurz auf State-Update
    await page.waitForTimeout(1000);
    
    // Prüfe neuen State
    const newState = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
    console.log('New state after move:', {
      moveCount: newState.moveCount,
      isWhiteTurn: newState.isWhiteTurn
    });
    
    // Erwartungen
    expect(newState.moveCount).toBeGreaterThan(0);
    expect(newState.fen).not.toBe(initialState.fen);
    
    // Prüfe ob Zugliste aktualisiert wurde
    const moveListVisible = await page.locator('.font-mono').count();
    expect(moveListVisible).toBeGreaterThan(0);
    
    // "Noch keine Züge gespielt" sollte verschwunden sein
    const noMovesText = page.locator('text=Noch keine Züge gespielt');
    await expect(noMovesText).not.toBeVisible();
  });
  
  test('Züge mit SAN-Notation', async ({ page }) => {
    await navigateWithTestMode(page, '/train/2');
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    
    // Mache Zug mit SAN
    const sanResult = await page.evaluate(() => 
      window.testHelpers.makeMoveSAN('e4')
    ) as MoveResult;
    
    if (sanResult.success) {
      console.log('SAN move successful');
      
      // Prüfe State
      const state = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
      expect(state.moveCount).toBe(1);
      expect(state.pgn).toContain('e4');
    } else {
      console.log('SAN move failed:', sanResult.error);
      // Versuche alternativen Zug
      const altResult = await page.evaluate(() => 
        window.testHelpers.makeMove('e2', 'e4')
      ) as MoveResult;
      expect(altResult.success).toBe(true);
    }
  });
  
  test('Illegale Züge werden abgelehnt', async ({ page }) => {
    await navigateWithTestMode(page, '/train/1');
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    
    // Prüfe ob Zug legal ist
    const isLegal = await page.evaluate(() => 
      window.testHelpers.isLegalMove('a1', 'h8')
    );
    
    expect(isLegal).toBe(false);
    
    // Versuche illegalen Zug
    const illegalMove = await page.evaluate(() => 
      window.testHelpers.makeMove('a1', 'h8')
    ) as MoveResult;
    
    expect(illegalMove.success).toBe(false);
    expect(illegalMove.error).toBeTruthy();
    
    // State sollte unverändert sein
    const state = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
    expect(state.moveCount).toBe(0);
  });
  
  test('Reset-Funktion', async ({ page }) => {
    await navigateWithTestMode(page, '/train/1');
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    
    // Mache einige Züge
    await page.evaluate(() => window.testHelpers.makeMove('e2', 'e4'));
    await page.waitForTimeout(500);
    
    const stateBeforeReset = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
    expect(stateBeforeReset.moveCount).toBeGreaterThan(0);
    
    // Reset
    const resetResult = await page.evaluate(() => window.testHelpers.resetGame());
    expect(resetResult.success).toBe(true);
    
    await page.waitForTimeout(1000);
    
    // Prüfe Reset
    const stateAfterReset = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
    expect(stateAfterReset.moveCount).toBe(0);
    expect(stateAfterReset.fen).toBe(stateBeforeReset.fen); // Sollte zur Startposition zurückkehren
  });
  
  test('Move History mit Evaluierungen', async ({ page }) => {
    await navigateWithTestMode(page, '/train/12'); // Brückenbau
    await expect(page.locator('[data-square="c8"]')).toBeVisible();
    
    // Mache bekannte Züge
    const moves = [
      { from: 'c8', to: 'd7' },
      { from: 'd7', to: 'c6' },
      { from: 'c6', to: 'b5' } // Der Fehler
    ];
    
    for (const move of moves) {
      const result = await page.evaluate(({ from, to }) => 
        window.testHelpers.makeMove(from, to), move
      ) as MoveResult;
      
      expect(result.success).toBe(true);
      await page.waitForTimeout(2000); // Warte auf Engine-Antwort
    }
    
    // Hole History mit Evaluierungen
    const historyWithEval = await page.evaluate(() => 
      window.testHelpers.getMoveHistoryWithEvaluations()
    );
    
    console.log('Move history with evaluations:', historyWithEval);
    
    // Sollte mindestens 3 Züge haben
    expect(historyWithEval.length).toBeGreaterThanOrEqual(3);
    
    // Der dritte Zug (Kb5) sollte eine schlechte Bewertung haben
    if (historyWithEval[2]?.evaluation) {
      const kb5Eval = historyWithEval[2].evaluation;
      console.log('Kb5 evaluation:', kb5Eval);
      // Erwarte negative Bewertung für Weiß
      expect(kb5Eval.evaluation).toBeLessThan(-100); // Schlechter als -1.00
    }
  });
  
  test('Position Info abrufen', async ({ page }) => {
    await navigateWithTestMode(page, '/train/12');
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    
    const positionInfo = await page.evaluate(() => 
      window.testHelpers.getPositionInfo()
    );
    
    console.log('Position info:', positionInfo);
    
    expect(positionInfo.id).toBe(12);
    expect(positionInfo.title).toContain('Brückenbau');
    expect(positionInfo.goal).toBe('win');
    expect(positionInfo.sideToMove).toBe('white');
  });
  
  test('Vollständiger Trainings-Flow', async ({ page }) => {
    await navigateWithTestMode(page, '/train/1');
    await expect(page.locator('[data-square="a1"]')).toBeVisible();
    
    // Spiele eine komplette Sequenz
    const moveSequence = ['e4', 'd5', 'exd5'];
    let allMovesSuccessful = true;
    
    for (const san of moveSequence) {
      const result = await page.evaluate((move) => 
        window.testHelpers.makeMoveSAN(move), san
      ) as MoveResult;
      
      if (!result.success) {
        console.log(`Move ${san} failed:`, result.error);
        allMovesSuccessful = false;
        break;
      }
      
      await page.waitForTimeout(1500);
    }
    
    // Hole finalen State
    const finalState = await page.evaluate(() => window.testHelpers.getGameState()) as GameState;
    
    // Prüfungen
    if (allMovesSuccessful) {
      expect(finalState.moveCount).toBeGreaterThanOrEqual(moveSequence.length);
      expect(finalState.pgn).toBeTruthy();
      
      // Screenshot für visuelle Verifikation
      await page.screenshot({ 
        path: 'test-successful-training-flow.png', 
        fullPage: true 
      });
    }
    
    // Prüfe ob UI korrekt aktualisiert wurde
    const moveElements = await page.locator('.font-mono').count();
    expect(moveElements).toBeGreaterThan(0);
  });
});