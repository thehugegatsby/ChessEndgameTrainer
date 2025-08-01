/**
 * Global constants for the Chess Endgame Trainer application
 * Centralizes all magic numbers and configuration values
 */

// Storage Constants
export /**
 *
 */
const STORAGE = {
  PREFIX: "chess_trainer_",
  MAX_SIZE_WEB: 100 * 1024 * 1024, // 100MB for web
  MAX_SIZE_MOBILE: 50 * 1024 * 1024, // 50MB for mobile
  COMPRESSION_THRESHOLD: 1024, // 1KB - compress data larger than this
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Cache Constants
export /**
 *
 */
const CACHE = {
  // Cache sizes - Standardized across all components
  EVALUATION_CACHE_SIZE: 200, // Main evaluation cache in useEvaluation
  BEST_MOVE_CACHE_SIZE: 500, // Best move cache size for EvaluationCache
  LRU_DEFAULT_SIZE: 1000, // Default LRU cache size
  LRU_MEMORY_PER_ITEM: 350, // Estimated bytes per cache item
  CHESS_AWARE_CACHE_SIZE: 200, // Chess-aware cache default size (standardized)
  TABLEBASE_CACHE_SIZE: 100, // Tablebase results cache size
  POSITION_CACHE_SIZE: 200, // Position service cache size
  ANALYSIS_CACHE_SIZE: 200, // Analysis results cache size
  PARALLEL_EVALUATION_CACHE_SIZE: 200, // ParallelEvaluationService cache size

  // Cache timeouts - Standardized TTL values
  TABLEBASE_CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes for tablebase cache
  ANALYSIS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes for analysis cache TTL
  EVALUATION_CACHE_TTL: 30 * 60 * 1000, // 30 minutes for evaluation cache
  BEST_MOVE_CACHE_TTL: 10 * 60 * 1000, // 10 minutes for best move cache (more volatile)
  DEDUPLICATION_TTL: 10 * 1000, // 10 seconds for deduplication
  CLEANUP_INTERVAL_TTL: 30 * 1000, // 30 seconds for cleanup intervals
} as const;

// Performance Constants
export /**
 *
 */
const PERFORMANCE = {
  DEBOUNCE_DELAY: 300, // 300ms default debounce
  THROTTLE_DELAY: 1000, // 1 second throttle
  BATCH_SIZE: 50, // Items to process in batch
  MAX_LOG_ENTRIES: 1000, // Maximum log entries in memory
} as const;

// Tablebase Constants
export /**
 *
 */
const TABLEBASE = {
  // Timeouts
  EVALUATION_TIMEOUT: 7000, // 7 seconds for tablebase evaluation
  TIMEOUT_BUFFER: 1000, // 1 second buffer added to timeouts
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes cache TTL
  MAX_PIECES: 7, // Maximum pieces for tablebase lookup
} as const;

// UI Constants
export /**
 *
 */
const UI = {
  ANIMATION_DURATION: 300, // 300ms for animations
  TOAST_DURATION: 3000, // 3 seconds for toast messages
  TOAST_FADE_DURATION: 300, // 300ms for toast fade animation
  TOUCH_TARGET_MIN: 44, // 44px minimum touch target
  BREAKPOINTS: {
    MOBILE: 640, // Mobile breakpoint
    TABLET: 1024, // Tablet breakpoint
    DESKTOP: 1280, // Desktop breakpoint
  },

  // Evaluation color palette - synchronized with CSS variables
  EVALUATION_COLORS: {
    EXCELLENT: {
      text: "#10b981", // Light green text
      background: "#065f46", // Dark green background
    },
    GOOD: {
      text: "#3b82f6", // Light blue text
      background: "#1e40af", // Dark blue background
    },
    NEUTRAL: {
      text: "var(--text-secondary)", // Secondary text color
      background: "var(--bg-accent)", // Accent background
    },
    INACCURATE: {
      text: "#f59e0b", // Light yellow/orange text
      background: "#92400e", // Dark yellow/orange background
    },
    MISTAKE: {
      text: "#fb923c", // Light orange text
      background: "#c2410c", // Dark orange background
    },
    BLUNDER: {
      text: "#ef4444", // Light red text
      background: "#991b1b", // Dark red background
    },
  },
} as const;

// Chess Constants
export /**
 *
 */
const CHESS = {
  BOARD_SIZE: 8,
  STARTING_FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  MAX_MOVES_HISTORY: 500, // Maximum moves to keep in history
  FIFTY_MOVE_RULE: 50, // Draw by fifty-move rule
  THREEFOLD_REPETITION: 3, // Draw by repetition
  TABLEBASE_PIECE_LIMIT: 7, // Maximum pieces for tablebase lookup
  ENDGAME_PIECE_THRESHOLD: 7, // Piece count threshold for endgame

  // FEN Validation Constants
  FEN_PARTS_COUNT: 6, // FEN must have exactly 6 parts separated by spaces
  FEN_RANKS_COUNT: 8, // Chess board has 8 ranks
  FEN_SQUARES_PER_RANK: 8, // Each rank has 8 squares
  FEN_MIN_LENGTH: 10, // Minimum reasonable FEN length
  FEN_MAX_LENGTH: 100, // Maximum reasonable FEN length
  FEN_HALFMOVE_MIN: 0, // Minimum halfmove clock value
  FEN_HALFMOVE_MAX: 100, // Maximum halfmove clock value (50-move rule * 2)
  FEN_FULLMOVE_MIN: 1, // Minimum fullmove number
  FEN_FULLMOVE_MAX: 9999, // Maximum fullmove number
  FEN_CASTLING_MAX_LENGTH: 4, // Maximum castling rights length (KQkq)

  // Piece Count Limits
  MAX_PIECES_PER_SIDE: 16, // Maximum pieces per side
  MAX_PAWNS_PER_SIDE: 8, // Maximum pawns per side
  KINGS_PER_SIDE: 1, // Exactly one king per side

  // Starting piece counts for promotion validation
  STARTING_PIECES: {
    WHITE: { Q: 1, R: 2, B: 2, N: 2, P: 8 },
    BLACK: { q: 1, r: 2, b: 2, n: 2, p: 8 },
  },

  // En passant validation
  EN_PASSANT_RANKS: [3, 6], // Valid en passant target ranks
} as const;

// Evaluation Constants
export /**
 *
 */
const EVALUATION = {
  MATE_SCORE: 10000, // Score for checkmate
  WINNING_THRESHOLD: 200, // Centipawns for winning advantage
  DRAWING_THRESHOLD: 50, // Centipawns for draw range
  BLUNDER_THRESHOLD: 300, // Centipawns lost for blunder
  MISTAKE_THRESHOLD: 100, // Centipawns lost for mistake
  INACCURACY_THRESHOLD: 50, // Centipawns lost for inaccuracy
  TABLEBASE_TIMEOUT: 2000, // 2 seconds for tablebase lookup

  // Multi-PV and move display configuration
  MULTI_PV_COUNT: 3, // Number of alternative moves to analyze and display
  MAX_DISPLAY_MOVES: 5, // Maximum moves that can be displayed in UI

  // Critical position thresholds
  CRITICAL_SCORE_THRESHOLD: 500, // Score threshold for critical positions
  CRITICAL_MISTAKE_THRESHOLD: 200, // Threshold for critical mistakes
  TABLEBASE_SCORE_LIMIT: 3000, // Limit for tablebase scores

  // Priority calculation
  BASE_PRIORITY: 100, // Base priority for positions
  CRITICAL_PRIORITY_BOOST: 200, // Priority boost for critical positions
  ENDGAME_PRIORITY_FACTOR: 20, // Factor for endgame priority

  // ChessAwareCache configuration
  CHESS_AWARE_CACHE: {
    ENDGAME_THRESHOLD: 7, // 7 pieces or less = endgame
    CRITICAL_SCORE_THRESHOLD: 500, // Centipawns for critical positions
    ENDGAME_PRIORITY_BASE: 100, // Base priority for endgame positions
    ENDGAME_PRIORITY_MULTIPLIER: 20, // Priority multiplier per missing piece
    CRITICAL_POSITION_BOOST: 200, // Priority boost for critical positions
    NON_ENDGAME_PRIORITY_BASE: 50, // Base priority for non-endgame positions
  },

  // Win/Loss thresholds for mistake checking
  WIN_THRESHOLD: 300, // Positive score threshold for winning
  LOSS_THRESHOLD: -300, // Negative score threshold for losing
  MATE_THRESHOLD: 100000, // Threshold for mate scores

  // Color display thresholds (in pawn units, 1 pawn = 100 centipawns)
  COLOR_THRESHOLDS: {
    DOMINATING: 5.0, // 5+ pawns - Dominating advantage
    EXCELLENT: 2.0, // 2+ pawns - Excellent position
    GOOD: 0.5, // 0.5+ pawns - Good advantage
    NEUTRAL_UPPER: 0.5, // Upper bound for neutral
    NEUTRAL_LOWER: -0.5, // Lower bound for neutral
    INACCURATE: -2.0, // -2 to -0.5 pawns - Inaccurate
    MISTAKE: -5.0, // -5 to -2 pawns - Mistake
    // Below -5 pawns = Blunder
  },

  // Tablebase WDL thresholds
  WDL_THRESHOLDS: {
    WIN: 1, // WDL >= 1 = win/cursed-win
    LOSS: -1, // WDL <= -1 = loss/blessed-loss
    // WDL = 0 = draw
  },
} as const;

// Training Constants
export /**
 *
 */
const TRAINING = {
  MIN_MOVES_FOR_COMPLETION: 3, // Minimum moves to complete position
  SUCCESS_RATE_THRESHOLD: 0.8, // 80% success rate
  REPETITION_INTERVALS: [1, 3, 7, 14, 30], // Days for spaced repetition
  MAX_HINTS: 3, // Maximum hints per position

  // Spaced repetition multipliers
  SUCCESS_MULTIPLIER: 2, // Interval multiplier on success
  FAILURE_MULTIPLIER: 1, // Interval multiplier on failure

  // Mock data for development
  MOCK: {
    DEFAULT_LESSON_COUNT: 10, // Default number of lessons in dashboard
    SUCCESS_RATE_MIN: 0.7, // Minimum success rate for mock data
    SUCCESS_RATE_RANGE: 0.3, // Range for success rate variation
    DUE_TODAY_MAX: 3, // Maximum lessons due today
    STREAK_MAX: 10, // Maximum current streak value
    OVERALL_STREAK_MAX: 15, // Maximum overall streak value
  },
} as const;

// Rating Constants - Centralized rating system thresholds
export /**
 *
 */
const RATING = {
  // Base ratings
  DEFAULT_RATING: 1200, // Default user rating
  TEST_RATING: 1500, // Test user rating for E2E tests

  // Skill level thresholds
  BEGINNER_THRESHOLD: 1200, // Below this = beginner
  INTERMEDIATE_THRESHOLD: 1800, // 1200-1800 = intermediate
  ADVANCED_THRESHOLD: 2200, // 1800-2200 = advanced
  EXPERT_THRESHOLD: 2200, // 2200+ = expert

  // Rating change calculations
  RATING_CHANGE_BASE: 32, // ELO-like rating change base
} as const;

// Network Constants
export /**
 *
 */
const NETWORK = {
  API_TIMEOUT: 10000, // 10 seconds API timeout
  TABLEBASE_API_TIMEOUT: 5000, // 5 seconds for tablebase API
  RETRY_COUNT: 3, // Number of retries
  RETRY_DELAY: 1000, // 1 second between retries
  BATCH_UPLOAD_SIZE: 10, // Items to upload in batch
} as const;

// Time Constants (in milliseconds)
export /**
 *
 */
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Animation and Feedback Constants
export /**
 *
 */
const ANIMATION = {
  // Training feedback animations
  EVALUATION_FEEDBACK_DURATION: 2000, // 2 seconds for evaluation feedback display
  MOVE_PLAY_DELAY_FAST: 500, // 0.5 seconds for fast move playback
  MOVE_PLAY_DELAY_NORMAL: 1500, // 1.5 seconds for normal move playback
  MOVE_PLAY_DELAY_SLOW: 2000, // 2 seconds for slow move playback

  // Service timeouts
  PARALLEL_EVALUATION_DELAY: 200, // 200ms delay for parallel evaluation
  PARALLEL_EVALUATION_FALLBACK: 500, // 500ms fallback timeout
  TABLEBASE_REQUEST_TIMEOUT: 5000, // 5 seconds for tablebase requests
  WORKER_DELAY: 100, // 100ms delay for worker operations
  MOCK_SERVICE_DELAY: 10, // 10ms delay for mock services

  // Toast message durations
  SUCCESS_TOAST_DURATION: 4000, // 4 seconds for success messages
  ERROR_TOAST_DURATION: 3000, // 3 seconds for error messages

  // E2E test timeouts
  VIEWPORT_CHANGE_DELAY: 100, // 100ms delay for viewport changes
  BREAKPOINT_DETECTION_TIMEOUT: 5000, // 5 seconds for breakpoint detection
} as const;

// Board and UI Dimensions
export /**
 *
 */
const DIMENSIONS = {
  // Board sizes
  DEFAULT_BOARD_SIZE: 400, // Default chessboard size in pixels
  TRAINING_BOARD_SIZE: 600, // Training board size in pixels

  // Panel heights
  ANALYSIS_PANEL_HEIGHT: 400, // Analysis panel height in pixels

  // Component minimum widths
  MOVE_CONTAINER_MIN_WIDTH: 80, // Minimum width for move containers
  MOVE_NUMBER_MIN_WIDTH: 20, // Minimum width for move numbers
  MOVE_DISPLAY_MIN_WIDTH: 45, // Minimum width for move display

  // Breakpoint values (for E2E tests)
  MOBILE_BREAKPOINT: 768, // Mobile breakpoint threshold
  TABLET_BREAKPOINT: 1024, // Tablet breakpoint threshold
} as const;

// E2E Testing Constants
export /**
 *
 */
const E2E = {
  // Timeouts
  TIMEOUTS: {
    PAGE_LOAD: 2 * TIME.SECOND, // 2 seconds for page loads
    PAGE_RELOAD: 3 * TIME.SECOND, // 3 seconds for page reloads
    TABLEBASE_INIT: 3 * TIME.SECOND, // 3 seconds for tablebase initialization
    MODAL_APPEAR: 1 * TIME.SECOND, // 1 second for modals to appear
    ANIMATION: 500, // 500ms for animations
  },

  // Test Data
  DATA: {
    STORAGE_KEY: "chess-trainer-storage", // LocalStorage key for state persistence
    USER: {
      RATING: 1500, // Test user rating - Use RATING.TEST_RATING
      STREAK: 5, // Test user streak
    },
    MOVES: [
      { from: "e2", to: "e4", san: "e4" },
      { from: "e7", to: "e5", san: "e5" },
    ],
    COMPLETED_POSITIONS: [1, 2], // Test completed positions
    PREFERENCES: {
      theme: "light" as const,
      showCoordinates: false,
      animationSpeed: "fast" as const,
    },
  },

  // Selectors (data-testid based)
  SELECTORS: {
    // Navigation
    NAV: {
      TRAINING_LINK: '[data-testid="training-link"]',
      DASHBOARD_LINK: '[data-testid="nav-dashboard"]',
      NAVBAR: '[data-testid="navbar"]',
      NAVBAR_LOGO: '[data-testid="navbar-logo"]',
    },

    // Chess Board
    BOARD: '[data-testid="training-board"]',
    CHESSBOARD: '[data-testid="chessboard"]',
    /**
     *
     * @param square
     */
    SQUARE: (square: string) => `[data-square="${square}"]`,
    PIECE: "[data-piece]",

    // Training Controls
    BUTTONS: {
      RESET: '[data-testid="reset-button"]',
      HINT: '[data-testid="hint-button"]',
      SOLUTION: '[data-testid="solution-button"]',
      NEXT_POSITION: '[data-testid="next-position-button"]',
      PREVIOUS_POSITION: '[data-testid="previous-position-button"]',
      UNDO: '[data-testid="undo-button"]', // Future: Dedicated undo button
    },

    // Navigation Controls
    NAVIGATION: {
      FIRST: '[data-testid="nav-first"]',
      BACK: '[data-testid="nav-back"]', // Current: Navigation-based undo
      FORWARD: '[data-testid="nav-forward"]',
      LAST: '[data-testid="nav-last"]',
    },

    // Error Recovery Elements
    ERROR_RECOVERY: {
      TOAST: '.toast, [data-testid="toast"], .notification',
      MISTAKE_COUNTER: '[data-testid="mistake-counter"]',
      TABLEBASE_ERROR: '[data-testid="tablebase-error"]',
      RETRY_BUTTON: '[data-testid="retry-tablebase"]',
      WARNING_DIALOG: '[data-testid="warning-dialog"]',
    },

    // UI Elements
    EVALUATION_DISPLAY: '[data-testid="evaluation-display"]',
    MOVE_COUNTER: '[data-testid="move-counter"]',
    ANALYSIS_STATUS: '[data-testid="analysis-status"]',
    POSITION_DESCRIPTION: '[data-testid="position-description"]',
    LOADING_SPINNER: '[data-testid="loading-spinner"]',

    // Modals
    HINT_MODAL: '[data-testid="hint-modal"]',
    SOLUTION_MODAL: '[data-testid="solution-modal"]',
    PROMOTION_DIALOG: '[data-testid="promotion-dialog"]',
  },

  // Routes/URLs
  ROUTES: {
    HOME: "/",
    /**
     *
     * @param id
     */
    TRAIN: (id: number) => `/train/${id}`,
    DASHBOARD: "/dashboard",
  },

  // Expected Messages/Texts
  MESSAGES: {
    SUCCESS: {
      CORE_TRAINING_COMPLETE: "Core Training Workflow completed successfully",
      TABLEBASE_VERIFIED: "Tablebase initialization verified",
      STATE_PERSISTED: "State persistence test completed successfully",
      POSITION_PRESERVED: "Position navigation state preserved after reload",
      CORRUPTION_HANDLED: "App handles localStorage corruption gracefully",
      PREFERENCES_PERSISTED: "User preferences persisted across sessions",
      ERROR_RECOVERY_TESTED: "Error recovery functionality tested successfully",
      UNDO_FUNCTIONALITY_TESTED:
        "Undo functionality and state consistency verified",
      MISTAKE_TRACKING_TESTED: "Mistake tracking functionality verified",
      TABLEBASE_ERROR_RECOVERY_TESTED:
        "Tablebase error recovery scenarios tested",
    },
    ERRORS: {
      TABLEBASE_ERROR: /tablebase.*error/i,
      GENERIC_ERROR: /error/i,
      INVALID_MOVE: /invalid.*move/i,
      WARNING: /warning/i,
    },
    WARNINGS: {
      INVALID_MOVE: "Invalid move",
      BAD_MOVE: "Not the best move",
      MISTAKE: "Mistake detected",
    },
  },
} as const;

// Testing constants for test configuration
export /**
 *
 */
const TESTING = {
  DEFAULT_TIMEOUT: 1000, // 1 second default timeout for API calls
  POLL_INTERVAL: 50, // 50ms polling interval for status checks
} as const;

// System constants for platform services
export /**
 *
 */
const SYSTEM = {
  GB_TO_BYTES_FACTOR: 1024 * 1024 * 1024, // Conversion factor GB to bytes
  DEFAULT_MEMORY_GB: 4, // Default system memory allocation
  LOW_MEMORY_THRESHOLD_GB: 4, // Low memory warning threshold
} as const;

// Type utilities for constants
/**
 *
 */
export type StorageConstants = typeof STORAGE;
/**
 *
 */
export type CacheConstants = typeof CACHE;
/**
 *
 */
export type PerformanceConstants = typeof PERFORMANCE;
/**
 *
 */
export type UIConstants = typeof UI;
/**
 *
 */
export type ChessConstants = typeof CHESS;
/**
 *
 */
export type EvaluationConstants = typeof EVALUATION;
/**
 *
 */
export type TrainingConstants = typeof TRAINING;
/**
 *
 */
export type RatingConstants = typeof RATING;
/**
 *
 */
export type NetworkConstants = typeof NETWORK;
/**
 *
 */
export type TimeConstants = typeof TIME;
/**
 *
 */
export type AnimationConstants = typeof ANIMATION;
/**
 *
 */
export type DimensionsConstants = typeof DIMENSIONS;
/**
 *
 */
export type E2EConstants = typeof E2E;
