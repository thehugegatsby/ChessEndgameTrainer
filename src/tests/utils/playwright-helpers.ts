/**
 * Playwright Test Helpers
 * Common utility functions for Playwright tests
 */

import { Locator } from "@playwright/test";

/**
 * Safely get text content from a locator
 * Returns empty string if element has no text or is null
 *
 * This helper is for components and other test utilities that don't inherit from BasePage
 */
export async function getLocatorText(locator: Locator): Promise<string> {
  const text = await locator.textContent();
  return text || "";
}

/**
 * Wait for element to be visible and get its text
 * Combines waiting and text extraction in one operation
 */
export async function getVisibleText(locator: Locator): Promise<string> {
  await locator.waitFor({ state: "visible" });
  return getLocatorText(locator);
}
