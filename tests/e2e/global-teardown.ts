/**
 * Global E2E Test Teardown - Clean Architecture
 */

import { FullConfig } from "@playwright/test";
import { getLogger } from "../../shared/services/logging";
import { stopMSWServer } from "./fixtures/msw-server";

async function globalTeardown(_config: FullConfig) {
  const logger = getLogger().setContext("E2E-GlobalTeardown");
  logger.info("Starting E2E Global Teardown");

  // Stop MSW server to prevent memory leaks
  stopMSWServer();
  logger.info("MSW Server stopped");

  // Cleanup any global resources if needed
  logger.info("E2E Global Teardown Complete");
}

export default globalTeardown;
