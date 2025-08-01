/**
 * Global E2E Test Setup - Clean Architecture
 * Expert validated aggressive implementation
 */

import { chromium, FullConfig } from "@playwright/test";
import { getLogger } from "../../shared/services/logging";
import { E2E } from "../../shared/constants";
import { startMSWServer } from "./fixtures/msw-server";

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
  logger.info("Starting E2E Global Setup - Clean Architecture with MSW");

  // Start MSW server for API mocking (server-side + client-side)
  startMSWServer();
  logger.info("MSW Server started - Industry Standard API mocking");

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

    // Verify engine is loadable (comprehensive check)
    try {
      await page.evaluate((timeoutMs) => {
        return new Promise((resolve, reject) => {
          if (typeof Worker === "undefined") {
            return reject(new Error("Worker API not available"));
          }

          // Try to load the actual stockfish worker
          let worker: Worker | undefined;
          const timeout = setTimeout(() => {
            worker?.terminate();
            reject(
              new Error(
                `Engine worker failed to initialize within ${timeoutMs}ms`,
              ),
            );
          }, timeoutMs);

          try {
            // Attempt to create worker with stockfish path
            worker = new Worker("/stockfish.wasm.js");

            /**
             *
             * @param _event
             */
            worker.onmessage = (_event) => {
              clearTimeout(timeout);
              worker?.terminate();
              resolve("Engine worker loaded successfully");
            };

            /**
             *
             * @param err
             */
            worker.onerror = (err) => {
              clearTimeout(timeout);
              reject(
                new Error(
                  `Engine worker error: ${err.message || "Unknown error"}`,
                ),
              );
            };

            // Send initial command to test worker response
            worker.postMessage("uci");
          } catch (err) {
            clearTimeout(timeout);
            reject(
              new Error(
                `Failed to create engine worker: ${err instanceof Error ? err.message : "Unknown error"}`,
              ),
            );
          }
        });
      }, E2E.TIMEOUTS.TABLEBASE_INIT);
      logger.info("Engine worker verified (comprehensive check)");
    } catch (error) {
      logger.warn("Engine worker check failed (continuing anyway)", {
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
