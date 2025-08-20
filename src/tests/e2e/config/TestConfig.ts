/**
 * Central configuration for E2E tests
 * 
 * All timeouts, selectors, and test constants in one place
 * for easy maintenance and consistency across test suite.
 */

export const TestConfig = {
  // Timeouts
  timeouts: {
    /** Short wait for UI state changes */
    short: 1000,
    /** Medium wait for board operations */
    medium: 3000,
    /** Long wait for page loads and complex operations */
    long: 5000,
    /** Very long wait for complete workflows */
    veryLong: 10000,
    /** Maximum wait for critical operations */
    critical: 15000,
    /** Performance benchmark - page should load within this time */
    performanceMax: 10000,
    /** Complete workflow timeout */
    workflowMax: 60000,
  },

  // URLs and Navigation
  urls: {
    home: '/',
    training: '/training',
  },

  // Chess Board Selectors (priority order for fallback)
  selectors: {
    board: {
      container: '[data-testid="training-board"]',
      square: (square: string) => `[data-testid="square-${square}"], [data-square="${square}"], .square-${square}`,
      piece: '[data-piece], .piece, img',
      pieceOnSquare: (square: string) => `${TestConfig.selectors.board.square(square)} ${TestConfig.selectors.board.piece}`,
    },
    
    training: {
      streakCounter: {
        primary: '[data-testid="current-streak"], .streak-counter',
        fallback: ['text=Serie', 'text=Streak', ':has-text("Serie")', ':has-text("Streak")']
      },
      feedback: '[data-testid="move-feedback"], .feedback-message, .toast, .move-analysis',
      nextButton: {
        primary: '[data-testid="next-position"]',
        fallback: ['button[title="Nächste Stellung"]', 'text=Nächste Stellung', 'button:has-text("Nächste Stellung")', 'text=Nächste', 'button:has-text("Nächste")']
      },
      positionInfo: '[data-testid="position-info"], .position-info',
      completionModal: '.completion-modal, [data-testid="training-complete"]',
    },

    promotion: {
      dialog: '[data-testid*="promotion"], .promotion-dialog',
      piece: (piece: string) => `[data-testid="promotion-${piece}"], [data-piece="${piece}"], .promotion-${piece}`,
    },

    loading: {
      indicators: '.loading, [data-loading="true"], .opponent-thinking, [data-loading="opponent"], .thinking',
      boardLoading: '.board-loading, [data-testid="board-loading"]',
    },

    errors: {
      general: '.error, .alert-error, [data-testid*="error"]',
      critical: '.error-critical, .alert-danger',
    },
  },

  // Test Data
  testData: {
    positions: {
      default: 1,
      second: 2,
      pawnPromotion: 3, // Position with pawn promotion opportunity
    },
    
    moves: {
      // CORRECTED: Position 1 (Opposition Grundlagen) has King on e6, Pawn on e5
      // Best move is Kd6 (take opposition), alternative is e6 (pawn advance)
      simple: { from: 'e6', to: 'd6' }, // Kd6 - optimal move for position 1
      pawnAdvance: { from: 'e5', to: 'e6' }, // Alternative: pawn advance
      promotion: { from: 'e7', to: 'e8', promotion: 'q' as const },
      
      // Position-specific moves for better testing
      position1: { from: 'e6', to: 'd6' }, // Kd6 for Opposition Grundlagen  
      position2: { from: 'e5', to: 'd5' }, // Kd5 for Advanced KPK
    },
  },

  // Error Filtering
  errorFilters: {
    /** Non-critical errors to ignore in tests */
    ignoredErrors: [
      'ResizeObserver',
      'TestBridge', 
      'favicon',
      'Non-Error promise rejection captured',
    ],
  },

  // Performance Thresholds
  performance: {
    maxLoadTime: 10000,
    maxBoardReadyTime: 5000,
    maxMoveTime: 3000,
  },

  // Chess-specific constants
  chess: {
    totalSquares: 64,
    minSquaresForReady: 32,
    files: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ranks: ['1', '2', '3', '4', '5', '6', '7', '8'],
    pieces: {
      queen: 'q',
      rook: 'r', 
      bishop: 'b',
      knight: 'n',
    },
  },
} as const;

// Type definitions for better TypeScript support
export type ChessPiece = typeof TestConfig.chess.pieces[keyof typeof TestConfig.chess.pieces];
export type InteractionMethod = 'click' | 'drag';

/**
 * Chess position validation utility
 */
export const isValidSquare = (square: string): boolean => {
  if (square.length !== 2) return false;
  const file = square[0];
  const rank = square[1];
  return TestConfig.chess.files.includes(file) && TestConfig.chess.ranks.includes(rank);
};

/**
 * Get selector with fallback priority
 * @param selectorPath Path to selector in config (e.g., 'board.container')
 */
export const getSelector = (selectorPath: string): string => {
  const path = selectorPath.split('.');
  let selector: any = TestConfig.selectors;
  
  for (const key of path) {
    selector = selector[key];
    if (!selector) {
      throw new Error(`Invalid selector path: ${selectorPath}`);
    }
  }
  
  return typeof selector === 'string' ? selector : selector.toString();
};

/**
 * Selector configuration type for elements with fallback strategies
 */
export type SelectorConfig = string | {
  primary: string;
  fallback: string[];
};

/**
 * Try multiple selectors with fallback strategy
 * Returns the first working locator
 */
export const createLocatorWithFallback = (page: any, selectorConfig: SelectorConfig) => {
  if (typeof selectorConfig === 'string') {
    return page.locator(selectorConfig).first();
  }
  
  // For complex selectors, try primary first, then fallbacks
  const { primary, fallback } = selectorConfig;
  
  return {
    async waitFor(options?: any) {
      let lastError: Error | null = null;
      
      // Try primary selector first
      try {
        const primaryLocator = page.locator(primary).first();
        await primaryLocator.waitFor({ ...options, timeout: Math.min(options?.timeout || 5000, 2000) });
        return primaryLocator;
      } catch (error) {
        lastError = error as Error;
      }
      
      // Try fallback selectors
      for (const selector of fallback) {
        try {
          const fallbackLocator = page.locator(selector).first();
          await fallbackLocator.waitFor({ ...options, timeout: Math.min(options?.timeout || 5000, 1000) });
          return fallbackLocator;
        } catch (error) {
          lastError = error as Error;
        }
      }
      
      // If all failed, throw the last error
      throw lastError || new Error(`No selector found for: ${primary}`);
    },
    
    async click() {
      const locator = await this.waitFor();
      return locator.click();
    },
    
    async textContent() {
      const locator = await this.waitFor();
      return locator.textContent();
    },
    
    async isVisible() {
      try {
        await this.waitFor({ timeout: 1000 });
        return true;
      } catch {
        return false;
      }
    }
  };
};