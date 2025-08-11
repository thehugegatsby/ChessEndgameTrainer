/**
 * Playwright-Only Mocking Utilities for E2E Tests
 * 
 * Simplified mocking using only Playwright's native route() API.
 * No MSW complexity, no function serialization issues.
 * 
 * @example
 * ```typescript
 * import { mockTablebase } from './helpers/playwrightMocking';
 * 
 * test('should handle tablebase success', async ({ page }) => {
 *   await mockTablebase.success(page);
 *   // Now all tablebase calls return mocked winning position
 * });
 * ```
 */

import { type Page } from '@playwright/test';
import { getLogger } from '@shared/services/logging';
import type { LichessTablebaseResponse } from '@shared/types/tablebase';

const logger = getLogger().setContext('E2E-PlaywrightMocking');

/**
 * Standard tablebase responses for common test scenarios
 */
const TABLEBASE_RESPONSES = {
  /**
   * Winning position - King + Pawn vs King
   */
  WIN: {
    dtz: 12,
    precise_dtz: 12,
    dtm: 12,
    checkmate: false,
    stalemate: false,
    variant_win: true,
    variant_loss: false,
    insufficient_material: false,
    category: "win",
    moves: [
      {
        uci: "e5e6",
        san: "e6",
        dtz: -11,
        precise_dtz: -11,
        dtm: -11,
        zeroing: false,
        checkmate: false,
        stalemate: false,
        variant_win: false,
        variant_loss: true,
        insufficient_material: false,
        category: "loss"
      }
    ]
  },

  /**
   * Draw position - insufficient material
   */
  DRAW: {
    dtz: 0,
    precise_dtz: 0,
    dtm: 0,
    checkmate: false,
    stalemate: false,
    variant_win: false,
    variant_loss: false,
    insufficient_material: true,
    category: "draw",
    moves: []
  },

  /**
   * Mate position
   */
  MATE: {
    dtz: 0,
    precise_dtz: 0,
    dtm: 0,
    checkmate: true,
    stalemate: false,
    variant_win: false,
    variant_loss: true,
    insufficient_material: false,
    category: "loss",
    moves: []
  }
};

/**
 * Mock tablebase API with specific response
 * 
 * @param page - Playwright page instance
 * @param response - Response data to return
 * @param status - HTTP status code (default: 200)
 */
export async function mockTablebaseAPI(
  page: Page, 
  response: LichessTablebaseResponse | { error: string }, 
  status: number = 200
): Promise<void> {
  const endpoint = '**/tablebase.lichess.ovh/standard**';
  
  logger.info(`🎭 Mocking tablebase API: ${status === 200 ? 'success' : `error ${status}`}`);
  
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
  
  logger.info(`✅ Tablebase mock active`);
}

/**
 * Tablebase mocking presets for common scenarios
 */
export const mockTablebase = {
  /**
   * Mock successful winning position
   */
  async success(page: Page): Promise<void> {
    await mockTablebaseAPI(page, TABLEBASE_RESPONSES.WIN);
  },

  /**
   * Mock draw position
   */
  async draw(page: Page): Promise<void> {
    await mockTablebaseAPI(page, TABLEBASE_RESPONSES.DRAW);
  },

  /**
   * Mock mate position
   */
  async mate(page: Page): Promise<void> {
    await mockTablebaseAPI(page, TABLEBASE_RESPONSES.MATE);
  },

  /**
   * Mock network error
   */
  async error(page: Page, status: number = 500): Promise<void> {
    await mockTablebaseAPI(page, { error: 'Tablebase service unavailable' }, status);
  },

  /**
   * Mock slow response with specified delay
   */
  async slow(page: Page, delayMs: number = 3000): Promise<void> {
    const endpoint = '**/tablebase.lichess.ovh/standard**';
    
    logger.info(`🐌 Mocking slow tablebase response (${delayMs}ms delay)`);
    
    await page.route(endpoint, async (route) => {
      // Log when request is received
      logger.info(`⏱️ Request received, starting ${delayMs}ms delay...`);
      const startTime = Date.now();
      
      // Apply delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const actualDelay = Date.now() - startTime;
      logger.info(`⏱️ Delay complete after ${actualDelay}ms, sending response`);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TABLEBASE_RESPONSES.WIN)
      });
    });
    
    logger.info(`✅ Slow mock configured with ${delayMs}ms delay`);
  },

  /**
   * Mock dynamic response based on FEN
   * 
   * @param page - Playwright page
   * @param fenToResponse - Map of FEN positions to responses
   */
  async dynamic(page: Page, fenToResponse: Map<string, LichessTablebaseResponse | { error: string }>): Promise<void> {
    const endpoint = '**/tablebase.lichess.ovh/standard**';
    
    logger.info(`🎯 Mocking dynamic tablebase responses for ${fenToResponse.size} positions`);
    
    await page.route(endpoint, async (route) => {
      const url = new URL(route.request().url());
      const fen = url.searchParams.get('fen');
      
      // Find matching FEN in map
      let response: LichessTablebaseResponse | { error: string } = TABLEBASE_RESPONSES.WIN; // default
      
      if (fen) {
        // Try exact match first
        if (fenToResponse.has(fen)) {
          response = fenToResponse.get(fen)!;
        } else {
          // Try to match board position only (ignore move counters)
          const boardPosition = fen.split(' ')[0];
          for (const [key, value] of fenToResponse.entries()) {
            if (key.startsWith(boardPosition)) {
              response = value;
              break;
            }
          }
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  },

  /**
   * Clear all mocks
   */
  async clear(page: Page): Promise<void> {
    await page.unroute('**/tablebase.lichess.ovh/standard**');
    logger.info('🧹 Tablebase mocks cleared');
  }
};

/**
 * Mock any API endpoint with custom response
 * 
 * @param page - Playwright page instance
 * @param pattern - URL pattern to match (glob or regex)
 * @param response - Response data
 * @param status - HTTP status code
 */
export async function mockAPI(
  page: Page,
  pattern: string,
  response: unknown,
  status: number = 200
): Promise<void> {
  logger.info(`🎭 Mocking API: ${pattern}`);
  
  await page.route(pattern, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Intercept and log all API calls for debugging
 * 
 * @param page - Playwright page instance
 * @param pattern - URL pattern to intercept (default: all APIs)
 */
export async function interceptAPICalls(
  page: Page,
  pattern: string = '**/api/**'
): Promise<void> {
  logger.info(`🔍 Intercepting API calls: ${pattern}`);
  
  await page.route(pattern, async (route) => {
    const request = route.request();
    logger.info('API Request:', {
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    
    // Continue with actual request
    const response = await route.fetch();
    
    logger.info('API Response:', {
      status: response.status(),
      headers: response.headers()
    });
    
    await route.fulfill({ response });
  });
}