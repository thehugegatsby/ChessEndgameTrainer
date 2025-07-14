/**
 * Playwright Route Interception for E2E Tests
 * Replaces IS_E2E_TEST architectural smell with clean network-level mocking
 * Expert consensus: Gemini 9/10, O3-mini 9/10, Claude 8/10 confidence
 */

import { Page } from '@playwright/test';
import { E2E } from '../../../shared/constants';

/**
 * Mock position data for E2E tests
 * Matches EndgamePosition interface structure
 */
const createMockPosition = (id: number) => ({
  id,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  name: `E2E Test Position ${id}`,
  description: `Test position for E2E testing - ID ${id}`,
  pgn: '',
  tags: ['e2e-test'],
  difficulty: 'beginner' as const,
  category: 'endgame' as const,
  moves: []
});

/**
 * Setup route interception for position API calls
 * Clean alternative to IS_E2E_TEST flag in production code
 */
export async function setupRouteInterception(page: Page) {
  // Intercept position API calls
  await page.route('**/api/positions/**', async (route) => {
    const url = new URL(route.request().url());
    const pathParts = url.pathname.split('/');
    const id = Number(pathParts[pathParts.indexOf('positions') + 1]);
    
    if (isNaN(id)) {
      await route.fulfill({
        status: 404,
        json: { error: 'Position not found' }
      });
      return;
    }
    
    const mockPosition = createMockPosition(id);
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: mockPosition
    });
  });

  // Intercept any other backend calls that might need mocking
  await page.route('**/api/user/**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: 'e2e-test-user',
        rating: E2E.DATA.USER.RATING,
        currentStreak: E2E.DATA.USER.STREAK,
        preferences: E2E.DATA.PREFERENCES
      }
    });
  });
}

/**
 * Setup route interception with error simulation for testing error handling
 */
export async function setupRouteInterceptionWithErrors(page: Page, errorRate = 0.1) {
  await page.route('**/api/positions/**', async (route) => {
    // Simulate network errors occasionally
    if (Math.random() < errorRate) {
      await route.fulfill({
        status: 500,
        json: { error: 'Simulated server error for E2E testing' }
      });
      return;
    }
    
    // Normal mock response
    const url = new URL(route.request().url());
    const pathParts = url.pathname.split('/');
    const id = Number(pathParts[pathParts.indexOf('positions') + 1]);
    
    const mockPosition = createMockPosition(id);
    await route.fulfill({
      status: 200,
      json: mockPosition
    });
  });
}