/**
 * Base Page Object
 * Common functionality for all page objects
 */

import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific path
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.isVisible(selector);
  }

  /**
   * Wait for element
   */
  async waitForElement(selector: string, options?: { state?: 'visible' | 'hidden' | 'attached' | 'detached'; timeout?: number }): Promise<void> {
    await this.page.waitForSelector(selector, options ?? {});
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    const text = await this.page.textContent(selector);
    return text || '';
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  /**
   * Fill input
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Safely get text content from a locator
   * Returns empty string if element has no text or is null
   */
  protected async getLocatorText(locator: Locator): Promise<string> {
    const text = await locator.textContent();
    return text || '';
  }

  /**
   * Wait for Firebase data to be loaded
   * This is a placeholder that can be overridden by specific pages
   * or implemented based on your Firebase integration pattern
   */
  async waitForFirebaseData(timeout = 5000): Promise<void> {
    // Wait for a global Firebase ready indicator or specific data attribute
    // This could check for:
    // - A global window variable: window.firebaseDataReady
    // - A data attribute: data-firebase-loaded="true"
    // - Absence of loading indicators
    
    // For now, just a small delay to ensure async operations complete
    // Override this method in specific pages for more precise waiting
    await this.page.waitForTimeout(100);
  }
}