/**
 * @fileoverview Page Object Model for Training Page
 * @version 1.0.0
 * @description Encapsulates all training page interactions and selectors
 * following Page Object Model pattern for maintainable E2E tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { setupEngineMocking } from '../mocks/engineMock';
import { makeMove as helperMakeMove, getGameState as helperGetGameState, waitForEngine, configureEngine as helperConfigureEngine } from '../helpers';

/**
 * Training Page Object
 * Provides clean interface for interacting with the training page
 */
export class TrainingPage {
  readonly page: Page;
  
  // Selectors
  readonly chessboard: Locator;
  readonly boardSquares: {
    [key: string]: Locator;
  };
  readonly movePanel: Locator;
  readonly moveList: Locator;
  readonly evaluationPanel: Locator;
  readonly resetButton: Locator;
  readonly engineToggle: Locator;
  readonly trainingTitle: Locator;
  readonly navigationButtons: {
    previous: Locator;
    next: Locator;
  };
  readonly lichessLink: Locator;
  readonly engineStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize selectors
    this.chessboard = page.locator('[class*="chessboard"]');
    this.boardSquares = this.initializeBoardSquares();
    this.movePanel = page.locator('.space-y-1');
    this.moveList = this.movePanel.locator('.font-mono');
    this.evaluationPanel = page.locator('[data-testid="evaluation-panel"]');
    this.resetButton = page.locator('button:has-text("Reset")');
    this.engineToggle = page.locator('button:has-text("Engine")');
    this.trainingTitle = page.locator('h2');
    this.navigationButtons = {
      previous: page.locator('button[aria-label="Previous position"]'),
      next: page.locator('button[aria-label="Next position"]')
    };
    this.lichessLink = page.locator('a[href*="lichess.org"]');
    this.engineStatus = page.locator('[data-testid="engine-status"]');
  }

  /**
   * Initialize board square selectors
   */
  private initializeBoardSquares(): { [key: string]: Locator } {
    const squares: { [key: string]: Locator } = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        squares[square] = this.page.locator(`[data-square="${square}"]`);
      }
    }
    
    return squares;
  }

  /**
   * Navigate to a specific training position
   */
  async goto(positionId: number, mockEngine: boolean = true): Promise<void> {
    if (mockEngine) {
      await setupEngineMocking(this.page);
    }
    await this.page.goto(`/train/${positionId}`);
    await this.waitForBoard();
  }

  /**
   * Wait for the board to be fully loaded
   */
  async waitForBoard(): Promise<void> {
    // CRITICAL: Wait for engine to be fully initialized
    // This prevents race conditions in E2E tests
    await this.page.waitForSelector('body[data-engine-status="ready"]', { 
      timeout: 10000 
    });
    
    await this.chessboard.waitFor({ state: 'visible', timeout: 10000 });
    await this.boardSquares.a1.waitFor({ state: 'visible' });
    await this.boardSquares.h8.waitFor({ state: 'visible' });
    
    console.log('✅ Engine ready, board loaded, proceeding with test');
  }

  /**
   * Make a move using the test API
   */
  async makeMove(move: string): Promise<boolean> {
    const result = await helperMakeMove(this.page, move);
    return result.success;
  }

  /**
   * Get current game state
   */
  async getGameState() {
    return await helperGetGameState(this.page);
  }

  /**
   * Wait for engine to respond
   */
  async waitForEngineMove(timeout: number = 10000): Promise<boolean> {
    return await waitForEngine(this.page, timeout);
  }

  /**
   * Configure engine for deterministic testing
   */
  async configureEngine(config: { deterministic: boolean; fixedResponses?: Record<string, string>; timeLimit?: number; }): Promise<void> {
    await helperConfigureEngine(this.page, config);
  }

  /**
   * Reset the game
   */
  async resetGame(): Promise<void> {
    await this.resetButton.click();
    
    // Wait for game state to be reset (event-based)
    await expect(async () => {
      const state = await this.getGameState();
      expect(state.moveCount).toBe(0);
    }).toPass({ timeout: 5000 });
  }

  /**
   * Get the training title text
   */
  async getTitle(): Promise<string> {
    return await this.trainingTitle.textContent() || '';
  }

  /**
   * Check if a move is displayed in the move list
   */
  async isMoveDisplayed(move: string): Promise<boolean> {
    const moves = await this.moveList.allTextContents();
    return moves.some(m => m.includes(move));
  }

  /**
   * Get the number of moves in the move list
   */
  async getMoveCount(): Promise<number> {
    return await this.moveList.count();
  }

  /**
   * Toggle engine analysis
   */
  async toggleEngine(): Promise<void> {
    const initialStatus = await this.getEngineStatus();
    await this.engineToggle.click();
    
    // Wait for engine status to change (event-based)
    await expect(async () => {
      const newStatus = await this.getEngineStatus();
      expect(newStatus).not.toBe(initialStatus);
    }).toPass({ timeout: 3000 });
  }

  /**
   * Navigate to previous position
   */
  async goToPreviousPosition(): Promise<void> {
    await this.navigationButtons.previous.click();
    await this.waitForBoard();
  }

  /**
   * Navigate to next position
   */
  async goToNextPosition(): Promise<void> {
    await this.navigationButtons.next.click();
    await this.waitForBoard();
  }

  /**
   * Check if Lichess analysis link is visible
   */
  async isLichessLinkVisible(): Promise<boolean> {
    return await this.lichessLink.isVisible();
  }

  /**
   * Get engine status text
   */
  async getEngineStatus(): Promise<string | null> {
    return await this.engineStatus.textContent();
  }

  /**
   * Take a screenshot
   */
  async screenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Verify the board shows the expected position
   */
  async verifyPosition(expectedFen: string): Promise<void> {
    const state = await this.getGameState();
    expect(state.fen).toBe(expectedFen);
  }

  /**
   * Check if the game is over
   */
  async isGameOver(): Promise<boolean> {
    const state = await this.getGameState();
    return state.isGameOver;
  }

  /**
   * Get game over reason
   */
  async getGameOverReason(): Promise<string | undefined> {
    const state = await this.getGameState();
    return state.gameOverReason;
  }
}