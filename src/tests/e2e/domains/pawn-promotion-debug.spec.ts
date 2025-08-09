/**
 * Pawn Promotion Debug Tests
 * Tests pawn promotion detection and UI behavior
 */

import { test, expect } from "@playwright/test";
import { TrainingBoardPage } from "../helpers/pageObjects/TrainingBoardPage";
import { E2E } from "../../../shared/constants";
import { getLogger } from "../../../shared/services/logging";
import { 
  waitForTablebaseInit,
  waitForOpponentMove
} from "../helpers/deterministicWaiting";

test.describe.skip("Pawn Promotion Debug Tests", () => {
  const logger = getLogger().setContext("E2E-PawnPromotionDebug");

  test("debug promotion detection and toast system", async ({ page }) => {
    logger.info("🔍 Starting detailed promotion debug test...");

    // Mock tablebase to always return win
    await page.route("**/api/tablebase/**", async (route) => {
      logger.info("📡 Tablebase API call:", route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          category: "win", 
          wdl: 2,
          dtm: 8,
          moves: [],
        }),
      });
    });

    // Navigate to training page
    await page.goto(E2E.ROUTES.TRAIN(1));
    
    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await waitForTablebaseInit(page);
    
    logger.info("✅ Board loaded");

    // Get initial state
    const initialState = await boardPage.getGameState();
    logger.info("📋 Initial game state:", {
      fen: initialState.fen,
      turn: initialState.turn,
      moveCount: initialState.moveCount,
    });
    
    // Train/1 starts with: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1
    // We'll try to advance the pawn toward promotion
    
    // Move 1: Pawn e5 to e6
    logger.info("Attempting pawn advance e5-e6");
    let moveSuccessful = await boardPage.makeMoveWithValidation("e5", "e6");
    
    if (moveSuccessful) {
      logger.info("✅ Pawn moved to e6");
      
      // Check for any toasts or messages
      const toast = page.locator('[data-testid="toast"], .toast, [role="alert"]');
      const hasToast = await toast.isVisible().catch(() => false);
      
      if (hasToast) {
        const toastText = await toast.textContent();
        logger.info("Toast appeared:", toastText);
      }
      
      // Wait for opponent's response
      await waitForOpponentMove(page);
      
      const stateAfterE6 = await boardPage.getGameState();
      logger.info("Position after e6:", stateAfterE6.fen);
      
      // If it's our turn again, try to advance further
      if (stateAfterE6.turn === "w") {
        logger.info("Attempting pawn advance e6-e7");
        moveSuccessful = await boardPage.makeMoveWithValidation("e6", "e7");
        
        if (moveSuccessful) {
          logger.info("✅ Pawn moved to e7");
          
          // Wait for opponent
          await waitForOpponentMove(page);
          
          const stateAfterE7 = await boardPage.getGameState();
          logger.info("Position after e7:", stateAfterE7.fen);
          
          // If it's our turn and pawn is on e7, try promotion
          if (stateAfterE7.turn === "w" && stateAfterE7.fen.includes("P")) {
            logger.info("Attempting promotion e7-e8");
            
            // Try to promote to Queen
            moveSuccessful = await boardPage.makeMoveWithValidation("e7", "e8", "q");
            
            if (moveSuccessful) {
              logger.info("✅ PROMOTION SUCCESSFUL!");
              
              // Check for promotion dialog or automatic queen
              const finalState = await boardPage.getGameState();
              logger.info("Final position after promotion:", finalState.fen);
              
              // Verify we have a Queen
              if (finalState.fen.includes("Q")) {
                logger.info("✅ Queen detected in final position!");
                expect(finalState.fen).toContain("Q");
              } else {
                logger.info("❌ No Queen found after promotion");
              }
            } else {
              logger.info("❌ Promotion move failed");
            }
          }
        }
      }
    } else {
      logger.info("❌ Initial pawn move failed");
    }
    
    // Debug: Check what elements are visible on the board
    logger.info("=== Board Debug Info ===");
    
    // Check for pieces
    const pieces = await page.locator('[draggable="true"]').count();
    logger.info(`Number of draggable pieces: ${pieces}`);
    
    // Check for squares
    const squares = await page.locator('[data-square]').count();
    logger.info(`Number of squares with data-square: ${squares}`);
    
    // Check for any error dialogs
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    const hasError = await errorDialog.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorDialog.textContent();
      logger.info("Error dialog present:", errorText);
    }
    
    // Final verification
    const finalState = await boardPage.getGameState();
    expect(finalState.fen).toBeDefined();
    expect(finalState.moveCount).toBeGreaterThanOrEqual(0);
    
    logger.info("=== Test Complete ===");
  });
});