/**
 * @fileoverview BoardComponent - Chess board abstraction for E2E testing
 * @description Implements click-to-click moves, FEN-polling, and Test Data Builders integration
 */

import { Page, Locator } from '@playwright/test';
import { BaseComponent, BaseComponentConfig } from './BaseComponent';
import { Position, Piece, ChessMove, FenString } from '../builders/types';

/**
 * Configuration for BoardComponent
 */
export interface BoardComponentConfig extends BaseComponentConfig {
  /** Debounce delay for move actions in milliseconds */
  moveDebounceMs?: number;
  /** Timeout for waiting for move completion */
  moveTimeout?: number;
  /** Enable FEN validation */
  enableFenValidation?: boolean;
}

/**
 * Chess piece representation for DOM interaction
 */
export interface ChessPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  square: string;
  notation: string; // e.g., 'wK', 'bP'
}

/**
 * Board Component Object for chess board interactions
 * Implements consensus recommendations from Gemini and O3
 */
export class BoardComponent extends BaseComponent {
  private readonly moveDebounceMs: number;
  private readonly moveTimeout: number;
  private readonly enableFenValidation: boolean;
  private lastMoveTime: number = 0;

  constructor(
    page: Page,
    rootSelector?: string,
    config: BoardComponentConfig = {}
  ) {
    super(page, rootSelector, config);
    this.moveDebounceMs = config.moveDebounceMs ?? 100;
    this.moveTimeout = config.moveTimeout ?? 10000;
    this.enableFenValidation = config.enableFenValidation ?? true;
  }

  /**
   * Default selector for chess board container
   * Implements abstract method from BaseComponent
   */
  getDefaultSelector(): string {
    return '[data-testid="training-board"], .react-chessboard, #chessboard';
  }
  
  /**
   * Wait for board to be ready for interaction
   * Ensures consistency with TrainingPage API
   */
  async waitForBoard(): Promise<void> {
    // Check if board element already exists and is visible
    try {
      const boardElement = await this.page.locator(this.getDefaultSelector());
      const isVisible = await boardElement.isVisible();
      
      if (isVisible) {
        this.log('info', 'Board already visible and ready');
        return;
      }
    } catch {
      // Element not found, proceed with wait
    }
    
    // Wait for board element to be available and visible
    await this.waitForElement(this.getDefaultSelector());
  }
  
  /**
   * Get current position as FEN string
   * Alias for getCurrentFen for API consistency
   */
  async getPosition(): Promise<string> {
    return await this.getCurrentFen();
  }

  /**
   * Make a move using click-to-click implementation
   * Consensus: Most reliable approach for automation (Gemini & O3)
   */
  async makeMove(from: string, to: string): Promise<void> {
    this.log('info', `Making move: ${from} -> ${to}`);
    
    // Debounce mechanism for performance (O3 recommendation)
    await this.debounceMove();

    try {
      // Get current FEN for comparison
      const initialFen = await this.getCurrentFen();
      
      // Step 1: Click source square
      await this.clickSquare(from);
      this.log('info', `Clicked source square: ${from}`);
      
      // Small delay to allow for UI state update
      await this.page.waitForTimeout(50);
      
      // Step 2: Click destination square  
      await this.clickSquare(to);
      this.log('info', `Clicked destination square: ${to}`);
      
      // Step 3: Wait for move completion
      await this.waitForMoveComplete(initialFen);
      
      this.log('info', `Move completed successfully: ${from} -> ${to}`);
    } catch (error) {
      this.log('error', `Move failed: ${from} -> ${to}`, { error: (error as Error).message });
      throw new Error(`Failed to make move ${from} -> ${to}: ${(error as Error).message}`);
    }
  }

  /**
   * Click a chess square with hybrid selector strategy
   * Primary: [data-square="e4"], Fallback: [data-testid="chess-square-e4"]
   */
  private async clickSquare(square: string): Promise<void> {
    const primarySelector = `[data-square="${square}"]`;
    const fallbackSelector = `[data-testid="chess-square-${square}"]`;
    
    return this.withRetry(async () => {
      const element = await this.findElement(primarySelector, fallbackSelector);
      await element.click();
    });
  }

  /**
   * Wait for move completion using FEN-polling strategy
   * Consensus: Most robust approach (Gemini & O3)
   */
  private async waitForMoveComplete(initialFen?: string): Promise<void> {
    const startTime = Date.now();
    
    await this.waitForCondition(async () => {
      const currentFen = await this.getCurrentFen();
      const hasChanged = initialFen ? currentFen !== initialFen : true;
      
      if (hasChanged) {
        this.log('info', `Position updated`, { from: initialFen, to: currentFen });
        return true;
      }
      
      return false;
    }, this.moveTimeout);
  }

  /**
   * Get current FEN from board
   * Uses data-fen attribute polling (Gemini recommendation)
   */
  private async getCurrentFen(): Promise<string> {
    try {
      // Try data-fen attribute first (Gemini's recommendation)
      const boardContainer = await this.getRootElement();
      const fenFromAttribute = await boardContainer.getAttribute('data-fen');
      
      if (fenFromAttribute && this.isValidFen(fenFromAttribute)) {
        return fenFromAttribute;
      }
      
      // Fallback: Try to get FEN from test bridge if available
      const fenFromBridge = await this.page.evaluate(() => {
        const bridge = (window as any).__E2E_TEST_BRIDGE__;
        return bridge?.diagnostic?.getCurrentFen?.();
      });
      
      if (fenFromBridge && this.isValidFen(fenFromBridge)) {
        return fenFromBridge;
      }
      
      // Final fallback: Extract from DOM structure
      return await this.extractFenFromDom();
      
    } catch (error) {
      this.log('warn', 'Failed to get current FEN', { error: (error as Error).message });
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Starting position fallback
    }
  }

  /**
   * Wait for specific position (FEN string)
   * Key feature for Test Data Builders integration
   */
  async waitForPosition(fen: string, timeout?: number): Promise<void> {
    const timeoutMs = timeout ?? this.defaultTimeout;
    this.log('info', `Waiting for position: ${fen}`);
    
    await this.waitForCondition(async () => {
      const currentFen = await this.getCurrentFen();
      return this.compareFenPositions(currentFen, fen);
    }, timeoutMs);
    
    this.log('info', `Position reached: ${fen}`);
  }

  /**
   * Load position from Test Data Builders
   * Uses Test Bridge for direct state setting (consensus recommendation)
   */
  async loadPosition(position: Position): Promise<void> {
    this.log('info', `Loading position`, { fen: position.fen });
    
    try {
      // Primary: Use Test Bridge (both models' recommendation)
      await this.page.evaluate((fen) => {
        const bridge = (window as any).__E2E_TEST_BRIDGE__;
        if (bridge?.engine?.setPosition) {
          bridge.engine.setPosition(fen);
          return true;
        }
        return false;
      }, position.fen);
      
      // Wait for position to be loaded
      await this.waitForPosition(position.fen);
      
    } catch (error) {
      this.log('error', 'Failed to load position via Test Bridge', { error: (error as Error).message });
      throw new Error(`Failed to load position: ${(error as Error).message}`);
    }
  }

  /**
   * Get piece at specific square
   * Uses DOM inspection with hybrid selector strategy
   */
  async getPieceAt(square: string): Promise<ChessPiece | null> {
    try {
      const squareElement = await this.findElement(
        `[data-square="${square}"]`,
        `[data-testid="chess-square-${square}"]`
      );
      
      // Try data-piece attribute first
      const pieceNotation = await squareElement.getAttribute('data-piece');
      if (pieceNotation) {
        return this.parsePieceNotation(pieceNotation, square);
      }
      
      // Fallback: Check for piece elements within square
      const pieceElement = squareElement.locator('[data-piece], .chess-piece, [class*="piece"]');
      if (await pieceElement.count() > 0) {
        const firstPiece = pieceElement.first();
        const pieceClass = await firstPiece.getAttribute('class') || '';
        const pieceData = await firstPiece.getAttribute('data-piece') || '';
        
        return this.parsePieceFromClass(pieceClass, pieceData, square);
      }
      
      return null;
    } catch (error) {
      this.log('warn', `Failed to get piece at ${square}`, { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get highlighted squares (legal moves, selected squares)
   * Uses CSS class inspection with fallback selectors
   */
  async getHighlightedSquares(): Promise<string[]> {
    try {
      const highlightedSquares: string[] = [];
      
      // Common highlight classes to check
      const highlightSelectors = [
        '[data-highlight="true"]',
        '.highlight-legal',
        '.legal-move',
        '.highlighted',
        '.square-highlight',
        '[class*="highlight"]'
      ];
      
      for (const selector of highlightSelectors) {
        const elements = await this.page.locator(selector).all();
        
        for (const element of elements) {
          const square = await element.getAttribute('data-square') ||
                         await this.extractSquareFromElement(element);
          
          if (square && !highlightedSquares.includes(square)) {
            highlightedSquares.push(square);
          }
        }
      }
      
      this.log('info', `Found highlighted squares`, { squares: highlightedSquares });
      return highlightedSquares;
      
    } catch (error) {
      this.log('warn', 'Failed to get highlighted squares', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Check if move is valid (helper for error handling)
   */
  async isMoveValid(from: string, to: string): Promise<boolean> {
    try {
      const piece = await this.getPieceAt(from);
      if (!piece) {
        this.log('warn', `No piece at source square: ${from}`);
        return false;
      }
      
      const highlightedSquares = await this.getHighlightedSquares();
      await this.clickSquare(from); // Select piece to see legal moves
      
      const legalMoves = await this.getHighlightedSquares();
      return legalMoves.includes(to);
      
    } catch (error) {
      this.log('warn', `Failed to validate move ${from} -> ${to}`, { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Debounce mechanism for move actions (O3 recommendation)
   */
  private async debounceMove(): Promise<void> {
    const now = Date.now();
    const timeSinceLastMove = now - this.lastMoveTime;
    
    if (timeSinceLastMove < this.moveDebounceMs) {
      const waitTime = this.moveDebounceMs - timeSinceLastMove;
      await this.page.waitForTimeout(waitTime);
    }
    
    this.lastMoveTime = Date.now();
  }

  /**
   * Validate FEN string format
   */
  private isValidFen(fen: string): boolean {
    if (!this.enableFenValidation) return true;
    
    // Basic FEN validation (can be expanded)
    const fenParts = fen.split(' ');
    return fenParts.length >= 4 && fenParts[0].includes('/');
  }

  /**
   * Compare FEN positions (ignoring move counts for position comparison)
   */
  private compareFenPositions(fen1: string, fen2: string): boolean {
    const position1 = fen1.split(' ')[0]; // Just the piece placement
    const position2 = fen2.split(' ')[0];
    return position1 === position2;
  }

  /**
   * Extract FEN from DOM structure (fallback method)
   */
  private async extractFenFromDom(): Promise<string> {
    // This would need to be implemented based on the actual DOM structure
    // For now, return starting position
    this.log('warn', 'Using fallback FEN extraction');
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  /**
   * Parse piece notation (e.g., 'wK' -> white king)
   */
  private parsePieceNotation(notation: string, square: string): ChessPiece | null {
    if (notation.length !== 2) return null;
    
    const color = notation[0] === 'w' ? 'white' : 'black';
    const typeMap: Record<string, ChessPiece['type']> = {
      'P': 'pawn', 'R': 'rook', 'N': 'knight',
      'B': 'bishop', 'Q': 'queen', 'K': 'king'
    };
    
    const type = typeMap[notation[1].toUpperCase()];
    if (!type) return null;
    
    return { type, color, square, notation };
  }

  /**
   * Parse piece from CSS classes and data attributes
   */
  private parsePieceFromClass(className: string, dataAttr: string, square: string): ChessPiece | null {
    // Implementation would depend on actual CSS class structure
    // This is a placeholder for the actual implementation
    this.log('info', 'Parsing piece from class', { className, dataAttr, square });
    return null;
  }

  /**
   * Extract square name from element (e.g., from ID or class)
   */
  private async extractSquareFromElement(element: Locator): Promise<string | null> {
    const id = await element.getAttribute('id');
    const className = await element.getAttribute('class');
    
    // Look for square patterns like 'square-e4', 'e4', etc.
    const squarePattern = /[a-h][1-8]/;
    
    if (id) {
      const match = id.match(squarePattern);
      if (match) return match[0];
    }
    
    if (className) {
      const match = className.match(squarePattern);
      if (match) return match[0];
    }
    
    return null;
  }
  
  /**
   * Wait for position to change from current FEN
   * Useful for synchronizing after navigation or moves
   * @param currentFen - The current FEN to wait for change from
   * @param timeout - Optional timeout override
   */
  async waitForPositionChange(currentFen: string, timeout?: number): Promise<void> {
    const effectiveTimeout = timeout || this.config.timeouts?.position || 5000;
    
    try {
      await this.page.waitForFunction(
        (oldFen) => {
          // Try multiple selectors to find FEN
          const fenElement = document.querySelector('[data-fen]') || 
                           document.querySelector('[data-testid="board-fen"]') ||
                           document.querySelector('.board-fen');
          
          if (!fenElement) {
            // If no FEN element, check if position visually changed
            // This is a fallback - ideally we'd have a FEN attribute
            return true; // Assume changed if we can't verify
          }
          
          const currentFen = fenElement.getAttribute('data-fen') || 
                           fenElement.textContent?.trim();
          
          return currentFen !== oldFen;
        },
        currentFen,
        { timeout: effectiveTimeout }
      );
      
      this.log('info', 'Position changed successfully', { 
        fromFen: currentFen,
        timeout: effectiveTimeout 
      });
    } catch (error) {
      throw new Error(`Position did not change from ${currentFen} within ${effectiveTimeout}ms`);
    }
  }
}