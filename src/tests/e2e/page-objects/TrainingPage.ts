import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { ChessboardPage } from './ChessboardPage';
import { TestConfig, type InteractionMethod, type ChessPiece, createLocatorWithFallback } from '../config/TestConfig';

/**
 * TrainingPage - Page Object for chess training functionality
 * 
 * Composes ChessboardPage for chess interactions and adds training-specific
 * UI elements like streak counters, feedback, navigation etc.
 */
export class TrainingPage {
  public chessboard: ChessboardPage;

  constructor(private page: Page) {
    this.chessboard = new ChessboardPage(page);
  }

  // Training-specific locators
  private get streakCounter() {
    return createLocatorWithFallback(this.page, TestConfig.selectors.training.streakCounter);
  }

  private get feedbackMessage(): Locator {
    return this.page.locator(TestConfig.selectors.training.feedback).first();
  }

  private get nextPositionButton() {
    return createLocatorWithFallback(this.page, TestConfig.selectors.training.nextButton);
  }

  private get positionInfo(): Locator {
    return this.page.locator(TestConfig.selectors.training.positionInfo).first();
  }

  // Navigation and Setup
  /**
   * Navigate to a specific training position
   * @param positionId Position number (e.g. 1, 2, 3...)
   */
  async goToPosition(positionId: number): Promise<void> {
    await this.page.goto(TestConfig.urls.position(positionId));
    await this.page.waitForLoadState('networkidle');
    await this.chessboard.waitForBoardReady();
  }

  /**
   * Wait for the training page to be fully loaded and ready
   */
  async waitForPageReady(): Promise<void> {
    // Wait for board to be ready
    await this.chessboard.waitForBoardReady();
    
    // Wait for training UI elements to be available
    await this.streakCounter.waitFor({ timeout: TestConfig.timeouts.long });
    
    // Ensure page is interactive
    await this.page.waitForLoadState('networkidle');
  }

  // Training Actions
  /**
   * Make a move and wait for the training system to respond
   * @param from Source square
   * @param to Target square  
   * @param method Interaction method
   * @param promotion Optional promotion piece
   */
  async makeTrainingMove(
    from: string, 
    to: string, 
    method: InteractionMethod = 'click',
    promotion?: ChessPiece
  ): Promise<void> {
    await this.chessboard.move(from, to, method, promotion);
    
    // Wait for training system to process move
    await this.waitForMoveProcessing();
  }

  /**
   * Navigate to the next training position
   */
  async goToNextPosition(): Promise<void> {
    console.log('🔍 Attempting to find next position button...');
    
    // Debug: Check what buttons are actually visible
    const allButtons = await this.page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on page`);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      const disabled = await button.isDisabled();
      console.log(`Button ${i}: text="${text}", title="${title}", disabled=${disabled}`);
    }
    
    await this.nextPositionButton.waitFor({ state: 'visible', timeout: TestConfig.timeouts.long });
    
    // CRITICAL FIX: Wait for navigation refresh to complete after move
    // The handlePlayerMove orchestrator runs asynchronously and needs time to update nextPosition/prevPosition
    console.log('⏳ Waiting for navigation state to be refreshed...');
    
    // Simple timeout since console log detection is unreliable in parallel tests
    // After the piece color fix, handlePlayerMove consistently executes within 1-2 seconds
    await this.page.waitForTimeout(2000);
    console.log('✅ Navigation refresh wait complete - nextPosition should be available');
    
    await this.nextPositionButton.click();
    
    // Wait for new position to load
    await this.page.waitForLoadState('networkidle');
    await this.chessboard.waitForBoardReady();
  }

  /**
   * Wait for the training system to process a move
   * Uses condition-based waits instead of fixed timeouts to avoid race conditions
   */
  private async waitForMoveProcessing(): Promise<void> {
    // Wait for move processing to begin (no fixed timeout)
    await this.waitForMoveProcessingStart();
    
    // Wait for any opponent move to complete
    await this.waitForOpponentMove();
    
    // Wait for feedback/analysis to become available
    await this.waitForFeedbackReady();
  }

  /**
   * Wait for move processing to start
   */
  private async waitForMoveProcessingStart(): Promise<void> {
    try {
      // Wait for either loading indicators to appear OR turn change to happen
      await this.page.waitForFunction(() => {
        // Check for loading states
        const loadingElements = document.querySelectorAll(
          '.opponent-thinking, [data-loading="opponent"], .thinking, .processing-move'
        );
        
        // Check for turn change indicators
        const turnIndicator = document.querySelector('[data-turn], .turn-indicator');
        const hasTurnChange = turnIndicator?.textContent?.includes('Black') || 
                             turnIndicator?.textContent?.includes('Schwarz');
        
        return loadingElements.length > 0 || hasTurnChange;
      }, { timeout: TestConfig.timeouts.short });
    } catch {
      // Move processing might be instant, that's ok
    }
  }

  /**
   * Wait for opponent to make their move
   * Uses multiple indicators to detect when opponent move is complete
   */
  private async waitForOpponentMove(): Promise<void> {
    // Strategy 1: Wait for loading indicators to disappear
    try {
      await this.page.waitForSelector('.opponent-thinking, [data-loading="opponent"], .thinking', {
        state: 'hidden',
        timeout: TestConfig.timeouts.long
      });
    } catch {
      // Strategy 2: Wait for move count to change (indicates opponent moved)
      try {
        await this.page.waitForFunction(
          () => {
            // Look for move counter or turn indicator changes
            const turnIndicator = document.querySelector('[data-turn], .turn-indicator');
            const moveCount = document.querySelector('[data-move-count], .move-count');
            return turnIndicator?.textContent?.includes('White') || 
                   moveCount?.textContent !== document.querySelector('[data-initial-move-count]')?.textContent;
          },
          { timeout: TestConfig.timeouts.long }
        );
      } catch {
        // Strategy 3: Fallback to board state change
        await this.waitForBoardStateChange();
      }
    }
  }

  /**
   * Wait for feedback to be ready after move processing
   */
  private async waitForFeedbackReady(): Promise<void> {
    try {
      // Wait for feedback elements to appear
      await this.page.waitForSelector(
        TestConfig.selectors.training.feedback,
        { state: 'visible', timeout: TestConfig.timeouts.medium }
      );
    } catch {
      // Feedback might not always appear, that's ok
      // Wait for UI state to stabilize instead of fixed timeout
      await this.page.waitForFunction(() => {
        // Check if page is in stable state (no ongoing updates)
        return !document.querySelector('.updating, [data-updating="true"]');
      }, { timeout: TestConfig.timeouts.short });
    }
  }

  /**
   * Wait for board state to change (detects opponent moves)
   */
  private async waitForBoardStateChange(): Promise<void> {
    // Get initial board state
    const initialFEN = await this.chessboard.getCurrentFEN();
    
    // Wait for FEN to change
    await this.page.waitForFunction(
      (startFEN) => {
        // Check if board state changed by comparing FEN or piece positions
        const currentBoard = document.querySelector('[data-fen]');
        return currentBoard?.getAttribute('data-fen') !== startFEN;
      },
      initialFEN,
      { timeout: TestConfig.timeouts.long }
    );
  }

  // Assertions and Checks
  /**
   * Assert current streak value
   * @param expectedStreak Expected streak number
   */
  async assertStreak(expectedStreak: number): Promise<void> {
    // Wait for streak counter to be available
    await this.streakCounter.waitFor({ timeout: TestConfig.timeouts.medium });
    
    // Get text content with retry logic
    const streakText = await this.streakCounter.textContent();
    
    if (streakText) {
      // Extract number from text like "Serie: 5" or "5"
      const streakMatch = streakText.match(/\d+/);
      if (streakMatch) {
        const actualStreak = parseInt(streakMatch[0]);
        expect(actualStreak).toBe(expectedStreak);
        return;
      }
    }
    
    // If no number found, the element might be in unexpected state
    throw new Error(`Could not extract streak number from text: "${streakText}"`);
  }

  /**
   * Assert that feedback message is visible
   * @param expectedText Optional expected feedback text
   */
  async assertFeedbackVisible(expectedText?: string): Promise<void> {
    await expect(this.feedbackMessage).toBeVisible();
    
    if (expectedText) {
      await expect(this.feedbackMessage).toContainText(expectedText);
    }
  }

  /**
   * Assert that next position button is available
   */
  async assertCanProceedToNext(): Promise<void> {
    await expect(this.nextPositionButton).toBeVisible();
    await expect(this.nextPositionButton).toBeEnabled();
  }

  /**
   * Assert current URL matches expected position
   * @param positionId Expected position number
   */
  async assertAtPosition(positionId: number): Promise<void> {
    // Wait for navigation to complete with proper timeout
    await this.page.waitForURL(`**/train/${positionId}**`, { 
      timeout: 10000,
      waitUntil: 'networkidle' 
    });
    
    const currentUrl = this.page.url();
    expect(currentUrl).toMatch(new RegExp(`/train/${positionId}(?:\\?|$)`));
  }

  /**
   * Check if training is completed (success state)
   */
  async isTrainingCompleted(): Promise<boolean> {
    try {
      const completionModal = this.page.locator('.completion-modal, [data-testid="training-complete"]');
      return await completionModal.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get current position information
   */
  async getPositionInfo(): Promise<string | null> {
    try {
      return await this.positionInfo.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if there are any visible error messages
   */
  async hasErrors(): Promise<boolean> {
    try {
      const errorElements = this.page.locator('.error, .alert-error, [data-testid*="error"]');
      return await errorElements.first().isVisible();
    } catch {
      return false;
    }
  }
}