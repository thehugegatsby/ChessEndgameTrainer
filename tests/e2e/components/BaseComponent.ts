/**
 * @fileoverview BaseComponent - Hybrid approach combining abstract class consistency with flexible constructor
 * @description Provides shared functionality for all Component Objects with enforced consistency
 */

import { Page, Locator } from '@playwright/test';
import { getLogger, ILogger } from '../../../shared/services/logging';
import { TIMEOUTS, RETRY_CONFIG, LOG_CONTEXTS } from '../config/constants';

/**
 * Configuration options for BaseComponent
 */
export interface BaseComponentConfig {
  /** Default timeout for wait operations in milliseconds */
  defaultTimeout?: number;
  /** Enable debug logging */
  enableLogging?: boolean;
  /** Maximum number of retries for operations */
  maxRetries?: number;
}

/**
 * Base class for all Component Objects
 * Combines abstract class consistency (O3) with flexible constructor parameters (Gemini)
 */
export abstract class BaseComponent {
  protected readonly defaultTimeout: number;
  protected readonly maxRetries: number;
  protected readonly logger: ILogger;

  constructor(
    protected readonly page: Page,
    protected readonly rootSelector?: string,
    config: BaseComponentConfig = {}
  ) {
    this.defaultTimeout = config.defaultTimeout ?? TIMEOUTS.default;
    this.maxRetries = config.maxRetries ?? RETRY_CONFIG.MAX_RETRIES;
    this.logger = getLogger().setContext(LOG_CONTEXTS.BASE);
  }

  /**
   * Abstract method to ensure consistent selector definition
   * Must be implemented by all extending classes
   */
  abstract getDefaultSelector(): string;

  /**
   * Get the root selector for this component
   * Uses provided rootSelector or falls back to default
   */
  protected getRootSelector(): string {
    return this.rootSelector || this.getDefaultSelector();
  }

  /**
   * Hybrid selector strategy with primary/fallback approach
   * Primary: flexible attribute selectors ([data-square="e4"])
   * Fallback: data-testid selectors ([data-testid="chess-square-e4"])
   */
  protected async findElement(
    selector: string, 
    fallback?: string, 
    timeout?: number
  ): Promise<Locator> {
    const timeoutMs = timeout ?? this.defaultTimeout;
    
    try {
      // Try primary selector first
      const element = this.page.locator(selector);
      await element.waitFor({ timeout: timeoutMs });
      this.log('info', `Found element with primary selector: ${selector}`);
      return element;
    } catch (error) {
      // If fallback is provided, try it
      if (fallback) {
        try {
          const fallbackElement = this.page.locator(fallback);
          await fallbackElement.waitFor({ timeout: timeoutMs });
          this.log('warn', `Found element with fallback selector: ${fallback}`, { primarySelector: selector });
          return fallbackElement;
        } catch (fallbackError) {
          this.log('error', `Both primary and fallback selectors failed`, { 
            primarySelector: selector, 
            fallbackSelector: fallback,
            primaryError: error,
            fallbackError: fallbackError
          });
          throw new Error(`Element not found with selectors: ${selector} or ${fallback}`);
        }
      }
      
      this.log('error', `Primary selector failed and no fallback provided: ${selector}`, { error });
      throw error;
    }
  }

  /**
   * Retry mechanism for operations that may fail transiently
   * Essential for handling UI state changes and network issues
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    delay: number = RETRY_CONFIG.INITIAL_DELAY
  ): Promise<T> {
    const retries = maxRetries ?? this.maxRetries;
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          this.log('info', `Operation succeeded on attempt ${attempt}/${retries}`);
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Operation failed on attempt ${attempt}/${retries}`, { error: lastError.message });
        
        if (attempt === retries) {
          break; // Don't wait after final attempt
        }
        
        // Exponential backoff with jitter
        const backoffDelay = Math.min(
          delay * Math.pow(RETRY_CONFIG.EXPONENTIAL_BASE, attempt - 1),
          RETRY_CONFIG.MAX_DELAY
        ) + Math.random() * (RETRY_CONFIG.MAX_DELAY * RETRY_CONFIG.JITTER_FACTOR);
        
        await this.page.waitForTimeout(backoffDelay);
      }
    }

    this.log('error', `Operation failed after ${retries} attempts`, { error: lastError.message });
    throw lastError;
  }

  /**
   * Wait for a condition to be true with polling
   * Critical for synchronizing with React re-renders and animations
   */
  protected async waitForCondition(
    condition: () => Promise<boolean>,
    timeout?: number,
    pollInterval: number = TIMEOUTS.poll
  ): Promise<void> {
    const timeoutMs = timeout ?? this.defaultTimeout;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await condition();
        if (result) {
          this.log('info', `Condition met after ${Date.now() - startTime}ms`);
          return;
        }
      } catch (error) {
        this.log('warn', `Condition check failed`, { error: (error as Error).message });
      }

      await this.page.waitForTimeout(pollInterval);
    }

    const elapsed = Date.now() - startTime;
    this.log('error', `Condition not met after ${elapsed}ms timeout`);
    throw new Error(`Condition not met within ${timeoutMs}ms timeout`);
  }

  /**
   * Wait for element to be present and visible
   * Essential helper for all UI interactions
   */
  protected async waitForElement(
    selector: string,
    timeout?: number,
    fallback?: string
  ): Promise<Locator> {
    const timeoutMs = timeout ?? this.defaultTimeout;
    
    return this.withRetry(async () => {
      const element = await this.findElement(selector, fallback, timeoutMs);
      await element.waitFor({ state: 'visible', timeout: timeoutMs });
      return element;
    });
  }

  /**
   * Wait for text to appear in element
   * Useful for waiting for dynamic content updates
   */
  protected async waitForText(
    text: string,
    timeout?: number,
    selector?: string
  ): Promise<void> {
    const timeoutMs = timeout ?? this.defaultTimeout;
    const locator = selector ? this.page.locator(selector) : this.page.locator(this.getRootSelector());
    
    await this.withRetry(async () => {
      await locator.waitFor({ timeout: timeoutMs });
      await locator.locator(`text=${text}`).waitFor({ timeout: timeoutMs });
    });
  }

  /**
   * Wait for element to have specific attribute value
   * Essential for waiting for state changes
   */
  protected async waitForAttribute(
    selector: string,
    attribute: string,
    value: string,
    timeout?: number
  ): Promise<void> {
    const timeoutMs = timeout ?? this.defaultTimeout;
    
    await this.withRetry(async () => {
      const element = await this.findElement(selector, undefined, timeoutMs);
      await element.waitFor({ timeout: timeoutMs });
      
      await this.waitForCondition(async () => {
        const attributeValue = await element.getAttribute(attribute);
        return attributeValue === value;
      }, timeoutMs);
    });
  }

  /**
   * Logging utility with structured logging service
   * Provides debugging support and operation tracking
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, context?: any): void {
    const componentLogger = this.logger.setContext(this.constructor.name);
    
    switch (level) {
      case 'info':
        componentLogger.info(message, context);
        break;
      case 'warn':
        componentLogger.warn(message, context);
        break;
      case 'error':
        componentLogger.error(message, undefined, context);
        break;
    }
  }

  /**
   * Get root element for this component
   * Used by extending classes for component-specific operations
   */
  protected async getRootElement(): Promise<Locator> {
    return this.waitForElement(this.getRootSelector());
  }

  /**
   * Check if component is visible (immediate check with short timeout)
   * Useful for conditional operations - does not wait for full timeout
   */
  async isVisible(): Promise<boolean> {
    try {
      const element = await this.findElement(this.getRootSelector(), undefined, TIMEOUTS.short);
      return await element.isVisible({ timeout: TIMEOUTS.short });
    } catch {
      return false;
    }
  }

  /**
   * Check if component is enabled
   * Useful for form validation and interaction checks
   */
  async isEnabled(): Promise<boolean> {
    try {
      const element = await this.getRootElement();
      return await element.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Get immediate element count (no waiting)
   * Useful for existence checks and empty state validation
   */
  protected async getElementCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }
}