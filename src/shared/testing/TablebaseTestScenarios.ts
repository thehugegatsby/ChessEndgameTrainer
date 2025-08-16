/**
 * @file Tablebase Test Scenarios for Move Ranking Validation
 * @module testing/TablebaseTestScenarios
 *
 * @description
 * Provides comprehensive test scenarios for validating the hierarchical
 * tablebase move ranking system (WDL → DTZ → DTM). Contains real positions
 * with verified Lichess API data for testing ranking logic.
 *
 * @remarks
 * Key features:
 * - User-provided FEN positions (no auto-generated positions)
 * - Verified tablebase values from Lichess API
 * - Hierarchical ranking test coverage
 * - Support for edge cases (cursed-win, blessed-loss, null DTM)
 * - Defensive strategy validation
 *
 * All positions and values are manually curated and validated for correctness.
 */

/**
 * Represents the tablebase data for a single possible move
 */
export interface TablebaseMoveData {
  /** The move in Universal Chess Interface (UCI) format (e.g., "e2e4") */
  uci: string;

  /** The move in Standard Algebraic Notation (SAN) for readability (e.g., "e4") */
  san: string;

  /** Win/Draw/Loss score. 2=Win, 1=Cursed-Win, 0=Draw, -1=Blessed-Loss, -2=Loss */
  wdl: number;

  /** Distance to Zeroing move (50-move rule). Lower absolute value is better for winning positions */
  dtz: number;

  /** Distance to Mate. Lower absolute value is better. Can be null if no mate is found */
  dtm: number | null;

  /** Tablebase category for validation */
  category?: 'win' | 'loss' | 'draw' | 'cursed-win' | 'blessed-loss';
}

/**
 * Defines a complete test scenario for tablebase move ranking
 */
export interface TablebaseRankingScenario {
  /** A short description of what this scenario is testing */
  description: string;

  /** The starting FEN position for the scenario */
  fen: string;

  /** Test category for grouping */
  category: 'wdl' | 'dtz' | 'dtm' | 'defensive' | 'edge';

  /** An array of possible moves from the FEN with their tablebase data */
  moves: TablebaseMoveData[];

  /**
   * The expected ranking of moves, ordered from best to worst.
   * Stored as an array of UCI strings for easy comparison in tests.
   */
  expectedRanking: string[];

  /** Optional notes about the test scenario */
  notes?: string;
}

/**
 * Central collection of tablebase ranking test scenarios
 *
 * @description
 * All scenarios are manually curated with real FEN positions and verified
 * tablebase values. Each scenario tests a specific aspect of the hierarchical
 * ranking system (WDL → DTZ → DTM).
 */
export const TablebaseTestScenarios: Record<string, TablebaseRankingScenario> = {
  // WDL Priority Test - Tests that WDL has the highest priority
  ROOK_ENDGAME_WDL_PRIORITY: {
    description: 'Tests WDL priority: Win > Draw > Loss regardless of DTZ/DTM',
    fen: '8/8/1P3k2/6r1/8/3K4/4R3/8 w - - 0 1',
    category: 'wdl',
    moves: [
      {
        uci: 'e2b2',
        san: 'Rb2',
        wdl: 2,
        dtz: 8,
        dtm: 42,
        category: 'win'
      },
      {
        uci: 'e2e1',
        san: 'Re1',
        wdl: 0,
        dtz: 0,
        dtm: null,
        category: 'draw'
      },
      {
        uci: 'e2e6',
        san: 'Re6+',
        wdl: -2,
        dtz: -1,
        dtm: -33,
        category: 'loss'
      }
    ],
    expectedRanking: ['e2b2', 'e2e1', 'e2e6'],
    notes: 'Verified with Lichess API 2025-08-16. Position is winning for White.'
  },

  // DTM vs DTZ Priority Test - Training optimization over 50-move rule safety
  DTM_PRIORITY_CONFLICT: {
    description: 'Tests DTM priority over DTZ: Training chooses faster mate over 50-move safety',
    fen: '5k2/2P5/1K6/8/8/2r5/8/4R3 w - - 6 4',
    category: 'dtm',
    moves: [
      {
        uci: 'e1b1',
        san: 'Rb1',
        wdl: 2,
        dtz: 4,
        dtm: 38,
        category: 'win'
      },
      {
        uci: 'e1e5',
        san: 'Re5',
        wdl: 2,
        dtz: 6,
        dtm: 20,
        category: 'win'
      }
    ],
    expectedRanking: ['e1e5', 'e1b1'],
    notes: 'DTZ hierarchy would prefer Rb1 (DTZ=4), but DTM hierarchy prefers Re5 (DTM=20) for faster, more instructive mate. Verified with Lichess API 2025-08-16.'
  },

  // DTM Tiebreaker Test - Same WDL and DTZ, different DTM
  DTM_TIEBREAKER_SAME_DTZ: {
    description: 'Tests DTM as tiebreaker when WDL and DTZ are equal',
    fen: '5k2/2P5/1K6/8/8/2r5/8/4R3 w - - 0 1',
    category: 'dtm',
    moves: [
      {
        uci: 'e1e6',
        san: 'Te6',
        wdl: 2,
        dtz: 8,
        dtm: 24,
        category: 'win'
      },
      {
        uci: 'e1h1',
        san: 'Th1',
        wdl: 2,
        dtz: 8,
        dtm: 36,
        category: 'win'
      }
    ],
    expectedRanking: ['e1e6', 'e1h1'],
    notes: 'Both moves win with same DTZ=8, but Te6 has better DTM=24 vs Th1 DTM=36. Tests DTM priority in training hierarchy. Verified with user data 2025-08-16.'
  },

  // Defensive Strategy Test - All moves lose, prefer slowest loss
  DEFENSIVE_STRATEGY_LOSING_POSITION: {
    description: 'Tests defensive strategy: When all moves lose, prefer slowest loss (highest DTM)',
    fen: '8/8/4k3/8/3K4/2N5/6q1/8 w - - 0 1',
    category: 'defensive',
    moves: [
      {
        uci: 'c3e4',
        san: 'Ne4',
        wdl: -2,
        dtz: -21,
        dtm: -25,
        category: 'loss'
      },
      {
        uci: 'd4e3',
        san: 'Ke3',
        wdl: -2,
        dtz: -21,
        dtm: -25,
        category: 'loss'
      },
      {
        uci: 'd4d3',
        san: 'Kd3',
        wdl: -2,
        dtz: -19,
        dtm: -23,
        category: 'loss'
      },
      {
        uci: 'c3b5',
        san: 'Nb5',
        wdl: -2,
        dtz: -3,
        dtm: -17,
        category: 'loss'
      },
      {
        uci: 'c3d1',
        san: 'Nd1',
        wdl: -2,
        dtz: -3,
        dtm: -13,
        category: 'loss'
      }
    ],
    expectedRanking: ['c3e4', 'd4e3', 'd4d3', 'c3b5', 'c3d1'],
    notes: 'White is losing but should prefer moves with highest DTM (longest resistance). Ne4/Ke3 both DTM=-25 (best), Nd1 DTM=-13 (worst). Tests defensive hierarchy: higher absolute DTM is better when losing. Verified with Lichess API 2025-08-16.'
  },

  // Placeholder for Edge Cases
  EDGE_CASES_PLACEHOLDER: {
    description: 'Tests edge cases: null DTM, cursed-win, blessed-loss handling',
    fen: 'PLACEHOLDER - User will provide',
    category: 'edge',
    moves: [
      // User will provide moves with edge case scenarios
    ],
    expectedRanking: [],
    notes: 'Awaiting user-provided FEN and move data'
  }
};

/**
 * Get scenarios by category for targeted testing
 */
export function getScenariosByCategory(category: TablebaseRankingScenario['category']): TablebaseRankingScenario[] {
  return Object.values(TablebaseTestScenarios).filter(scenario => scenario.category === category);
}

/**
 * Get a scenario by its key
 */
export function getScenarioByKey(key: keyof typeof TablebaseTestScenarios): TablebaseRankingScenario | null {
  return TablebaseTestScenarios[key] || null;
}

/**
 * Get all valid (non-placeholder) scenarios for testing
 */
export function getValidScenarios(): Record<string, TablebaseRankingScenario> {
  const validScenarios: Record<string, TablebaseRankingScenario> = {};
  
  for (const [key, scenario] of Object.entries(TablebaseTestScenarios)) {
    // Skip placeholder scenarios
    if (!scenario.fen.includes('PLACEHOLDER') && scenario.moves.length > 0) {
      validScenarios[key] = scenario;
    }
  }
  
  return validScenarios;
}

/**
 * Reverse lookup map for FEN to scenario mapping
 */
export const FenToScenarioMap = new Map<string, TablebaseRankingScenario>(
  Object.values(TablebaseTestScenarios)
    .filter(scenario => !scenario.fen.includes('PLACEHOLDER'))
    .map(scenario => [scenario.fen, scenario])
);