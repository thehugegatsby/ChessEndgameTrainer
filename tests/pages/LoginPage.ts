/**
 * Login Page Object
 * Handles authentication UI interactions
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.fill('[data-testid="email-input"]', email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill('[data-testid="password-input"]', password);
  }

  async submit(): Promise<void> {
    await this.page.click('[data-testid="login-button"]');
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    await errorElement.waitFor({ state: 'visible' });
    return this.getLocatorText(errorElement);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}