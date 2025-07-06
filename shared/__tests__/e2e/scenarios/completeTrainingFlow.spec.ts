import { test, expect } from '@playwright/test';

test.describe('Complete Training Flow with Move Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/train/1'); // Brückenbau Position
    await page.waitForSelector('[data-testid="chessboard"]');
  });

  test('userMakesOptimalMove_evaluationShowsCheckmark_feedbackIsPositive', async ({ page }) => {
    // Wait for initial position to load
    await expect(page.locator('[data-testid="position-name"]')).toContainText('Brückenbau');
    
    // Make optimal move (based on tablebase)
    await page.click('[data-square="d2"]'); // Select rook
    await page.click('[data-square="d3"]'); // Move to d3
    
    // Wait for evaluation to complete
    await page.waitForSelector('[data-testid="move-evaluation"]', { timeout: 5000 });
    
    // Verify correct evaluation symbol
    const evaluationSymbol = await page.locator('[data-testid="move-evaluation-symbol"]').textContent();
    expect(evaluationSymbol).toBe('✓');
    
    // Verify evaluation has correct class
    const evaluationClass = await page.locator('[data-testid="move-evaluation"]').getAttribute('class');
    expect(evaluationClass).toContain('eval-good');
    
    // Verify tablebase info is displayed
    await expect(page.locator('[data-testid="tablebase-dtm"]')).toContainText('DTM');
    
    // Verify move appears in history
    await expect(page.locator('[data-testid="move-history"]')).toContainText('Rd3');
  });

  test('userMakesBlunder_evaluationShowsRedTriangle_canUndoMove', async ({ page }) => {
    // Setup: Navigate to critical position
    await page.click('[data-testid="position-selector"]');
    await page.click('[data-testid="position-kritisc"]');
    
    // Make the known blunder move (Td4 allowing Kc5)
    await page.click('[data-square="d4"]'); // Select rook
    await page.click('[data-square="d4"]'); // Keep on d4 (blunder!)
    
    // Verify blunder evaluation
    await page.waitForSelector('[data-testid="move-evaluation-symbol"]:has-text("🔻")');
    const evaluationClass = await page.locator('[data-testid="move-evaluation"]').getAttribute('class');
    expect(evaluationClass).toContain('eval-blunder');
    
    // Verify explanation is shown
    await expect(page.locator('[data-testid="evaluation-explanation"]')).toContainText('verliert den Gewinn');
    
    // Test undo functionality
    await page.click('[data-testid="undo-button"]');
    await expect(page.locator('[data-testid="move-history"]')).not.toContainText('Td4');
  });

  test('engineAndTablebaseToggle_independentlyControlled_displayCorrectly', async ({ page }) => {
    // Initially both should be visible
    await expect(page.locator('[data-testid="engine-lines"]')).toBeVisible();
    await expect(page.locator('[data-testid="tablebase-info"]')).toBeVisible();
    
    // Toggle engine off
    await page.click('[data-testid="toggle-engine"]');
    await expect(page.locator('[data-testid="engine-lines"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="tablebase-info"]')).toBeVisible();
    
    // Toggle tablebase off
    await page.click('[data-testid="toggle-tablebase"]');
    await expect(page.locator('[data-testid="tablebase-info"]')).not.toBeVisible();
    
    // Re-enable engine
    await page.click('[data-testid="toggle-engine"]');
    await expect(page.locator('[data-testid="engine-lines"]')).toBeVisible();
    
    // Verify multi-PV lines are shown
    const engineLines = await page.locator('[data-testid="engine-line"]').count();
    expect(engineLines).toBeGreaterThanOrEqual(1);
    expect(engineLines).toBeLessThanOrEqual(3);
  });

  test('mobileResponsive_touchInteractions_workCorrectly', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Test touch interaction for moves
    await page.locator('[data-square="e2"]').tap();
    await page.locator('[data-square="e4"]').tap();
    
    // Verify move was made
    await expect(page.locator('[data-testid="move-history"]')).toContainText('e4');
    
    // Test swipe for navigation (if implemented)
    // await page.locator('[data-testid="chessboard"]').swipe({ direction: 'left' });
  });
});