/**
 * @file Browser-compatible E2E mode detection utility
 * @module utils/environment/isE2EMode
 * 
 * @description
 * Provides a browser-safe way to detect if the application is running in E2E test mode.
 * This utility works in both server and browser environments without relying on process.env
 * which is not available in the browser.
 */

import { getLogger } from '@shared/services/logging';

/**
 * Detect if application is running in E2E test mode
 * 
 * @returns {boolean} True if in E2E test mode, false otherwise
 * 
 * @description
 * Uses multiple detection methods to determine E2E mode:
 * 1. URL parameter: ?e2e=true
 * 2. User agent detection: Playwright browser
 * 3. Test environment markers
 * 
 * This function is safe to use in both server and browser contexts.
 * 
 * @example
 * ```typescript
 * import { isE2EMode } from '@shared/utils/environment/isE2EMode';
 * 
 * if (isE2EMode()) {
 *   // Initialize test APIs
 *   initializeTestApi();
 * }
 * ```
 */
export function isE2EMode(): boolean {
  // Server-side: no E2E mode detection needed
  if (typeof window === 'undefined') {
    return false;
  }

  const logger = getLogger().setContext('isE2EMode');
  
  try {
    // Method 1: Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasE2EParam = urlParams.get('e2e') === 'true';
    
    // Method 2: Check User Agent for Playwright
    const hasPlaywrightUA = window.navigator.userAgent.includes('Playwright');
    
    // Method 3: Check if running in headless browser (common in E2E tests)
    const isHeadless = window.navigator.webdriver === true;
    
    // Method 4: Check for test-specific window properties
    const hasTestMarkers = Boolean(
      (window as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__ ||
      (window as { __playwright__?: unknown }).__playwright__ ||
      (window as { __webdriver__?: unknown }).__webdriver__
    );

    const result = hasE2EParam || hasPlaywrightUA || isHeadless || hasTestMarkers;
    
    logger.debug('E2E mode detection', {
      hasE2EParam,
      hasPlaywrightUA,
      isHeadless,
      hasTestMarkers,
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      result
    });
    
    return result;
  } catch (error) {
    logger.error('Error detecting E2E mode', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Force E2E mode for testing
 * 
 * @description
 * Sets a window property to force E2E mode detection.
 * Useful for manual testing or when other detection methods fail.
 */
export function forceE2EMode(): void {
  if (typeof window !== 'undefined') {
    (window as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__ = true;
    getLogger().info('E2E mode forced via window property');
  }
}

/**
 * Clear forced E2E mode
 */
export function clearE2EMode(): void {
  if (typeof window !== 'undefined') {
    delete (window as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;
    getLogger().info('E2E mode cleared');
  }
}