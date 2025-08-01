/**
 * Server-side Position Service Factory
 * Creates PositionService instances for use in getStaticProps/getServerSideProps
 * where React hooks are not available
 */

import { PositionService } from "./PositionService";
import { IPositionService } from "./IPositionService";
import { FirebasePositionRepository } from "@shared/repositories/implementations/FirebasePositionRepository";
import { db } from "@shared/lib/firebase";
import {
  shouldUseMockService,
  createMockPositionService,
} from "@shared/testing/MockPositionServiceFactory";
import { CACHE } from "@shared/constants";

/**
 * Creates a PositionService instance for server-side usage
 * This is needed for Next.js getStaticProps/getServerSideProps
 * where React Context/hooks are not available
 */
export function createServerPositionService(): IPositionService {
  // Use mock service for E2E tests (server-side)
  if (shouldUseMockService()) {
    console.log("Creating MockPositionService for server-side E2E testing");
    return createMockPositionService();
  }

  // Use Firebase for production/development
  const repository = new FirebasePositionRepository(db, {
    enableCache: true,
    cacheSize: CACHE.POSITION_CACHE_SIZE,
    cacheTTL: CACHE.ANALYSIS_CACHE_TTL,
  });

  return new PositionService(repository, {
    cacheEnabled: true,
    cacheSize: CACHE.POSITION_CACHE_SIZE,
    cacheTTL: CACHE.ANALYSIS_CACHE_TTL,
  });
}

// Create a singleton instance for server-side usage
let serverPositionService: IPositionService | null = null;

/**
 * Get or create the server-side position service singleton
 * This ensures we reuse the same service instance across server-side renders
 */
export function getServerPositionService(): IPositionService {
  if (!serverPositionService) {
    serverPositionService = createServerPositionService();
  }
  return serverPositionService;
}

/**
 * Reset server position service singleton (useful for testing)
 */
export function resetServerPositionService(): void {
  serverPositionService = null;
}
