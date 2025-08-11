/**
 * Centralized UI messages for consistent testing
 * Import these in both components and tests to avoid fragile string matching
 */

import { deepFreezeConst } from "../utils/deepFreeze";

export /**
 *
 */
const TEST_MESSAGES = deepFreezeConst({
  // Loading states
  LOADING: {
    DEFAULT: "Loading...",
    POSITION: "Loading position...",
    TABLEBASE: "Initializing tablebase...",
    TRAINING: "Loading training session...",
  },

  // Error states
  ERROR: {
    GENERIC: "Something went wrong. Please try again.",
    POSITION_NOT_FOUND: "Position not found",
    FAILED_TO_LOAD: "Failed to load training position. Please try again.",
    TABLEBASE_INIT: "Failed to initialize tablebase",
    NETWORK: "Network error. Please check your connection.",
    INVALID_ID: "Invalid position ID",
  },

  // Success states
  SUCCESS: {
    POSITION_LOADED: "Position loaded successfully",
    TABLEBASE_READY: "Tablebase ready",
    MOVE_COMPLETED: "Move completed",
  },

  // Navigation
  NAVIGATION: {
    NEXT_POSITION: "Next Position",
    PREVIOUS_POSITION: "Previous Position",
  },

  // Training specific
  TRAINING: {
    COMPLETED: "Training completed!",
    IN_PROGRESS: "Training in progress",
    PAUSED: "Training paused",
    YOUR_TURN: "Your turn",
    THINKING: "Thinking...",
  },

  // Tablebase states
  TABLEBASE: {
    IDLE: "Tablebase idle",
    ANALYZING: "Analyzing position...",
    CALCULATING: "Calculating best move...",
    READY: "Tablebase ready",
  },

  // Validation messages
  VALIDATION: {
    INVALID_FEN: "Invalid chess position",
    ILLEGAL_MOVE: "Illegal move",
    GAME_OVER: "Game over",
  },
} as const);

/**
 * Helper function to get timeout values based on environment
 */
export function getTestTimeout(): number {
  const isCI =
    process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  return isCI ? 5000 : 2000;
}

/**
 * Helper to create consistent error objects for testing
 * @param message
 * @param code
 */
export function createTestError(message: string, code?: string): Error {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
}

/**
 * Type-safe message getter with fallback
 * Uses optional chaining and type narrowing for robustness
 * @param path
 * @param fallback
 */
export function getMessage(path: string, fallback = "Unknown message"): string {
  const keys = path.split(".");
  let current: unknown = TEST_MESSAGES;

  try {
    for (const key of keys) {
      // Type narrowing with proper checks
      if (
        current !== null &&
        current !== undefined &&
        typeof current === "object" &&
        key in current
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn(`Message not found: ${path}`);
        }
        return fallback;
      }
    }

    // Final type check
    return typeof current === "string" ? current : fallback;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Error accessing message: ${path}`, error);
    }
    return fallback;
  }
}
