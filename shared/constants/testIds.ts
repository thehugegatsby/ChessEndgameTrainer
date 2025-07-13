/**
 * Centralized Test IDs for E2E Testing
 * 
 * This file serves as the single source of truth for all data-testid attributes
 * used throughout the application. It ensures consistency between UI components
 * and E2E tests while providing type safety and better maintainability.
 */

export const TEST_IDS = {
  MOVE_PANEL: {
    CONTAINER: 'move-list', // Semantic name for the move list container
    ITEM: 'move-item',
    EVALUATION: 'move-evaluation',
    EVAL_SCORE: 'eval-score'
  },
  NAVIGATION: {
    FIRST: 'nav-first',
    BACK: 'nav-back',
    FORWARD: 'nav-forward',
    LAST: 'nav-last',
    TRAINING_LINK: 'training-link'
  },
  CONTROLS: {
    UNDO: 'undo-button'
  },
  CHESS: {
    TRAINING_BOARD: 'training-board',
    CHESSBOARD: 'chessboard'
  },
  LESSONS: {
    START_BUTTON: 'lesson-start'
  }
} as const;

/**
 * Helper function to create dynamic test IDs with consistent formatting
 * @param base - The base test ID from TEST_IDS
 * @param suffix - A unique identifier (index, id, etc.)
 * @returns Formatted test ID string
 */
export const getTestId = (base: string, suffix: string | number): string => {
  return `${base}-${suffix}`;
};

// Type exports for strict type safety
export type TestIds = typeof TEST_IDS;
export type TestIdValue = string;