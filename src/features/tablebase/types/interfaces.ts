/**
 * Tablebase Service Interfaces - Clean Domain Layer
 *
 * These interfaces define the contract for tablebase functionality
 * without any implementation details or external API specifics.
 * Following Clean Architecture principles.
 */

/**
 * Main tablebase service interface
 * Provides evaluation and move analysis for chess positions
 */
export interface TablebaseServiceInterface {
  /**
   * Evaluate a chess position
   * @param fen - Position in FEN notation
   * @returns Evaluation from the perspective of the player to move
   */
  evaluate(fen: string): Promise<TablebaseEvaluation>;

  /**
   * Get the best moves for a position
   * @param fen - Position in FEN notation
   * @param limit - Maximum number of moves to return (default: 3)
   * @returns Best moves sorted by quality
   */
  getBestMoves(fen: string, limit?: number): Promise<TablebaseMove[]>;
}

/**
 * Position evaluation result
 * Always from the perspective of the player to move
 */
export interface TablebaseEvaluation {
  /** Win, draw, or loss from the player's perspective */
  outcome: TablebaseOutcome;

  /** Distance to mate in plies (half-moves), if available */
  dtm?: number | undefined;

  /** Distance to zeroing (50-move rule) in plies, if available */
  dtz?: number | undefined;
}

/**
 * Individual move with evaluation
 * Evaluation is from the perspective of the player making the move
 */
export interface TablebaseMove {
  /** Move in UCI notation (e.g., "e2e4", "a7a8q") */
  uci: string;

  /** Move in Standard Algebraic Notation (e.g., "e4", "a8=Q+") */
  san: string;

  /** Evaluation after this move from the mover's perspective */
  outcome: TablebaseOutcome;

  /** Distance to mate after this move, if available */
  dtm?: number | undefined;

  /** Distance to zeroing after this move, if available */
  dtz?: number | undefined;
}

/**
 * Possible tablebase outcomes
 * Simplified to essential categories only
 */
export type TablebaseOutcome = 'win' | 'draw' | 'loss';

/**
 * API client interface for tablebase queries
 * Abstracts the HTTP communication layer
 */
export interface TablebaseApiClientInterface {
  /**
   * Query the tablebase API for a position
   * @param fen - Position in FEN notation
   * @returns Raw API response
   */
  query(fen: string): Promise<TablebaseApiResponse>;
}

/**
 * Raw API response structure
 * This represents the external API format before transformation
 */
export interface TablebaseApiResponse {
  /** Win/Draw/Loss value from White's perspective */
  wdl: number;

  /** Distance to zeroing */
  dtz: number | null;

  /** Distance to mate (only for ≤5 pieces) */
  dtm?: number | null | undefined;

  /** Category string from the API */
  category: string;

  /** Available moves with evaluations */
  moves: TablebaseApiMove[];
}

/**
 * Raw move data from the API
 */
export interface TablebaseApiMove {
  /** Move in UCI notation */
  uci: string;

  /** Move in SAN notation */
  san: string;

  /** WDL after the move from White's perspective */
  wdl: number;

  /** DTZ after the move */
  dtz: number | null;

  /** DTM after the move */
  dtm?: number | null | undefined;

  /** Category after the move */
  category: string;
}

/**
 * Transformer interface for perspective normalization
 * Critical for correct evaluation display
 */
export interface TablebaseTransformerInterface {
  /**
   * Normalize position evaluation to player's perspective
   * @param apiData - Raw API response
   * @param fen - Current position
   * @returns Normalized evaluation
   */
  normalizePositionEvaluation(apiData: TablebaseApiResponse, fen: string): TablebaseEvaluation;

  /**
   * Normalize move evaluation to player's perspective
   * @param moveWdl - WDL value from API (White's perspective)
   * @param isBlackToMove - Whether Black is to move
   * @returns Normalized outcome
   */
  normalizeMoveEvaluation(moveWdl: number, isBlackToMove: boolean): TablebaseOutcome;
}

/**
 * Error class for tablebase-specific errors
 */
export class TablebaseError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'API_ERROR' | 'INVALID_FEN' | 'UNAVAILABLE'
  ) {
    super(message);
    this.name = 'TablebaseError';
  }
}
