/**
 * MSW Setup Utilities for E2E Tests
 * 
 * Provides utilities to setup MSW in Playwright tests for deterministic API responses.
 * Eliminates network dependencies and enables error scenario testing.
 * 
 * @example
 * ```typescript
 * import { setupMSW } from './helpers/mswSetup';
 * import { tablebaseHandlers } from './mocks/tablebaseHandlers';
 * 
 * test('should handle tablebase success', async ({ page }) => {
 *   await setupMSW(page, tablebaseHandlers.success);
 *   // Now all tablebase calls return mocked responses
 * });
 * ```
 */

import { Page } from '@playwright/test';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('E2E-MSW');

/**
 * Setup MSW in the browser context for API mocking
 * 
 * @param page - Playwright page instance
 * @param handlers - MSW request handlers to use
 */
export async function setupMSW(page: Page, handlers: any[]): Promise<void> {
  logger.info('🔧 Setting up MSW for E2E test');

  // Register MSW in the browser context
  await page.addInitScript(() => {
    // Enable MSW in browser
    if (typeof window !== 'undefined') {
      (window as any).MSW_ENABLED = true;
    }
  });

  // Navigate to enable service worker registration
  await page.goto('/');
  
  // Wait for service worker to register and activate
  await page.waitForFunction(() => {
    return navigator.serviceWorker.ready;
  }, { timeout: 10000 });

  // Setup MSW handlers via page evaluation
  await page.evaluate((handlersData) => {
    const { setupWorker } = require('msw/browser');
    const { http, HttpResponse } = require('msw');
    
    // Convert handler data back to actual handlers
    const handlers = handlersData.map((handlerData: any) => {
      return http.get(handlerData.url, handlerData.resolver);
    });

    const worker = setupWorker(...handlers);
    (window as any).mswWorker = worker;
    
    return worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true
    });
  }, handlers.map(h => ({ 
    url: h.info.path,
    resolver: h.resolver.toString() 
  })));

  logger.info('✅ MSW setup complete');
}

/**
 * Teardown MSW after test completion
 * 
 * @param page - Playwright page instance 
 */
export async function teardownMSW(page: Page): Promise<void> {
  logger.info('🧹 Tearing down MSW');

  await page.evaluate(() => {
    const worker = (window as any).mswWorker;
    if (worker) {
      return worker.stop();
    }
  });

  logger.info('✅ MSW teardown complete');
}

/**
 * Simple MSW setup for specific endpoints with inline handlers
 * 
 * @param page - Playwright page instance
 * @param endpoint - API endpoint to mock
 * @param response - Response data to return
 * @param status - HTTP status code (default: 200)
 */
export async function mockEndpoint(
  page: Page, 
  endpoint: string, 
  response: any, 
  status: number = 200
): Promise<void> {
  logger.info(`🎭 Mocking endpoint: ${endpoint}`);

  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });

  logger.info(`✅ Mock active for: ${endpoint}`);
}

/**
 * Mock tablebase API with success response
 * Quick setup for common test scenario
 * 
 * @param page - Playwright page instance
 */
export async function mockTablebaseSuccess(page: Page): Promise<void> {
  const successResponse = {
    dtz: 5,
    precise_dtz: 5,
    dtm: 5,
    checkmate: false,
    stalemate: false,
    variant_win: true,
    variant_loss: false,
    insufficient_material: false,
    category: "win" as const,
    moves: [
      {
        uci: "e2e4",
        san: "e4", 
        dtz: -4,
        precise_dtz: -4,
        dtm: -4,
        zeroing: false,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: true,
        insufficient_material: false,
        category: "loss" as const
      }
    ]
  };

  await mockEndpoint(page, '**/tablebase.lichess.ovh/standard**', successResponse);
}

/**
 * Mock tablebase API with error response  
 * Quick setup for error testing
 * 
 * @param page - Playwright page instance
 * @param status - HTTP error status (default: 500)
 */
export async function mockTablebaseError(page: Page, status: number = 500): Promise<void> {
  await mockEndpoint(page, '**/tablebase.lichess.ovh/standard**', 
    { error: 'Tablebase service unavailable' }, 
    status
  );
}