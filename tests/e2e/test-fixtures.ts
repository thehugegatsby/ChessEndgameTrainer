/**
 * Custom Playwright test fixtures for E2E tests
 * Provides automatic CSS injection to disable animations and improve test stability
 */

import { test as base } from '@playwright/test';
import path from 'path';

// Extend basic test by providing a "page" fixture that automatically injects CSS
export const test = base.extend({
  page: async ({ page }, use) => {
    // Path to the CSS file that disables animations
    const cssFilePath = path.resolve(__dirname, './styles/test-overrides.css');
    
    try {
      // Inject the CSS file into the page
      await page.addStyleTag({ path: cssFilePath });
      console.log('[E2E] Injected test-overrides.css to disable animations');
    } catch (error) {
      console.error('[E2E] Failed to inject test-overrides.css:', error);
      // Continue with test even if CSS injection fails
    }
    
    // Also inject inline CSS as a fallback in case file loading fails
    await page.addStyleTag({
      content: `
        /* Fallback inline CSS */
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });
    
    // Continue with the test
    await use(page);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';