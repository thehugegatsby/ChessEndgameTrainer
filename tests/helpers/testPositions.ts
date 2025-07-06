/**
 * @fileoverview Standard chess positions for unit testing
 * @description Collection of well-known chess positions for consistent testing
 */

export const TEST_POSITIONS: Record<string, string> = {
  // Standard starting position
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  
  // Tablebase positions (≤7 pieces)
  KQK_TABLEBASE_WIN: '8/8/8/8/8/8/4K3/k6Q w - - 0 1', // Queen vs King - forced win
  KRK_TABLEBASE_DRAW: '8/8/8/8/8/8/4K3/k6R w - - 50 100', // Rook vs King near 50-move rule
  KPK_WINNING: '8/8/8/8/8/4K3/4P3/4k3 w - - 0 1', // King and Pawn vs King - winning
  KPK_DRAWING: '8/8/8/8/8/8/4PK2/4k3 w - - 0 1', // King and Pawn vs King - drawing
  
  // Complex endgame positions
  ROOK_ENDGAME: '8/8/1K6/8/8/8/2k5/4R3 w - - 0 1', // Rook endgame technique
  QUEEN_ENDGAME: '8/8/8/8/8/2q5/4K3/4k3 w - - 0 1', // Queen vs King
  
  // Positions with different evaluation characteristics
  EQUAL_POSITION: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  WHITE_ADVANTAGE: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
  BLACK_ADVANTAGE: 'rnbqkbnr/ppp2ppp/8/3pp3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
  
  // Edge cases and error testing
  INVALID_FEN: 'invalid fen string',
  EMPTY_FEN: '',
  MALFORMED_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR X KQkq - 0 1', // Invalid turn
  
  // Specific training positions
  BRUCKENBAU_POSITION: '6k1/6p1/6K1/8/8/8/8/6Q1 w - - 0 1', // Bridge building technique
  LUCENA_POSITION: '1K6/1P6/8/8/8/8/2r5/2k5 w - - 0 1', // Famous rook endgame
  PHILIDOR_POSITION: '4k3/8/4K3/4P3/8/8/1r6/1R6 b - - 0 1', // Philidor defense
} as const;

export const TEST_MOVES = {
  // Legal moves from starting position
  E2E4: { from: 'e2', to: 'e4' },
  D2D4: { from: 'd2', to: 'd4' },
  NG1F3: { from: 'g1', to: 'f3' },
  
  // Illegal moves
  ILLEGAL_MOVE: { from: 'e2', to: 'e5' }, // Can't jump over pieces
  INVALID_SQUARE: { from: 'z9', to: 'a1' },
  
  // Promotion moves - White pawn promoting
  PROMOTION_QUEEN: { from: 'e7', to: 'e8', promotion: 'q' as const },
  PROMOTION_ROOK: { from: 'e7', to: 'e8', promotion: 'r' as const },
  // Black pawn promoting
  BLACK_PROMOTION_QUEEN: { from: 'e2', to: 'e1', promotion: 'q' as const },
} as const;

/**
 * Expected evaluations for test positions
 * Used to verify evaluation correctness
 */
export const EXPECTED_EVALUATIONS = {
  [TEST_POSITIONS.STARTING_POSITION]: {
    score: 0, // Approximately equal
    mate: null,
    description: 'Starting position should be roughly equal'
  },
  [TEST_POSITIONS.KQK_TABLEBASE_WIN]: {
    scoreRange: [2000, 10000], // Strong winning advantage
    mate: { min: 1, max: 10 },
    description: 'Queen vs King is a forced mate'
  },
  [TEST_POSITIONS.EQUAL_POSITION]: {
    scoreRange: [-50, 50], // Roughly equal
    mate: null,
    description: 'Should be approximately equal'
  }
} as const;

/**
 * Utility function to get position by key
 */
export function getTestPosition(key: keyof typeof TEST_POSITIONS): string {
  return TEST_POSITIONS[key];
}

/**
 * Utility function to validate if a FEN is from our test set
 */
export function isTestPosition(fen: string): boolean {
  return Object.values(TEST_POSITIONS).includes(fen as any);
}

/**
 * Get all tablebase positions (≤7 pieces)
 */
export function getTablebasePositions(): string[] {
  return [
    TEST_POSITIONS.KQK_TABLEBASE_WIN,
    TEST_POSITIONS.KRK_TABLEBASE_DRAW,
    TEST_POSITIONS.KPK_WINNING,
    TEST_POSITIONS.KPK_DRAWING,
    TEST_POSITIONS.ROOK_ENDGAME,
    TEST_POSITIONS.QUEEN_ENDGAME
  ];
}

/**
 * Get positions that should trigger engine evaluation errors
 */
export function getInvalidPositions(): string[] {
  return [
    TEST_POSITIONS.INVALID_FEN,
    TEST_POSITIONS.EMPTY_FEN,
    TEST_POSITIONS.MALFORMED_FEN
  ];
}// CI test 1751837601
