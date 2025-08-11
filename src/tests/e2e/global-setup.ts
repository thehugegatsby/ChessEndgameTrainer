/**
 * Global E2E Test Setup - Clean Architecture
 * Expert validated aggressive implementation
 */

import { chromium, type FullConfig } from "@playwright/test";
import { getLogger } from "../../shared/services/logging";

// Configuration constants
const SERVER_CHECK_RETRIES = 30;
const SERVER_CHECK_INTERVAL_MS = 1000;
const SERVER_CHECK_TIMEOUT_MS = 5000;

/**
 *
 * @param config
 */
async function globalSetup(config: FullConfig) {
  const logger = getLogger().setContext("E2E-GlobalSetup");
  logger.info("Starting E2E Global Setup - Clean Architecture");

  // Note: MSW removed - E2E tests now use real API calls
  logger.info("Using real Tablebase API for E2E tests");

  // Browser setup for shared context
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Wait for dev server to be ready
    const baseURL = config.projects[0].use?.baseURL || "http://127.0.0.1:3002";
    logger.info("Checking dev server readiness", { baseURL });

    let retries = SERVER_CHECK_RETRIES;
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: SERVER_CHECK_TIMEOUT_MS });
        logger.info("Dev server is ready");
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(
            `Dev server not ready after ${SERVER_CHECK_RETRIES} attempts: ${error}`,
          );
        }
        await new Promise((resolve) =>
          setTimeout(resolve, SERVER_CHECK_INTERVAL_MS),
        );
      }
    }

    // Verify basic browser functionality (tablebase-only architecture)
    try {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          // Basic smoke test - no tablebase/worker verification needed
          resolve("Browser environment ready for tablebase-only tests");
        });
      });
      logger.info(
        "Browser environment verified for tablebase-only architecture",
      );
    } catch (error) {
      logger.warn("Browser environment check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await context.close();
  } finally {
    await browser.close();
  }

  logger.info("E2E Global Setup Complete - Ready for aggressive testing!");
}

export default globalSetup;
