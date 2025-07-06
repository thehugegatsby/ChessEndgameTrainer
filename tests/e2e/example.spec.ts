import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Endgame Training/);
});

test('navigate to training page', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Click on the first endgame training link (Brückenbau)
  await page.getByRole('link', { name: 'Brückenbau' }).first().click();

  // Wait for navigation
  await page.waitForURL('**/train/**');

  // Check that we're on the training page
  await expect(page.locator('h1').filter({ hasText: 'Brückenbau' })).toBeVisible();
});