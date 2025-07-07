import { test, expect, Page } from '@playwright/test';

/**
 * Playwright E2E Test für Brückenbau-Endspiel
 * Testet, ob der Fehlerzug Kb5 korrekt als Fehler markiert wird
 * 
 * Startposition: Weiß K auf c8, Turm auf e4, Bauer auf c7
 *                Schwarz K auf f7, Turm auf b2
 */

// Helper function to make a move by clicking squares
const makeMove = async (page: Page, from: string, to: string) => {
  // Click source square
  await page.locator(`[data-square="${from}"]`).click();
  // Click destination square  
  await page.locator(`[data-square="${to}"]`).click();
};

// Helper to ensure evaluations are enabled
const ensureEvaluationsEnabled = async (page: Page) => {
  // Check if Engine toggle is already on (green background)
  const engineToggle = page.locator('text=Engine').locator('..');
  const tablebaseToggle = page.locator('text=Tablebase').locator('..');
  
  // Both should already be enabled by default in this training
  // Just wait a bit for initial evaluation
  await page.waitForTimeout(1000);
};

// Helper to wait for computer to make a specific move
const waitForComputerMove = async (page: Page, expectedMove: string) => {
  // Wait for the move to appear in the move list
  const moveList = page.locator('.space-y-1');
  await expect(moveList.locator(`text=${expectedMove}`)).toBeVisible({ timeout: 5000 });
  
  // Also give a bit of time for the board to update
  await page.waitForTimeout(500);
};

test.describe('Endspiel-Trainer: Brückenbau (Turm + Bauer vs. Turm)', () => {
  
  test('sollte nach dem Fehlerzug Kb5 eine Fehlermarkierung anzeigen', async ({ page }) => {
    // 1. Navigate to the bridge building training page
    await page.goto('/train/12');

    // Wait for the board to be ready
    await expect(page.locator('[data-square="c8"]')).toBeVisible();
    
    // Wait for the title to confirm we're on the right training
    await expect(page.locator('h2').filter({ hasText: 'Brückenbau' })).toBeVisible();

    // 2. Ensure evaluations are enabled (they should be by default)
    await ensureEvaluationsEnabled(page);

    // 3. Make the first move - the correct move Kd7
    await makeMove(page, 'c8', 'd7');
    
    // Wait for computer response (Black plays ...Rc2 or similar)
    await page.waitForTimeout(2000);
    
    // 4. Make move Kc6 (still correct)
    await makeMove(page, 'd7', 'c6');
    
    // Wait for computer response
    await page.waitForTimeout(2000);
    
    // 5. Make the blunder move Kb5 (this should show as error)
    await makeMove(page, 'c6', 'b5');
    
    // 6. Check for the error evaluation in the move panel
    // The evaluation should show a red triangle (🔻) or similar error indicator
    
    // Wait for the evaluation to appear
    await page.waitForTimeout(1000);
    
    // The move panel should contain evaluations
    const movePanel = page.locator('.space-y-1'); // Move panel container
    
    // Find the Kb5 move in the move list
    const kb5Move = movePanel.locator('.font-mono').filter({ hasText: 'Kb5' });
    await expect(kb5Move).toBeVisible({ timeout: 5000 });
    
    // Check for the error evaluation - it should have a span with error class
    const moveContainer = kb5Move.locator('xpath=../..');
    const evalSpan = moveContainer.locator('span.text-xs');
    
    // The evaluation span should exist and contain the error indicator
    await expect(evalSpan).toBeVisible();
    
    // Check for error classes
    const hasErrorClass = await evalSpan.evaluate(el => {
      return el.classList.contains('eval-mistake') || 
             el.classList.contains('eval-blunder') ||
             el.classList.contains('eval-inaccuracy');
    });
    
    expect(hasErrorClass).toBe(true);
    
    // Additionally check the text content
    const evalText = await evalSpan.textContent();
    console.log('Evaluation text found:', evalText);
    
    // Should contain one of the error symbols
    expect(['🔻', '❌', '⚠️'].some(symbol => evalText?.includes(symbol))).toBe(true);
  });

  test('sollte die korrekte Zugfolge und Evaluierungen zeigen', async ({ page }) => {
    // This test verifies the complete sequence including evaluations
    await page.goto('/train/12');
    
    // Wait for initial setup
    await expect(page.locator('[data-square="b4"]')).toBeVisible();
    
    // Enable evaluations display
    const settingsButton = page.locator('button[aria-label="Settings"]');
    await settingsButton.click();
    
    // Toggle evaluation display
    const evalToggle = page.locator('text=Züge bewerten').locator('..');
    await evalToggle.click();
    
    // Close settings
    await page.keyboard.press('Escape');
    
    // Wait for computer's first move
    await waitForComputerMove(page, 'Rc8');
    
    // Make the blunder
    await makeMove(page, 'b4', 'b5');
    
    // Verify the move sequence in the move panel
    const moveList = page.locator('.space-y-1');
    
    // Check move 1: Kb4 (should be neutral or good)
    const kb4Eval = moveList.locator('text=Kb4').locator('..').locator('span.text-xs');
    await expect(kb4Eval).toBeVisible();
    await expect(kb4Eval).not.toHaveClass(/eval-mistake|eval-blunder/);
    
    // Check move 2: ...Rc8 (computer move)
    await expect(moveList.locator('text=Rc8')).toBeVisible();
    
    // Check move 3: Kb5 (should show error)
    const kb5Eval = moveList.locator('text=Kb5').locator('..').locator('span.text-xs');
    await expect(kb5Eval).toBeVisible();
    await expect(kb5Eval).toHaveClass(/eval-mistake|eval-blunder/);
  });
});