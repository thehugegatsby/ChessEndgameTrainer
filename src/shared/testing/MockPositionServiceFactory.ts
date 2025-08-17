/**
 * Mock Position Service Factory for E2E Testing
 * Creates MockPositionRepository with pre-seeded test data
 * Completely bypasses Firebase for clean, fast, deterministic tests
 */

import { MockPositionRepository } from '@shared/repositories/implementations/MockPositionRepository';
import { PositionService as DefaultPositionService } from '@shared/services/database/PositionService';
import { type PositionService } from '@shared/services/database/IPositionService';
import type { EndgamePosition } from '@shared/types/endgame';
// NOTE: Using the Bridge-Trainer positions that were migrated from TestScenarios to ChessTestData
// We use the BRIDGE_* TEST_POSITIONS since they have the same structure as the original TestPositions
import { TEST_POSITIONS } from './ChessTestData';
import { getLogger } from '@shared/services/logging/Logger';

const logger = getLogger().setContext('MockPositionServiceFactory');

/**
 * Create a fully configured MockPositionService for E2E tests
 * Pre-seeded with TestPositions data for immediate test usage
 */
export function createMockPositionService(): PositionService {
  // Create mock repository
  const repository = new MockPositionRepository({
    enableCache: false, // Disable cache for deterministic tests
    events: {
      onDataFetched: (operation, count) => {
        // Silent logging for tests - only in debug mode
        if (process.env['DEBUG_MOCK_SERVICE']) {
          logger.debug(`[MockRepo] ${operation}: ${count} items`);
        }
      },
      onDataModified: (operation, ids) => {
        if (process.env['DEBUG_MOCK_SERVICE']) {
          logger.debug(`[MockRepo] ${operation}: ${ids.length} items`);
        }
      },
      onError: (operation, error) => {
        logger.error(`[MockRepo] ${operation} failed`, error);
      },
    },
  });

  // Create EndgamePosition objects for repository seeding from central test data
  // Using specific test positions that were migrated from original TestScenarios
  const testPositions: EndgamePosition[] = [
    {
      id: 1,
      title: 'Opposition Grundlagen',
      description: 'Opposition Grundlagen - Lerne das fundamentale Konzept der Opposition in Bauernendspielen',
      fen: TEST_POSITIONS.FIREBASE_OPPOSITION_BASIC,
      category: 'endgame',
      difficulty: 'beginner',
      targetMoves: 11,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'Verwende die Opposition um den gegnerischen König zu verdrängen',
        'Kf6 oder Kd6 sind gleichwertige Züge',
        'Der Bauer auf e5 entscheidet das Spiel',
      ],
      solution: ['Kf6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q', 'mate'],
    },
    {
      id: 2,
      title: 'König und Bauer vs König - Fortgeschritten',
      description: 'Fortgeschrittene K+B vs K Position - Opposition und Bauernumwandlung',
      fen: TEST_POSITIONS.FIREBASE_KPK_ADVANCED,
      category: 'endgame',
      difficulty: 'beginner',
      targetMoves: 10,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'Der Bauer muss zur Umwandlung gebracht werden',
        'König muss den Bauern unterstützen',
        'Opposition ist der Schlüssel zum Sieg',
      ],
      solution: [
        'Kd6', 'Ke8', 'd5', 'Kf7', 'Kd7', 'Kf6', 'd6', 'Kf7', 'Kd8', 'Kf8', 'd7+', 'Kf7', 'd8=Q',
      ],
    },
    {
      id: 9,
      title: 'Zickzack-Technik',
      description: 'König läuft im Zickzack nach vorne, Turm schützt von hinten',
      fen: TEST_POSITIONS.BRIDGE_ZICKZACK,
      category: 'endgame',
      difficulty: 'beginner',
      targetMoves: 8,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'König läuft im Zickzack nach vorne',
        'Turm schützt von hinten',
        'Kd7, Kc6, Kb5 sind die Schlüsselzüge',
      ],
      solution: ['Kd7', 'Kf8', 'Kc6', 'Ke7', 'Kb5', 'Kd6', 'Re6+', 'Kd5', 'c8=Q'],
    },
    {
      id: 10,
      title: 'Turm positionieren',
      description: 'Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen',
      fen: TEST_POSITIONS.BRIDGE_POSITIONING,
      category: 'endgame',
      difficulty: 'beginner',
      targetMoves: 10,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'Turm auf die 4. oder 5. Reihe positionieren',
        'Re4 oder Re5 sind gute Züge',
        'Dann normale Brückenbau-Technik anwenden',
      ],
      solution: ['Re4', 'Kd8', 'Kd7', 'Kc8', 'Kc6', 'Kd8', 'Kb5', 'Kc7', 'Re7+', 'Kd6', 'c8=Q'],
    },
    {
      id: 11,
      title: 'König abdrängen',
      description: 'König steht noch zentral - erst abdrängen, dann Brücke bauen',
      fen: TEST_POSITIONS.BRIDGE_DEFLECTION,
      category: 'endgame',
      difficulty: 'intermediate',
      targetMoves: 12,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'König mit einem Turmschach abdrängen',
        'Re1+ zwingt den König auf f8',
        'Dann Turm positionieren und Brücke bauen',
      ],
      solution: [
        'Re1+', 'Kf8', 'Re4', 'Kf7', 'Kd7', 'Kf8', 'Kc6', 'Ke7', 'Kb5', 'Kd6', 'Re6+', 'Kd5', 'c8=Q',
      ],
    },
  ];

  repository.seedData({
    positions: testPositions,
    categories: [], // Add test categories if needed
    chapters: [], // Add test chapters if needed
  });

  // Create service with mock repository
  const service = new DefaultPositionService(repository, {
    cacheEnabled: false, // Disable service-level cache for tests
    cacheSize: 0,
    cacheTTL: 0,
  });

  logger.info(`[MockPositionService] Initialized with ${testPositions.length} test positions`);

  return service;
}

/**
 * Create MockPositionRepository only (for direct repository testing)
 */
export function createMockPositionRepository(): MockPositionRepository {
  const repository = new MockPositionRepository();

  // Create EndgamePosition objects for repository seeding from central test data
  // Using the same positions as above - reuse the same array
  const testPositions: EndgamePosition[] = [
    {
      id: 1,
      title: 'Opposition Grundlagen',
      description: 'Opposition Grundlagen - Lerne das fundamentale Konzept der Opposition in Bauernendspielen',
      fen: TEST_POSITIONS.FIREBASE_OPPOSITION_BASIC,
      category: 'endgame',
      difficulty: 'beginner',
      targetMoves: 11,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'Verwende die Opposition um den gegnerischen König zu verdrängen',
        'Kf6 oder Kd6 sind gleichwertige Züge',
        'Der Bauer auf e5 entscheidet das Spiel',
      ],
      solution: ['Kf6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q', 'mate'],
    },
    {
      id: 2,
      title: 'König und Bauer vs König - Fortgeschritten',
      description: 'Fortgeschrittene K+B vs K Position - Opposition und Bauernumwandlung',
      fen: TEST_POSITIONS.FIREBASE_KPK_ADVANCED,
      category: 'endgame',
      difficulty: 'beginner',
      targetMoves: 10,
      sideToMove: 'white',
      goal: 'win',
      hints: [
        'Der Bauer muss zur Umwandlung gebracht werden',
        'König muss den Bauern unterstützen',
        'Opposition ist der Schlüssel zum Sieg',
      ],
      solution: [
        'Kd6', 'Ke8', 'd5', 'Kf7', 'Kd7', 'Kf6', 'd6', 'Kf7', 'Kd8', 'Kf8', 'd7+', 'Kf7', 'd8=Q',
      ],
    },
  ];

  repository.seedData({
    positions: testPositions,
  });

  return repository;
}

/**
 * E2E Test Environment Detection
 * Determines if we should use mock services
 */
export function shouldUseMockService(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  const nextPublicE2E = process.env['NEXT_PUBLIC_IS_E2E_TEST'];
  const isE2E = process.env['IS_E2E_TEST'];
  const useFirestore = process.env['NEXT_PUBLIC_USE_FIRESTORE'];

  // Debug logging for environment detection
  logger.debug('[MockServiceFactory] Environment check', {
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_IS_E2E_TEST: nextPublicE2E,
    IS_E2E_TEST: isE2E,
    NEXT_PUBLIC_USE_FIRESTORE: useFirestore,
    shouldUseMock:
      nodeEnv === 'test' ||
      nextPublicE2E === 'true' ||
      isE2E === 'true' ||
      useFirestore === 'false',
  });

  return (
    nodeEnv === 'test' || nextPublicE2E === 'true' || isE2E === 'true' || useFirestore === 'false'
  );
}
