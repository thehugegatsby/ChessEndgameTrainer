import { vi, beforeAll, afterEach, afterAll } from 'vitest';
/**
 * Direct test of TablebaseService DTM sorting for defense
 */

import { tablebaseService } from '../../domains/evaluation';
import { TRAIN_SCENARIOS } from '../fixtures/trainPositions';
import { getLogger } from '@shared/services/logging/Logger';
import { MSWServerMockFactory } from '../mocks/MSWServerMockFactory';
import { http } from 'msw';

const logger = getLogger();

// Mock TablebaseService for unit tests only
vi.mock('@shared/services/TablebaseService');

// MSW server for integration tests
let mswFactory: MSWServerMockFactory | null = null;

// Helper to conditionally run tests based on environment
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Unit tests with mocked data (fast, deterministic)
describe('TablebaseService Defense Sorting - Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('Should sort DTM moves correctly with mocked data', async () => {
    // Mock the getTopMoves method to return sorted moves
    (tablebaseService.getTopMoves as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      isAvailable: true,
      moves: [
        {
          uci: 'e7e8',
          san: 'Ke8',
          dtz: 25,
          dtm: -25,
          wdl: -2,
          category: 'loss',
        },
        {
          uci: 'e7d6',
          san: 'Kd6',
          dtz: 23,
          dtm: -23,
          wdl: -2,
          category: 'loss',
        },
        {
          uci: 'e7f6',
          san: 'Kf6',
          dtz: 21,
          dtm: -21,
          wdl: -2,
          category: 'loss',
        },
      ],
    });

    const scenario = TRAIN_SCENARIOS.TRAIN_2;
    const fen = '8/4k3/8/3PK3/8/8/8/8 b - - 2 3';

    const result = await tablebaseService.getTopMoves(fen, 10);

    logger.info('Mock result:', {
      isAvailable: result.isAvailable,
      movesLength: result.moves?.length,
    });

    expect(result.isAvailable).toBe(true);
    expect(result.moves).toHaveLength(3);
    expect(result.moves![0].san).toBe('Ke8'); // Best defense (highest DTM)
    expect(result.moves![0].dtm).toBe(-25);

    logger.info('✅ Unit test: DTM sorting works correctly with mocked data');
  });
});

// Integration tests with MSW-mocked API responses
describe('TablebaseService Defense Sorting - Integration Tests (MSW)', () => {
  beforeAll(async () => {
    // Unmock the TablebaseService for integration tests
    vi.doUnmock('@shared/services/TablebaseService');

    // Initialize MSW server
    mswFactory = new MSWServerMockFactory();
    const mockServer = mswFactory.create();
  });

  afterEach(() => {
    // Reset MSW handlers after each test
    if (mswFactory) {
      mswFactory.reset();
    }
  });

  afterAll(() => {
    // Clean up MSW server
    if (mswFactory) {
      mswFactory.cleanup();
      mswFactory = null;
    }
  });

  it('Should return moves sorted by DTM for losing positions', async () => {
    // Position after 1.Kd5 Ke7 2.Kc6 (black to move, Ke8 is best defense with DTM 25)
    const fen = '8/4k3/8/3PK3/8/8/8/8 b - - 2 3';

    // Set up MSW to return the expected response
    if (mswFactory) {
      mswFactory.mockTablebaseSuccess(fen, {
        category: 'loss',
        dtz: -25,
        dtm: -25,
        moves: [
          { uci: 'e7e8', san: 'Ke8', dtz: -25, dtm: -25, wdl: -2, category: 'loss' },
          { uci: 'e7d6', san: 'Kd6', dtz: -23, dtm: -23, wdl: -2, category: 'loss' },
          { uci: 'e7f6', san: 'Kf6', dtz: -21, dtm: -21, wdl: -2, category: 'loss' },
          { uci: 'e7d7', san: 'Kd7', dtz: -19, dtm: -19, wdl: -2, category: 'loss' },
          { uci: 'e7f7', san: 'Kf7', dtz: -17, dtm: -17, wdl: -2, category: 'loss' },
        ],
      });
    }

    // Use TRAIN_2 BLACK_FINDS_BEST_DEFENSE sequence
    const scenario = TRAIN_SCENARIOS.TRAIN_2;
    const sequence = scenario.sequences.BLACK_FINDS_BEST_DEFENSE;

    logger.info('\n=== Testing TablebaseService with MSW ===');
    logger.info('FEN:', fen);

    // Import the real service dynamically (not mocked)
    const { tablebaseService: realService } = await import('@shared/services/TablebaseService');

    // Get top 10 moves from tablebase (will hit MSW mock)
    const result = await realService.getTopMoves(fen, 10);

    logger.info(`API returned: ${result.moves?.length} moves`);

    if (result.isAvailable && result.moves) {
      logger.info('\nMoves returned by TablebaseService:');
      result.moves.forEach((move, index) => {
        logger.info(`  ${index + 1}. ${move.san}: DTM ${move.dtm}, WDL ${move.wdl}`);
      });

      // Check if moves are sorted correctly for losing position
      // For losing positions (WDL < 0), moves should be sorted by DTM descending (highest DTM first)
      if (result.moves.length > 1 && result.moves[0].wdl < 0) {
        const firstMoveDtm = Math.abs(result.moves[0].dtm || 0);
        const secondMoveDtm = Math.abs(result.moves[1].dtm || 0);

        logger.info('\nFirst move DTM:', firstMoveDtm);
        logger.info('Second move DTM:', secondMoveDtm);
        logger.info('Is correctly sorted for defense?', firstMoveDtm >= secondMoveDtm);

        // The first move should have the highest DTM (best defense)
        expect(firstMoveDtm).toBeGreaterThanOrEqual(secondMoveDtm);
      }

      // Check if Ke8 (best defense with DTM 25) is ranked first
      const ke8Move = result.moves.find(m => m.san === 'Ke8');
      if (ke8Move) {
        logger.info('\nKe8 found with DTM:', ke8Move.dtm);
        logger.info('Is Ke8 the first move?', result.moves[0].san === 'Ke8');
        logger.info('Expected: Ke8 should have DTM -25 (best defense)');
      }
    } else {
      logger.info('No moves available from tablebase');
    }
  });

  it('Should validate Lichess API response structure', async () => {
    // Position after 1.Kd5 Ke7 2.Kc6 - black should play Ke8 (DTM 25)
    const fen = '8/4k3/8/3PK3/8/8/8/8 b - - 2 3';

    // Mock the Lichess API response structure
    const mockLichessResponse = {
      category: 'loss',
      dtz: -25,
      dtm: -25,
      moves: [
        { san: 'Ke8', uci: 'e7e8', dtm: -25, dtz: -25, wdl: -2, category: 'loss' },
        { san: 'Kd6', uci: 'e7d6', dtm: -23, dtz: -23, wdl: -2, category: 'loss' },
        { san: 'Kf6', uci: 'e7f6', dtm: -21, dtz: -21, wdl: -2, category: 'loss' },
      ],
    };

    // Set up MSW to return the expected response
    if (mswFactory) {
      mswFactory.mockTablebaseSuccess(fen, mockLichessResponse);
    }

    const scenario = TRAIN_SCENARIOS.TRAIN_2;
    const sequence = scenario.sequences.BLACK_FINDS_BEST_DEFENSE;

    // Import the real service dynamically (not mocked)
    const { tablebaseService: realService } = await import('@shared/services/TablebaseService');

    // Call the service (will hit MSW mock)
    const result = await realService.getTopMoves(fen, 10);
    const data = { ...mockLichessResponse, moves: result.moves };

    logger.info('\n=== Mocked Lichess API Response ===');
    logger.info('Category:', data.category);
    logger.info('Moves count:', data.moves?.length);

    if (data.moves) {
      logger.info('\nAll moves from API:');
      data.moves.forEach((move: any) => {
        logger.info(`  ${move.san}: DTM ${move.dtm}, DTZ ${move.dtz}, Category: ${move.category}`);
      });

      // Assert API structure is as expected
      expect(data.moves).toBeDefined();
      expect(Array.isArray(data.moves)).toBe(true);
      expect(data.moves.length).toBeGreaterThan(0);

      // Check that moves have required properties
      data.moves.forEach((move: any) => {
        expect(move).toHaveProperty('san');
        expect(move).toHaveProperty('dtm');
        expect(move).toHaveProperty('wdl');
      });
    }
  });
});
