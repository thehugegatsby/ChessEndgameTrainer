/**
 * Firestore Debug Page Object
 * Enhanced page object for Firebase testing with comprehensive debugging capabilities
 * Integrates with Firebase Test Infrastructure (A.1-A.5)
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { type TestApiClient } from '../api/TestApiClient';

export interface FirestoreConnectionInfo {
  status: 'connected' | 'disconnected' | 'error';
  emulatorMode: boolean;
  host?: string;
  port?: number;
  projectId?: string;
}

export interface FirestoreDataStats {
  collections: Record<string, number>;
  totalDocuments: number;
  lastUpdate: Date | null;
}

export interface FirestoreValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Enhanced Firestore Debug Page Object
 * Provides comprehensive debugging capabilities for Firebase testing
 */
export class FirestoreDebugPage extends BasePage {
  // Core locators for Firebase connection status
  private readonly connectionStatus: Locator;
  private readonly emulatorBadge: Locator;
  private readonly projectIdDisplay: Locator;
  private readonly hostDisplay: Locator;

  // Data display locators
  private readonly positionsCount: Locator;
  private readonly categoriesCount: Locator;
  private readonly chaptersCount: Locator;
  private readonly usersCount: Locator;

  // Action buttons
  private readonly refreshButton: Locator;
  private readonly clearDataButton: Locator;
  private readonly validateDataButton: Locator;
  private readonly exportDataButton: Locator;
  private readonly seedTestDataButton: Locator;

  // Data lists and viewers
  private readonly positionsList: Locator;
  private readonly categoriesList: Locator;
  private readonly usersList: Locator;
  private readonly rawDataViewer: Locator;

  // Status and feedback
  private readonly loadingIndicator: Locator;
  private readonly errorMessage: Locator;
  private readonly successMessage: Locator;
  private readonly validationResults: Locator;

  // Progress tracking for batch operations
  private readonly progressBar: Locator;

  constructor(
    page: Page,
    private apiClient?: TestApiClient
  ) {
    super(page);

    // Connection status locators
    this.connectionStatus = page.locator('[data-testid="firebase-connection-status"]');
    this.emulatorBadge = page.locator('[data-testid="emulator-badge"]');
    this.projectIdDisplay = page.locator('[data-testid="project-id"]');
    this.hostDisplay = page.locator('[data-testid="firebase-host"]');

    // Data statistics locators
    this.positionsCount = page.locator('[data-testid="positions-count"]');
    this.categoriesCount = page.locator('[data-testid="categories-count"]');
    this.chaptersCount = page.locator('[data-testid="chapters-count"]');
    this.usersCount = page.locator('[data-testid="users-count"]');

    // Action buttons
    this.refreshButton = page.locator('[data-testid="refresh-data-button"]');
    this.clearDataButton = page.locator('[data-testid="clear-data-button"]');
    this.validateDataButton = page.locator('[data-testid="validate-data-button"]');
    this.exportDataButton = page.locator('[data-testid="export-data-button"]');
    this.seedTestDataButton = page.locator('[data-testid="seed-test-data-button"]');

    // Data viewers
    this.positionsList = page.locator('[data-testid="positions-list"]');
    this.categoriesList = page.locator('[data-testid="categories-list"]');
    this.usersList = page.locator('[data-testid="users-list"]');
    this.rawDataViewer = page.locator('[data-testid="raw-data-viewer"]');

    // Status indicators
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.validationResults = page.locator('[data-testid="validation-results"]');

    // Progress tracking
    this.progressBar = page.locator('[data-testid="progress-bar"]');
  }

  /**
   * Navigate to the Firestore debug page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/debug/firestore');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load and Firebase connection to establish
   */
  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();

    // Wait for Firebase connection status to appear
    await this.connectionStatus.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for initial data load
    await this.waitForLoadingComplete();
  }

  /**
   * Get comprehensive Firebase connection information
   */
  async getConnectionInfo(): Promise<FirestoreConnectionInfo> {
    const statusText = await this.getLocatorText(this.connectionStatus);
    const emulatorBadgeVisible = await this.emulatorBadge.isVisible();

    let status: 'connected' | 'disconnected' | 'error' = 'disconnected';
    if (statusText.includes('Connected') || statusText.includes('Online')) {
      status = 'connected';
    } else if (statusText.includes('Error') || statusText.includes('Failed')) {
      status = 'error';
    }

    const connectionInfo: FirestoreConnectionInfo = {
      status,
      emulatorMode: emulatorBadgeVisible,
    };

    // Get additional connection details if available
    if (await this.projectIdDisplay.isVisible()) {
      connectionInfo.projectId = await this.getLocatorText(this.projectIdDisplay);
    }

    if (await this.hostDisplay.isVisible()) {
      const hostText = await this.getLocatorText(this.hostDisplay);
      const match = hostText.match(/([^:]+):(\d+)/);
      if (match) {
        connectionInfo.host = match[1];
        connectionInfo.port = parseInt(match[2]);
      }
    }

    return connectionInfo;
  }

  /**
   * Check if connected to Firebase emulator
   */
  async isConnectedToEmulator(): Promise<boolean> {
    const connectionInfo = await this.getConnectionInfo();
    return connectionInfo.emulatorMode;
  }

  /**
   * Get comprehensive data statistics
   */
  async getDataStats(): Promise<FirestoreDataStats> {
    await this.waitForLoadingComplete();

    const stats: FirestoreDataStats = {
      collections: {},
      totalDocuments: 0,
      lastUpdate: null,
    };

    // Get collection counts
    if (await this.positionsCount.isVisible()) {
      stats.collections.positions = await this.extractNumber(this.positionsCount);
    }

    if (await this.categoriesCount.isVisible()) {
      stats.collections.categories = await this.extractNumber(this.categoriesCount);
    }

    if (await this.chaptersCount.isVisible()) {
      stats.collections.chapters = await this.extractNumber(this.chaptersCount);
    }

    if (await this.usersCount.isVisible()) {
      stats.collections.users = await this.extractNumber(this.usersCount);
    }

    // Calculate total documents
    stats.totalDocuments = Object.values(stats.collections).reduce((sum, count) => sum + count, 0);

    return stats;
  }

  /**
   * Refresh data from Firestore
   */
  async refreshData(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoadingComplete();

    // Verify refresh completed successfully
    await this.verifyNoErrors();
  }

  /**
   * Clear all Firestore data with confirmation
   */
  async clearAllData(
    options: { confirm?: boolean; waitForComplete?: boolean } = {}
  ): Promise<void> {
    const { confirm = true, waitForComplete = true } = options;

    await this.clearDataButton.click();

    // Handle confirmation dialog
    if (confirm) {
      const confirmButton = this.page.locator(
        'button:has-text("Confirm"), button:has-text("Clear"), button:has-text("Delete")'
      );
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    }

    if (waitForComplete) {
      await this.waitForLoadingComplete();
      await this.verifyNoErrors();

      // Verify data was actually cleared
      const stats = await this.getDataStats();
      expect(stats.totalDocuments).toBe(0);
    }
  }

  /**
   * Validate data integrity
   */
  async validateData(): Promise<FirestoreValidationResult> {
    await this.validateDataButton.click();
    await this.waitForLoadingComplete();

    // Wait for validation results to appear
    await this.validationResults.waitFor({ state: 'visible', timeout: 10000 });

    const resultsText = await this.getLocatorText(this.validationResults);

    const result: FirestoreValidationResult = {
      isValid: resultsText.includes('Valid') || resultsText.includes('No issues'),
      issues: [],
      warnings: [],
    };

    // Extract specific issues and warnings if present
    const issueLines = resultsText.split('\n');
    for (const line of issueLines) {
      if (line.includes('Error:') || line.includes('Issue:')) {
        result.issues.push(line.trim());
      } else if (line.includes('Warning:')) {
        result.warnings.push(line.trim());
      }
    }

    return result;
  }

  /**
   * Seed test data using predefined scenario
   */
  async seedTestData(scenario: 'basic' | 'advanced' | 'empty' = 'basic'): Promise<void> {
    // Use the dropdown to select scenario
    const scenarioDropdown = this.page.locator('[data-testid="scenario-dropdown"]');
    if (await scenarioDropdown.isVisible()) {
      await scenarioDropdown.selectOption(scenario);
    }

    await this.seedTestDataButton.click();
    await this.waitForLoadingComplete();

    // Verify seeding completed successfully
    await this.verifyNoErrors();

    if (scenario !== 'empty') {
      const stats = await this.getDataStats();
      expect(stats.totalDocuments).toBeGreaterThan(0);
    }
  }

  /**
   * Wait for all loading operations to complete
   */
  async waitForLoadingComplete(timeout = 15000): Promise<void> {
    try {
      // Wait for loading to start (if it does)
      await this.loadingIndicator.waitFor({ state: 'visible', timeout: 1000 });
      // Then wait for it to disappear
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout });
    } catch {
      // Loading might be too fast to catch or not present, that's ok
    }

    // Additional wait for network idle
    await this.page.waitForLoadState('networkidle', { timeout: 5000 });
  }

  /**
   * Wait for progress bar operations to complete
   */
  async waitForProgressComplete(timeout = 30000): Promise<void> {
    try {
      // Wait for progress bar to appear
      await this.progressBar.waitFor({ state: 'visible', timeout: 2000 });

      // Wait for progress to reach 100% or disappear
      await this.page.waitForFunction(
        () => {
          const progressBar = document.querySelector('[data-testid="progress-bar"]');
          if (!progressBar) return true; // Progress bar disappeared

          const progressText =
            document.querySelector('[data-testid="progress-text"]')?.textContent || '';
          return progressText.includes('100%') || progressText.includes('Complete');
        },
        { timeout }
      );

      // Wait for progress bar to disappear
      await this.progressBar.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Progress bar might not appear for quick operations
    }
  }

  /**
   * Get list of position titles from the debug view
   */
  async getPositionTitles(): Promise<string[]> {
    await this.waitForLoadingComplete();

    const items = await this.positionsList.locator('[data-testid="position-title"]').all();
    const titles: string[] = [];

    for (const item of items) {
      const title = await this.getLocatorText(item);
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  /**
   * Get list of category names from the debug view
   */
  async getCategoryNames(): Promise<string[]> {
    await this.waitForLoadingComplete();

    const items = await this.categoriesList.locator('[data-testid="category-name"]').all();
    const names: string[] = [];

    for (const item of items) {
      const name = await this.getLocatorText(item);
      if (name) names.push(name.trim());
    }

    return names;
  }

  /**
   * Get list of user emails from the debug view
   */
  async getUserEmails(): Promise<string[]> {
    await this.waitForLoadingComplete();

    const items = await this.usersList.locator('[data-testid="user-email"]').all();
    const emails: string[] = [];

    for (const item of items) {
      const email = await this.getLocatorText(item);
      if (email) emails.push(email.trim());
    }

    return emails;
  }

  /**
   * Select and view details of a specific position
   */
  async selectPosition(title: string): Promise<void> {
    const position = this.positionsList.locator(
      `[data-testid="position-title"]:has-text("${title}")`
    );
    await position.click();

    // Wait for position details to load
    await this.page.waitForSelector('[data-testid="position-details"]', {
      state: 'visible',
      timeout: 5000,
    });
  }

  /**
   * Export data as JSON for debugging
   */
  async exportData(): Promise<string> {
    await this.exportDataButton.click();

    // Wait for export to complete and raw data to appear
    await this.rawDataViewer.waitFor({ state: 'visible', timeout: 10000 });

    return await this.getLocatorText(this.rawDataViewer);
  }

  /**
   * Check if there are any error messages displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the current error message if any
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.getLocatorText(this.errorMessage);
    }
    return '';
  }

  /**
   * Check if there are any success messages displayed
   */
  async hasSuccess(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * Get the current success message if any
   */
  async getSuccessMessage(): Promise<string> {
    if (await this.hasSuccess()) {
      return await this.getLocatorText(this.successMessage);
    }
    return '';
  }

  /**
   * Verify no errors are present on the page
   */
  async verifyNoErrors(): Promise<void> {
    if (await this.hasError()) {
      const errorMsg = await this.getErrorMessage();
      throw new Error(`Firestore debug page has errors: ${errorMsg}`);
    }
  }

  /**
   * Wait for specific number of positions to be loaded
   */
  async waitForPositionsCount(expectedCount: number, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      count => {
        const countElement = document.querySelector('[data-testid="positions-count"]');
        if (!countElement) return false;

        const text = countElement.textContent || '';
        const match = text.match(/\d+/);
        const currentCount = match ? parseInt(match[0]) : 0;

        return currentCount === count;
      },
      expectedCount,
      { timeout }
    );
  }

  /**
   * Verify data matches expected state using Test API
   */
  async verifyDataState(expectedStats: Partial<FirestoreDataStats>): Promise<void> {
    const actualStats = await this.getDataStats();

    if (expectedStats.totalDocuments !== undefined) {
      expect(actualStats.totalDocuments).toBe(expectedStats.totalDocuments);
    }

    if (expectedStats.collections) {
      for (const [collection, expectedCount] of Object.entries(expectedStats.collections)) {
        expect(actualStats.collections[collection] || 0).toBe(expectedCount);
      }
    }
  }

  /**
   * Integration with Test API Client for cross-verification
   */
  async verifyWithTestApi(): Promise<void> {
    if (!this.apiClient) {
      console.warn('No Test API client provided, skipping API verification');
      return;
    }

    // Get data from both UI and API
    const uiStats = await this.getDataStats();
    const apiStatus = await this.apiClient.getFirebaseStatus();

    // Verify counts match between UI and API
    expect(uiStats.collections.positions || 0).toBe(apiStatus.collections.positions || 0);
    expect(uiStats.collections.categories || 0).toBe(apiStatus.collections.categories || 0);
    expect(uiStats.collections.users || 0).toBe(apiStatus.collections.users || 0);
  }

  // Private helper methods

  /**
   * Extract number from a locator's text content
   */
  private async extractNumber(locator: Locator): Promise<number> {
    const text = await this.getLocatorText(locator);
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Enhanced Firebase data waiting with timeout
   */
  async waitForFirebaseData(timeout = 10000): Promise<void> {
    await super.waitForFirebaseData(timeout);

    // Additional Firebase-specific checks
    await this.connectionStatus.waitFor({ state: 'visible', timeout });

    // Ensure we're connected
    const connectionInfo = await this.getConnectionInfo();
    if (connectionInfo.status !== 'connected') {
      throw new Error(`Firebase not connected: ${connectionInfo.status}`);
    }
  }
}
