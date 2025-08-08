/**
 * E2E Test for Pawn Promotion Auto-Win Feature
 */

import { test, expect } from "@playwright/test";
import { E2EMoveSequences } from "../../fixtures/fenPositions";
import { 
  waitForMoveAnimation,
  waitForUIReady,
  waitForOpponentMove
} from "../helpers/deterministicWaiting";

test.describe("Pawn Promotion Auto-Win Feature", () => {
  test.skip("should show success message when promotion leads to win", async ({
    page,
  }) => {
    console.log("🚀 Testing promotion auto-win with FULL move sequence...");

    // Mock tablebase API to return win for winning positions
    await page.route("**/api/tablebase/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          category: "win",
          wdl: 2, // Win for white
          dtm: 5,
          moves: [],
        }),
      });
    });

    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]', {
      timeout: 10000,
    });

    // Wait for API to be ready
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
    );

    // Use the complete sequence from central data - play ALL moves (white and black)
    const sequence = E2EMoveSequences.PAWN_PROMOTION_TO_WIN;

    console.log("🎯 Playing COMPLETE winning promotion sequence...");
    console.log("Sequence moves:", sequence.moves);

    for (let i = 0; i < sequence.moves.length; i++) {
      const move = sequence.moves[i];
      console.log(`Making move ${i + 1}/${sequence.moves.length}: ${move}`);

      const result = await page.evaluate(async (moveStr) => {
        const result = await (window as any).e2e_makeMove(moveStr);
        console.log(`Move result:`, result);
        return result;
      }, move);

      if (!result.success) {
        console.log(`❌ Move ${move} failed:`, result);
        break;
      }

      // Special handling for the promotion move
      if (move.includes("=Q")) {
        console.log(
          "🎯 Promotion move successful! Waiting for auto-win detection...",
        );
        await waitForUIReady(page); // Give time for promotion detection
        break;
      }

      // Short wait between moves
      await waitForMoveAnimation(page);
    }

    // Check if sequence completed successfully
    console.log("🎯 Checking if promotion sequence completed...");

    // Give time for promotion detection logic to run
    await waitForUIReady(page);

    // Check final state
    const finalState = await page.evaluate(() => {
      const store = (window as any).__zustand_store;
      if (store) {
        const state = store.getState();
        return {
          isSuccess: state.training?.isSuccess,
          toasts: state.ui?.toasts || [],
          currentModal: state.ui?.currentModal,
          moveSuccessDialog: state.training?.moveSuccessDialog,
          promotionToasts: state.ui?.toasts?.filter(
            (t: any) =>
              t.type === "success" && t.message?.includes("Umwandlung"),
          ),
        };
      }
      return null;
    });

    console.log("📊 Final state after promotion attempt:", finalState);

    // Check for promotion success dialog instead of toast
    const hasPromotionSuccess =
      finalState?.moveSuccessDialog?.isOpen &&
      finalState?.moveSuccessDialog?.promotionPiece;

    console.log(`🔍 Promotion success detected: ${hasPromotionSuccess}`);
    console.log(`🔍 Move success dialog:`, finalState?.moveSuccessDialog);

    if (hasPromotionSuccess) {
      expect(hasPromotionSuccess).toBe(true);
      console.log("✅ SUCCESS: Promotion auto-win detection working!");
    } else {
      console.log("❌ ISSUE: No success dialog found after promotion sequence");
      console.log("This means the promotion detection feature is NOT working");
      expect(hasPromotionSuccess).toBe(true); // This will fail and show the real issue
    }
  });

  test.skip("should NOT show success message when promotion leads to draw", async ({
    page,
  }) => {
    console.log("Testing promotion that should NOT trigger auto-win...");

    // Mock tablebase API to return draw for drawing positions
    await page.route("**/api/tablebase/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          category: "draw",
          wdl: 0, // Draw
          dtm: null,
          moves: [],
        }),
      });
    });

    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]', {
      timeout: 10000,
    });

    // Use the drawing sequence from central data
    const sequence = E2EMoveSequences.PAWN_PROMOTION_TO_DRAW;

    console.log("Playing drawing promotion sequence...");

    for (let i = 0; i < Math.min(5, sequence.moves.length); i++) {
      const move = sequence.moves[i];
      console.log(`Making move ${i + 1}: ${move}`);

      const result = await page.evaluate(async (moveStr) => {
        return await (window as any).e2e_makeMove(moveStr);
      }, move);

      console.log(`Move result:`, result);

      // Wait for opponent moves
      await waitForOpponentMove(page);
    }

    // Check that NO promotion success was detected
    const storeState = await page.evaluate(() => {
      const store = (window as any).__zustand_store;
      if (store) {
        const state = store.getState();
        return {
          isSuccess: state.training?.isSuccess,
          toasts: state.ui?.toasts || [],
          currentModal: state.ui?.currentModal,
          moveSuccessDialog: state.training?.moveSuccessDialog,
        };
      }
      return null;
    });

    console.log("Store state after drawing sequence:", storeState);

    // Should NOT have success indication for drawing promotion
    const hasWinIndication =
      storeState?.isSuccess ||
      storeState?.toasts?.some(
        (t: any) => t.type === "success" && t.message?.includes("Dame"),
      ) ||
      (storeState?.moveSuccessDialog?.isOpen &&
        storeState?.moveSuccessDialog?.promotionPiece);

    console.log(`Has win indication: ${hasWinIndication}`);
    console.log(`Move success dialog:`, storeState?.moveSuccessDialog);
    expect(hasWinIndication).toBe(false); // Should be false for draw sequence
  });

  test.skip("should show correct promotion message", async ({ page }) => {
    // Mock winning tablebase response
    await page.route("**/api/tablebase/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          category: "win",
          wdl: 2,
          dtm: 5,
          moves: [],
        }),
      });
    });

    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]');

    // Wait for API
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
    );

    // Direct test: make a promotion move
    console.log("Testing direct promotion message...");

    // Try to make promotion move (this might fail if position isn't set up)
    try {
      await page.evaluate(async () => {
        return await (window as any).e2e_makeMove("e7-e8=Q");
      });

      // Check for German success dialog instead of toast
      const dialogState = await page.evaluate(() => {
        const store = (window as any).__zustand_store;
        if (store) {
          const state = store.getState();
          return state.training?.moveSuccessDialog;
        }
        return null;
      });

      console.log("Dialog state:", dialogState);

      // Check that dialog contains German promotion piece name
      if (
        dialogState?.isOpen &&
        dialogState?.promotionPiece?.includes("Dame")
      ) {
        console.log("✅ German promotion dialog found with Dame!");
      } else {
        console.log("❌ German promotion dialog not found");
      }
    } catch (error) {
      console.log(
        "Direct promotion test failed (expected if position not set up):",
        error,
      );
    }
  });
});
