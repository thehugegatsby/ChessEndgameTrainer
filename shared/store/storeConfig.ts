/**
 * Store Configuration
 * Manages dependency injection for the Zustand store
 */

import { IPositionService } from "@shared/services/database/IPositionService";

/**
 * Store dependencies that need to be injected
 */
export interface StoreDependencies {
  positionService: IPositionService;
}

/**
 * Global store dependencies singleton
 * This allows the store to access services without React hooks
 */
let storeDependencies: StoreDependencies | null = null;

/**
 * Configure the store with required dependencies
 * This should be called once at app initialization
 */
export function configureStore(dependencies: StoreDependencies): void {
  storeDependencies = dependencies;
}

/**
 * Get the configured store dependencies
 * @returns StoreDependencies or null if not configured (SSR-safe)
 */
export function getStoreDependencies(): StoreDependencies | null {
  return storeDependencies;
}
