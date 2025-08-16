/**
 * @file Training Scenarios - Real Firebase Positions
 * @description Central database of real training positions from Firebase with move sequences
 *
 * Use this for:
 * - E2E testing with real app positions
 * - Training sequence validation
 * - Move outcome testing (GEWINN, GEWINN_IN_VERLUST, REMIS)
 *
 * Only contains actual Firebase training positions that exist in the app
 */

/**
 * Move sequence for a training scenario
 */
export interface MoveSequence {
  /** Sequence identifier */
  id: string;
  /** Human readable description */
  description: string;
  /** Array of moves in algebraic notation */
  moves: string[];
  /** Expected final outcome */
  expectedOutcome: 'win' | 'draw' | 'loss';
  /** Expected mistakes during sequence */
  expectedMistakes?: number;
}

/**
 * Training scenario with real Firebase position
 */
export interface TrainScenario {
  /** Position ID from Firebase */
  id: number;
  /** Position title from Firebase */
  title: string;
  /** Position description */
  description: string;
  /** FEN position string */
  fen: string;
  /** Available move sequences for this position */
  sequences: Record<string, MoveSequence>;
}

/**
 * Real training positions from Firebase with move sequences
 */
export const TRAIN_SCENARIOS: Record<string, TrainScenario> = {
  /** Training Position 1: Opposition Grundlagen */
  TRAIN_1: {
    id: 1,
    title: 'Opposition Grundlagen',
    description: 'King + Pawn vs King - Opposition fundamentals',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',

    sequences: {
      WIN: {
        id: 'WIN',
        description: 'Optimal play - White wins with correct opposition',
        moves: ['Kd6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q+'],
        expectedOutcome: 'win',
        expectedMistakes: 0,
      },

      WIN_TO_DRAW_MOVE_1: {
        id: 'WIN_TO_DRAW_MOVE_1',
        description: 'Immediate blunder - Kd5 throws away the win',
        moves: ['Kd5'],
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },

      WIN_TO_DRAW_MOVE_2: {
        id: 'WIN_TO_DRAW_MOVE_2',
        description: 'Late blunder - good start then Kd5 mistake',
        moves: ['Kd6', 'Kd8', 'Kd5'],
        expectedOutcome: 'draw',
        expectedMistakes: 1, // Only the last move is mistake
      },

      PAWN_PROMOTION_TO_DRAW: {
        id: 'PAWN_PROMOTION_TO_DRAW',
        description: 'Suboptimal play leads to draw despite pawn promotion to queen',
        moves: ['Kd6', 'Kf7', 'Kc7', 'Kg6', 'e6', 'Kf6', 'e7', 'Kf7', 'e8=Q+'], // White allows black king to escape
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },
    },
  },

  /** Training Position 2: Advanced KPK */
  TRAIN_2: {
    id: 2,
    title: 'König und Bauer vs König - Fortgeschritten',
    description: 'Advanced K+P vs K position - White to win',
    fen: '8/3k4/8/4K3/3P4/8/8/8 w - - 0 1',

    sequences: {
      WIN: {
        id: 'WIN',
        description: 'Perfect technique - support pawn advance',
        moves: [
          'Kd5',
          'Ke7',
          'Kc6',
          'Ke8',
          'Kc7',
          'Ke7',
          'd5',
          'Kf6',
          'd6',
          'Ke6',
          'd7',
          'Ke7',
          'd8=D',
        ],
        expectedOutcome: 'win',
        expectedMistakes: 0,
      },

      WIN_TO_DRAW_MOVE_1: {
        id: 'WIN_TO_DRAW_MOVE_1',
        description: 'Immediate blunder - premature pawn advance d5',
        moves: ['d5'], // Only the blunder move
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },

      WIN_TO_DRAW_MOVE_2: {
        id: 'WIN_TO_DRAW_MOVE_2',
        description: 'Good start then blunder - Kc4 throws away the win',
        moves: ['Kd5', 'Ke7', 'Kc4'], // Good start then blunder
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },

      BLACK_FINDS_BEST_DEFENSE: {
        id: 'BLACK_FINDS_BEST_DEFENSE',
        description: 'Black plays best defense - Ke8 gives DTM 25 vs DTM 23',
        moves: ['Kd5', 'Ke7', 'Kc6', 'Ke8'], // White Kd5, Black Ke7, White Kc6, Black best defense Ke8 (DTM 25)
        expectedOutcome: 'win', // Still win for white but longest resistance
        expectedMistakes: 0,
      },
    },
  },
};

/**
 * Get training scenario by position ID
 *
 * @param positionId - Firebase position ID (1, 2, etc.)
 * @returns Training scenario or null if not found
 */
export function getTrainScenario(positionId: number): TrainScenario | null {
  const scenario = Object.values(TRAIN_SCENARIOS).find(s => s.id === positionId);
  return scenario || null;
}

/**
 * Get all available training position IDs
 *
 * @returns Array of available position IDs
 */
export function getAvailableTrainPositions(): number[] {
  return Object.values(TRAIN_SCENARIOS)
    .map(s => s.id)
    .sort((a, b) => a - b);
}

/**
 * Get move sequence by position ID and sequence type
 *
 * @param positionId - Firebase position ID
 * @param sequenceType - Sequence identifier (GEWINN, GEWINN_IN_VERLUST, etc.)
 * @returns Move sequence or null if not found
 */
export function getMoveSequence(positionId: number, sequenceType: string): MoveSequence | null {
  const scenario = getTrainScenario(positionId);
  if (!scenario || !scenario.sequences[sequenceType]) {
    return null;
  }
  return scenario.sequences[sequenceType];
}

/**
 * Helper function for E2E tests - get URL with move sequence
 *
 * @param positionId - Training position ID
 * @param sequenceType - Move sequence type
 * @returns URL string for E2E testing
 *
 * @example
 * ```typescript
 * const url = getE2EUrl(1, 'GEWINN');
 * // Returns: '/train/1?moves=Kd6,Kf8,e6,Ke8,e7,Kd7,Kf7,Kd6,e8=Q+'
 * ```
 */
export function getE2EUrl(positionId: number, sequenceType: string): string {
  const sequence = getMoveSequence(positionId, sequenceType);
  if (!sequence) {
    throw new Error(`Sequence not found: position ${positionId}, type ${sequenceType}`);
  }

  const movesParam = sequence.moves.join(',');
  return `/train/${positionId}?moves=${movesParam}`;
}
