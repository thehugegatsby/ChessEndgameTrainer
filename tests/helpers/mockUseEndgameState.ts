/**
 * @deprecated Use mockRootStore from './mockRootStore' instead
 *
 * Mock helper for useEndgameState Zustand store
 * This file is kept for backward compatibility during migration.
 *
 * @example
 * Use mockRootStore instead of this deprecated helper
 */

// This helper is deprecated - useEndgameState no longer exists in new store architecture
// Use mockRootStore instead
export const mockUseEndgameState = () => {
  throw new Error('mockUseEndgameState is deprecated. Use mockRootStore instead.');
};

export const resetUseEndgameStateMock = () => {
  // No-op for backward compatibility
};

export const verifyUseEndgameStateCalls = () => {
  throw new Error('verifyUseEndgameStateCalls is deprecated. Use mockRootStore instead.');
};