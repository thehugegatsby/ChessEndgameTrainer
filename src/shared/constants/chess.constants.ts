/**
 * @fileoverview Chess-specific constants for game logic and FEN handling
 * @module constants/chess
 *
 * @description
 * Centralizes all chess-related constants including FEN strings, board properties,
 * game rules, and position handling. Designed for optimal LLM readability with
 * comprehensive JSDoc documentation for each constant.
 *
 * @remarks
 * All constants use `as const` assertion for type safety and immutability.
 * Constants are grouped by logical domain for easy discovery and maintenance.
 */

/**
 * Forsyth-Edwards Notation (FEN) related constants
 *
 * @description
 * FEN is the standard notation for describing chess positions. A FEN string
 * contains 6 space-separated fields: piece placement, active color, castling
 * availability, en passant target, halfmove clock, and fullmove number.
 */
export const FEN = {
  /**
   * Standard starting position in chess
   * Format: piece_placement active_color castling en_passant halfmove fullmove
   * @example "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
   */
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',

  /**
   * Number of fields to use when normalizing FEN for caching
   * We use first 4 fields (position, color, castling, en passant)
   * Excluding halfmove clock and fullmove number for better cache hits
   */
  NORMALIZATION_FIELDS: 4,

  /**
   * Index positions of FEN fields after splitting by space
   */
  FIELD_INDICES: {
    PIECE_PLACEMENT: 0,
    ACTIVE_COLOR: 1,
    CASTLING: 2,
    EN_PASSANT: 3,
    HALFMOVE_CLOCK: 4,
    FULLMOVE_NUMBER: 5,
  },

  /**
   * Total number of fields in a complete FEN string
   */
  TOTAL_FIELDS: 6,
} as const;

/**
 * Chess board dimensions and properties
 *
 * @description
 * Standard chess is played on an 8x8 board with 64 squares.
 * Files are columns (a-h), ranks are rows (1-8).
 */
export const BOARD = {
  /**
   * Number of files (columns) on a chess board
   */
  FILES: 8,

  /**
   * Number of ranks (rows) on a chess board
   */
  RANKS: 8,

  /**
   * Total number of squares on a chess board
   */
  TOTAL_SQUARES: 64,

  /**
   * Size of the board (for square boards, width = height)
   */
  SIZE: 8,

  /**
   * ASCII code for file 'a' (used for board coordinate calculations)
   */
  FILE_A_ASCII: 97,
} as const;

/**
 * Game state and outcome constants
 *
 * @description
 * Numerical representations of game outcomes and states.
 * Used for evaluation and game result determination.
 */
export const GAME_STATE = {
  /**
   * White wins the game
   */
  WHITE_WINS: 1,

  /**
   * Black wins the game
   */
  BLACK_WINS: -1,

  /**
   * Game ends in a draw
   */
  DRAW: 0,

  /**
   * Game is still in progress
   */
  IN_PROGRESS: null,
} as const;

/**
 * Array index constants for semantic clarity
 *
 * @description
 * Replace magic numbers like -1, 0, 1 with named constants
 * when they have specific meaning beyond simple array access.
 */
export const ARRAY_INDICES = {
  /**
   * Value returned when element is not found in array
   * @example array.indexOf(element) === ARRAY_INDICES.NOT_FOUND
   */
  NOT_FOUND: -1,

  /**
   * Index of the first element in an array
   */
  FIRST: 0,

  /**
   * Index of the second element in an array
   */
  SECOND: 1,

  /**
   * Starting index for loops
   */
  LOOP_START: 1,

  /**
   * Initial move index (before any moves)
   */
  INITIAL_MOVE_INDEX: -1 as number,
} as const;

/**
 * Chess piece limits and counts
 *
 * @description
 * Maximum and standard piece counts for validation and endgame detection.
 */
export const PIECES = {
  /**
   * Maximum total pieces per side in standard chess
   */
  MAX_PER_SIDE: 16,

  /**
   * Maximum pawns per side
   */
  MAX_PAWNS: 8,

  /**
   * Number of kings per side (always exactly 1)
   */
  KINGS_PER_SIDE: 1,

  /**
   * Maximum pieces for tablebase lookup
   * Tablebase databases typically support up to 7-piece positions
   */
  TABLEBASE_LIMIT: 7,

  /**
   * Piece count threshold for endgame phase
   * Positions with 7 or fewer pieces are considered endgames
   */
  ENDGAME_THRESHOLD: 7,

  /**
   * Starting piece counts per side (excluding king)
   */
  STARTING_COUNTS: {
    QUEEN: 1,
    ROOK: 2,
    BISHOP: 2,
    KNIGHT: 2,
    PAWN: 8,
  },
} as const;

/**
 * Chess rules and draw conditions
 *
 * @description
 * Constants for various chess rules that can lead to draws.
 */
export const RULES = {
  /**
   * Number of halfmoves without pawn move or capture before draw can be claimed
   */
  FIFTY_MOVE_RULE: 50,

  /**
   * Number of position repetitions before draw can be claimed
   */
  THREEFOLD_REPETITION: 3,

  /**
   * Maximum moves to keep in history for analysis
   */
  MAX_HISTORY_MOVES: 500,
} as const;

/**
 * Type exports for strict typing
 */
export type FenConstants = typeof FEN;
export type BoardConstants = typeof BOARD;
export type GameStateConstants = typeof GAME_STATE;
export type ArrayIndexConstants = typeof ARRAY_INDICES;
export type PieceConstants = typeof PIECES;
export type RuleConstants = typeof RULES;
