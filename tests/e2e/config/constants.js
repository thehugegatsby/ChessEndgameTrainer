/**
 * E2E Test Constants for Build-Time Injection
 * This is a JavaScript file to allow importing in next.config.js
 * TypeScript files can import this and will have full type inference
 */

// Environment-specific timeout profiles
const TIMEOUT_PROFILES = {
  development: {
    default: 5000,
    short: 1000,
    medium: 3000,
    long: 10000,
    move: 5000,
    position: 8000,
    navigation: 2000,
    navigationAction: 2000,
    stateSyncWait: 3000,
    disabledCheck: 1000,
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
    navigationAction: 1000,
    stateSyncWait: 2000,
    disabledCheck: 500,
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
    navigationAction: 3000,
    stateSyncWait: 5000,
    disabledCheck: 2000,
    retry: 1000,
    debounce: 200,
    poll: 200
  }
};

// Get current environment (default to development)
const getEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'test') return 'testing';
  if (env === 'ci') return 'ci';
  return 'development';
};

// Current active timeouts
const TIMEOUTS = TIMEOUT_PROFILES[getEnvironment()];

// Selector priorities for hybrid strategy
const SELECTORS = {
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
  },
  EVALUATION_PANEL: {
    PRIMARY: '[data-testid="evaluation-panel"]',
    SECONDARY: '.evaluation-panel',
    TERTIARY: '#evaluation-panel',
    FALLBACK: '[role="region"][aria-label*="evaluation"]'
  },
  EVALUATION_VALUE: {
    PRIMARY: '[data-testid="evaluation-value"]',
    SECONDARY: '[data-evaluation]',
    TERTIARY: '.evaluation-value',
    FALLBACK: '.evaluation'
  },
  BEST_MOVE: {
    PRIMARY: '[data-testid="best-move"]',
    SECONDARY: '[data-best-move]',
    TERTIARY: '.best-move',
    FALLBACK: '.engine-move'
  },
  SEARCH_DEPTH: {
    PRIMARY: '[data-testid="search-depth"]',
    SECONDARY: '[data-depth]',
    TERTIARY: '.search-depth',
    FALLBACK: '.depth'
  },
  THINKING_INDICATOR: {
    PRIMARY: '[data-testid="engine-thinking"]',
    SECONDARY: '[data-thinking="true"]',
    TERTIARY: '.engine-thinking',
    FALLBACK: '.thinking'
  },
  NAVIGATION_CONTROLS: {
    GO_TO_START: {
      PRIMARY: '[role="button"][aria-label*="start"]',
      SECONDARY: '[data-testid="nav-start"]',
      TERTIARY: '[data-testid="nav-first"]',
      FALLBACK: 'button[title*="start"]'
    },
    GO_BACK: {
      PRIMARY: '[role="button"][aria-label*="back"]',
      SECONDARY: '[data-testid="nav-back"]',
      TERTIARY: '[data-testid="nav-previous"]',
      FALLBACK: 'button[title*="back"]'
    },
    GO_FORWARD: {
      PRIMARY: '[role="button"][aria-label*="forward"]',
      SECONDARY: '[data-testid="nav-forward"]',
      TERTIARY: '[data-testid="nav-next"]',
      FALLBACK: 'button[title*="forward"]'
    },
    GO_TO_END: {
      PRIMARY: '[role="button"][aria-label*="end"]',
      SECONDARY: '[data-testid="nav-end"]',
      TERTIARY: '[data-testid="nav-last"]',
      FALLBACK: 'button[title*="end"]'
    }
  }
};

// Active move indicators (ordered by priority)
const ACTIVE_MOVE_INDICATORS = [
  '[data-active="true"]',
  '.move-active',
  '.active-move',
  '.current-move',
  '[aria-current="true"]',
  '[class*="active"]'
];

// Highlight indicators for chess squares
const HIGHLIGHT_INDICATORS = [
  '[data-highlight="true"]',
  '.highlight-legal',
  '.legal-move',
  '.highlighted',
  '.square-highlight',
  '[class*="highlight"]'
];

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 500,
  EXPONENTIAL_BASE: 2,
  MAX_DELAY: 5000,
  JITTER_FACTOR: 0.1
};

// Performance thresholds
const PERFORMANCE = {
  LARGE_MOVE_LIST_SIZE: 50,
  RAPID_MOVE_THRESHOLD: 10,
  MAX_OPERATION_TIME: 5000,
  DEBOUNCE_WINDOW: 100,
  POLL_INTERVAL_MIN: 50,
  POLL_INTERVAL_MAX: 500,
  EXPONENTIAL_BACKOFF_FACTOR: 1.2
};

// Test data configuration
const TEST_DATA = {
  DEFAULT_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  SAMPLE_MOVES: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'd6', 'O-O', 'Nf6'],
  COMPLEX_MOVES: ['O-O', 'O-O-O', 'Qxd5+', 'Nf6#', 'a8=Q+'],
  MOCK_BATCH_SIZE: 10,
  RAPID_UPDATE_COUNT: 10,
  RAPID_UPDATE_DELAY: 100
};

// Error messages
const ERROR_MESSAGES = {
  MOVE_NOT_FOUND: 'Move {moveNumber} not found in move list',
  ELEMENT_DISAPPEARED: 'Move element {moveNumber} disappeared before click',
  NAVIGATION_FAILED: 'Move element disappeared after click - possible navigation failure',
  NO_MOVES_AVAILABLE: 'No moves available to navigate to',
  INVALID_SELECTOR: 'Element not found with selectors: {primary} or {fallback}',
  TIMEOUT_EXCEEDED: 'Condition not met within {timeout}ms timeout',
  OPERATION_FAILED: 'Operation failed after {retries} attempts',
  NAVIGATION_BUTTON_NOT_FOUND: 'Navigation button "{button}" not found with any selector',
  NAVIGATION_ALREADY_AT_BOUNDARY: 'Cannot navigate {direction}: already at {position}',
  NAVIGATION_STATE_SYNC_FAILED: 'Navigation state synchronization failed after {timeout}ms',
  NAVIGATION_EMPTY_GAME: 'Cannot navigate: game has no moves',
  NAVIGATION_DISABLED_BUTTON: 'Navigation button "{button}" is disabled'
};

// Logging contexts
const LOG_CONTEXTS = {
  MOVE_LIST: 'MoveListComponent',
  BOARD: 'BoardComponent',
  EVALUATION_PANEL: 'EvaluationPanel',
  NAVIGATION_CONTROLS: 'NavigationControls',
  BASE: 'BaseComponent',
  TEST_BRIDGE: 'TestBridge',
  MOCK_ENGINE: 'MockEngine',
  APP_DRIVER: 'AppDriver'
};

// Test Bridge configuration
const TEST_BRIDGE = {
  BRIDGE_NAME: '__E2E_TEST_BRIDGE__',
  ENGINE_METHODS: {
    SET_POSITION: 'setPosition',
    GET_CURRENT_FEN: 'getCurrentFen',
    MAKE_MOVE: 'makeMove'
  },
  DIAGNOSTIC_METHODS: {
    GET_CURRENT_FEN: 'getCurrentFen',
    GET_GAME_STATE: 'getGameState',
    GET_MOVE_COUNT: 'getMoveCount',
    GET_CURRENT_MOVE_INDEX: 'getCurrentMoveIndex',
    GET_TOTAL_MOVES: 'getTotalMoves',
    IS_AT_START: 'isAtStart',
    IS_AT_END: 'isAtEnd'
  }
};

// Animation frame timing
const ANIMATION = {
  FRAME_DELAY: 16, // ~60fps
  SMOOTH_SCROLL_DURATION: 300,
  FADE_TRANSITION: 200,
  HOVER_DELAY: 100
};

// Validation patterns
const VALIDATION = {
  SQUARE_PATTERN: /^[a-h][1-8]$/,
  MOVE_PATTERN: /^[a-zA-Z0-9+#=\-O]+$/,
  FEN_PARTS_MIN: 4,
  PIECE_NOTATION_LENGTH: 2
};

// Feature flags for different test environments
const FEATURES = {
  ENABLE_LOGGING: process.env.NODE_ENV !== 'production',
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_MOCK_ENGINE: process.env.NODE_ENV === 'test',
  ENABLE_VISUAL_DEBUGGING: process.env.NODE_ENV === 'development'
};

// Navigation-specific configuration
const NAVIGATION_CONFIG = {
  BUTTONS: ['start', 'back', 'forward', 'end'],
  DISABLED_ATTRIBUTES: ['disabled', 'aria-disabled'],
  STATE_SYNC_EVENTS: ['moveChanged', 'positionChanged', 'gameUpdated'],
  BOUNDARY_POSITIONS: {
    START: 0,
    END: -1 // -1 indicates last move
  },
  RAPID_NAVIGATION_THRESHOLD: 3, // clicks per second
  DEBOUNCE_RAPID_NAVIGATION: true,
  VALIDATE_STATE_AFTER_NAVIGATION: true
};

// Export all constants for use in both Node.js and browser contexts
module.exports = {
  TIMEOUT_PROFILES,
  TIMEOUTS,
  SELECTORS,
  ACTIVE_MOVE_INDICATORS,
  HIGHLIGHT_INDICATORS,
  RETRY_CONFIG,
  PERFORMANCE,
  TEST_DATA,
  ERROR_MESSAGES,
  LOG_CONTEXTS,
  TEST_BRIDGE,
  ANIMATION,
  VALIDATION,
  FEATURES,
  NAVIGATION_CONFIG
};