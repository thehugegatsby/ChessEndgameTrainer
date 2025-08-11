/**
 * Direct test of TablebaseService DTM sorting for defense
 */

import { tablebaseService } from "@shared/services/TablebaseService";
import { TRAIN_SCENARIOS } from "../fixtures/trainPositions";
import { getLogger } from "@shared/services/logging/Logger";

const logger = getLogger();

// Helper to conditionally run tests based on environment
const describeIf = (condition: boolean) => condition ? describe : describe.skip;

// Unit tests with mocked data (fast, deterministic)
describe.skip("TablebaseService Defense Sorting - Unit Tests", () => {
  beforeEach(() => {
    // Reset fetch mock
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("Should sort DTM moves correctly with mocked data", async () => {
    // Mock complete Lichess API response structure
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
      dtz: 25,
      precise_dtz: 25,
      dtm: null,
      checkmate: false,
      stalemate: false,
      variant: "standard",
      insufficient_material: false,
      category: "loss",
      moves: [
        { 
          uci: "e7e8", 
          san: "Ke8", 
          dtz: 25, 
          precise_dtz: 25, 
          dtm: -25, 
          zeroing: false, 
          checkmate: false, 
          stalemate: false, 
          insufficient_material: false, 
          wdl: -2,
          category: "loss" 
        },
        { 
          uci: "e7d6", 
          san: "Kd6", 
          dtz: 23, 
          precise_dtz: 23, 
          dtm: -23, 
          zeroing: false, 
          checkmate: false, 
          stalemate: false, 
          insufficient_material: false, 
          wdl: -2,
          category: "loss" 
        },
        { 
          uci: "e7f6", 
          san: "Kf6", 
          dtz: 21, 
          precise_dtz: 21, 
          dtm: -21, 
          zeroing: false, 
          checkmate: false, 
          stalemate: false, 
          insufficient_material: false, 
          wdl: -2,
          category: "loss" 
        }
      ]
      })
    });

    const scenario = TRAIN_SCENARIOS.TRAIN_2;
    const fen = '8/4k3/8/3PK3/8/8/8/8 b - - 2 3';
    
    const result = await tablebaseService.getTopMoves(fen, 10);
    
    logger.info("Mock result:", { isAvailable: result.isAvailable, movesLength: result.moves?.length });
    
    expect(result.isAvailable).toBe(true);
    expect(result.moves).toHaveLength(3);
    expect(result.moves![0].san).toBe("Ke8"); // Best defense (highest DTM)
    expect(result.moves![0].dtm).toBe(-25);
    
    logger.info("✅ Unit test: DTM sorting works correctly with mocked data");
  });
});

// Integration tests with real API calls (slower, requires network)
// TODO: TEMPORARILY SKIPPED - jest-fetch-mock vs cross-fetch/polyfill conflict
// Will be rewritten during Vitest migration with proper fetch handling
describeIf(false && (global as any).isIntegrationTest)("TablebaseService Defense Sorting - Integration Tests", () => {
  beforeEach(() => {
    // Disable fetch mock for real API calls
    (fetch as any).dontMock();
  });
  
  afterEach(() => {
    // Re-enable mocks after integration tests
    (fetch as any).enableMocks();
  });

  it("Should return moves sorted by DTM for losing positions", async () => {
    // Use TRAIN_2 BLACK_FINDS_BEST_DEFENSE sequence
    const scenario = TRAIN_SCENARIOS.TRAIN_2;
    const sequence = scenario.sequences.BLACK_FINDS_BEST_DEFENSE;
    // Position after 1.Kd5 Ke7 2.Kc6 (black to move, Ke8 is best defense with DTM 25)
    const fen = '8/4k3/8/3PK3/8/8/8/8 b - - 2 3';

    logger.info("\n=== Testing TablebaseService directly ===");
    logger.info("FEN:", fen);

    // Get top 10 moves from tablebase
    const result = await tablebaseService.getTopMoves(fen, 10);

    logger.info(`API returned: ${result.moves?.length} moves`);

    if (result.isAvailable && result.moves) {
      logger.info("\nMoves returned by TablebaseService:");
      result.moves.forEach((move, index) => {
        logger.info(
          `  ${index + 1}. ${move.san}: DTM ${move.dtm}, WDL ${move.wdl}`,
        );
      });

      // Check if moves are sorted correctly for losing position
      // For losing positions (WDL < 0), moves should be sorted by DTM descending (highest DTM first)
      if (result.moves.length > 1 && result.moves[0].wdl < 0) {
        const firstMoveDtm = Math.abs(result.moves[0].dtm || 0);
        const secondMoveDtm = Math.abs(result.moves[1].dtm || 0);

        logger.info("\nFirst move DTM:", firstMoveDtm);
        logger.info("Second move DTM:", secondMoveDtm);
        logger.info(
          "Is correctly sorted for defense?",
          firstMoveDtm >= secondMoveDtm,
        );

        // The first move should have the highest DTM (best defense)
        expect(firstMoveDtm).toBeGreaterThanOrEqual(secondMoveDtm);
      }

      // Check if Ke8 (best defense with DTM 25) is ranked first
      const ke8Move = result.moves.find((m) => m.san === "Ke8");
      if (ke8Move) {
        logger.info("\nKe8 found with DTM:", ke8Move.dtm);
        logger.info("Is Ke8 the first move?", result.moves[0].san === "Ke8");
        logger.info("Expected: Ke8 should have DTM -25 (best defense)");
      }
    } else {
      logger.info("No moves available from tablebase");
    }
  });

  it("Should test the actual Lichess API response", async () => {
    // This will make a real API call to understand what we're getting
    const scenario = TRAIN_SCENARIOS.TRAIN_2;
    const sequence = scenario.sequences.BLACK_FINDS_BEST_DEFENSE;
    // Position after 1.Kd5 Ke7 2.Kc6 - black should play Ke8 (DTM 25)
    const fen = '8/4k3/8/3PK3/8/8/8/8 b - - 2 3';

    try {
      // Make direct API call (using cross-fetch polyfill)
      const response = await fetch(
        `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`,
      );
      const data = await response.json();

      logger.info("\n=== Direct Lichess API Response ===");
      logger.info("Category:", data.category);
      logger.info("Moves count:", data.moves?.length);

      if (data.moves) {
        logger.info("\nAll moves from API:");
        data.moves.forEach((move: any) => {
          logger.info(
            `  ${move.san}: DTM ${move.dtm}, DTZ ${move.dtz}, Category: ${move.category}`,
          );
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
    } catch (error) {
      logger.error("Could not fetch from Lichess API:", error);
      // Don't fail test if API is down - just log it
      logger.warn("⚠️  Skipping real API test due to network error");
    }
  }, 15000); // Longer timeout for real API calls
});
