import { test, expect, Page } from '@playwright/test';

/**
 * Einfacher E2E Test für Brückenbau-Endspiel
 * Testet nur, ob die Züge gemacht werden können und die UI reagiert
 */

// Helper function to make a move by clicking squares
const makeMove = async (page: Page, from: string, to: string) => {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
};

test.describe('Brückenbau Training - Basic UI Test', () => {
  
  test('kann Züge ausführen und UI zeigt sie an', async ({ page }) => {
    // Navigate to the bridge building training page
    await page.goto('/train/12');

    // Wait for the board to be ready
    await expect(page.locator('[data-square="c8"]')).toBeVisible();
    
    // Wait for the title
    await expect(page.locator('text=Brückenbau 1/5')).toBeVisible();
    
    // Check initial state - should say "Noch keine Züge gespielt"
    await expect(page.locator('text=Noch keine Züge gespielt')).toBeVisible();
    
    // Make the first move Kd7
    await makeMove(page, 'c8', 'd7');
    
    // Wait a bit for the move to register and computer to respond
    await page.waitForTimeout(3000);
    
    // Now the "Noch keine Züge gespielt" should be gone
    await expect(page.locator('text=Noch keine Züge gespielt')).not.toBeVisible();
    
    // We should see some moves in the list
    const moveList = page.locator('.space-y-1');
    await expect(moveList.locator('.font-mono').first()).toBeVisible();
    
    // Continue with Kc6
    await makeMove(page, 'd7', 'c6');
    await page.waitForTimeout(3000);
    
    // Now make the problematic move Kb5
    await makeMove(page, 'c6', 'b5');
    await page.waitForTimeout(3000);
    
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'test-kb5-move.png', fullPage: true });
    
    // Look for any evaluation indicators in the move list
    const evaluations = page.locator('.text-xs').filter({ hasText: /[🟢⚪🔻❌⚠️]/ });
    const count = await evaluations.count();
    console.log(`Found ${count} evaluation indicators`);
    
    // Check if Kb5 is in the move list
    const kb5Move = page.locator('.font-mono').filter({ hasText: 'Kb5' });
    await expect(kb5Move).toBeVisible();
    
    // Get the parent container of Kb5 and look for evaluation
    const kb5Container = kb5Move.first().locator('xpath=..');
    const kb5Eval = kb5Container.locator('.text-xs');
    
    if (await kb5Eval.count() > 0) {
      const evalText = await kb5Eval.first().textContent();
      console.log('Kb5 evaluation:', evalText);
      
      // Log the class names for debugging
      const classes = await kb5Eval.first().getAttribute('class');
      console.log('Kb5 evaluation classes:', classes);
    } else {
      console.log('No evaluation found for Kb5');
    }
  });
  
  test('zeigt Engine und Tablebase Evaluierungen', async ({ page }) => {
    await page.goto('/train/12');
    
    // Wait for the board
    await expect(page.locator('[data-square="c8"]')).toBeVisible();
    
    // Check that Engine and Tablebase are enabled
    await expect(page.locator('text=Engine')).toBeVisible();
    await expect(page.locator('text=Tablebase')).toBeVisible();
    
    // Check for evaluation display in sidebar
    const engineSection = page.locator('text=Engine').locator('..').locator('..');
    await expect(engineSection.locator('text=DTM')).toBeVisible();
    
    // Make a move to trigger evaluations
    await makeMove(page, 'c8', 'd7');
    await page.waitForTimeout(3000);
    
    // Check if any moves have evaluations
    const moveWithEval = page.locator('.font-mono').first().locator('..').locator('.text-xs');
    const hasEval = await moveWithEval.count() > 0;
    
    if (hasEval) {
      const evalText = await moveWithEval.first().textContent();
      console.log('First move evaluation:', evalText);
    }
  });
});