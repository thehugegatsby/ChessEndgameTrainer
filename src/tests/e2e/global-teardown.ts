/**
 * Global E2E Test Teardown - Clean Architecture
 */

import { type FullConfig } from "@playwright/test";
import { getLogger } from "../../shared/services/logging";

/**
 *
 * @param _config
 */
async function globalTeardown(_config: FullConfig) {
  const logger = getLogger().setContext("E2E-GlobalTeardown");
  logger.info("Starting E2E Global Teardown");

  // Note: MSW removed - no server to stop

  // Cleanup any global resources if needed
  logger.info("E2E Global Teardown Complete");
}

export default globalTeardown;
