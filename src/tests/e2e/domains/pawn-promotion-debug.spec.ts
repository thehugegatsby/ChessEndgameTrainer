/**
 * Debug E2E Test for Pawn Promotion
 * Detailed logging and step-by-step analysis
 */

import { test, expect } from "@playwright/test";

test.describe("Pawn Promotion Debug Tests", () => {
  
  test("debug promotion detection and toast system", async ({ page }) => {
    console.log("🔍 Starting detailed promotion debug test...");

    // Mock tablebase to always return win
    await page.route("**/api/tablebase/**", async (route) => {
      console.log("📡 Tablebase API call:", route.request().url());
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

    // Navigate and wait for setup
    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]', { timeout: 10000 });
    
    console.log("✅ Board loaded");

    // Wait for E2E API
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function", 
      { timeout: 10000 }
    );
    
    console.log("✅ E2E API ready");

    // Check initial game state
    const initialState = await page.evaluate(() => {
      return (window as any).e2e_getGameState();
    });
    
    console.log("📋 Initial game state:", {
      fen: initialState.fen,
      turn: initialState.turn,
      moveCount: initialState.moveCount
    });

    // Check toast container exists  
    const toastContainer = page.locator('.toast-container, [data-testid="toast-container"]');
    const hasToastContainer = await toastContainer.count() > 0;
    console.log("🍞 Toast container exists:", hasToastContainer);

    // Check Zustand store state
    const storeState = await page.evaluate(() => {
      const store = (window as any).__zustand_store;
      if (store) {
        const state = store.getState();
        return {
          hasUI: !!state.ui,
          toastCount: state.ui?.toasts?.length || 0,
          toasts: state.ui?.toasts || []
        };
      }
      return { error: "Store not available" };
    });
    
    console.log("🏪 Store state:", storeState);

    // Test sequence leading to promotion from position 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1
    console.log("🎯 Making first move: Kd6");
    
    // Just make the first move - the position has Black King on e8, White King on e6, White pawn on e5
    const firstMove = await page.evaluate(async () => {
      try {
        const result = await (window as any).e2e_makeMove("e6-d6"); // Kd6
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    console.log("First move (Kd6) result:", firstMove);
    
    // Wait for opponent move and then continue - the app should auto-play the solution
    console.log("⏳ Waiting for game to progress...");
    await page.waitForTimeout(3000);
    
    // Check if the game has progressed by looking at move history
    const gameState = await page.evaluate(() => {
      return (window as any).e2e_getGameState();
    });
    
    console.log("🎯 Game state after first move:", {
      fen: gameState.fen,
      turn: gameState.turn,
      moveCount: gameState.moveCount
    });

    // Try a direct promotion move from starting position to test the format
    console.log("🚀 Testing direct promotion command");
    
    // First, let's see what the E2E API understands about promotion
    const testFormats = ["e7-e8", "e7-e8=Q", "e7e8", "e7e8q"];
    
    for (const format of testFormats) {
      console.log(`Testing promotion format: "${format}"`);
      const testResult = await page.evaluate(async (moveStr) => {
        try {
          const result = await (window as any).e2e_makeMove(moveStr);
          return { success: true, result, format: moveStr };
        } catch (error) {
          return { success: false, error: (error as Error).message, format: moveStr };
        }
      }, format);
      console.log(`Format "${format}" result:`, testResult);
    }
    
    const promotionResult = await page.evaluate(async () => {
      try {
        // Check store state before promotion
        const store = (window as any).__zustand_store;
        const stateBefore = store ? {
          toastsBefore: store.getState().ui.toasts.length
        } : null;
        
        // Make promotion move with basic coordinate format
        const result = await (window as any).e2e_makeMove("e7-e8");
        
        // Check store state after promotion
        const stateAfter = store ? {
          toastsAfter: store.getState().ui.toasts.length,
          latestToasts: store.getState().ui.toasts.slice(-2)
        } : null;
        
        return {
          success: true,
          result,
          stateBefore,
          stateAfter
        };
      } catch (error) {
        return { 
          success: false, 
          error: (error as Error).message 
        };
      }
    });
    
    console.log("🎉 Promotion result:", promotionResult);

    // Check if toast appeared in UI
    if (promotionResult.success) {
      console.log("🔍 Checking for visible toasts...");
      
      // Wait a moment for UI to update
      await page.waitForTimeout(1000);
      
      // Look for success toasts - check for actual green background and German text
      const successToasts = page.locator('[class*="bg-green-500"], [class*="bg-green"], :has-text("Glückwunsch"), :has-text("Dame"), :has-text("Sieg")');
      const toastCount = await successToasts.count();
      
      console.log(`🍞 Found ${toastCount} success toast(s)`);
      
      if (toastCount > 0) {
        const toastText = await successToasts.first().textContent();
        console.log("🎯 Toast text:", toastText);
        expect(toastCount).toBeGreaterThan(0);
      } else {
        console.log("❌ No visible success toasts found");
        
        // Debug: Check all visible elements with "Glückwunsch" or success indicators
        const allToasts = page.locator('div:has-text("Glück"), div:has-text("Dame"), div:has-text("success"), [class*="toast"]');
        const allToastCount = await allToasts.count();
        console.log(`🔍 Found ${allToastCount} toast-like elements`);
        
        for (let i = 0; i < Math.min(allToastCount, 3); i++) {
          const text = await allToasts.nth(i).textContent();
          const isVisible = await allToasts.nth(i).isVisible();
          console.log(`Toast ${i}: "${text}" (visible: ${isVisible})`);
        }
      }
    }
  });
});