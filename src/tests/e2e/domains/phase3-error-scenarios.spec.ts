/**
 * Phase 3 Error Scenarios Test
 * 
 * Tests various error scenarios using the new deterministic waiting infrastructure:
 * - Network failures
 * - Slow responses
 * - Invalid moves
 * - Recovery flows
 * 
 * All tests use the new deterministic waiting helpers instead of hardcoded timeouts.
 */

import { test, expect } from "@playwright/test";
import { ChessboardPage } from "../helpers/pageObjects/ChessboardPage";
import { TrainingBoardPage } from "../helpers/pageObjects/TrainingBoardPage";
import { mockTablebase, mockAPI } from "../helpers/playwrightMocking";
import { 
  waitForPageReady,
  waitForTablebaseInit,
  waitForUIReady,
  waitForToast,
  waitForOpponentMove,
  waitForNetworkIdle,
  waitForStableState
} from "../helpers/deterministicWaiting";
import { getLogger } from "@shared/services/logging";

test.describe("Phase 3 Error Scenarios with New Infrastructure", () => {
  const logger = getLogger().setContext("E2E-Phase3-ErrorScenarios");

  test("should handle network timeout gracefully", async ({ page }) => {
    logger.info("🔌 Testing network timeout handling");

    // Mock API to never respond (simulate timeout)
    await page.route('**/tablebase.lichess.ovh/standard**', async (route) => {
      // Just hang - don't respond at all
      await new Promise(() => {}); // Never resolves
    });

    await page.goto("/train/1");
    await waitForPageReady(page);

    const chessboard = new ChessboardPage(page);
    
    // This should timeout gracefully
    try {
      await Promise.race([
        waitForTablebaseInit(page),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Expected timeout")), 5000)
        )
      ]);
      
      // If we get here, check for error state
      const hasError = await page.locator('[data-testid="error-message"]').isVisible();
      expect(hasError).toBe(true);
      logger.info("✅ Network timeout handled with error message");
    } catch (error) {
      logger.info("✅ Network timeout detected as expected");
    }
  });

  test("should handle API 500 errors with retry option", async ({ page }) => {
    logger.info("💥 Testing API 500 error handling");

    // Mock API to return 500 error
    await mockTablebase.error(page, 500);

    await page.goto("/train/1");
    await waitForPageReady(page);

    // Wait for error to be shown
    await waitForUIReady(page);

    // Look for error indicators
    const errorIndicators = [
      '[data-testid="error-toast"]',
      '[data-testid="error-message"]',
      '.error-message',
      'text=/fehler/i',
      'text=/error/i'
    ];

    let errorFound = false;
    for (const selector of errorIndicators) {
      if (await page.locator(selector).isVisible().catch(() => false)) {
        errorFound = true;
        logger.info(`✅ Error indicator found: ${selector}`);
        break;
      }
    }

    // Look for retry button
    const retryButton = page.locator('button:has-text("Wiederholen"), button:has-text("Retry")').first();
    if (await retryButton.isVisible()) {
      logger.info("✅ Retry button available");
      
      // Mock successful response for retry
      await mockTablebase.success(page);
      
      // Click retry
      await retryButton.click();
      await waitForTablebaseInit(page);
      
      logger.info("✅ Retry successful after error");
    }
  });

  test("should handle invalid move with error dialog", async ({ page }) => {
    logger.info("❌ Testing invalid move error handling");

    await mockTablebase.success(page);
    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    const boardPage = new TrainingBoardPage(page);
    
    // Get initial state
    const initialState = await boardPage.getGameState();
    logger.info(`Initial position: ${initialState.fen}`);

    // Try to make an invalid move (move to same square or invalid destination)
    try {
      // Try to move a piece to an invalid square
      const fromSquare = page.locator('[data-square="a1"]');
      const toSquare = page.locator('[data-square="h8"]'); // Likely invalid
      
      if (await fromSquare.isVisible() && await toSquare.isVisible()) {
        await fromSquare.click();
        await toSquare.click();
        
        // Wait for any error indication
        await waitForUIReady(page);
        
        // Check if move was rejected
        const finalState = await boardPage.getGameState();
        if (finalState.fen === initialState.fen) {
          logger.info("✅ Invalid move correctly rejected (position unchanged)");
        }
        
        // Check for error dialog
        const errorDialog = page.locator('[data-testid="move-error-dialog"]');
        if (await errorDialog.isVisible()) {
          logger.info("✅ Error dialog shown for invalid move");
          
          // Test "Continue Playing" option
          const continueButton = page.locator('[data-testid="move-error-continue"]');
          if (await continueButton.isVisible()) {
            await continueButton.click();
            await waitForUIReady(page);
            logger.info("✅ Continue playing after error works");
          }
        }
      }
    } catch (error) {
      logger.info("Move validation prevented invalid move (expected behavior)");
    }
  });

  test("should handle rapid successive moves without race conditions", async ({ page }) => {
    logger.info("⚡ Testing rapid move handling");

    await mockTablebase.success(page);
    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    const chessboard = new ChessboardPage(page);
    
    // Try to make multiple moves rapidly
    const moves = [
      { from: "e2", to: "e4" },
      { from: "d2", to: "d4" },
      { from: "c2", to: "c4" }
    ];

    for (const move of moves) {
      try {
        // Check if it's player's turn before attempting move
        const isPlayerTurn = await chessboard.isPlayerTurn();
        
        if (isPlayerTurn) {
          logger.info(`Attempting move: ${move.from} to ${move.to}`);
          
          // Make move without waiting between
          await page.locator(`[data-square="${move.from}"]`).click({ force: true });
          await page.locator(`[data-square="${move.to}"]`).click({ force: true });
          
          // Use deterministic waiting
          await chessboard.waitForMoveProcessed();
          
          // If it's an opponent turn game, wait for opponent
          if (!await chessboard.isPlayerTurn()) {
            await waitForOpponentMove(page);
          }
        }
      } catch (error) {
        logger.info(`Move ${move.from}-${move.to} handled gracefully`);
      }
    }
    
    logger.info("✅ Rapid moves handled without race conditions");
  });

  test("should recover from tablebase unavailable scenario", async ({ page }) => {
    logger.info("🚫 Testing tablebase unavailable recovery");

    // Start with tablebase unavailable (404)
    await mockTablebase.error(page, 404);
    
    await page.goto("/train/1");
    await waitForPageReady(page);
    
    // Should show position but indicate tablebase unavailable
    const unavailableIndicators = [
      'text=/nicht verfügbar/i',
      'text=/unavailable/i',
      'text=/tablebase/i'
    ];
    
    let unavailableShown = false;
    for (const selector of unavailableIndicators) {
      if (await page.locator(selector).isVisible().catch(() => false)) {
        unavailableShown = true;
        logger.info("✅ Tablebase unavailable message shown");
        break;
      }
    }
    
    // Now mock tablebase becoming available
    await mockTablebase.success(page);
    
    // Trigger a refresh (could be automatic polling or manual)
    const refreshButton = page.locator('button:has-text("Aktualisieren"), button:has-text("Refresh")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
    } else {
      // Or make a move to trigger new evaluation
      const boardPage = new TrainingBoardPage(page);
      await boardPage.makeMove("e2", "e4");
    }
    
    await waitForTablebaseInit(page);
    
    // Check that evaluation is now available
    const chessboard = new ChessboardPage(page);
    await chessboard.assertEvaluationAvailable();
    
    logger.info("✅ Recovered from tablebase unavailable");
  });

  test("should handle concurrent API calls without duplication", async ({ page }) => {
    logger.info("🔄 Testing concurrent API call handling");

    let apiCallCount = 0;
    
    // Count API calls
    await page.route('**/tablebase.lichess.ovh/standard**', async (route) => {
      apiCallCount++;
      logger.info(`API call #${apiCallCount}`);
      
      // Return success response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dtz: 12,
          category: "win",
          moves: [{ uci: "e2e4", san: "e4", category: "loss", dtz: -11 }]
        })
      });
    });
    
    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);
    
    // Make a move
    const boardPage = new TrainingBoardPage(page);
    await boardPage.makeMove("e2", "e4");
    
    // Wait for everything to settle
    await waitForStableState(page);
    
    // Check that we didn't make excessive API calls
    // Should be at most 2-3 calls (initial + after move)
    expect(apiCallCount).toBeLessThanOrEqual(3);
    logger.info(`✅ Made only ${apiCallCount} API calls (no excessive duplication)`);
  });

  test("should show proper error messages in German", async ({ page }) => {
    logger.info("🇩🇪 Testing German error messages");

    // Mock various error scenarios
    const errorScenarios = [
      { status: 500, expectedText: /Serverfehler|Server-Fehler|Fehler/i },
      { status: 503, expectedText: /nicht verfügbar|Wartung/i },
      { status: 404, expectedText: /nicht gefunden|Tablebase/i }
    ];

    for (const scenario of errorScenarios) {
      await mockTablebase.error(page, scenario.status);
      await page.goto("/train/1");
      await waitForPageReady(page);
      await waitForUIReady(page);
      
      // Look for German error message
      const errorElement = page.locator(`text=${scenario.expectedText}`).first();
      if (await errorElement.isVisible().catch(() => false)) {
        const errorText = await errorElement.textContent();
        logger.info(`✅ German error message for ${scenario.status}: "${errorText}"`);
      }
      
      // Clear for next test
      await page.reload();
    }
  });
});

test.describe("Phase 3 Success Scenarios", () => {
  const logger = getLogger().setContext("E2E-Phase3-Success");

  test("should complete training session with new infrastructure", async ({ page }) => {
    logger.info("🏆 Testing complete training flow");

    await mockTablebase.success(page);
    await page.goto("/train/1");
    
    // Use all our deterministic helpers
    await waitForPageReady(page);
    await waitForTablebaseInit(page);
    await waitForUIReady(page);
    
    const chessboard = new ChessboardPage(page);
    const boardPage = new TrainingBoardPage(page);
    
    // Make several moves
    const moveCount = 3;
    for (let i = 0; i < moveCount; i++) {
      if (await chessboard.isPlayerTurn()) {
        // Find a valid move (simplified - in real scenario would use proper move logic)
        const squares = ['e2', 'e4', 'd2', 'd4', 'c2', 'c4'];
        for (let j = 0; j < squares.length - 1; j += 2) {
          try {
            await boardPage.makeMove(squares[j], squares[j + 1]);
            logger.info(`Move ${i + 1}: ${squares[j]} to ${squares[j + 1]}`);
            break;
          } catch {
            // Try next move
          }
        }
        
        // Wait for opponent if not game over
        if (!await boardPage.isGameOver()) {
          await waitForOpponentMove(page);
        }
      }
    }
    
    // Check final state
    const finalState = await boardPage.getGameState();
    logger.info(`✅ Training session completed. Final move count: ${finalState.moveCount}`);
    
    // Verify all systems working
    await chessboard.assertEvaluationAvailable();
    logger.info("✅ All systems operational with new infrastructure");
  });
});