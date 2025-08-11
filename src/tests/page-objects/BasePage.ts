/**
 * Base Page Object
 * Foundation for all page objects with common functionality
 */

import { type Page, type Locator, expect } from "@playwright/test";

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be ready (custom implementation per page)
   */
  abstract waitForPageReady(): Promise<void>;

  /**
   * Common navigation elements
   */
  get navbar(): Locator {
    return this.page.locator('[data-testid="navbar"]');
  }

  get navbarLogo(): Locator {
    return this.navbar.locator('[data-testid="navbar-logo"]');
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for Firebase data to load
   */
  async waitForFirebaseData(): Promise<void> {
    // Wait for common Firebase loading indicators to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', {
      state: "hidden",
    });
    await this.waitForNetworkIdle();
  }

  /**
   * Take screenshot for visual regression
   */
  async takeScreenshot(_name: string): Promise<Buffer> {
    return await this.page.screenshot({
      fullPage: true,
      animations: "disabled",
    });
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * Get text content of element
   */
  async getElementText(selector: string): Promise<string> {
    await this.page.waitForSelector(selector);
    return (await this.page.textContent(selector)) || "";
  }

  /**
   * Click element with retry
   */
  async clickWithRetry(selector: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Fill form field
   */
  async fillField(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check/uncheck checkbox
   */
  async setCheckbox(selector: string, checked: boolean): Promise<void> {
    if (checked) {
      await this.page.check(selector);
    } else {
      await this.page.uncheck(selector);
    }
  }

  /**
   * Assert page URL
   */
  async assertUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Assert page title
   */
  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Debug helpers
   */
  async pauseTest(): Promise<void> {
    await this.page.pause();
  }

  async logPageState(): Promise<void> {
    console.log("Current URL:", this.getCurrentUrl());
    console.log("Page Title:", await this.page.title());
  }
}
