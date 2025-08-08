import { Page, expect } from "@playwright/test";
import { getLogger } from "@shared/services/logging";

/**
 * Chess Domain Page Object - Replaces hardcoded waitForTimeout() with deterministic waiting
 * 
 * This helper focuses on chess-specific interactions and state validation,
 * providing domain abstractions for common E2E test patterns.
 * 
 * @example
 * ```typescript
 * const chessboard = new ChessboardPage(page);
 * await chessboard.waitForTablebaseReady();
 * await chessboard.makeMove("e2", "e4");
 * await chessboard.waitForMoveProcessed();
 * ```
 */
export class ChessboardPage {
  private logger = getLogger().setContext("ChessboardPage");

  constructor(private page: Page) {}

  /**
   * Wait for tablebase to be ready and responsive
   * Replaces: await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);
   */
  async waitForTablebaseReady(): Promise<void> {
    this.logger.info("⏳ Waiting for tablebase to be ready");
    
    await this.page.waitForFunction(
      () => {
        // Check if store indicates tablebase is ready
        // Using __e2e_store exposed by StoreContext for E2E tests
        const store = (window as any).__e2e_store;
        if (!store) {
          console.warn('E2E Store not available - waiting for initialization');
          return false;
        }
        const state = store.getState?.();
        return state?.tablebase?.analysisStatus !== 'loading';
      },
      { timeout: 15000 }
    );
    
    this.logger.info("✅ Tablebase ready");
  }

  /**
   * Wait for a move to be fully processed
   * Replaces: await page.waitForTimeout(500/1000/2000);
   */
  async waitForMoveProcessed(): Promise<void> {
    this.logger.info("⏳ Waiting for move to be processed");
    
    await this.page.waitForFunction(
      () => {
        const store = (window as any).__e2e_store;
        if (!store) return false;
        const state = store.getState?.();
        // Wait for move to be processed and tablebase analysis complete
        return state?.tablebase?.analysisStatus !== 'loading' && 
               !state?.game?.isProcessingMove;
      },
      { timeout: 10000 }
    );
    
    this.logger.info("✅ Move processed");
  }

  /**
   * Make a chess move with proper waiting
   * Replaces scattered click + waitForTimeout patterns
   */
  async makeMove(from: string, to: string, promotion?: string): Promise<void> {
    this.logger.info(`🎯 Making move: ${from} → ${to}${promotion ? `=${promotion}` : ''}`);

    // Click source square (try piece first, then square)
    try {
      await this.page.click(`[data-square="${from}"] [draggable]`, { timeout: 2000 });
    } catch {
      await this.page.click(`[data-square="${from}"]`);
    }

    // Click target square
    await this.page.click(`[data-square="${to}"]`);

    // Handle promotion if needed
    if (promotion) {
      const promotionSelector = `[data-testid="promotion-${promotion}"]`;
      await this.page.waitForSelector(promotionSelector, { timeout: 5000 });
      await this.page.click(promotionSelector);
    }

    // Wait for move to be processed (replaces hardcoded timeouts)
    await this.waitForMoveProcessed();
  }

  /**
   * Wait for game over state
   * Replaces: checking for various game over indicators with timeouts
   */
  async waitForGameOver(): Promise<void> {
    this.logger.info("⏳ Waiting for game over");
    
    await this.page.waitForFunction(
      () => {
        const store = (window as any).__e2e_store;
        if (!store) return false;
        const state = store.getState?.();
        return state?.training?.isGameOver || 
               state?.training?.isSuccess ||
               state?.training?.gameResult;
      },
      { timeout: 30000 }
    );
    
    this.logger.info("✅ Game over detected");
  }

  /**
   * Wait for toast message to appear
   * Replaces: manual toast checking with timeouts
   */
  async waitForToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): Promise<void> {
    this.logger.info(`⏳ Waiting for ${type} toast: ${message}`);
    
    const toastSelector = `[data-testid="toast-${type}"]`;
    await this.page.waitForSelector(toastSelector, { timeout: 10000 });
    
    const toastElement = this.page.locator(toastSelector);
    await expect(toastElement).toContainText(message);
    
    this.logger.info(`✅ Toast appeared: ${message}`);
  }

  /**
   * Get current FEN position from store
   * Replaces: DOM-based FEN reading with potential race conditions
   */
  async getCurrentFEN(): Promise<string> {
    const fen = await this.page.evaluate(() => {
      const store = (window as any).__e2e_store;
      if (!store) throw new Error("E2E Store not available");
      const state = store.getState?.();
      return state?.game?.currentPosition;
    });
    
    if (!fen) {
      throw new Error("Could not retrieve FEN from game state");
    }
    
    return fen;
  }

  /**
   * Wait for specific FEN position to be reached
   * More reliable than DOM-based position checking
   */
  async waitForPosition(expectedFEN: string): Promise<void> {
    this.logger.info(`⏳ Waiting for position: ${expectedFEN}`);
    
    await this.page.waitForFunction(
      (fen) => {
        const store = (window as any).__e2e_store;
        if (!store) return false;
        const state = store.getState?.();
        return state?.game?.currentPosition === fen;
      },
      expectedFEN,
      { timeout: 15000 }
    );
    
    this.logger.info("✅ Position reached");
  }

  /**
   * Assert that evaluation is available
   * Replaces: manual evaluation checking with race conditions
   */
  async assertEvaluationAvailable(): Promise<void> {
    this.logger.info("🧠 Checking tablebase evaluation");
    
    await this.page.waitForFunction(
      () => {
        const store = (window as any).__e2e_store;
        if (!store) return false;
        const state = store.getState?.();
        return state?.tablebase?.evaluation?.isAvailable === true;
      },
      { timeout: 15000 }
    );
    
    this.logger.info("✅ Tablebase evaluation available");
  }

  /**
   * Get move count from game state
   * More reliable than DOM-based counting
   */
  async getMoveCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const store = (window as any).__e2e_store;
      if (!store) return 0;
      const state = store.getState?.();
      return state?.game?.moveHistory?.length || 0;
    });
  }

  /**
   * Check if it's player's turn
   * Replaces: manual turn detection logic
   */
  async isPlayerTurn(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const store = (window as any).__e2e_store;
      if (!store) return false;
      const state = store.getState?.();
      return state?.game?.isPlayerTurn === true;
    });
  }
}