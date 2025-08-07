/**
 * Central FEN position store for all tests
 * 
 * This file contains all FEN positions used across the test suite.
 * Using a central store ensures consistency, reduces duplication,
 * and makes it easier to maintain and discover test positions.
 */

/**
 * Standard chess positions
 */
export const StandardPositions = {
  /** Initial chess position */
  STARTING: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  
  /** After 1.e4 */
  AFTER_E4: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  
  /** After 1.e4 e5 */
  AFTER_E4_E5: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
  
  /** After 1.e4 e5 2.Nf3 */
  AFTER_E4_E5_NF3: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  
  /** Position with castling rights */
  CASTLING_AVAILABLE: "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
  
  /** En passant possible */
  EN_PASSANT: "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3",
  
  /** En passant with pawn on d5 and c5 */
  EN_PASSANT_COMPLEX: "8/8/8/2pP4/8/8/8/4K2k w - c6 0 1",
} as const;

/**
 * Basic endgame positions
 */
export const EndgamePositions = {
  /** King vs King - theoretical draw */
  KK_DRAW: "4k3/8/4K3/8/8/8/8/8 w - - 0 1",
  
  /** King vs King (alternative) */
  KK_DRAW_ALT: "8/8/8/8/8/8/8/K3k3 w - - 0 1",
  
  /** King and Pawn vs King - winning for white */
  KPK_WIN: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
  
  /** King and Pawn vs King - central pawn */
  KPK_CENTRAL: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
  
  /** King and Pawn vs King - various positions */
  KPK_VARIANTS: {
    SIDE_PAWN: "8/8/8/8/8/8/P7/K2k4 w - - 0 1",
    CENTER_ADVANCED: "8/2k5/8/2K5/2P5/8/8/8 w - - 0 1",
    ENDGAME_PAWN: "8/8/8/8/8/8/P7/K3k3 w - - 0 1",
    DRAW_POSITION: "8/8/8/3k4/8/2KP4/8/8 w - - 0 1",
    BLACK_TO_MOVE: "8/8/8/3k4/3P4/3K4/8/8 b - - 0 1",
  },
  
  /** King and Queen vs King - winning */
  KQK_WIN: "4k3/8/8/8/8/8/8/4K2Q w - - 0 1",
  
  /** King and Queen vs King - black to move */
  KQK_BLACK_TO_MOVE: "4k3/8/8/8/8/8/8/4K2Q b - - 0 1",
  
  /** King and Queen vs King (alternative) */
  KQK_WIN_ALT: "8/8/8/8/8/8/1Q6/K3k3 w - - 0 1",
  
  /** King and Rook vs King - winning */
  KRK_WIN: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
  
  /** King and Rook vs King (alternative) */
  KRK_WIN_ALT: "4k3/R7/8/8/8/8/8/4K3 w - - 0 1",
  
  /** King and Rook vs King (another variant) */
  KRK_WIN_VAR: "R7/8/8/8/8/8/8/K2k4 w - - 0 1",
  
  /** King and Rook vs King (center) */
  KRK_CENTER: "8/8/8/8/8/3k4/8/R3K3 w - - 0 1",
  
  /** King and Knight vs King - insufficient material */
  KNK_DRAW: "8/8/8/8/8/8/k7/K6N w - - 0 1",
  
  /** Lucena position */
  LUCENA: "1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1",
  
  /** Promotion position */
  PROMOTION: "8/P7/8/8/8/8/8/k6K w - - 0 1",
} as const;

/**
 * Special game states
 */
export const SpecialPositions = {
  /** Checkmate position */
  CHECKMATE: "4k3/8/8/8/8/8/7Q/4K3 b - - 0 1",
  
  /** Stalemate position */
  STALEMATE: "k7/P7/K7/8/8/8/8/8 b - - 0 1",
  
  /** Checkmate in 1 move */
  MATE_IN_1: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
  
  /** Draw by insufficient material */
  INSUFFICIENT_MATERIAL: {
    KK: "8/8/8/8/8/8/8/K2k4 w - - 0 1",
    KNK: "8/8/8/8/8/8/8/K2k2N1 w - - 0 1",
    KBK: "8/8/8/8/8/8/8/K2k2B1 w - - 0 1",
  },
  
  /** Complex middle game position */
  COMPLEX_MIDGAME: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2",
  
  /** Too many pieces for tablebase (starting position) */
  TOO_MANY_PIECES: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  
  /** Empty board (for error testing) */
  EMPTY_BOARD: "8/8/8/8/8/8/8/8 w - - 0 1",
  
  /** Invalid position with wrong pawn structure */
  INVALID_TOO_MANY_PAWNS: "rnbqkbnr/ppppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  
  /** Position with wrong ranks */
  INVALID_WRONG_RANKS: "9/8/8/8/8/8/8/8 w - - 0 1",
  
  /** Position with insufficient ranks */
  INVALID_INSUFFICIENT_RANKS: "8/8/8/8/8/8/8/7 w - - 0 1",
} as const;

/**
 * KPK endgame progression for integration tests
 */
export const KPKProgression = {
  /** Initial winning position */
  INITIAL: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
  
  /** After Kb8 (still winning) */
  AFTER_KB8: "1K6/P7/k7/8/8/8/8/8 b - - 1 1",
  
  /** After Kd6 (suboptimal but still winning) */
  AFTER_KD6: "4k3/8/3K4/4P3/8/8/8/8 b - - 1 1",
  
  /** After Kd6 Kf8 (white to move) */
  AFTER_KD6_KF8: "5k2/8/3K4/4P3/8/8/8/8 w - - 2 2",
  
  /** After Kc7 from setup position */
  AFTER_KC7: "5k2/2K5/8/4P3/8/8/8/8 b - - 3 2",
} as const;

/**
 * Test move sequences
 */
export const MoveSequences = {
  /** Positions after specific moves */
  e4: {
    before: StandardPositions.STARTING,
    after: StandardPositions.AFTER_E4,
  },
  e4_e5: {
    before: StandardPositions.AFTER_E4,
    after: StandardPositions.AFTER_E4_E5,
  },
  e4_e5_Nf3: {
    before: StandardPositions.AFTER_E4_E5,
    after: StandardPositions.AFTER_E4_E5_NF3,
  },
} as const;

/**
 * E2E test move sequences for complex scenarios
 */
export const E2EMoveSequences = {
  /** Pawn promotion sequence leading to automatic win */
  PAWN_PROMOTION_TO_WIN: {
    startPosition: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    moves: [
      "e6-d6",  // 1. Kd6
      "e8-f7",  // 1... Kf7 (opponent move)
      "d6-d7",  // 2. Kd7  
      "f7-f8",  // 2... Kf8 (opponent move)
      "e5-e6",  // 3. e6
      "f8-g8",  // 3... Kg8 (opponent move)
      "e6-e7",  // 4. e7
      "g8-f7",  // 4... Kf7 (opponent move)
      "e7-e8=Q" // 5. e8=Q+ (promotion!)
    ],
    description: "King and pawn endgame leading to promotion and auto-win detection",
    expectedResult: "win" // Should trigger auto-completion
  },

  /** Pawn promotion sequence leading to draw (no auto-win) */
  PAWN_PROMOTION_TO_DRAW: {
    startPosition: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    moves: [
      "e6-d6",  // 1. Kd6
      "e8-f7",  // 1... Kf7 (opponent move)
      "d6-c7",  // 2. Kc7
      "f7-g7",  // 2... Kg7 (opponent move)
      "e5-e6",  // 3. e6
      "g7-f6",  // 3... Kf6 (opponent move)
      "e6-e7",  // 4. e7
      "f6-f7",  // 4... Kf7 (opponent move)
      "e7-e8=Q" // 5. e8=Q+ (promotion but no auto-win!)
    ],
    description: "King and pawn endgame leading to promotion but NOT immediate win",
    expectedResult: "continue" // Should NOT trigger auto-completion
  }
} as const;

/**
 * Helper function to get all FEN positions for validation tests
 */
export function getAllTestFENs(): string[] {
  const positions: string[] = [];
  
  // Add standard positions
  Object.values(StandardPositions).forEach(pos => {
    if (typeof pos === 'string') positions.push(pos);
  });
  
  // Add endgame positions
  Object.values(EndgamePositions).forEach(pos => {
    if (typeof pos === 'string') {
      positions.push(pos);
    } else if (typeof pos === 'object') {
      Object.values(pos).forEach(subPos => {
        if (typeof subPos === 'string') positions.push(subPos);
      });
    }
  });
  
  // Add special positions
  Object.values(SpecialPositions).forEach(pos => {
    if (typeof pos === 'string') {
      positions.push(pos);
    } else if (typeof pos === 'object') {
      Object.values(pos).forEach(subPos => {
        if (typeof subPos === 'string') positions.push(subPos);
      });
    }
  });
  
  // Add KPK progression
  Object.values(KPKProgression).forEach(pos => {
    if (typeof pos === 'string') positions.push(pos);
  });
  
  return positions;
}

/**
 * Get a random endgame position for testing
 */
export function getRandomEndgamePosition(): string {
  const endgames = [
    EndgamePositions.KPK_WIN,
    EndgamePositions.KPK_CENTRAL,
    EndgamePositions.KPK_VARIANTS.SIDE_PAWN,
    EndgamePositions.KPK_VARIANTS.CENTER_ADVANCED,
    EndgamePositions.KQK_WIN,
    EndgamePositions.KRK_WIN,
    EndgamePositions.KRK_WIN_ALT,
  ];
  return endgames[Math.floor(Math.random() * endgames.length)];
}

/**
 * Type-safe FEN position type
 */
export type TestFEN = 
  | typeof StandardPositions[keyof typeof StandardPositions]
  | typeof EndgamePositions[keyof typeof EndgamePositions]
  | typeof SpecialPositions[keyof typeof SpecialPositions]
  | typeof KPKProgression[keyof typeof KPKProgression];