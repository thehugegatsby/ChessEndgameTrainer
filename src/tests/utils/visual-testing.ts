/**
 * Visual Regression and Accessibility Testing Utilities
 * Enterprise-grade visual and a11y testing
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

export interface VisualTestOptions {
  name: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  mask?: Locator[];
  animations?: 'disabled' | 'allow';
  caret?: 'hide' | 'initial';
  scale?: 'css' | 'device';
  maxDiffPixels?: number;
  maxDiffPixelRatio?: number;
  threshold?: number;
  timeout?: number;
}

export interface A11yTestOptions {
  includedImpacts?: ('minor' | 'moderate' | 'serious' | 'critical')[];
  detailedReport?: boolean;
  detailedReportOptions?: {
    html?: boolean;
  };
  rules?: Record<string, { enabled: boolean; options?: any }>;
  skipFailures?: boolean;
}

export class VisualTester {
  private page: Page;
  private defaultOptions: Partial<VisualTestOptions>;

  constructor(page: Page, defaultOptions?: Partial<VisualTestOptions>) {
    this.page = page;
    this.defaultOptions = {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixels: 100,
      threshold: 0.2,
      ...defaultOptions,
    };
  }

  /**
   * Take and compare screenshot
   */
  async snapshot(options: VisualTestOptions): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Prepare page for consistent screenshots
    await this.preparePage(mergedOptions);

    // Take screenshot
    if (mergedOptions.fullPage) {
      await expect(this.page).toHaveScreenshot(mergedOptions.name, {
        fullPage: true,
        animations: mergedOptions.animations,
        caret: mergedOptions.caret,
        scale: mergedOptions.scale,
        mask: mergedOptions.mask,
        maxDiffPixels: mergedOptions.maxDiffPixels,
        maxDiffPixelRatio: mergedOptions.maxDiffPixelRatio,
        threshold: mergedOptions.threshold,
        timeout: mergedOptions.timeout,
      });
    } else {
      const screenshot = mergedOptions.clip
        ? await this.page.screenshot({ clip: mergedOptions.clip })
        : await this.page.screenshot();

      await expect(screenshot).toMatchSnapshot(mergedOptions.name, {
        maxDiffPixels: mergedOptions.maxDiffPixels,
        maxDiffPixelRatio: mergedOptions.maxDiffPixelRatio,
        threshold: mergedOptions.threshold,
      });
    }
  }

  /**
   * Compare specific element
   */
  async snapshotElement(
    element: Locator,
    name: string,
    options?: Partial<VisualTestOptions>
  ): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    await this.preparePage(mergedOptions);

    await expect(element).toHaveScreenshot(name, {
      animations: mergedOptions.animations,
      caret: mergedOptions.caret,
      scale: mergedOptions.scale,
      mask: mergedOptions.mask,
      maxDiffPixels: mergedOptions.maxDiffPixels,
      maxDiffPixelRatio: mergedOptions.maxDiffPixelRatio,
      threshold: mergedOptions.threshold,
      timeout: mergedOptions.timeout,
    });
  }

  /**
   * Prepare page for consistent screenshots
   */
  private async preparePage(options: Partial<VisualTestOptions>): Promise<void> {
    // Disable animations if requested
    if (options.animations === 'disabled') {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `,
      });
    }

    // Hide caret if requested
    if (options.caret === 'hide') {
      await this.page.addStyleTag({
        content: `
          * {
            caret-color: transparent !important;
          }
        `,
      });
    }

    // Wait for fonts to load
    await this.page.evaluate(() => document.fonts.ready);

    // Wait for images to load
    await this.page.waitForLoadState('networkidle');

    // Additional wait for any lazy-loaded content
    await this.page.waitForTimeout(500);
  }

  /**
   * Visual regression test suite
   */
  async runSuite(suite: { name: string; tests: VisualTestOptions[] }): Promise<void> {
    for (const test of suite.tests) {
      await this.snapshot({
        ...test,
        name: `${suite.name}/${test.name}`,
      });
    }
  }
}

export class A11yTester {
  private page: Page;
  private isInjected = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Initialize axe-core
   */
  async initialize(): Promise<void> {
    if (!this.isInjected) {
      await injectAxe(this.page);
      this.isInjected = true;
    }
  }

  /**
   * Configure axe-core rules
   */
  async configure(config: {
    rules?: Array<{ id: string; enabled: boolean }>;
    checks?: Array<{ id: string; enabled: boolean }>;
    locale?: string;
    branding?: {
      brand?: string;
      application?: string;
    };
    reporter?: string;
  }): Promise<void> {
    await this.initialize();
    await configureAxe(this.page, config as any);
  }

  /**
   * Run accessibility tests
   */
  async check(options?: A11yTestOptions): Promise<void> {
    await this.initialize();

    await checkA11y(
      this.page,
      undefined, // selector - undefined means whole page
      {
        includedImpacts: options?.includedImpacts,
        detailedReport: options?.detailedReport,
        detailedReportOptions: options?.detailedReportOptions,
        axeOptions: {
          rules: options?.rules,
        },
      },
      options?.skipFailures
    );
  }

  /**
   * Check specific element
   */
  async checkElement(selector: string, options?: A11yTestOptions): Promise<void> {
    await this.initialize();

    await checkA11y(
      this.page,
      selector,
      {
        includedImpacts: options?.includedImpacts,
        detailedReport: options?.detailedReport,
        detailedReportOptions: options?.detailedReportOptions,
        axeOptions: {
          rules: options?.rules,
        },
      },
      options?.skipFailures
    );
  }

  /**
   * Get accessibility tree
   */
  async getAccessibilityTree(): Promise<any> {
    return await this.page.accessibility.snapshot();
  }

  /**
   * Common a11y test suites
   */
  async runCommonTests(): Promise<void> {
    // WCAG 2.1 Level AA compliance
    await this.check({
      includedImpacts: ['critical', 'serious'],
      rules: {
        'color-contrast': { enabled: true },
        label: { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        region: { enabled: true },
      },
    });
  }

  /**
   * Check keyboard navigation
   */
  async checkKeyboardNavigation(elements: string[]): Promise<void> {
    for (const selector of elements) {
      const element = this.page.locator(selector);

      // Check if element is focusable
      const isFocusable = await element.evaluate(el => {
        const tabindex = el.getAttribute('tabindex');
        return el.matches(':focus-visible') || (tabindex !== null && parseInt(tabindex) >= 0);
      });

      expect(isFocusable).toBe(true);

      // Check if element has accessible name
      const accessibleName =
        (await element.getAttribute('aria-label')) ||
        (await element.getAttribute('aria-labelledby')) ||
        (await element.textContent());

      expect(accessibleName).toBeTruthy();
    }
  }

  /**
   * Check contrast ratio
   */
  async checkContrast(options?: {
    normalTextMinimum?: number; // Default: 4.5:1
    largeTextMinimum?: number; // Default: 3:1
  }): Promise<void> {
    await this.check({
      rules: {
        'color-contrast': {
          enabled: true,
          options: {
            noScroll: true,
            normalTextMinimum: options?.normalTextMinimum || 4.5,
            largeTextMinimum: options?.largeTextMinimum || 3,
          },
        },
      },
    });
  }
}

/**
 * Combined visual and a11y test runner
 */
export class QualityAssuranceTester {
  private visualTester: VisualTester;
  private a11yTester: A11yTester;

  constructor(page: Page) {
    this.visualTester = new VisualTester(page);
    this.a11yTester = new A11yTester(page);
  }

  /**
   * Run full QA suite
   */
  async runFullSuite(options: {
    visualTests: VisualTestOptions[];
    a11yConfig?: A11yTestOptions;
    keyboardElements?: string[];
  }): Promise<void> {
    // Visual regression tests
    for (const test of options.visualTests) {
      await this.visualTester.snapshot(test);
    }

    // Accessibility tests
    await this.a11yTester.runCommonTests();

    if (options.a11yConfig) {
      await this.a11yTester.check(options.a11yConfig);
    }

    // Keyboard navigation tests
    if (options.keyboardElements) {
      await this.a11yTester.checkKeyboardNavigation(options.keyboardElements);
    }
  }

  /**
   * Generate QA report
   */
  generateReport(): {
    visualTests: number;
    a11yIssues: any[];
    keyboardNavigation: boolean;
  } {
    // This would integrate with your reporting system
    return {
      visualTests: 0, // Count from actual tests
      a11yIssues: [], // Collect from axe results
      keyboardNavigation: true, // Result from keyboard tests
    };
  }
}
