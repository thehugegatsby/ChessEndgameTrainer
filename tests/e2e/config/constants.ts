/**
 * E2E Test Constants
 * Central configuration for all E2E test timing, selectors, and behavior
 */

// Environment-specific timeout profiles
export const TIMEOUT_PROFILES = {
  development: {
    default: 5000,
    short: 1000,
    medium: 3000,
    long: 10000,
    move: 5000,
    position: 8000,
    navigation: 2000,
    retry: 500,
    debounce: 100,
    poll: 100
  },
  testing: {
    default: 3000,
    short: 500,
    medium: 1500,
    long: 5000,
    move: 3000,
    position: 4000,
    navigation: 1000,
    retry: 200,
    debounce: 50,
    poll: 50
  },
  ci: {
    default: 10000,
    short: 2000,
    medium: 5000,
    long: 15000,
    move: 8000,
    position: 12000,
    navigation: 3000,
    retry: 1000,
    debounce: 200,
    poll: 200
  }
} as const;

// Get current environment (default to development)
const getEnvironment = (): keyof typeof TIMEOUT_PROFILES => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'test') return 'testing';
  if (env === 'ci') return 'ci';
  return 'development';
};

// Current active timeouts
export const TIMEOUTS = TIMEOUT_PROFILES[getEnvironment()];

// Selector priorities for hybrid strategy
export const SELECTORS = {
  MOVE_LIST: {
    PRIMARY: '[data-testid="move-list"]',
    SECONDARY: '.move-list',
    TERTIARY: '#move-list',
    FALLBACK: '[role="list"]'
  },
  MOVE_ITEM: {
    PRIMARY: '[data-testid="move-item"]',
    SECONDARY: '[data-move-number]',
    TERTIARY: '.move-item',
    QUATERNARY: '.move',
    FALLBACK: 'li'
  },
  CHESS_BOARD: {
    PRIMARY: '[data-testid="training-board"]',
    SECONDARY: '.react-chessboard',
    TERTIARY: '#chessboard',
    FALLBACK: '[data-testid="chess-board"]'
  },
  CHESS_SQUARE: {
    PRIMARY: '[data-square="{square}"]',
    SECONDARY: '[data-testid="chess-square-{square}"]',
    TERTIARY: '.chess-square-{square}',
    FALLBACK: '[id="square-{square}"]'
  }
} as const;

// Active move indicators (ordered by priority)
export const ACTIVE_MOVE_INDICATORS = [
  '[data-active="true"]',
  '.move-active',
  '.active-move',
  '.current-move',
  '[aria-current="true"]',
  '[class*="active"]'
] as const;

// Highlight indicators for chess squares
export const HIGHLIGHT_INDICATORS = [
  '[data-highlight="true"]',
  '.highlight-legal',
  '.legal-move',
  '.highlighted',
  '.square-highlight',
  '[class*="highlight"]'
] as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 500,
  EXPONENTIAL_BASE: 2,
  MAX_DELAY: 5000,
  JITTER_FACTOR: 0.1
} as const;

// Performance thresholds
export const PERFORMANCE = {
  LARGE_MOVE_LIST_SIZE: 50,
  RAPID_MOVE_THRESHOLD: 10,
  MAX_OPERATION_TIME: 5000,
  DEBOUNCE_WINDOW: 100,
  POLL_INTERVAL_MIN: 50,
  POLL_INTERVAL_MAX: 500,
  EXPONENTIAL_BACKOFF_FACTOR: 1.2
} as const;

// Test data configuration
export const TEST_DATA = {
  DEFAULT_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  SAMPLE_MOVES: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'd6', 'O-O', 'Nf6'] as const,
  COMPLEX_MOVES: ['O-O', 'O-O-O', 'Qxd5+', 'Nf6#', 'a8=Q+'] as const,
  MOCK_BATCH_SIZE: 10,
  RAPID_UPDATE_COUNT: 10,
  RAPID_UPDATE_DELAY: 100
} as const;

// Error messages
export const ERROR_MESSAGES = {
  MOVE_NOT_FOUND: 'Move {moveNumber} not found in move list',
  ELEMENT_DISAPPEARED: 'Move element {moveNumber} disappeared before click',
  NAVIGATION_FAILED: 'Move element disappeared after click - possible navigation failure',
  NO_MOVES_AVAILABLE: 'No moves available to navigate to',
  INVALID_SELECTOR: 'Element not found with selectors: {primary} or {fallback}',
  TIMEOUT_EXCEEDED: 'Condition not met within {timeout}ms timeout',
  OPERATION_FAILED: 'Operation failed after {retries} attempts'
} as const;

// Logging contexts
export const LOG_CONTEXTS = {
  MOVE_LIST: 'MoveListComponent',
  BOARD: 'BoardComponent',
  BASE: 'BaseComponent',
  TEST_BRIDGE: 'TestBridge',
  MOCK_ENGINE: 'MockEngine'
} as const;

// Test Bridge configuration
export const TEST_BRIDGE = {
  BRIDGE_NAME: '__E2E_TEST_BRIDGE__',
  ENGINE_METHODS: {
    SET_POSITION: 'setPosition',
    GET_CURRENT_FEN: 'getCurrentFen',
    MAKE_MOVE: 'makeMove'
  },
  DIAGNOSTIC_METHODS: {
    GET_CURRENT_FEN: 'getCurrentFen',
    GET_GAME_STATE: 'getGameState',
    GET_MOVE_COUNT: 'getMoveCount'
  }
} as const;

// Animation frame timing
export const ANIMATION = {
  FRAME_DELAY: 16, // ~60fps
  SMOOTH_SCROLL_DURATION: 300,
  FADE_TRANSITION: 200,
  HOVER_DELAY: 100
} as const;

// Validation patterns
export const VALIDATION = {
  SQUARE_PATTERN: /^[a-h][1-8]$/,
  MOVE_PATTERN: /^[a-zA-Z0-9+#=\-O]+$/,
  FEN_PARTS_MIN: 4,
  PIECE_NOTATION_LENGTH: 2
} as const;

// Feature flags for different test environments
export const FEATURES = {
  ENABLE_LOGGING: process.env.NODE_ENV !== 'production',
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_MOCK_ENGINE: process.env.NODE_ENV === 'test',
  ENABLE_VISUAL_DEBUGGING: process.env.NODE_ENV === 'development'
} as const;