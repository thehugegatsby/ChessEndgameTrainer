/**
 * Dashboard Page Object
 * Handles category navigation and position selection
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  positionCount: number;
}

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locators
   */
  get pageTitle(): Locator {
    return this.page.locator('h1');
  }

  get categoryCards(): Locator {
    return this.page.locator('[data-testid="category-card"]');
  }

  get loadingSpinner(): Locator {
    return this.page.locator('[data-testid="loading-spinner"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-testid="error-message"]');
  }

  get progressOverview(): Locator {
    return this.page.locator('[data-testid="progress-overview"]');
  }

  get totalPositionsCount(): Locator {
    return this.page.locator('[data-testid="total-positions-count"]');
  }

  get completedPositionsCount(): Locator {
    return this.page.locator('[data-testid="completed-positions-count"]');
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(): Promise<void> {
    await this.page.waitForSelector('[data-testid="category-card"]', { state: 'visible' });
    await this.waitForFirebaseData();
  }

  /**
   * Navigate to dashboard
   */
  async navigateToDashboard(): Promise<void> {
    await this.navigate('/dashboard');
    await this.waitForPageReady();
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryInfo[]> {
    const cards = await this.categoryCards.all();
    const categories: CategoryInfo[] = [];

    for (const card of cards) {
      const id = await card.getAttribute('data-category-id') || '';
      const name = await card.locator('[data-testid="category-name"]').textContent() || '';
      const description = await card.locator('[data-testid="category-description"]').textContent() || '';
      const countText = await card.locator('[data-testid="position-count"]').textContent() || '0';
      const positionCount = parseInt(countText.match(/\d+/)?.[0] || '0', 10);

      categories.push({ id, name, description, positionCount });
    }

    return categories;
  }

  /**
   * Get specific category card
   */
  getCategoryCard(categoryId: string): Locator {
    return this.page.locator(`[data-testid="category-card"][data-category-id="${categoryId}"]`);
  }

  /**
   * Click on category
   */
  async selectCategory(categoryId: string): Promise<void> {
    const card = this.getCategoryCard(categoryId);
    await card.click();
    
    // Wait for navigation or modal
    await this.page.waitForTimeout(500);
  }

  /**
   * Get category by name
   */
  async getCategoryByName(name: string): Promise<CategoryInfo | null> {
    const categories = await this.getCategories();
    return categories.find(cat => cat.name === name) || null;
  }

  /**
   * Select first position in category
   */
  async selectFirstPositionInCategory(categoryId: string): Promise<void> {
    await this.selectCategory(categoryId);
    
    // Wait for position list or navigation
    const firstPosition = this.page.locator('[data-testid="position-item"]').first();
    
    if (await firstPosition.isVisible()) {
      // If positions are shown in a list/modal
      await firstPosition.click();
    } else {
      // If it navigates directly to first position
      await this.page.waitForURL(/\/train\/\d+/);
    }
  }

  /**
   * Get user progress
   */
  async getUserProgress(): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    const totalText = await this.totalPositionsCount.textContent() || '0';
    const completedText = await this.completedPositionsCount.textContent() || '0';
    
    const total = parseInt(totalText.match(/\d+/)?.[0] || '0', 10);
    const completed = parseInt(completedText.match(/\d+/)?.[0] || '0', 10);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }

  /**
   * Check if loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Check if error displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.errorMessage.textContent() || '';
    }
    return '';
  }

  /**
   * Assert categories loaded
   */
  async assertCategoriesLoaded(expectedCount: number): Promise<void> {
    const categories = await this.getCategories();
    expect(categories).toHaveLength(expectedCount);
  }

  /**
   * Assert category exists
   */
  async assertCategoryExists(name: string): Promise<void> {
    const category = await this.getCategoryByName(name);
    expect(category).not.toBeNull();
  }

  /**
   * Assert no errors
   */
  async assertNoErrors(): Promise<void> {
    const hasError = await this.hasError();
    expect(hasError).toBe(false);
  }

  /**
   * Take dashboard screenshot
   */
  async takeDashboardScreenshot(name: string): Promise<Buffer> {
    // Hide dynamic content for consistent screenshots
    await this.page.evaluate(() => {
      // Hide timestamps or dynamic content
      document.querySelectorAll('[data-dynamic-content]').forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    });

    const screenshot = await this.page.screenshot({
      fullPage: true,
      animations: 'disabled',
    });

    // Restore visibility
    await this.page.evaluate(() => {
      document.querySelectorAll('[data-dynamic-content]').forEach(el => {
        (el as HTMLElement).style.visibility = 'visible';
      });
    });

    return screenshot;
  }

  /**
   * Search for positions (if search feature exists)
   */
  async searchPositions(query: string): Promise<void> {
    const searchInput = this.page.locator('[data-testid="search-input"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await searchInput.press('Enter');
      
      // Wait for search results
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Filter by difficulty
   */
  async filterByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master'): Promise<void> {
    const difficultyFilter = this.page.locator(`[data-testid="difficulty-filter-${difficulty}"]`);
    
    if (await difficultyFilter.isVisible()) {
      await difficultyFilter.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Sort positions
   */
  async sortPositions(sortBy: 'name' | 'difficulty' | 'progress'): Promise<void> {
    const sortDropdown = this.page.locator('[data-testid="sort-dropdown"]');
    
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption(sortBy);
      await this.page.waitForTimeout(500);
    }
  }
}