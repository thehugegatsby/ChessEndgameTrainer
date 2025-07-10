/**
 * @fileoverview Manual Mock for BaseComponent
 * @description Provides test-friendly BaseComponent without logger dependencies
 */

import { Page, Locator } from '@playwright/test';

export interface BaseComponentConfig {
  defaultTimeout?: number;
  enableLogging?: boolean;
  maxRetries?: number;
}

/**
 * Mock BaseComponent for component testing
 * Removes all external dependencies for true isolation
 */
export abstract class BaseComponent {
  protected readonly defaultTimeout: number;
  protected readonly maxRetries: number;
  protected readonly logger: any;

  constructor(
    protected readonly page: Page,
    protected readonly rootSelector?: string,
    config: BaseComponentConfig = {}
  ) {
    this.defaultTimeout = config.defaultTimeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
    
    // Mock logger with chainable methods
    this.logger = {
      setContext: jest.fn().mockReturnThis(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }

  abstract getDefaultSelector(): string;

  protected async getRootElement() {
    const selector = this.rootSelector || this.getDefaultSelector();
    return this.page.locator(selector);
  }

  protected async waitForElement(selector: string) {
    // Debug output
    (process.stdout as any).write(`waitForElement called with: ${selector}\n`);
    
    // Check if element exists first
    const element = this.page.locator(selector);
    const count = await element.count();
    (process.stdout as any).write(`Element count: ${count}\n`);
    
    if (count > 0) {
      // Element exists, check visibility
      const isVisible = await element.isVisible();
      (process.stdout as any).write(`Element isVisible: ${isVisible}\n`);
      
      if (isVisible) {
        (process.stdout as any).write('EARLY RETURN - element is visible\n');
        return element;
      }
    }
    
    // Element doesn't exist or isn't visible, wait for it
    (process.stdout as any).write('Calling waitForSelector...\n');
    return this.page.waitForSelector(selector, { timeout: this.defaultTimeout });
  }

  protected async findElement(primarySelector: string, fallbackSelector?: string) {
    try {
      const element = this.page.locator(primarySelector);
      const count = await element.count();
      if (count > 0) {
        return element;
      }
      
      if (fallbackSelector) {
        return this.page.locator(fallbackSelector);
      }
      
      return element;
    } catch (error) {
      if (fallbackSelector) {
        return this.page.locator(fallbackSelector);
      }
      throw error;
    }
  }

  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < this.maxRetries - 1) {
          await this.page.waitForTimeout(100);
        }
      }
    }
    
    throw lastError || new Error('Retry failed');
  }

  protected async waitForCondition(
    condition: () => Promise<boolean>, 
    timeout: number
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  protected log(level: 'info' | 'warn' | 'error', message: string, context?: any): void {
    // Mock implementation - logger is already mocked in constructor
    const componentLogger = this.logger.setContext(this.constructor.name);
    
    switch (level) {
      case 'info':
        componentLogger.info(message, context);
        break;
      case 'warn':
        componentLogger.warn(message, context);
        break;
      case 'error':
        componentLogger.error(message, context);
        break;
    }
  }
}