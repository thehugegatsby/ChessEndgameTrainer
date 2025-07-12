/**
 * Firebase Test Setup Helper
 * Configures dependency injection for Firebase integration tests
 */

import { PositionService } from '@shared/services/database/PositionService';
import { FirebasePositionRepository } from '@shared/repositories/implementations/FirebasePositionRepository';
import { IPositionService } from '@shared/services/database/IPositionService';
import { configureStore } from '@shared/store/storeConfig';
import { db } from '@shared/lib/firebase';

/**
 * Creates a PositionService instance configured for Firebase integration testing
 * Uses the real FirebasePositionRepository to test actual Firebase integration
 */
export function createFirebasePositionService(): IPositionService {
  const repository = new FirebasePositionRepository(db);
  const positionService = new PositionService(repository);
  
  // Also configure the store for any components that might use it
  configureStore({ positionService });
  
  return positionService;
}

/**
 * Gets a singleton instance of PositionService for tests that need consistency
 * across multiple test cases
 */
let singletonInstance: IPositionService | null = null;

export function getFirebasePositionService(): IPositionService {
  if (!singletonInstance) {
    singletonInstance = createFirebasePositionService();
  }
  return singletonInstance;
}

/**
 * Resets the singleton instance - useful for test isolation
 */
export function resetFirebasePositionService(): void {
  singletonInstance = null;
}