/**
 * @fileoverview MoveListComponent - Move list abstraction for E2E testing
 * @description Implements move navigation, click interactions, and state synchronization
 */

import { Page, Locator } from '@playwright/test';
import { BaseComponent, BaseComponentConfig } from './BaseComponent';
import { TIMEOUTS, SELECTORS, ACTIVE_MOVE_INDICATORS, ERROR_MESSAGES, LOG_CONTEXTS, PERFORMANCE } from '../config/constants';
import { getLogger, ILogger } from '../../../shared/services/logging';

/**
 * Configuration for MoveListComponent
 */
export interface MoveListComponentConfig extends BaseComponentConfig {
  /** Timeout for waiting for move updates */
  moveTimeout?: number;
  /** Enable move validation */
  enableMoveValidation?: boolean;
}

/**
 * Chess move representation for move list interactions
 * Detailed interface for future extensibility (consensus recommendation)
 */
export interface Move {
  /** Move number (1-based) */
  moveNumber: number;
  /** SAN notation (e.g., 'e4', 'Nf3', 'O-O') */
  san: string;
  /** UCI notation (e.g., 'e2e4', 'g1f3') */
  uci?: string;
  /** Source square */
  from?: string;
  /** Target square */
  to?: string;
  /** Promotion piece if applicable */
  promotion?: string;
  /** Move color */
  color: 'white' | 'black';
  /** Half-move number for navigation */
  halfMove: number;
  /** Evaluation after this move */
  evaluation?: number;
  /** Whether this is the current active move */
  isActive?: boolean;
}

/**
 * MoveList Component Object for move list interactions
 * Implements consensus recommendations from Gemini and O3
 */
export class MoveListComponent extends BaseComponent {
  private readonly moveTimeout: number;
  private readonly enableMoveValidation: boolean;

  constructor(
    page: Page,
    rootSelector?: string,
    config: MoveListComponentConfig = {}
  ) {
    super(page, rootSelector, config);
    this.moveTimeout = config.moveTimeout ?? 5000;
    this.enableMoveValidation = config.enableMoveValidation ?? true;
  }

  /**
   * Default selector for move list container
   * Implements abstract method from BaseComponent
   * Updated to support both old and new selectors for compatibility
   */
  getDefaultSelector(): string {
    return '[data-testid="move-list"], [data-testid="move-panel"], .move-list, #move-list, [role="list"]';
  }

  /**
   * Get all moves from the move list
   * Uses hybrid selector strategy with polling-based synchronization
   */
  async getMoves(): Promise<Move[]> {
    this.log('info', 'Getting all moves from move list');
    
    try {
      const moves: Move[] = [];
      const moveElements = await this.getMoveElements();
      
      for (let i = 0; i < moveElements.length; i++) {
        const element = moveElements[i];
        const move = await this.parseMoveFromElement(element, i);
        if (move) {
          moves.push(move);
        }
      }
      
      this.log('info', `Found ${moves.length} moves in move list`);
      return moves;
      
    } catch (error) {
      this.log('error', 'Failed to get moves', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Get the last move from the move list
   * Essential for training flow validation
   */
  async getLastMove(): Promise<Move | null> {
    this.log('info', 'Getting last move from move list');
    
    try {
      const moves = await this.getMoves();
      const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;
      
      if (lastMove) {
        this.log('info', `Last move: ${lastMove.san}`, { move: lastMove });
      } else {
        this.log('info', 'No moves found in move list');
      }
      
      return lastMove;
      
    } catch (error) {
      this.log('error', 'Failed to get last move', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get the total count of moves in the move list
   * Required by AppDriver for UI synchronization
   * OPTIMIZED: First check data-attribute for immediate store state
   */
  async getMoveCount(): Promise<number> {
    this.log('info', 'Getting move count from move list');
    
    try {
      // First try to get count from data-attribute (immediate store state)
      const movePanel = await this.page.locator('[data-testid="move-panel"]').first();
      if (await movePanel.count() > 0) {
        const dataCount = await movePanel.getAttribute('data-move-count');
        if (dataCount !== null) {
          const count = parseInt(dataCount, 10);
          this.log('info', `Move count from data-attribute: ${count}`);
          return count;
        }
      }
      
      // Fallback to counting DOM elements
      const moves = await this.getMoves();
      const count = moves.length;
      
      this.log('info', `Move count from DOM: ${count}`);
      return count;
      
    } catch (error) {
      this.log('error', 'Failed to get move count', { error: (error as Error).message });
      return 0;
    }
  }

  /**
   * Click on a specific move by move number
   * Implements click-based navigation with robust error handling
   * OPTIMIZED: Enhanced retry logic with state validation
   */
  async clickMove(moveNumber: number): Promise<void> {
    this.log('info', `Clicking move number: ${moveNumber}`);
    
    try {
      const moveElement = await this.findMoveElement(moveNumber);
      
      if (!moveElement) {
        throw new Error(`Move ${moveNumber} not found in move list`);
      }
      
      // Ensure element is visible and enabled before clicking
      await moveElement.waitFor({ state: 'visible', timeout: 2000 });
      
      // Click with enhanced retry logic
      await this.withRetry(async () => {
        // Double-check element is still valid
        if (await moveElement.count() === 0) {
          throw new Error(`Move element ${moveNumber} disappeared before click`);
        }
        
        await moveElement.click({ force: false, trial: true }); // Trial click first
        await moveElement.click(); // Actual click
      }, 3, 500); // 3 retries with 500ms delay
      
      // Wait for navigation with fallback
      try {
        await this.waitForActiveMove(moveNumber, 1500); // Increased timeout
      } catch (error) {
        this.log('warn', `Navigation state change not detected, but click succeeded`, { moveNumber });
        // Verify click had some effect (element should exist)
        if (await moveElement.count() === 0) {
          throw new Error(`Move element disappeared after click - possible navigation failure`);
        }
      }
      
      this.log('info', `Successfully clicked move ${moveNumber}`);
      
    } catch (error) {
      this.log('error', `Failed to click move ${moveNumber}`, { error: (error as Error).message });
      throw new Error(`Failed to click move ${moveNumber}: ${(error as Error).message}`);
    }
  }

  /**
   * Wait for move count to reach specific number
   * Essential for synchronizing with game state changes
   * OPTIMIZED: Use data-attribute for immediate store state
   */
  async waitForMoveCount(count: number, timeout?: number): Promise<void> {
    const timeoutMs = timeout ?? this.moveTimeout;
    this.log('info', `Waiting for move count: ${count}`);
    
    try {
      // Use data-attribute for immediate store state checking
      await this.page.waitForFunction(
        (targetCount) => {
          const movePanel = document.querySelector('[data-testid="move-panel"]');
          if (movePanel) {
            const currentCount = parseInt(movePanel.getAttribute('data-move-count') || '0', 10);
            return currentCount >= targetCount;
          }
          // Fallback: count DOM elements
          const moveElements = document.querySelectorAll('[data-testid="move-item"], .move-item, [class*="move-"]');
          return moveElements.length >= targetCount;
        },
        count,
        { timeout: timeoutMs }
      );
      
      this.log('info', `Move count ${count} reached`);
    } catch (error) {
      // Log the actual count for debugging
      const currentCount = await this.getMoveCount();
      this.log('error', `Timeout waiting for move count ${count}, current count: ${currentCount}`);
      throw new Error(`Move count did not reach ${count} within ${timeoutMs}ms. Current count: ${currentCount}`);
    }
  }

  /**
   * Wait for specific move to appear in the list
   * Uses SAN notation for move identification
   * OPTIMIZED: Efficient move lookup with caching
   */
  async waitForMove(san: string, timeout?: number): Promise<void> {
    const timeoutMs = timeout ?? this.moveTimeout;
    this.log('info', `Waiting for move: ${san}`);
    
    let lastMoveCount = 0;
    let cachedMoves: Move[] = [];
    
    await this.waitForCondition(async () => {
      // Only re-fetch moves if count changed (performance optimization)
      const moveElements = await this.getMoveElements();
      if (moveElements.length !== lastMoveCount) {
        cachedMoves = await this.getMoves();
        lastMoveCount = moveElements.length;
      }
      
      return cachedMoves.some(move => move.san === san);
    }, timeoutMs, TIMEOUTS.poll);
    
    this.log('info', `Move ${san} appeared in move list`);
  }

  /**
   * Get the currently active (highlighted) move
   * Uses CSS class inspection and data attributes
   */
  async getActiveMove(): Promise<Move | null> {
    this.log('info', 'Getting currently active move');
    
    try {
      // Look for active move indicators
      const activeSelectors = ACTIVE_MOVE_INDICATORS;
      
      for (const selector of activeSelectors) {
        const activeElements = await this.page.locator(selector).all();
        
        for (const element of activeElements) {
          // Check if this element is within the move list
          const isInMoveList = await this.isElementInMoveList(element);
          if (isInMoveList) {
            const move = await this.parseMoveFromElement(element);
            if (move) {
              move.isActive = true;
              this.log('info', `Active move found: ${move.san}`, { move });
              return move;
            }
          }
        }
      }
      
      this.log('info', 'No active move found');
      return null;
      
    } catch (error) {
      this.log('error', 'Failed to get active move', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Navigate to first move (fast-fail for empty lists)
   * Convenience method for move list navigation
   */
  async goToFirstMove(): Promise<void> {
    this.log('info', 'Navigating to first move');
    
    // Fast-fail check for empty list
    if (await this.isEmpty()) {
      throw new Error('No moves available to navigate to');
    }
    
    await this.clickMove(1);
  }

  /**
   * Navigate to last move (fast-fail for empty lists)
   * Convenience method for move list navigation
   */
  async goToLastMove(): Promise<void> {
    this.log('info', 'Navigating to last move');
    
    // Fast-fail check for empty list
    if (await this.isEmpty()) {
      throw new Error('No moves available to navigate to');
    }
    
    const moves = await this.getMoves();
    await this.clickMove(moves.length);
  }

  /**
   * Check if move list is empty (immediate check)
   * Useful for initial state validation - does not wait for timeout
   */
  async isEmpty(): Promise<boolean> {
    try {
      // Immediate count check - no waiting
      const moveCount = await this.getElementCount('[data-testid="move-item"]');
      this.log('info', `Move list empty check: ${moveCount} moves found`);
      return moveCount === 0;
    } catch (error) {
      this.log('error', 'Failed to check if move list is empty', { error: (error as Error).message });
      return true;
    }
  }

  /**
   * Get move elements from DOM with optimized hybrid selector strategy
   * OPTIMIZED: Prioritized selectors with performance caching
   */
  private async getMoveElements(): Promise<Locator[]> {
    const rootElement = await this.getRootElement();
    
    // Prioritized selectors (most specific first for performance)
    const moveSelectors = [
      SELECTORS.MOVE_ITEM.PRIMARY,     // Primary: Most specific
      SELECTORS.MOVE_ITEM.SECONDARY,   // Secondary: Semantic
      SELECTORS.MOVE_ITEM.TERTIARY,    // Tertiary: Class-based
      SELECTORS.MOVE_ITEM.QUATERNARY,  // Quaternary: Generic class
      SELECTORS.MOVE_ITEM.FALLBACK,    // Fallback: Element type
      '[role="listitem"]'             // Accessibility fallback
    ];
    
    // Try selectors with short-circuit evaluation
    for (const selector of moveSelectors) {
      try {
        const elements = await rootElement.locator(selector).all();
        if (elements.length > 0) {
          this.log('info', `Found ${elements.length} move elements with selector: ${selector}`);
          return elements;
        }
      } catch (error) {
        this.log('warn', `Selector failed: ${selector}`, { error: (error as Error).message });
        continue; // Try next selector
      }
    }
    
    this.log('warn', 'No move elements found with any selector');
    return [];
  }

  /**
   * Find specific move element by move number
   */
  private async findMoveElement(moveNumber: number): Promise<Locator | null> {
    try {
      // Try data-move-number attribute first
      const byMoveNumber = await this.findElement(
        `[data-move-number="${moveNumber}"]`,
        `[data-testid="move-${moveNumber}"]`
      );
      
      if (await byMoveNumber.count() > 0) {
        return byMoveNumber;
      }
      
      // Fallback: Find by position in list
      const moveElements = await this.getMoveElements();
      if (moveNumber > 0 && moveNumber <= moveElements.length) {
        return moveElements[moveNumber - 1]; // Convert to 0-based index
      }
      
      return null;
      
    } catch (error) {
      this.log('error', `Failed to find move element ${moveNumber}`, { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Parse move information from DOM element
   */
  private async parseMoveFromElement(element: Locator, index?: number): Promise<Move | null> {
    try {
      // Extract move data from various sources
      const moveNumber = await this.extractMoveNumber(element, index);
      const san = await this.extractMoveSan(element);
      const uci = await this.extractMoveUci(element);
      const evaluation = await this.extractMoveEvaluation(element);
      const isActive = await this.checkIfMoveIsActive(element);
      
      if (!san) {
        this.log('warn', 'No SAN notation found for move element');
        return null;
      }
      
      // Determine color based on move number (odd = white, even = black)
      const color: 'white' | 'black' = moveNumber % 2 === 1 ? 'white' : 'black';
      const halfMove = moveNumber;
      
      const move: Move = {
        moveNumber,
        san,
        uci: uci ?? undefined,
        color,
        halfMove,
        evaluation: evaluation ?? undefined,
        isActive
      };
      
      // Extract from/to squares if available
      const { from, to, promotion } = await this.extractMoveDetails(element);
      if (from) move.from = from;
      if (to) move.to = to;
      if (promotion) move.promotion = promotion;
      
      this.log('info', `Parsed move: ${san}`, { move });
      return move;
      
    } catch (error) {
      this.log('error', 'Failed to parse move from element', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Extract move number from element
   */
  private async extractMoveNumber(element: Locator, index?: number): Promise<number> {
    // Try data-move-number attribute
    const moveNumberAttr = await element.getAttribute('data-move-number');
    if (moveNumberAttr) {
      return parseInt(moveNumberAttr, 10);
    }
    
    // Try to find move number in text content
    const textContent = await element.textContent() || '';
    const moveNumberMatch = textContent.match(/^(\d+)\./);
    if (moveNumberMatch) {
      return parseInt(moveNumberMatch[1], 10);
    }
    
    // Fallback to index-based calculation
    return (index ?? 0) + 1;
  }

  /**
   * Extract SAN notation from element
   */
  private async extractMoveSan(element: Locator): Promise<string | null> {
    // Try data-san attribute
    const sanAttr = await element.getAttribute('data-san');
    if (sanAttr) {
      return sanAttr;
    }
    
    // Try to extract from text content
    const textContent = await element.textContent() || '';
    
    // Remove move number if present (e.g., "1.e4" -> "e4")
    const sanMatch = textContent.match(/\d+\.?\s*([a-zA-Z0-9+#=\-O]+)/);
    if (sanMatch) {
      return sanMatch[1];
    }
    
    // If no move number, assume entire text is SAN
    const trimmedText = textContent.trim();
    if (trimmedText && /^[a-zA-Z0-9+#=\-O]+$/.test(trimmedText)) {
      return trimmedText;
    }
    
    return null;
  }

  /**
   * Extract UCI notation from element
   */
  private async extractMoveUci(element: Locator): Promise<string | null> {
    const uciAttr = await element.getAttribute('data-uci');
    return uciAttr || null;
  }

  /**
   * Extract move evaluation from element
   */
  private async extractMoveEvaluation(element: Locator): Promise<number | null> {
    const evalAttr = await element.getAttribute('data-evaluation');
    if (evalAttr) {
      const evaluation = parseFloat(evalAttr);
      return isNaN(evaluation) ? null : evaluation;
    }
    
    return null;
  }

  /**
   * Check if move is currently active
   */
  private async checkIfMoveIsActive(element: Locator): Promise<boolean> {
    // Check various active indicators
    const activeChecks = [
      () => element.getAttribute('data-active').then(attr => attr === 'true'),
      () => element.getAttribute('aria-current').then(attr => attr === 'true'),
      () => element.getAttribute('class').then(cls => cls?.includes('active') || false)
    ];
    
    for (const check of activeChecks) {
      try {
        const isActive = await check();
        if (isActive) return true;
      } catch {
        // Continue to next check
      }
    }
    
    return false;
  }

  /**
   * Extract detailed move information (from, to, promotion)
   */
  private async extractMoveDetails(element: Locator): Promise<{
    from?: string;
    to?: string;
    promotion?: string;
  }> {
    const from = await element.getAttribute('data-from');
    const to = await element.getAttribute('data-to');
    const promotion = await element.getAttribute('data-promotion');
    
    return {
      from: from || undefined,
      to: to || undefined,
      promotion: promotion || undefined
    };
  }

  /**
   * Check if element is within the move list container
   */
  private async isElementInMoveList(element: Locator): Promise<boolean> {
    try {
      const rootElement = await this.getRootElement();
      const rootBoundingBox = await rootElement.boundingBox();
      const elementBoundingBox = await element.boundingBox();
      
      if (!rootBoundingBox || !elementBoundingBox) {
        return false;
      }
      
      // Check if element is within root bounds
      return (
        elementBoundingBox.x >= rootBoundingBox.x &&
        elementBoundingBox.y >= rootBoundingBox.y &&
        elementBoundingBox.x + elementBoundingBox.width <= rootBoundingBox.x + rootBoundingBox.width &&
        elementBoundingBox.y + elementBoundingBox.height <= rootBoundingBox.y + rootBoundingBox.height
      );
      
    } catch (error) {
      this.log('error', 'Failed to check if element is in move list', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Wait for specific move to become active
   */
  private async waitForActiveMove(moveNumber: number, timeout?: number): Promise<void> {
    const timeoutMs = timeout ?? this.moveTimeout;
    
    await this.waitForCondition(async () => {
      const activeMove = await this.getActiveMove();
      return activeMove?.moveNumber === moveNumber;
    }, timeoutMs);
  }
}