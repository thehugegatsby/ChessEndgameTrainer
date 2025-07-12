/**
 * Firestore Debug Page Object
 * For testing Firebase-specific UI elements and debug panels
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../pages/BasePage';

export class FirestoreDebugPage extends BasePage {
  // Locators
  private readonly connectionStatus: Locator;
  private readonly emulatorBadge: Locator;
  private readonly dataCount: Locator;
  private readonly refreshButton: Locator;
  private readonly clearDataButton: Locator;
  private readonly positionsList: Locator;
  private readonly loadingIndicator: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.connectionStatus = page.locator('[data-testid="firebase-connection-status"]');
    this.emulatorBadge = page.locator('[data-testid="emulator-badge"]');
    this.dataCount = page.locator('[data-testid="firestore-data-count"]');
    this.refreshButton = page.locator('[data-testid="refresh-data-button"]');
    this.clearDataButton = page.locator('[data-testid="clear-data-button"]');
    this.positionsList = page.locator('[data-testid="positions-list"]');
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/debug/firestore');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // Wait for connection status to appear
    await this.connectionStatus.waitFor({ state: 'visible' });
  }

  async isConnectedToEmulator(): Promise<boolean> {
    const badge = await this.emulatorBadge.textContent();
    return badge?.includes('Emulator') || false;
  }

  async getConnectionStatus(): Promise<string> {
    return await this.connectionStatus.textContent() || '';
  }

  async getDataCount(): Promise<number> {
    const text = await this.dataCount.textContent() || '0';
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  async refreshData(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoadingComplete();
  }

  async clearAllData(): Promise<void> {
    await this.clearDataButton.click();
    
    // Confirm in dialog if present
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  async waitForLoadingComplete(): Promise<void> {
    // Wait for loading to start (if it does)
    try {
      await this.loadingIndicator.waitFor({ state: 'visible', timeout: 500 });
      // Then wait for it to disappear
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading might be too fast to catch, that's ok
    }
  }

  async getPositionTitles(): Promise<string[]> {
    await this.waitForLoadingComplete();
    const items = await this.positionsList.locator('[data-testid="position-title"]').all();
    const titles: string[] = [];
    
    for (const item of items) {
      const title = await item.textContent();
      if (title) titles.push(title.trim());
    }
    
    return titles;
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.errorMessage.textContent() || '';
    }
    return '';
  }

  async waitForPositionsToLoad(expectedCount?: number): Promise<void> {
    await this.waitForLoadingComplete();
    
    if (expectedCount !== undefined) {
      // Wait for specific number of positions
      await this.page.waitForFunction(
        (count) => {
          const items = document.querySelectorAll('[data-testid="position-title"]');
          return items.length === count;
        },
        expectedCount,
        { timeout: 5000 }
      );
    } else {
      // Just wait for any positions to appear
      await this.positionsList.locator('[data-testid="position-title"]').first().waitFor({ 
        state: 'visible',
        timeout: 5000 
      });
    }
  }

  async selectPosition(title: string): Promise<void> {
    const position = this.positionsList.locator(`[data-testid="position-title"]:has-text("${title}")`);
    await position.click();
  }
}