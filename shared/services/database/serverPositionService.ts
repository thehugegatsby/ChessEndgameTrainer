/**
 * Server-side Position Service Factory
 * Creates PositionService instances for use in getStaticProps/getServerSideProps
 * where React hooks are not available
 */

import { PositionService } from './PositionService';
import { IPositionService } from './IPositionService';
import { FirebasePositionRepository } from '@shared/repositories/implementations/FirebasePositionRepository';
import { db } from '@shared/lib/firebase';

/**
 * Creates a PositionService instance for server-side usage
 * This is needed for Next.js getStaticProps/getServerSideProps
 * where React Context/hooks are not available
 */
export function createServerPositionService(): IPositionService {
  const repository = new FirebasePositionRepository(db, {
    enableCache: true,
    cacheSize: 200,
    cacheTTL: 300000, // 5 minutes
  });
  
  return new PositionService(repository, {
    cacheEnabled: true,
    cacheSize: 200,
    cacheTTL: 300000
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