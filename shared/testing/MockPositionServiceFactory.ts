/**
 * Mock Position Service Factory for E2E Testing
 * Creates MockPositionRepository with pre-seeded test data
 * Completely bypasses Firebase for clean, fast, deterministic tests
 */

import { MockPositionRepository } from '@shared/repositories/implementations/MockPositionRepository';
import { PositionService } from '@shared/services/database/PositionService';
import { IPositionService } from '@shared/services/database/IPositionService';
import { TestPositions } from './TestScenarios';
import type { EndgamePosition } from '@shared/types/endgame';

/**
 * Create a fully configured MockPositionService for E2E tests
 * Pre-seeded with TestPositions data for immediate test usage
 */
export function createMockPositionService(): IPositionService {
  // Create mock repository
  const repository = new MockPositionRepository({
    enableCache: false, // Disable cache for deterministic tests
    events: {
      onDataFetched: (operation, count) => {
        // Silent logging for tests - only in debug mode
        if (process.env.DEBUG_MOCK_SERVICE) {
          console.log(`[MockRepo] ${operation}: ${count} items`);
        }
      },
      onDataModified: (operation, ids) => {
        if (process.env.DEBUG_MOCK_SERVICE) {
          console.log(`[MockRepo] ${operation}: ${ids.length} items`);
        }
      },
      onError: (operation, error) => {
        console.error(`[MockRepo] ${operation} failed:`, error);
      }
    }
  });

  // Convert TestScenario to EndgamePosition for repository seeding
  const testPositions: EndgamePosition[] = Object.values(TestPositions).map(scenario => ({
    id: parseInt(scenario.id), // Convert string ID back to number for EndgamePosition
    title: scenario.title,
    description: scenario.description,
    fen: scenario.fen,
    category: scenario.category,
    difficulty: scenario.difficulty,
    targetMoves: scenario.targetMoves,
    hints: scenario.hints,
    solution: scenario.solution,
    sideToMove: scenario.sideToMove,
    goal: scenario.goal,
    nextPositionId: scenario.nextPositionId
    // Note: Test-specific fields (initialExpectedMove, expectsDrawEvaluation) are NOT included
  }));

  repository.seedData({
    positions: testPositions,
    categories: [], // Add test categories if needed
    chapters: []   // Add test chapters if needed
  });

  // Create service with mock repository
  const service = new PositionService(repository, {
    cacheEnabled: false, // Disable service-level cache for tests
    cacheSize: 0,
    cacheTTL: 0
  });

  console.log(`[MockPositionService] Initialized with ${testPositions.length} test positions`);
  
  return service;
}

/**
 * Create MockPositionRepository only (for direct repository testing)
 */
export function createMockPositionRepository(): MockPositionRepository {
  const repository = new MockPositionRepository();
  
  // Convert TestScenario to EndgamePosition and pre-seed
  const testPositions: EndgamePosition[] = Object.values(TestPositions).map(scenario => ({
    id: parseInt(scenario.id),
    title: scenario.title,
    description: scenario.description,
    fen: scenario.fen,
    category: scenario.category,
    difficulty: scenario.difficulty,
    targetMoves: scenario.targetMoves,
    hints: scenario.hints,
    solution: scenario.solution,
    sideToMove: scenario.sideToMove,
    goal: scenario.goal,
    nextPositionId: scenario.nextPositionId
  }));

  repository.seedData({
    positions: testPositions
  });
  
  return repository;
}

/**
 * E2E Test Environment Detection
 * Determines if we should use mock services
 */
export function shouldUseMockService(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true' ||
    process.env.IS_E2E_TEST === 'true'
  );
}