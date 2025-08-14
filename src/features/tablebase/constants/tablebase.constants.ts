/**
 * @fileoverview Constants specific to the Tablebase API feature
 * @module features/tablebase/constants
 * 
 * @description
 * Tablebase-specific constants including error codes, messages,
 * and API configuration. Designed for optimal LLM readability
 * with comprehensive documentation.
 */

/**
 * Tablebase API error definitions
 * 
 * @description
 * Standardized error codes and messages for tablebase operations.
 * These provide consistent error handling across the feature.
 */
export const TABLEBASE_API_ERRORS = {
  /**
   * Position not found in tablebase
   * Occurs when querying positions with more than 7 pieces
   * or positions not yet computed in the tablebase
   */
  NOT_FOUND: {
    CODE: 'TABLEBASE_NOT_FOUND',
    MESSAGE: 'Position not in tablebase',
  },
  
  /**
   * Rate limiting error
   * Lichess API has rate limits to prevent abuse
   */
  RATE_LIMITED: {
    CODE: 'TABLEBASE_RATE_LIMITED',
    MESSAGE: 'Rate limited by tablebase API',
  },
  
  /**
   * Generic API error
   * Catch-all for unexpected API responses
   */
  GENERIC_ERROR: {
    CODE: 'TABLEBASE_API_ERROR',
    MESSAGE: 'Tablebase API error',
  },
  
  /**
   * Maximum retries exceeded
   * Request failed after all retry attempts
   */
  MAX_RETRIES_EXCEEDED: {
    CODE: 'TABLEBASE_MAX_RETRIES',
    MESSAGE: 'Maximum retry attempts exceeded for tablebase query',
  },
  
  /**
   * Timeout error
   * Request took too long to complete
   */
  TIMEOUT: {
    CODE: 'TABLEBASE_TIMEOUT',
    MESSAGE: 'Tablebase query timed out',
  },
  
  /**
   * Invalid FEN format
   * FEN string doesn't match expected format
   */
  INVALID_FEN: {
    CODE: 'TABLEBASE_INVALID_FEN',
    MESSAGE: 'Invalid FEN format for tablebase query',
  },
  
  /**
   * Too many pieces
   * Position has more pieces than tablebase supports
   */
  TOO_MANY_PIECES: {
    CODE: 'TABLEBASE_TOO_MANY_PIECES',
    MESSAGE: 'Position has too many pieces for tablebase lookup',
  },
} as const;

/**
 * Tablebase query configuration
 * 
 * @description
 * Configuration specific to tablebase queries and caching.
 */
export const TABLEBASE_CONFIG = {
  /**
   * Maximum number of pieces supported by tablebase
   * Current Syzygy tablebases support up to 7 pieces
   */
  MAX_PIECES: 7,
  
  /**
   * Minimum number of pieces for tablebase query
   * Positions with fewer pieces are trivial
   */
  MIN_PIECES: 3,
  
  /**
   * Cache configuration for tablebase results
   */
  CACHE: {
    /**
     * Time-to-live for cached results (5 minutes)
     * Tablebase results are static, so can be cached longer
     */
    TTL: 5 * 60 * 1000,
    
    /**
     * Maximum number of positions to cache
     */
    MAX_ENTRIES: 100,
    
    /**
     * Cache key prefix for storage
     */
    KEY_PREFIX: 'tablebase_',
  },
  
  /**
   * Query timeout specific to tablebase (7 seconds)
   * Slightly longer than general HTTP timeout due to computation
   */
  QUERY_TIMEOUT: 7000,
  
  /**
   * Buffer time added to timeout for cleanup (1 second)
   */
  TIMEOUT_BUFFER: 1000,
} as const;

/**
 * Tablebase result types
 * 
 * @description
 * Standardized result types from tablebase queries.
 */
export const TABLEBASE_RESULTS = {
  /**
   * Win/Draw/Loss values
   * Positive = White wins, Negative = Black wins, 0 = Draw
   */
  WDL: {
    WHITE_WIN: 1,
    DRAW: 0,
    BLACK_WIN: -1,
    CURSED_WIN: 2,    // Win but requires 50-move rule
    BLESSED_LOSS: -2, // Loss but can draw via 50-move rule
  },
  
  /**
   * Distance to zeroing move (DTZ)
   * Number of moves until a pawn move or capture
   */
  DTZ: {
    /**
     * Maximum DTZ value to display
     * Higher values are capped for UI clarity
     */
    MAX_DISPLAY: 100,
    
    /**
     * DTZ value indicating immediate win/loss
     */
    IMMEDIATE: 0,
  },
} as const;

/**
 * Tablebase API response fields
 * 
 * @description
 * Expected fields in tablebase API responses.
 */
export const TABLEBASE_RESPONSE_FIELDS = {
  /**
   * Response field names
   */
  CATEGORY: 'category',
  DTZ: 'dtz',
  DTM: 'dtm',
  MOVES: 'moves',
  
  /**
   * Category values
   */
  CATEGORIES: {
    WIN: 'win',
    DRAW: 'draw',
    LOSS: 'loss',
    CURSED_WIN: 'cursed-win',
    BLESSED_LOSS: 'blessed-loss',
    MAYBE_WIN: 'maybe-win',
    MAYBE_LOSS: 'maybe-loss',
  },
} as const;

/**
 * Tablebase move evaluation
 * 
 * @description
 * Constants for evaluating moves from tablebase.
 */
export const TABLEBASE_MOVE_EVAL = {
  /**
   * Score assigned to tablebase moves (in centipawns)
   * High values to prioritize tablebase knowledge
   */
  WIN_SCORE: 10000,
  LOSS_SCORE: -10000,
  DRAW_SCORE: 0,
  
  /**
   * Confidence level for tablebase evaluations
   * Tablebase provides perfect information
   */
  CONFIDENCE: 1.0,
  
  /**
   * Depth value for tablebase evaluations
   * Set high to indicate perfect knowledge
   */
  DEPTH: 999,
} as const;

/**
 * Type exports for strict typing
 */
export type TablebaseApiErrorConstants = typeof TABLEBASE_API_ERRORS;
export type TablebaseConfigConstants = typeof TABLEBASE_CONFIG;
export type TablebaseResultConstants = typeof TABLEBASE_RESULTS;
export type TablebaseResponseFieldConstants = typeof TABLEBASE_RESPONSE_FIELDS;
export type TablebaseMoveEvalConstants = typeof TABLEBASE_MOVE_EVAL;