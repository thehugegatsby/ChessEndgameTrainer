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

// Performance Constants
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300,                   // 300ms default debounce
  THROTTLE_DELAY: 1000,                  // 1 second throttle
  BATCH_SIZE: 50,                        // Items to process in batch
  MAX_LOG_ENTRIES: 1000,                 // Maximum log entries in memory
  CACHE_SIZE: 100,                       // Maximum cached evaluations
} as const;

// UI Constants
export const UI = {
  ANIMATION_DURATION: 300,               // 300ms for animations
  TOAST_DURATION: 3000,                  // 3 seconds for toast messages
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
} as const;

// Training Constants
export const TRAINING = {
  MIN_MOVES_FOR_COMPLETION: 3,           // Minimum moves to complete position
  SUCCESS_RATE_THRESHOLD: 0.8,           // 80% success rate
  REPETITION_INTERVALS: [1, 3, 7, 14, 30], // Days for spaced repetition
  MAX_HINTS: 3,                          // Maximum hints per position
  RATING_CHANGE_BASE: 32,                // ELO-like rating change
} as const;

// Network Constants
export const NETWORK = {
  API_TIMEOUT: 10000,                    // 10 seconds API timeout
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
export type PerformanceConstants = typeof PERFORMANCE;
export type UIConstants = typeof UI;
export type ChessConstants = typeof CHESS;
export type EvaluationConstants = typeof EVALUATION;
export type TrainingConstants = typeof TRAINING;
export type NetworkConstants = typeof NETWORK;
export type TimeConstants = typeof TIME;