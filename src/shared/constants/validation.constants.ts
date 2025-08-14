/**
 * @fileoverview Validation constants for input limits, patterns, and rules.
 *
 * This file defines standardized values for validating user input, chess notation,
 * and system constraints. These constants ensure consistent validation behavior
 * across the application and prevent magic numbers in validation logic.
 */

// ============================================================================
// INPUT LIMITS
// ============================================================================

/**
 * Maximum and minimum lengths for various string inputs.
 */
export const INPUT_LIMITS = Object.freeze({
  /**
   * String length limits
   */
  STRINGS: Object.freeze({
    /**
     * Maximum length for user display names
     */
    MAX_USERNAME_LENGTH: 50,
    
    /**
     * Minimum length for user display names
     */
    MIN_USERNAME_LENGTH: 2,
    
    /**
     * Maximum length for game comments or notes
     */
    MAX_COMMENT_LENGTH: 500,
    
    /**
     * Maximum length for endgame scenario descriptions
     */
    MAX_SCENARIO_DESCRIPTION_LENGTH: 200,
    
    /**
     * Maximum length for custom training session names
     */
    MAX_SESSION_NAME_LENGTH: 100,
  }),

  /**
   * Numeric value ranges
   */
  NUMBERS: Object.freeze({
    /**
     * Maximum number of moves in a single training session
     */
    MAX_MOVES_PER_SESSION: 1000,
    
    /**
     * Minimum engine depth for analysis
     */
    MIN_ENGINE_DEPTH: 1,
    
    /**
     * Maximum engine depth for analysis
     */
    MAX_ENGINE_DEPTH: 30,
    
    /**
     * Maximum number of variations to analyze
     */
    MAX_VARIATIONS: 10,
    
    /**
     * Maximum rating difference for matchmaking
     */
    MAX_RATING_DIFFERENCE: 500,
    
    /**
     * Minimum user rating
     */
    MIN_USER_RATING: 500,
    
    /**
     * Maximum user rating
     */
    MAX_USER_RATING: 3500,
  }),

  /**
   * Array and collection size limits
   */
  ARRAYS: Object.freeze({
    /**
     * Maximum number of items in move history
     */
    MAX_MOVE_HISTORY_SIZE: 200,
    
    /**
     * Maximum number of saved positions per user
     */
    MAX_SAVED_POSITIONS: 100,
    
    /**
     * Maximum number of concurrent training sessions
     */
    MAX_CONCURRENT_SESSIONS: 3,
    
    /**
     * Maximum number of custom endgame scenarios
     */
    MAX_CUSTOM_SCENARIOS: 50,
    
    /**
     * Maximum number of tags per position
     */
    MAX_POSITION_TAGS: 10,
  }),
});

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/**
 * Regular expressions for validating various chess-related inputs.
 */
export const VALIDATION_PATTERNS = Object.freeze({
  /**
   * FEN (Forsyth-Edwards Notation) validation
   */
  FEN: Object.freeze({
    /**
     * Complete FEN string pattern
     * Matches: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     */
    COMPLETE: /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s(K?Q?k?q?|-)\s([a-h][36]|-)\s\d+\s\d+$/,
    
    /**
     * FEN piece placement only (first field)
     */
    PIECE_PLACEMENT: /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+$/,
    
    /**
     * FEN active color (second field)
     */
    ACTIVE_COLOR: /^[bw]$/,
    
    /**
     * FEN castling rights (third field)
     */
    CASTLING_RIGHTS: /^(K?Q?k?q?|-)$/,
    
    /**
     * FEN en passant target (fourth field)
     */
    EN_PASSANT: /^([a-h][36]|-)$/,
  }),

  /**
   * Chess move notation patterns
   */
  MOVES: Object.freeze({
    /**
     * Standard Algebraic Notation (SAN)
     * Matches: "e4", "Nf3", "O-O", "Qxd5+", "a8=Q#"
     */
    SAN: /^([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?|O-O(-O)?)[+#]?$/,
    
    /**
     * Long Algebraic Notation (LAN)
     * Matches: "e2-e4", "Ng1-f3", "O-O"
     */
    LAN: /^([a-h][1-8]-[a-h][1-8](=[NBRQ])?|O-O(-O)?)[+#]?$/,
    
    /**
     * UCI (Universal Chess Interface) notation
     * Matches: "e2e4", "g1f3", "e7e8q"
     */
    UCI: /^[a-h][1-8][a-h][1-8][nbrq]?$/,
    
    /**
     * Square notation
     * Matches: "e4", "a1", "h8"
     */
    SQUARE: /^[a-h][1-8]$/,
    
    /**
     * Piece notation (single piece)
     * Matches: "K", "Q", "R", "B", "N", "P" (and lowercase)
     */
    PIECE: /^[KQRBNPkqrbnp]$/,
  }),

  /**
   * User input validation patterns
   */
  USER_INPUT: Object.freeze({
    /**
     * Valid username pattern (alphanumeric, underscore, hyphen)
     */
    USERNAME: /^[a-zA-Z0-9_-]+$/,
    
    /**
     * Valid session name (letters, numbers, spaces, basic punctuation)
     */
    SESSION_NAME: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
    
    /**
     * Valid tag name (alphanumeric, underscore, hyphen)
     */
    TAG_NAME: /^[a-zA-Z0-9_-]+$/,
    
    /**
     * Valid search query (flexible pattern for position search)
     */
    SEARCH_QUERY: /^[a-zA-Z0-9\s\-_.,!?()\/\\]+$/,
  }),

  /**
   * System validation patterns
   */
  SYSTEM: Object.freeze({
    /**
     * Valid session ID format
     */
    SESSION_ID: /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/,
    
    /**
     * Valid position hash format (for caching)
     */
    POSITION_HASH: /^[a-f0-9]{32}$/,
    
    /**
     * Valid timestamp format (ISO 8601)
     */
    TIMESTAMP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  }),
});

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Business rule constants for validation logic.
 */
export const VALIDATION_RULES = Object.freeze({
  /**
   * Chess game rules and constraints
   */
  CHESS: Object.freeze({
    /**
     * Maximum number of pieces of each type on the board
     */
    MAX_PIECES_PER_TYPE: Object.freeze({
      KING: 1,
      QUEEN: 9,   // 1 original + 8 promoted pawns
      ROOK: 10,   // 2 original + 8 promoted pawns
      BISHOP: 10, // 2 original + 8 promoted pawns
      KNIGHT: 10, // 2 original + 8 promoted pawns
      PAWN: 8,    // maximum on board at once
    }),
    
    /**
     * Board dimension constraints
     */
    BOARD: Object.freeze({
      MIN_RANK: 1,
      MAX_RANK: 8,
      MIN_FILE_CODE: 97, // 'a' in ASCII
      MAX_FILE_CODE: 104, // 'h' in ASCII
    }),
    
    /**
     * Move count constraints
     */
    MOVES: Object.freeze({
      /**
       * Minimum plies (half-moves) before draw by 50-move rule
       */
      FIFTY_MOVE_RULE_THRESHOLD: 100,
      
      /**
       * Maximum reasonable game length in plies
       */
      MAX_GAME_LENGTH: 500,
      
      /**
       * Minimum moves for a valid endgame training session
       */
      MIN_TRAINING_MOVES: 3,
    }),
  }),

  /**
   * Input sanitization rules
   */
  SANITIZATION: Object.freeze({
    /**
     * Characters to strip from user input
     */
    STRIP_CHARS: /[<>\"'&]/g,
    
    /**
     * Maximum consecutive whitespace characters to allow
     */
    MAX_CONSECUTIVE_SPACES: 3,
    
    /**
     * Whether to trim whitespace from inputs
     */
    TRIM_WHITESPACE: true,
    
    /**
     * Whether to convert inputs to lowercase for comparison
     */
    NORMALIZE_CASE: false,
  }),

  /**
   * Performance and rate limiting rules
   */
  PERFORMANCE: Object.freeze({
    /**
     * Maximum concurrent validation operations
     */
    MAX_CONCURRENT_VALIDATIONS: 10,
    
    /**
     * Timeout for individual validation operations (ms)
     */
    VALIDATION_TIMEOUT_MS: 1000,
    
    /**
     * Maximum depth for recursive validation
     */
    MAX_VALIDATION_DEPTH: 5,
    
    /**
     * Batch size for bulk validation operations
     */
    VALIDATION_BATCH_SIZE: 50,
  }),
});

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Standardized error codes for validation failures.
 */
export const VALIDATION_ERROR_CODES = Object.freeze({
  /**
   * Input validation errors
   */
  INPUT: Object.freeze({
    REQUIRED: 'INPUT_REQUIRED',
    TOO_SHORT: 'INPUT_TOO_SHORT',
    TOO_LONG: 'INPUT_TOO_LONG',
    INVALID_FORMAT: 'INPUT_INVALID_FORMAT',
    INVALID_CHARACTERS: 'INPUT_INVALID_CHARACTERS',
  }),

  /**
   * Chess-specific validation errors
   */
  CHESS: Object.freeze({
    INVALID_FEN: 'CHESS_INVALID_FEN',
    INVALID_MOVE: 'CHESS_INVALID_MOVE',
    ILLEGAL_POSITION: 'CHESS_ILLEGAL_POSITION',
    INVALID_SQUARE: 'CHESS_INVALID_SQUARE',
    INVALID_PIECE: 'CHESS_INVALID_PIECE',
  }),

  /**
   * Business rule validation errors
   */
  BUSINESS: Object.freeze({
    LIMIT_EXCEEDED: 'BUSINESS_LIMIT_EXCEEDED',
    CONSTRAINT_VIOLATION: 'BUSINESS_CONSTRAINT_VIOLATION',
    STATE_INVALID: 'BUSINESS_STATE_INVALID',
    PERMISSION_DENIED: 'BUSINESS_PERMISSION_DENIED',
  }),

  /**
   * System validation errors
   */
  SYSTEM: Object.freeze({
    TIMEOUT: 'SYSTEM_TIMEOUT',
    RESOURCE_EXHAUSTED: 'SYSTEM_RESOURCE_EXHAUSTED',
    INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  }),
});