/**
 * Dashboard Page Object
 * Handles main dashboard UI interactions
 */

import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async navigate(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for key elements
    await this.page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  }

  async getUserEmail(): Promise<string> {
    const userElement = this.page.locator('[data-testid="user-email"]');
    await userElement.waitFor({ state: 'visible' });
    const email = await userElement.textContent();
    return email || '';
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="logout-button"]');
  }

  async getPositionCount(): Promise<number> {
    const positions = await this.page.locator('[data-testid="position-card"]').all();
    return positions.length;
  }

  async selectPosition(id: number): Promise<void> {
    await this.page.click(`[data-testid="position-${id}"]`);
  }
}