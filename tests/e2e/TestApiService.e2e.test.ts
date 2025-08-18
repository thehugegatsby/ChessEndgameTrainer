/**
 * @file E2E Tests for TestApiService - Playwright Integration
 * @description End-to-end tests for TestApiService with actual browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('TestApiService E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E environment flag
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_IS_E2E_TEST', 'true');
    });
    
    // Navigate to training page
    await page.goto('/train/1');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should initialize TestApiService in browser', async ({ page }) => {
    // Check if Test API is available on window
    const testApiAvailable = await page.evaluate(() => {
      return typeof window.__testApi !== 'undefined';
    });
    
    expect(testApiAvailable).toBe(true);
  });

  test('should expose e2e_makeMove function', async ({ page }) => {
    const makeMoveAvailable = await page.evaluate(() => {
      return typeof window.e2e_makeMove === 'function';
    });
    
    expect(makeMoveAvailable).toBe(true);
  });

  test('should expose e2e_getGameState function', async ({ page }) => {
    const getGameStateAvailable = await page.evaluate(() => {
      return typeof window.e2e_getGameState === 'function';
    });
    
    expect(getGameStateAvailable).toBe(true);
  });

  test('should handle move execution through TestAPI', async ({ page }) => {
    // Execute a test move
    const moveResult = await page.evaluate(async () => {
      if (window.e2e_makeMove) {
        return await window.e2e_makeMove('e2-e4');
      }
      return null;
    });
    
    expect(moveResult).toBeTruthy();
    expect(moveResult.success).toBeDefined();
  });

  test('should get current game state', async ({ page }) => {
    const gameState = await page.evaluate(() => {
      if (window.e2e_getGameState) {
        return window.e2e_getGameState();
      }
      return null;
    });
    
    expect(gameState).toBeTruthy();
    expect(gameState.fen).toBeDefined();
    expect(gameState.turn).toMatch(/^[wb]$/);
  });
});