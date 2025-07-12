/**
 * @fileoverview Test Data Helper - Single Source of Truth
 * @description Provides test data from the same source as the application
 * This ensures tests stay in sync with application data changes
 */

import { EndgamePosition } from '../../../shared/types/endgame';
import { positionService } from '../../../shared/services/database/positionService';

/**
 * Get training position data by ID
 * Uses the same data source as the application
 * Note: This is now async due to Firebase integration
 */
export async function getTestPosition(id: number): Promise<EndgamePosition> {
  const position = await positionService.getPosition(id);
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
 * Note: This is now async due to Firebase integration
 */
export async function getTestFen(id: number): Promise<string> {
  const position = await getTestPosition(id);
  return position.fen;
}

/**
 * Verify a position matches expected data
 * Returns true if position matches, throws descriptive error if not
 * Note: This is now async due to Firebase integration
 */
export async function verifyPosition(actualFen: string, expectedPositionId: number): Promise<boolean> {
  const expectedPosition = await getTestPosition(expectedPositionId);
  if (actualFen !== expectedPosition.fen) {
    throw new Error(
      `Position mismatch for position ${expectedPositionId} (${expectedPosition.title}):\n` +
      `Expected: ${expectedPosition.fen}\n` +
      `Actual:   ${actualFen}`
    );
  }
  return true;
}