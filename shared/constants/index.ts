/**
 * Global constants for the Chess Endgame Trainer application
 * Centralizes all magic numbers and configuration values
 */

// Storage Constants
export const STORAGE = {
  PREFIX: 'chess_trainer_',
  MAX_SIZE_WEB: 100 * 1024 * 1024,      // 100MB for web
  MAX_SIZE_MOBILE: 50 * 1024 * 1024,    // 50MB for mobile
  COMPRESSION_THRESHOLD: 1024,           // 1KB - compress data larger than this
  CACHE_DURATION: 24 * 60 * 60 * 1000,   // 24 hours in milliseconds
} as const;

// Cache Constants
export const CACHE = {
  // Cache sizes
  EVALUATION_CACHE_SIZE: 200,            // Main evaluation cache in useEvaluation
  LRU_DEFAULT_SIZE: 1000,                // Default LRU cache size
  LRU_MEMORY_PER_ITEM: 350,              // Estimated bytes per cache item
  CHESS_AWARE_CACHE_SIZE: 100,           // Chess-aware cache default size
  TABLEBASE_CACHE_SIZE: 100,             // Tablebase results cache size
  
  // Cache timeouts
  TABLEBASE_CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes for tablebase cache
} as const;

// Performance Constants
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300,                   // 300ms default debounce
  THROTTLE_DELAY: 1000,                  // 1 second throttle
  BATCH_SIZE: 50,                        // Items to process in batch
  MAX_LOG_ENTRIES: 1000,                 // Maximum log entries in memory
  CACHE_SIZE: 100,                       // Maximum cached evaluations (deprecated - use CACHE constants)
} as const;

// Engine Constants
export const ENGINE = {
  // Timeouts
  WORKER_TERMINATION_TIMEOUT: 1000,      // 1 second to terminate worker
  DEFAULT_MOVE_TIMEOUT: 1000,            // 1 second default getBestMove timeout
  EVALUATION_TIMEOUT: 3000,              // 3 seconds for evaluation
  TIMEOUT_BUFFER: 1000,                  // 1 second buffer added to timeouts
  STALE_REQUEST_CLEANUP: 60000,          // 60 seconds for stale request cleanup
  WORKER_READY_TIMEOUT: 5000,            // 5 seconds for worker to be ready
  MAX_ENGINE_TIME: 2000,                 // 2 seconds max engine calculation time
  
  // Engine configuration
  MAX_INSTANCES: 5,                      // Maximum engine instances
  MAX_INIT_ATTEMPTS: 3,                  // Maximum initialization attempts
  DEFAULT_SEARCH_DEPTH: 15,              // Default engine search depth
  HASH_SIZE: 16,                         // Engine hash table size (MB)
  SKILL_LEVEL: 20,                       // Engine skill level (0-20)
  MAX_NODES: 100000,                     // Maximum nodes to search
  
  // Idle management
  IDLE_TIME: 5 * 60 * 1000,              // 5 minutes before marking as idle
  CLEANUP_INTERVAL: 60 * 1000,           // 1 minute cleanup check interval
} as const;

// UI Constants
export const UI = {
  ANIMATION_DURATION: 300,               // 300ms for animations
  TOAST_DURATION: 3000,                  // 3 seconds for toast messages
  TOAST_FADE_DURATION: 300,              // 300ms for toast fade animation
  TOUCH_TARGET_MIN: 44,                  // 44px minimum touch target
  BREAKPOINTS: {
    MOBILE: 640,                         // Mobile breakpoint
    TABLET: 1024,                        // Tablet breakpoint
    DESKTOP: 1280,                       // Desktop breakpoint
  },
} as const;

// Chess Constants
export const CHESS = {
  BOARD_SIZE: 8,
  STARTING_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  MAX_MOVES_HISTORY: 500,                // Maximum moves to keep in history
  FIFTY_MOVE_RULE: 50,                   // Draw by fifty-move rule
  THREEFOLD_REPETITION: 3,               // Draw by repetition
  TABLEBASE_PIECE_LIMIT: 7,              // Maximum pieces for tablebase lookup
  ENDGAME_PIECE_THRESHOLD: 7,            // Piece count threshold for endgame
} as const;

// Evaluation Constants
export const EVALUATION = {
  MATE_SCORE: 10000,                     // Score for checkmate
  WINNING_THRESHOLD: 200,                // Centipawns for winning advantage
  DRAWING_THRESHOLD: 50,                 // Centipawns for draw range
  BLUNDER_THRESHOLD: 300,                // Centipawns lost for blunder
  MISTAKE_THRESHOLD: 100,                // Centipawns lost for mistake
  INACCURACY_THRESHOLD: 50,              // Centipawns lost for inaccuracy
  TABLEBASE_TIMEOUT: 2000,               // 2 seconds for tablebase lookup
  
  // Critical position thresholds
  CRITICAL_SCORE_THRESHOLD: 500,         // Score threshold for critical positions
  CRITICAL_MISTAKE_THRESHOLD: 200,       // Threshold for critical mistakes
  TABLEBASE_SCORE_LIMIT: 3000,           // Limit for tablebase scores
  
  // Priority calculation
  BASE_PRIORITY: 100,                    // Base priority for positions
  CRITICAL_PRIORITY_BOOST: 200,          // Priority boost for critical positions
  ENDGAME_PRIORITY_FACTOR: 20,           // Factor for endgame priority
  
  // Win/Loss thresholds for mistake checking
  WIN_THRESHOLD: 300,                    // Positive score threshold for winning
  LOSS_THRESHOLD: -300,                  // Negative score threshold for losing
  MATE_THRESHOLD: 100000,                // Threshold for mate scores
} as const;

// Training Constants
export const TRAINING = {
  MIN_MOVES_FOR_COMPLETION: 3,           // Minimum moves to complete position
  SUCCESS_RATE_THRESHOLD: 0.8,           // 80% success rate
  REPETITION_INTERVALS: [1, 3, 7, 14, 30], // Days for spaced repetition
  MAX_HINTS: 3,                          // Maximum hints per position
  RATING_CHANGE_BASE: 32,                // ELO-like rating change
  DEFAULT_RATING: 1200,                  // Default user rating
  
  // Spaced repetition multipliers
  SUCCESS_MULTIPLIER: 2,                 // Interval multiplier on success
  FAILURE_MULTIPLIER: 1,                 // Interval multiplier on failure
} as const;

// Network Constants
export const NETWORK = {
  API_TIMEOUT: 10000,                    // 10 seconds API timeout
  TABLEBASE_API_TIMEOUT: 5000,           // 5 seconds for tablebase API
  RETRY_COUNT: 3,                        // Number of retries
  RETRY_DELAY: 1000,                     // 1 second between retries
  BATCH_UPLOAD_SIZE: 10,                 // Items to upload in batch
} as const;

// Time Constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;


// Type utilities for constants
export type StorageConstants = typeof STORAGE;
export type CacheConstants = typeof CACHE;
export type PerformanceConstants = typeof PERFORMANCE;
export type EngineConstants = typeof ENGINE;
export type UIConstants = typeof UI;
export type ChessConstants = typeof CHESS;
export type EvaluationConstants = typeof EVALUATION;
export type TrainingConstants = typeof TRAINING;
export type NetworkConstants = typeof NETWORK;
export type TimeConstants = typeof TIME;