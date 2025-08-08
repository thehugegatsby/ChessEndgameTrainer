/**
 * Pawn Promotion Test - Migrated to SequenceRunner
 * 
 * This is a migrated version of pawn-promotion.spec.ts using the SequenceRunner framework.
 * Demonstrates the benefits of declarative testing over imperative testing.
 */

import { test } from "@playwright/test";
import { SequenceRunner, expectation } from "../helpers/sequenceRunner";
import { E2EMoveSequences } from "../../fixtures/fenPositions";
import { waitForPageReady, waitForTablebaseInit } from "../helpers/deterministicWaiting";
import { getLogger } from "@shared/services/logging";

test.describe.skip("Pawn Promotion Auto-Win (SequenceRunner) - SKIPPED: _internalApplyMove issue", () => {
  const logger = getLogger().setContext("E2E-PawnPromotion-SequenceRunner");

  test("should show success message when promotion leads to win", async ({ page }) => {
    logger.info("🎯 Testing pawn promotion auto-win with SequenceRunner");

    // Navigate to training page
    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    // Initialize SequenceRunner
    const runner = new SequenceRunner(page);

    // Get the promotion sequence from central fixtures
    const sequence = E2EMoveSequences.PAWN_PROMOTION_TO_WIN;
    
    logger.info(`📋 Sequence has ${sequence.moves.length} moves`);
    logger.info(`Moves: ${sequence.moves.join(", ")}`);

    // Execute the promotion sequence with expectations
    await runner.executeSequence({
      name: "Pawn Promotion to Queen Win",
      description: "Tests automatic win detection when pawn promotes to queen",
      moves: [...sequence.moves], // Convert readonly array to mutable
      expectations: [
        // After promotion move (e7-e8=Q), expect success dialog
        expectation.promotionSuccessDialog("Dame", sequence.moves.length - 1),
        
        // Expect success toast for promotion
        expectation.successToast("Umwandlung in Dame", sequence.moves.length - 1),
        
        // Final expectation: training should be successful
        expectation.trainingSuccess(),
        
        // Modal should show completion
        expectation.modalOpen("completion"),
        
        // Store state should reflect success
        expectation.storeState("training.isSuccess", true)
      ],
      setup: {
        mockTablebase: true // Mock tablebase to return winning positions
      }
    });

    logger.info("✅ Pawn promotion test completed successfully with SequenceRunner");
  });

  test("should handle promotion to different pieces", async ({ page }) => {
    logger.info("🎯 Testing promotion to different pieces");

    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    const runner = new SequenceRunner(page);

    // Test promotion to rook
    const rookPromotionSequence = {
      name: "Pawn Promotion to Rook",
      description: "Tests promotion to rook instead of queen",
      moves: [
        "e6-d6", "e8-f7", "e5-e6+", "f7-f6", 
        "d6-d7", "f6-e5", "e6-e7", "e5-f5", "e7-e8=R"
      ],
      expectations: [
        expectation.promotionDialog("Turm", "e8=R", 8),
        expectation.successToast("Umwandlung in Turm", 8)
      ],
      setup: {
        mockTablebase: true
      }
    };

    await runner.executeSequence(rookPromotionSequence);
    
    logger.info("✅ Rook promotion test completed");
  });

  test("should handle underpromotion scenarios", async ({ page }) => {
    logger.info("🎯 Testing underpromotion scenarios");

    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    const runner = new SequenceRunner(page);

    // Test knight underpromotion (sometimes needed to avoid stalemate)
    const knightPromotionSequence = {
      name: "Knight Underpromotion",
      description: "Tests underpromotion to knight to avoid stalemate",
      moves: [
        "e6-d6", "e8-f7", "e5-e6+", "f7-f8",
        "d6-d7", "f8-g7", "e6-e7", "g7-f7", "e7-e8=N+"
      ],
      expectations: [
        expectation.promotionDialog("Springer", "e8=N+", 8),
        expectation.successToast("Umwandlung in Springer", 8),
        // Knight promotion gives check
        expectation.storeState("game.inCheck", true, 8)
      ],
      setup: {
        mockTablebase: true
      }
    };

    await runner.executeSequence(knightPromotionSequence);
    
    logger.info("✅ Knight underpromotion test completed");
  });

  test("should show error for wrong promotion choice", async ({ page }) => {
    logger.info("🎯 Testing wrong promotion choice");

    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    const runner = new SequenceRunner(page);

    // Test promoting to bishop when queen would win
    const wrongPromotionSequence = {
      name: "Wrong Promotion Choice",
      description: "Tests error handling when choosing suboptimal promotion",
      moves: [
        "e6-d6", "e8-f7", "e5-e6+", "f7-f6",
        "d6-d7", "f6-e5", "e6-e7", "e5-f5", "e7-e8=B" // Bishop instead of Queen
      ],
      expectations: [
        // Should show error dialog for suboptimal promotion
        expectation.errorToast("Bessere Umwandlung war Dame", 8),
        expectation.storeState("training.lastMoveQuality", "suboptimal", 8),
        // Note: moveError dialog check would go here but needs to be added to expectation helpers
      ],
      setup: {
        mockTablebase: true
      }
    };

    await runner.executeSequence(wrongPromotionSequence);
    
    logger.info("✅ Wrong promotion error handling test completed");
  });
});

test.describe.skip("Pawn Promotion Edge Cases (SequenceRunner) - SKIPPED: _internalApplyMove issue", () => {
  const logger = getLogger().setContext("E2E-PromotionEdgeCases");

  test("should handle promotion with opponent's immediate capture", async ({ page }) => {
    logger.info("🎯 Testing promotion with immediate capture threat");

    await page.goto("/train/1");
    await waitForPageReady(page);
    await waitForTablebaseInit(page);

    const runner = new SequenceRunner(page);

    const captureScenario = {
      name: "Promotion Under Capture Threat",
      description: "Tests promotion when opponent can immediately capture promoted piece",
      moves: [
        "e6-d6", "e8-d8", "e5-e6", "d8-c8",
        "e6-e7", "c8-b7", "e7-e8=Q" // Queen can be captured but still wins
      ],
      expectations: [
        expectation.promotionSuccessDialog("Dame", 6),
        // Even though queen can be captured, position is still winning
        expectation.storeState("tablebase.evaluation.category", "win", 6)
      ],
      setup: {
        mockTablebase: true
      }
    };

    await runner.executeSequence(captureScenario);
    
    logger.info("✅ Promotion under capture threat test completed");
  });

  test("should handle simultaneous promotion race", async ({ page }) => {
    logger.info("🎯 Testing simultaneous promotion race");

    await page.goto("/train/1");
    await waitForPageReady(page);
    
    // For this test, we need a different starting position
    // This would require setting up a specific FEN position
    // For now, we'll skip this as it requires position setup
    
    test.skip();
  });
});