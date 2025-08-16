/**
 * @file Common FEN Positions for Tests
 * @description Static FEN constants for chess rule testing only
 *
 * Use this for:
 * - Game status validation (checkmate, stalemate, check)
 * - Special moves (castling, en passant)
 * - Position comparisons
 * - Chess engine integration tests
 *
 * DO NOT add training positions here - use trainScenarios.ts instead
 */

/**
 * Static chess positions for testing game rules and validation
 */
export const COMMON_FENS = {
  /** Standard starting position */
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',

  /** Checkmate - White queen checkmates black king */
  CHECKMATE_POSITION: '4k3/4Q3/3K4/8/8/8/8/8 b - - 0 1',

  /** Stalemate - Black king has no legal moves but not in check */
  STALEMATE_POSITION: 'k7/P7/K7/8/8/8/8/8 b - - 0 1',

  /** Check - Black king in check from white queen */
  CHECK_POSITION: 'rnbkqbnr/pppp1ppp/8/6Q1/8/8/PPPPPPPP/RNB1KBNR b KQkq - 0 1',

  /** En passant available - White can capture d6 */
  EN_PASSANT_POSITION: 'rnbqkbnr/pp2pppp/8/2ppP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',

  /** Castling available for both sides */
  CASTLING_AVAILABLE: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',

  /** No castling rights available */
  CASTLING_DISABLED: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1',

  /** White pawn promotion available */
  WHITE_PROMOTION: '8/4P3/8/8/8/8/8/4k1K1 w - - 0 1',

  /** Pawn ready for promotion (alternative name) */
  PAWN_PROMOTION_READY: '8/4P3/8/8/8/8/8/4k1K1 w - - 0 1',

  /** Black pawn promotion available */
  BLACK_PROMOTION: '4k1K1/8/8/8/8/8/4p3/8 b - - 0 1',

  /** Only kings remaining - insufficient material */
  INSUFFICIENT_MATERIAL: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',

  /** Completely empty board with only required info */
  EMPTY_BOARD: '8/8/8/8/8/8/8/8 w - - 0 1',

  /** Complex position for FEN validation */
  COMPLEX_MIDDLE_GAME: 'r2qkb1r/pp2nppp/3p1n2/2pP4/2P1P3/2N2N2/PP1B1PPP/R2QK2R w KQkq c6 0 8',

  /** Opening sequence positions for UI testing */
  OPENING_AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  OPENING_AFTER_E4_E5: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  OPENING_AFTER_E4_E5_NF3: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',

  /** KPK endgame position for illegal move testing */
  KPK_WHITE_TO_MOVE: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',

  /** KPK basic winning position - King and Pawn vs King */
  KPK_BASIC_WIN: 'K7/P7/k7/8/8/8/8/8 w - - 0 1',

  /** Alternative name for KPK_BASIC_WIN */
  KPK_WIN: 'K7/P7/k7/8/8/8/8/8 w - - 0 1',

  /** King and Queen vs King - winning position */
  KQK_WIN: '8/8/8/8/8/8/1Q6/K3k3 w - - 0 1',

  /** King vs King - drawing position */
  KK_DRAW: '8/8/8/8/8/8/8/K3k3 w - - 0 1',

  /** KPK position with central pawn */
  KPK_CENTRAL: '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1',

  /** KPK drawing position variant */
  KPK_DRAW_POSITION: '8/8/8/8/4k3/4P3/4K3/8 w - - 0 1',

  /** KPK black to move variant */
  KPK_BLACK_TO_MOVE: '8/8/8/4k3/4P3/4K3/8/8 b - - 0 1',

  /** Lucena position - famous winning technique */
  LUCENA: '1K6/1P1k4/8/8/8/8/1R6/8 w - - 0 1',

  /** Complex endgame position for testing */
  COMPLEX_ENDGAME: '8/2k5/8/2KP4/8/8/8/8 w - - 0 1',

  /** Black in check position */
  BLACK_IN_CHECK: 'rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',

  /** King and Knight vs King - drawing position */
  KNK_DRAW: '8/8/8/8/8/8/1N6/K3k3 w - - 0 1',

  /** King and Queen vs King with black to move */
  KQK_BLACK_TO_MOVE: '8/8/8/8/8/8/1Q6/4k1K1 b - - 0 1',

  /** Complex en passant position */
  EN_PASSANT_COMPLEX: 'rnbqkb1r/ppp2ppp/5n2/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 4',

  /** Real API test position for KPK endgame */
  REAL_API_KPK: '4k3/8/3K4/4P3/8/8/8/8 w - - 0 1',
} as const;

/**
 * Type for accessing FEN strings with autocomplete
 */
export type CommonFenKey = keyof typeof COMMON_FENS;

/**
 * Get a random chess position for testing
 */
export function getRandomTestPosition(): string {
  const positions = [
    COMMON_FENS.STARTING_POSITION,
    COMMON_FENS.CASTLING_AVAILABLE,
    COMMON_FENS.EN_PASSANT_POSITION,
    COMMON_FENS.COMPLEX_MIDDLE_GAME,
    COMMON_FENS.INSUFFICIENT_MATERIAL,
  ];
  return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Get a random endgame position for testing
 */
export function getRandomEndgamePosition(): string {
  const positions = [
    COMMON_FENS.KPK_BASIC_WIN,
    COMMON_FENS.KPK_WHITE_TO_MOVE,
    COMMON_FENS.INSUFFICIENT_MATERIAL,
    COMMON_FENS.WHITE_PROMOTION,
  ];
  return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Legacy aliases for backward compatibility - DEPRECATED
 * Use COMMON_FENS directly instead
 */
export const StandardPositions = {
  STARTING: COMMON_FENS.STARTING_POSITION,
  CASTLING_AVAILABLE: COMMON_FENS.CASTLING_AVAILABLE,
  EN_PASSANT: COMMON_FENS.EN_PASSANT_POSITION,
  EN_PASSANT_COMPLEX: COMMON_FENS.EN_PASSANT_COMPLEX,
  AFTER_E4: COMMON_FENS.OPENING_AFTER_E4,
  AFTER_E4_E5: COMMON_FENS.OPENING_AFTER_E4_E5,
} as const;

export const SpecialPositions = {
  CHECKMATE: COMMON_FENS.CHECKMATE_POSITION,
  STALEMATE: COMMON_FENS.STALEMATE_POSITION,
  CHECK: COMMON_FENS.CHECK_POSITION,
  BLACK_IN_CHECK: COMMON_FENS.BLACK_IN_CHECK,
  INSUFFICIENT_MATERIAL: COMMON_FENS.INSUFFICIENT_MATERIAL,
  PROMOTION: COMMON_FENS.WHITE_PROMOTION,
} as const;

/**
 * Endgame positions for testing
 */
export const EndgamePositions = {
  KPK_BASIC: COMMON_FENS.KPK_BASIC_WIN,
  KPK_WHITE_TO_MOVE: COMMON_FENS.KPK_WHITE_TO_MOVE,
  KPK_WIN: COMMON_FENS.KPK_WIN,
  KQK_WIN: COMMON_FENS.KQK_WIN,
  KQK_BLACK_TO_MOVE: COMMON_FENS.KQK_BLACK_TO_MOVE,
  KK_DRAW: COMMON_FENS.KK_DRAW,
  KNK_DRAW: COMMON_FENS.KNK_DRAW,
  KPK_CENTRAL: COMMON_FENS.KPK_CENTRAL,
  LUCENA: COMMON_FENS.LUCENA,
  KPK_VARIANTS: {
    DRAW_POSITION: COMMON_FENS.KPK_DRAW_POSITION,
    BLACK_TO_MOVE: COMMON_FENS.KPK_BLACK_TO_MOVE,
  },
  REAL_API_KPK: COMMON_FENS.REAL_API_KPK,
  EMPTY_BOARD: COMMON_FENS.EMPTY_BOARD,
} as const;
