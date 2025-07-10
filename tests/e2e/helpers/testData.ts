/**
 * @fileoverview Test Data Helper - Single Source of Truth
 * @description Provides test data from the same source as the application
 * This ensures tests stay in sync with application data changes
 */

import { getPositionById } from '../../../shared/data/endgames/index';
import { EndgamePosition } from '../../../shared/data/endgames/types';

/**
 * Get training position data by ID
 * Uses the same data source as the application
 */
export function getTestPosition(id: number): EndgamePosition {
  const position = getPositionById(id);
  if (!position) {
    throw new Error(`Test position with id ${id} not found in endgame data`);
  }
  return position;
}

/**
 * Common test positions for easy reference
 */
export const TestPositions = {
  OPPOSITION_BASICS: 1,
  BRIDGE_BUILDING: 12,
  ADVANCED_OPPOSITION: 2,
  DISTANT_OPPOSITION: 3,
  TRIANGULATION: 7,
} as const;

/**
 * Get FEN for a specific position ID
 * Convenience method for tests that only need the FEN
 */
export function getTestFen(id: number): string {
  return getTestPosition(id).fen;
}

/**
 * Verify a position matches expected data
 * Returns true if position matches, throws descriptive error if not
 */
export function verifyPosition(actualFen: string, expectedPositionId: number): boolean {
  const expectedPosition = getTestPosition(expectedPositionId);
  if (actualFen !== expectedPosition.fen) {
    throw new Error(
      `Position mismatch for position ${expectedPositionId} (${expectedPosition.title}):\n` +
      `Expected: ${expectedPosition.fen}\n` +
      `Actual:   ${actualFen}`
    );
  }
  return true;
}