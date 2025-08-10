/**
 * @file E2E test for streak counter functionality
 * @module tests/e2e/streak-counter
 * 
 * @description
 * End-to-end test that reproduces the streak counter bug:
 * 1. Complete position 1 successfully 
 * 2. Navigate to position 2 via "Weiter" button
 * 3. Verify streak counter shows 1 (not 0)
 * 
 * This test reproduces the actual user experience where the streak
 * appears to reset when navigating between positions.
 */

import { test, expect } from '@playwright/test';
import { TrainingBoardPage } from './helpers/pageObjects/TrainingBoardPage';
import { TRAIN_SCENARIOS } from '../fixtures/trainPositions';

test.describe('Streak Counter E2E', () => {
  let trainingBoard: TrainingBoardPage;

  test.beforeEach(async ({ page }) => {
    trainingBoard = new TrainingBoardPage(page);
    
    // Navigate to first training position
    await page.goto('/train/1');
    
    // Wait for page to be ready
    await trainingBoard.waitForPageReady();
  });

  test('should maintain streak count when navigating from position 1 to position 2 after success', async ({ page }) => {
    // Step 1: Verify initial streak is 0
    await expect(page.locator('[data-testid="current-streak"]')).toHaveText('0');
    await expect(page.locator('[data-testid="best-streak"]')).toHaveText('0');
    
    console.log('✓ Initial streak verified: 0/0');

    // Step 2: Wait for test API to be ready
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
      { timeout: 10000 }
    );
    
    console.log('✓ Test API ready');

    // Step 3: Complete position 1 successfully using the WIN sequence from trainPositions.ts
    const moves = TRAIN_SCENARIOS.TRAIN_1.sequences.WIN.moves;
    
    for (const move of moves) {
      console.log(`Making move: ${move}`);
      const result = await page.evaluate(async (moveStr) => {
        // Use validated move for the final promotion to trigger win detection
        const isPromotion = moveStr.includes("=");
        const testApi = (window as any).__testApi;
        return isPromotion && testApi?.makeValidatedMove
          ? await testApi.makeValidatedMove(moveStr)
          : await (window as any).e2e_makeMove(moveStr);
      }, move);
      
      console.log(`Move result:`, result);
      
      if (!result.success) {
        console.log(`❌ Move ${move} failed:`, result);
        break;
      }
      
      // Wait a bit between moves
      await page.waitForTimeout(500);
      
      // Check for any success indicators after this move
      const successSelectors = [
        'text="Geschafft"',
        'text="Erfolg"', 
        'text="Gewonnen"',
        'text="Umwandlung"',
        'text="Dame"',
        '[data-testid="success-dialog"]',
        '[data-testid="move-success-dialog"]',
        'button:has-text("Weiter")'
      ];
      
      let hasSuccess = false;
      for (const selector of successSelectors) {
        try {
          hasSuccess = await page.locator(selector).isVisible();
          if (hasSuccess) {
            console.log('✅ Success achieved after move:', move, '- Found:', selector);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      if (hasSuccess) break;
    }
    
    // Wait for any success dialog to appear
    const successSelectors = [
      'text="Geschafft"',
      'text="Erfolg"', 
      'text="Gewonnen"',
      'button:has-text("Weiter")',
      '[data-testid="success-dialog"]'
    ];
    
    let foundSuccess = false;
    for (const selector of successSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        console.log('✅ Found success dialog with selector:', selector);
        foundSuccess = true;
        break;
      } catch (e) {
        console.log(`❌ No success dialog found with selector: ${selector}`);
      }
    }
    
    if (!foundSuccess) {
      throw new Error('No success dialog found after completing the position');
    }
    
    console.log('✓ Position completed successfully');

    // Step 4: Verify streak incremented after success
    await expect(page.locator('[data-testid="current-streak"]')).toHaveText('1');
    await expect(page.locator('[data-testid="best-streak"]')).toHaveText('1');
    
    console.log('✓ Streak incremented to 1/1 after success');

    // Step 5: Click "Weiter" button to navigate to next position
    await page.locator('button:has-text("Weiter")').click();
    
    console.log('✓ Clicked Weiter button');

    // Step 6: Wait for navigation to next position  
    await page.waitForURL('**/train/*');
    await trainingBoard.waitForPageReady();
    
    console.log('✓ Navigated to next training position');

    // Step 7: Verify streak is STILL 1 (not reset to 0)
    // This is where the bug occurs - streak gets reset to 0
    await expect(page.locator('[data-testid="current-streak"]')).toHaveText('1', {
      timeout: 5000
    });
    await expect(page.locator('[data-testid="best-streak"]')).toHaveText('1', {
      timeout: 5000  
    });
    
    console.log('✓ Streak maintained at 1/1 in next training position');
  });

  test.skip('should show streak progression through multiple positions', async ({ page }) => {
    // This test is skipped for now - focus on the main streak persistence issue
    console.log('Test skipped - focusing on main streak bug reproduction');
  });

  test.skip('should reset current streak on failure but maintain best streak', async ({ page }) => {
    // This test is also skipped for now - focus on the main issue
    console.log('Test skipped - focusing on main streak bug reproduction');
  });

  test('debug streak behavior with console logs', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('🔥') || msg.text().includes('👑')) {
        console.log('BROWSER CONSOLE:', msg.text());
      }
    });

    // Wait for test API to be ready
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
      { timeout: 10000 }
    );
    
    console.log('✓ Test API ready');

    // Use the exact WIN sequence from trainPositions.ts TRAIN_1
    const moves = TRAIN_SCENARIOS.TRAIN_1.sequences.WIN.moves;
    console.log('WIN sequence moves:', moves);
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      console.log(`Making move ${i + 1}/${moves.length}: ${move}`);
      
      const result = await page.evaluate(async (moveStr) => {
        try {
          console.log(`Browser: Attempting move ${moveStr}...`);
          // Use validated move for the final promotion to trigger win detection
          const isPromotion = moveStr.includes("=");
          const testApi = (window as any).__testApi;
          const result = isPromotion && testApi?.makeValidatedMove
            ? await testApi.makeValidatedMove(moveStr)
            : await (window as any).e2e_makeMove(moveStr);
          console.log(`Browser: Move ${moveStr} completed with result:`, result);
          return result;
        } catch (error) {
          console.log(`Browser: Move ${moveStr} failed with error:`, error);
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      }, move);
      
      console.log(`Node: Move result for ${move}:`, result);
      
      // Also get detailed game state after each move
      const gameState = await page.evaluate(() => {
        try {
          return (window as any).e2e_getGameState ? (window as any).e2e_getGameState() : null;
        } catch (error) {
          return { error: error instanceof Error ? error.message : String(error) };
        }
      });
      
      console.log(`Node: Game state after ${move}:`, gameState);
      
      if (!result.success) {
        console.log(`❌ Move ${move} failed:`, result);
        break;
      }
      
      // Wait between moves
      await page.waitForTimeout(500);
      
      // Check for any success indicators after this move
      const successSelectors = [
        'text="Geschafft"',
        'text="Erfolg"', 
        'text="Gewonnen"',
        'text="Umwandlung"',
        'text="Dame"',
        '[data-testid="success-dialog"]',
        '[data-testid="move-success-dialog"]',
        'button:has-text("Weiter")'
      ];
      
      let hasSuccess = false;
      for (const selector of successSelectors) {
        try {
          hasSuccess = await page.locator(selector).isVisible();
          if (hasSuccess) {
            console.log('✅ Success achieved after move:', move, '- Found:', selector);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      if (hasSuccess) break;
      
      // Special handling for the last move (pawn promotion)
      if (i === moves.length - 1) {
        console.log('🎯 Last move completed, checking for promotion dialog...');
        
        // Wait for promotion dialog to appear
        const promotionSelectors = [
          '[data-testid="promotion-dialog"]',
          '[data-testid="promotion-D"]',
          '[data-testid="promotion-q"]',
          'button:has-text("Dame")',
          'button:has-text("D")',
          '.promotion-dialog',
          '[class*="promotion"]'
        ];
        
        let foundPromotionDialog = false;
        for (const selector of promotionSelectors) {
          try {
            const dialogVisible = await page.locator(selector).isVisible({ timeout: 3000 });
            if (dialogVisible) {
              console.log('✅ Found promotion dialog with selector:', selector);
              foundPromotionDialog = true;
              
              // Click on Queen/Dame promotion
              if (selector.includes('Dame') || selector.includes('D')) {
                await page.locator(selector).click();
              } else {
                // Try to find and click Dame button within the dialog
                try {
                  await page.locator('button:has-text("Dame")').click({ timeout: 2000 });
                  console.log('✅ Clicked Dame promotion button');
                } catch {
                  try {
                    await page.locator('[data-testid="promotion-D"]').click({ timeout: 2000 });
                    console.log('✅ Clicked D promotion button');
                  } catch {
                    // Just click the dialog area
                    await page.locator(selector).click();
                    console.log('✅ Clicked promotion dialog');
                  }
                }
              }
              
              // Wait for promotion to complete
              await page.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            // Continue trying other selectors
          }
        }
        
        if (!foundPromotionDialog) {
          console.log('❌ No promotion dialog found after pawn reaches 8th rank');
        }
      }
    }
    
    // Check for any success dialog with multiple selectors
    const successSelectors = [
      'text="Geschafft"',
      'text="Erfolg"', 
      'text="Gewonnen"',
      'button:has-text("Weiter")',
      '[data-testid="success-dialog"]'
    ];
    
    let foundSuccess = false;
    for (const selector of successSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        console.log('✅ Found success dialog with selector:', selector);
        foundSuccess = true;
        break;
      } catch (e) {
        console.log(`❌ No success dialog found with selector: ${selector}`);
      }
    }
    
    if (!foundSuccess) {
      // Debug: Show what's actually on the page
      const pageContent = await page.content();
      console.log('📄 Page HTML content (first 2000 chars):', pageContent.substring(0, 2000));
      
      // Check store state for any success indicators
      const storeState = await page.evaluate(() => {
        const store = (window as any).__zustand_store;
        return store ? store.getState() : null;
      });
      console.log('🗄️ Current store state:', JSON.stringify(storeState, null, 2));
    }
    
    // Wait a bit to see logs
    await page.waitForTimeout(1000);
    
    // Navigate and see what happens to streak
    await page.locator('button:has-text("Weiter")').click();
    await page.waitForURL('**/train/*'); // Accept any training position
    
    // Wait to see logs during navigation
    await page.waitForTimeout(2000);
    
    // Check final streak state
    const currentStreak = await page.locator('[data-testid="current-streak"]').textContent();
    const bestStreak = await page.locator('[data-testid="best-streak"]').textContent();
    
    console.log(`Final streak state: ${currentStreak}/${bestStreak}`);
  });
});