/**
 * @file Common FEN Positions for Tests
 * @description Simple FEN constants for tests that only need position strings
 * 
 * Use this for:
 * - URL validations
 * - Position comparisons
 * - Setup configurations
 * 
 * For complex test scenarios with moves and expectations, use chessTestScenarios.ts
 */

/**
 * Training positions mapped to their URLs
 */
export const COMMON_FENS = {
  /** Training 1: King + Pawn vs King basic position (/train/1) */
  TRAIN1_KPK_BASIC: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  /** Pawn promotion position - White pawn ready to promote */
  PAWN_PROMOTION_READY: '8/5P2/8/8/k7/8/K7/8 w - - 0 1',
  
  /** Starting chess position */
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  
  /** Empty board except kings */
  KINGS_ONLY: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
  
  /** KPK position for real API integration testing (black to move, losing) */
  REAL_API_KPK: '1K6/P7/k7/8/8/8/8/8 b - - 1 1',
  
  /** Complex endgame position for UI testing (KPK with black to move) */
  COMPLEX_ENDGAME: '8/8/8/8/4k3/4P3/5K2/8 b - - 1 2',
} as const;

/**
 * Type for accessing FEN strings with autocomplete
 */
export type CommonFenKey = keyof typeof COMMON_FENS;

/**
 * Get a random endgame position for testing
 */
export function getRandomEndgamePosition(): string {
  const endgames = [
    COMMON_FENS.TRAIN1_KPK_BASIC,
    COMMON_FENS.PAWN_PROMOTION_READY,
    COMMON_FENS.KINGS_ONLY,
    COMMON_FENS.COMPLEX_ENDGAME,
    COMMON_FENS.REAL_API_KPK,
  ];
  return endgames[Math.floor(Math.random() * endgames.length)];
}

/**
 * Legacy positions for migration compatibility
 */
export const StandardPositions = {
  STARTING: COMMON_FENS.STARTING_POSITION,
  AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  AFTER_E4_E5: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  CASTLING_AVAILABLE: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  EN_PASSANT: 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
  EN_PASSANT_COMPLEX: '8/8/8/2pP4/8/8/8/4K2k w - c6 0 1',
} as const;

export const EndgamePositions = {
  KK_DRAW: COMMON_FENS.KINGS_ONLY,
  KPK_WIN: 'K7/P7/k7/8/8/8/8/8 w - - 0 1',
  KPK_CENTRAL: COMMON_FENS.TRAIN1_KPK_BASIC,
  KQK_WIN: '4k3/8/8/8/8/8/8/4K2Q w - - 0 1',
  KQK_BLACK_TO_MOVE: '4k3/8/8/8/8/8/8/4K2Q b - - 0 1',
  KNK_DRAW: '8/8/8/8/8/8/k7/K6N w - - 0 1',
  KPK_VARIANTS: {
    DRAW_POSITION: '8/8/8/3k4/8/2KP4/8/8 w - - 0 1',
    BLACK_TO_MOVE: '8/8/8/3k4/3P4/3K4/8/8 b - - 0 1',
  },
  LUCENA: '1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1',
} as const;

export const SpecialPositions = {
  PROMOTION: COMMON_FENS.PAWN_PROMOTION_READY,
  CHECKMATE: '4k3/4Q3/3K4/8/8/8/8/8 b - - 0 1',
  STALEMATE: 'k7/P7/K7/8/8/8/8/8 b - - 0 1',
  BLACK_IN_CHECK: 'rnbkqbnr/pppp1ppp/8/4p1Q1/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
  INSUFFICIENT_MATERIAL: {
    KK: COMMON_FENS.KINGS_ONLY,
  },
} as const;