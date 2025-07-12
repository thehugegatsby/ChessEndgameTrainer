/**
 * E2E Test Constants
 * Used by next.config.js to inject test configuration into browser context
 */

const SELECTORS = {
  BOARD: '[data-testid="training-board"], .react-chessboard, #chessboard',
  SQUARE: '[data-square="{square}"]',
  PIECE: '[data-piece]',
  MOVE_HIGHLIGHT: '[data-highlight="true"]',
  LEGAL_MOVES: '.highlight-legal',
  ENGINE_PANEL: '[data-testid="engine-panel"]',
  POSITION_INFO: '[data-testid="position-info"]'
};

const TIMEOUTS = {
  DEFAULT: 30000,
  NAVIGATION: 60000,
  WAIT_FOR_SELECTOR: 30000,
  ENGINE_RESPONSE: 15000,
  ANIMATION: 2000,
  DEBOUNCE: 300
};

const TEST_BRIDGE = {
  ENABLED: true,
  NAMESPACE: 'e2e_test',
  FUNCTIONS: {
    MAKE_MOVE: 'e2e_makeMove',
    GET_FEN: 'getCurrentFen',
    SET_POSITION: 'setPosition',
    GET_GAME_STATE: 'getGameState'
  }
};

const NAVIGATION_CONFIG = {
  RETRIES: 3,
  DELAY_MS: 500,
  BACKOFF_FACTOR: 1.5
};

const ERROR_MESSAGES = {
  BOARD_NOT_FOUND: 'Chess board not found',
  INVALID_MOVE: 'Invalid move attempted',
  TIMEOUT: 'Operation timed out',
  ENGINE_ERROR: 'Engine evaluation failed'
};

const LOG_CONTEXTS = {
  MOVE: 'E2E_MOVE',
  NAVIGATION: 'E2E_NAV',
  ENGINE: 'E2E_ENGINE',
  VALIDATION: 'E2E_VALIDATION'
};

const RETRY_CONFIG = {
  DEFAULT_ATTEMPTS: 3,
  DELAY_MS: 500,
  BACKOFF_FACTOR: 1.5
};

const PERFORMANCE = {
  MOVE_DEBOUNCE: 300,
  ENGINE_DEBOUNCE: 300,
  MAX_RETRIES: 3
};

const VALIDATION = {
  FEN_PATTERN: /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s(-|[KQkq]+)\s(-|[a-h][36])\s\d+\s\d+$/,
  SQUARE_PATTERN: /^[a-h][1-8]$/
};

const FEATURES = {
  MOCK_ENGINE: true,
  INSTANT_MOVES: true,
  DETERMINISTIC_RESPONSES: true
};

const ANIMATION = {
  MOVE_DURATION: 200,
  HIGHLIGHT_DURATION: 100
};

const ACTIVE_MOVE_INDICATORS = {
  LAST_MOVE: '[data-testid="last-move"]',
  CURRENT_MOVE: '[data-testid="current-move"]'
};

const HIGHLIGHT_INDICATORS = {
  LEGAL_MOVES: '[data-highlight="legal"]',
  SELECTED_SQUARE: '[data-highlight="selected"]',
  CHECK: '[data-highlight="check"]'
};

const TEST_DATA = {
  STARTING_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  SAMPLE_ENDGAME: 'k7/8/8/8/8/8/P7/K7 w - - 0 1'
};

module.exports = {
  SELECTORS,
  TIMEOUTS,
  TEST_BRIDGE,
  NAVIGATION_CONFIG,
  ERROR_MESSAGES,
  LOG_CONTEXTS,
  RETRY_CONFIG,
  PERFORMANCE,
  VALIDATION,
  FEATURES,
  ANIMATION,
  ACTIVE_MOVE_INDICATORS,
  HIGHLIGHT_INDICATORS,
  TEST_DATA
};