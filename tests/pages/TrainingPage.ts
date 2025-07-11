/**
 * Training Page Object
 * Handles the training page with chess board and controls
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ChessBoardComponent } from '../components/ChessBoardComponent';

export class TrainingPage extends BasePage {
  public readonly chessBoard: ChessBoardComponent;

  constructor(page: Page) {
    super(page);
    // Initialize chess board component
    this.chessBoard = new ChessBoardComponent(page, '[data-testid="training-board-container"]');
  }

  /**
   * Page elements
   */
  get positionTitle(): Locator {
    return this.page.locator('[data-testid="position-title"]');
  }

  get positionDescription(): Locator {
    return this.page.locator('[data-testid="position-description"]');
  }

  get objectiveDisplay(): Locator {
    return this.page.locator('[data-testid="objective-display"]');
  }

  get difficultyBadge(): Locator {
    return this.page.locator('[data-testid="difficulty-badge"]');
  }

  get moveCounter(): Locator {
    return this.page.locator('[data-testid="move-counter"]');
  }

  get targetMovesDisplay(): Locator {
    return this.page.locator('[data-testid="target-moves"]');
  }

  get evaluationBar(): Locator {
    return this.page.locator('[data-testid="evaluation-bar"]');
  }

  get evaluationScore(): Locator {
    return this.page.locator('[data-testid="evaluation-score"]');
  }

  /**
   * Control buttons
   */
  get resetButton(): Locator {
    return this.page.locator('[data-testid="reset-button"]');
  }

  get hintButton(): Locator {
    return this.page.locator('[data-testid="hint-button"]');
  }

  get solutionButton(): Locator {
    return this.page.locator('[data-testid="solution-button"]');
  }

  get analyzeButton(): Locator {
    return this.page.locator('[data-testid="analyze-button"]');
  }

  /**
   * Navigation buttons
   */
  get previousButton(): Locator {
    return this.page.locator('[data-testid="previous-position-button"]');
  }

  get nextButton(): Locator {
    return this.page.locator('[data-testid="next-position-button"]');
  }

  get backToDashboardButton(): Locator {
    return this.page.locator('[data-testid="back-to-dashboard"]');
  }

  /**
   * Wait for page ready
   */
  async waitForPageReady(): Promise<void> {
    await this.positionTitle.waitFor({ state: 'visible' });
    await this.waitForFirebaseData();
    await this.page.waitForFunction(() => {
      const board = document.querySelector('[data-testid="chess-board"]');
      return board && board.getAttribute('data-fen');
    });
  }

  /**
   * Navigate to position
   */
  async navigateToPosition(positionId: number): Promise<void> {
    await this.navigateTo(`/train/${positionId}`);
    await this.waitForPageReady();
  }

  /**
   * Get position info
   */
  async getPositionInfo(): Promise<{
    title: string;
    description: string;
    objective: string;
    difficulty: string;
  }> {
    const [title, description, objective, difficulty] = await Promise.all([
      this.positionTitle.textContent(),
      this.positionDescription.textContent(),
      this.objectiveDisplay.textContent(),
      this.difficultyBadge.textContent()
    ]);

    return {
      title: title || '',
      description: description || '',
      objective: objective || '',
      difficulty: difficulty || ''
    };
  }

  /**
   * Get move progress
   */
  async getMoveProgress(): Promise<{
    current: number;
    target: number;
    percentage: number;
  }> {
    const moveText = await this.getLocatorText(this.moveCounter) || '0';
    const targetText = await this.getLocatorText(this.targetMovesDisplay) || '0';
    
    const current = parseInt(moveText.match(/\d+/)?.[0] || '0', 10);
    const target = parseInt(targetText.match(/\d+/)?.[0] || '0', 10);
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

    return { current, target, percentage };
  }

  /**
   * Get evaluation
   */
  async getEvaluation(): Promise<{
    score: number;
    display: string;
  }> {
    const scoreText = await this.getLocatorText(this.evaluationScore) || '0.0';
    const score = parseFloat(scoreText);
    
    return {
      score,
      display: scoreText
    };
  }

  /**
   * Reset position
   */
  async resetPosition(): Promise<void> {
    await this.resetButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Request hint
   */
  async requestHint(): Promise<string> {
    await this.hintButton.click();
    
    const hintModal = this.page.locator('[data-testid="hint-modal"]');
    await hintModal.waitFor({ state: 'visible' });
    
    const hintText = await hintModal.locator('[data-testid="hint-content"]').textContent();
    
    await hintModal.locator('[data-testid="close-button"]').click();
    await hintModal.waitFor({ state: 'hidden' });
    
    return hintText || '';
  }

  /**
   * Show solution
   */
  async showSolution(): Promise<string[]> {
    await this.solutionButton.click();
    
    const solutionModal = this.page.locator('[data-testid="solution-modal"]');
    await solutionModal.waitFor({ state: 'visible' });
    
    const moves = await solutionModal.locator('[data-testid="solution-move"]').allTextContents();
    
    await solutionModal.locator('[data-testid="close-button"]').click();
    await solutionModal.waitFor({ state: 'hidden' });
    
    return moves;
  }

  /**
   * Navigate to next position
   */
  async goToNextPosition(): Promise<void> {
    const currentUrl = this.getUrl();
    await this.nextButton.click();
    
    await this.page.waitForFunction(
      (url) => window.location.href !== url,
      currentUrl
    );
    
    await this.waitForPageReady();
  }

  /**
   * Navigate to previous position
   */
  async goToPreviousPosition(): Promise<void> {
    const currentUrl = this.getUrl();
    await this.previousButton.click();
    
    await this.page.waitForFunction(
      (url) => window.location.href !== url,
      currentUrl
    );
    
    await this.waitForPageReady();
  }

  /**
   * Check if navigation is available
   */
  async canNavigate(): Promise<{
    previous: boolean;
    next: boolean;
  }> {
    const [previousEnabled, nextEnabled] = await Promise.all([
      this.previousButton.isEnabled(),
      this.nextButton.isEnabled()
    ]);

    return {
      previous: previousEnabled,
      next: nextEnabled
    };
  }

  /**
   * Open analysis mode
   */
  async openAnalysis(): Promise<void> {
    await this.analyzeButton.click();
    // This might open a modal or navigate to analysis page
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if position is completed
   */
  async isPositionCompleted(): Promise<boolean> {
    // Look for completion indicator
    const completionBadge = this.page.locator('[data-testid="completion-badge"]');
    return await completionBadge.isVisible();
  }

  /**
   * Get success message if shown
   */
  async getSuccessMessage(): Promise<string | null> {
    const successModal = this.page.locator('[data-testid="success-modal"]');
    
    if (await successModal.isVisible()) {
      return await successModal.locator('[data-testid="success-message"]').textContent();
    }
    
    return null;
  }

  /**
   * Wait for position completion
   */
  async waitForCompletion(timeout = 30000): Promise<void> {
    await this.page.waitForSelector('[data-testid="success-modal"]', { 
      state: 'visible',
      timeout 
    });
  }

  /**
   * Go back to dashboard
   */
  async goBackToDashboard(): Promise<void> {
    await this.backToDashboardButton.click();
    await this.page.waitForURL('**/dashboard');
  }
}