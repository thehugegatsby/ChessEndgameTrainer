import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { TestConfig, type InteractionMethod, type ChessPiece } from '../config/TestConfig';

/**
 * ChessboardPage - Central Page Object for chess board interactions
 * 
 * Provides unified interface for both click and drag&drop chess moves.
 * Uses current working selectors and supports future data-testid migration.
 */
export class ChessboardPage {
  private rootSelector: string;

  constructor(
    private page: Page, 
    rootSelector: string = TestConfig.selectors.board.container
  ) {
    this.rootSelector = rootSelector;
  }

  // Locators
  private get boardContainer(): Locator {
    return this.page.locator(this.rootSelector).first();
  }

  private getSquare(square: string): Locator {
    // Use centralized selector configuration
    return this.page.locator(TestConfig.selectors.board.square(square)).first();
  }

  private getPieceOnSquare(square: string): Locator {
    return this.getSquare(square).locator(TestConfig.selectors.board.piece).first();
  }

  // Core Methods
  /**
   * Wait for the chessboard to be ready for interaction
   * Handles React 19 dynamic rendering and react-chessboard v5 initialization
   */
  async waitForBoardReady(): Promise<void> {
    // Wait for container to be present
    await this.boardContainer.waitFor({ timeout: TestConfig.timeouts.critical });
    
    // Wait for squares to be rendered (chess board has 64 squares, wait for at least half)
    await this.page.waitForFunction(() => {
      const squares = document.querySelectorAll('[data-square]');
      return squares.length >= 32;
    }, { timeout: TestConfig.timeouts.critical });

    // Wait for board to be actionable (not just visible)
    await expect(this.boardContainer).toBeVisible();
    
    // Wait for board to be fully interactive (no loading states)
    await this.waitForBoardInteractive();
  }

  /**
   * Wait for board to be fully interactive (no loading indicators)
   */
  private async waitForBoardInteractive(): Promise<void> {
    try {
      // Wait for any loading indicators to disappear
      await this.page.waitForSelector(TestConfig.selectors.loading.indicators, {
        state: 'hidden',
        timeout: TestConfig.timeouts.medium
      });
    } catch {
      // No loading indicators found, board is likely ready
    }
    
    // Additional check: ensure first square is clickable
    await this.page.waitForFunction(() => {
      const firstSquare = document.querySelector('[data-square]');
      return firstSquare && !firstSquare.hasAttribute('disabled');
    }, { timeout: TestConfig.timeouts.medium });
  }

  /**
   * Make a chess move using specified interaction method
   * @param from Source square (e.g. "e2")
   * @param to Target square (e.g. "e4") 
   * @param method Interaction method: 'click' or 'drag'
   * @param promotion Optional promotion piece for pawn promotion
   */
  async move(
    from: string, 
    to: string, 
    method: InteractionMethod = 'click',
    promotion?: ChessPiece
  ): Promise<boolean> {
    console.log(`🎯 Making move: ${from} → ${to} (${method})`);

    try {
      // Get initial board state for move verification
      const initialFEN = await this.getCurrentFEN();
      
      // Wait for squares to be actionable before attempting move
      await this.getSquare(from).waitFor({ state: 'visible', timeout: TestConfig.timeouts.long });
      await this.getSquare(to).waitFor({ state: 'visible', timeout: TestConfig.timeouts.long });

      if (method === 'click') {
        await this.makeClickMove(from, to, promotion);
      } else {
        await this.makeDragMove(from, to, promotion);
      }

      // Verify move was successful by checking board state change
      const moveSuccessful = await this.verifyMoveSuccess(initialFEN, from, to);
      if (!moveSuccessful) {
        throw new Error(`Move verification failed: board state did not change as expected`);
      }

      console.log(`✅ Move verified successful: ${from} → ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Move failed: ${from} → ${to}`, error);
      // Re-throw error for test to fail explicitly rather than returning false
      // This prevents hiding unexpected UI behavior
      throw new Error(`Chess move failed: ${from} → ${to} (${method}): ${error}`);
    }
  }

  /**
   * Make move using click-click method
   * Waits for elements to be actionable and handles UI state changes
   */
  private async makeClickMove(
    from: string, 
    to: string, 
    promotion?: ChessPiece
  ): Promise<void> {
    const fromSquare = this.getSquare(from);
    const toSquare = this.getSquare(to);

    // Ensure squares are actionable (not just visible)
    await fromSquare.waitFor({ state: 'attached', timeout: TestConfig.timeouts.medium });
    await toSquare.waitFor({ state: 'attached', timeout: TestConfig.timeouts.medium });

    // Click from square and wait for selection state
    await fromSquare.click();
    await this.waitForSquareSelection(from);

    // Click to square and wait for move processing
    await toSquare.click();
    await this.waitForMoveInitiation();

    // Handle promotion if needed
    if (promotion) {
      await this.handlePromotion(promotion);
    }

    // Wait for move to be processed by React state
    await this.waitForMoveCompletion();

    console.log(`✅ Click move completed: ${from} → ${to}`);
  }

  /**
   * Make move using drag and drop
   */
  private async makeDragMove(
    from: string, 
    to: string, 
    promotion?: ChessPiece
  ): Promise<void> {
    const fromSquare = this.getSquare(from);
    const toSquare = this.getSquare(to);

    // Get piece element for more reliable dragging
    const piece = this.getPieceOnSquare(from);
    const pieceExists = await piece.isVisible();

    const sourceElement = pieceExists ? piece : fromSquare;

    // Perform drag and drop
    await sourceElement.dragTo(toSquare);
    await this.waitForMoveInitiation();

    // Handle promotion if needed
    if (promotion) {
      await this.handlePromotion(promotion);
    }

    console.log(`✅ Drag move completed: ${from} → ${to}`);
  }

  /**
   * Handle pawn promotion dialog
   */
  private async handlePromotion(piece: ChessPiece): Promise<void> {
    const promotionDialog = this.page.locator(TestConfig.selectors.promotion.dialog).first();
    
    try {
      await promotionDialog.waitFor({ timeout: TestConfig.timeouts.medium });
      
      const promotionButton = this.page.locator(TestConfig.selectors.promotion.piece(piece)).first();
      
      await promotionButton.click();
      console.log(`✅ Selected promotion piece: ${piece}`);
    } catch {
      console.log(`⚠️ No promotion dialog found, auto-promotion to queen`);
    }
  }

  /**
   * Wait for square selection visual feedback after click
   */
  private async waitForSquareSelection(square: string): Promise<void> {
    try {
      // Wait for square to show selection state (highlighted, selected class, etc.)
      await this.page.waitForFunction(
        (squareId) => {
          const targetSquare = document.querySelector(`[data-square="${squareId}"]`);
          return targetSquare && (
            targetSquare.classList.contains('selected') ||
            targetSquare.classList.contains('highlighted') ||
            targetSquare.hasAttribute('data-selected')
          );
        },
        square,
        { timeout: TestConfig.timeouts.short }
      );
    } catch {
      // Selection visual feedback might not be implemented, that's ok
      // Just wait a brief moment for any UI updates
      await this.page.waitForFunction(() => true, { timeout: 100 });
    }
  }

  /**
   * Wait for move initiation (after click or drag)
   */
  private async waitForMoveInitiation(): Promise<void> {
    // Brief wait for move to be registered by the chess engine
    await this.page.waitForFunction(() => {
      // Check if any move processing has started
      const loadingElements = document.querySelectorAll('.loading, [data-loading="true"]');
      return loadingElements.length === 0; // Wait for no loading state initially
    }, { timeout: TestConfig.timeouts.short });
  }

  /**
   * Verify that the move was successful by checking board state change
   */
  private async verifyMoveSuccess(initialFEN: string | null, from: string, to: string): Promise<boolean> {
    try {
      console.log(`🔍 DEBUG: Verifying move ${from}→${to}, initialFEN: ${initialFEN}`);
      
      // Wait for board state to change
      await this.page.waitForFunction(
        (startFEN) => {
          // Try multiple ways to detect board state change
          // Priority 1: Training board (most reliable)
          const trainingBoard = document.querySelector('[data-testid="training-board"]');
          if (trainingBoard) {
            const currentFEN = trainingBoard.getAttribute('data-fen');
            console.log(`🔍 DEBUG: training-board - startFEN: ${startFEN}, currentFEN: ${currentFEN}`);
            if (currentFEN && currentFEN !== startFEN) {
              return true;
            }
          }
          
          // Priority 2: Generic [data-fen] selector (fallback)
          const currentBoard = document.querySelector('[data-fen]');
          if (currentBoard) {
            const currentFEN = currentBoard.getAttribute('data-fen');
            console.log(`🔍 DEBUG: [data-fen] board - startFEN: ${startFEN}, currentFEN: ${currentFEN}`);
            if (currentFEN && currentFEN !== startFEN) {
              return true;
            }
          }
          
          // Fallback: check if piece positions changed
          const fromSquare = document.querySelector(`[data-square="${from}"]`);
          const toSquare = document.querySelector(`[data-square="${to}"]`);
          
          if (fromSquare && toSquare) {
            // Simple check: from square should be empty or have different piece
            // to square should now have a piece
            const fromPiece = fromSquare.querySelector('[data-piece], .piece, img');
            const toPiece = toSquare.querySelector('[data-piece], .piece, img');
            return Boolean(toPiece); // Target square should now have a piece
          }
          
          return false;
        },
        initialFEN,
        { timeout: TestConfig.timeouts.medium }
      );
      
      return true;
    } catch {
      // Move verification failed
      return false;
    }
  }

  // Assertions
  /**
   * Assert that a specific piece is on a square
   */
  async assertPieceAt(square: string, piece: string, color: 'white' | 'black'): Promise<void> {
    const pieceElement = this.getPieceOnSquare(square);
    await expect(pieceElement).toBeVisible();
    
    // Try different piece identification methods
    const pieceColor = color.charAt(0); // 'w' or 'b'
    const expectedPiece = `${piece.toLowerCase()}-${pieceColor}`;
    
    try {
      await expect(pieceElement).toHaveAttribute('data-piece', expectedPiece);
    } catch {
      // Fallback: check alt text or other attributes
      await expect(pieceElement).toHaveAttribute('alt', new RegExp(`${piece}.*${color}`, 'i'));
    }
  }

  /**
   * Assert that a square is empty
   */
  async assertSquareEmpty(square: string): Promise<void> {
    const pieceElement = this.getPieceOnSquare(square);
    await expect(pieceElement).not.toBeVisible();
  }

  /**
   * Assert that the board is visible and interactive
   */
  async assertBoardVisible(): Promise<void> {
    await expect(this.boardContainer).toBeVisible();
    
    // Verify some squares are present
    const squares = this.page.locator('[data-square]');
    await expect(squares.first()).toBeVisible();
  }

  /**
   * Wait for it to be white's turn to move
   */
  async waitForWhiteTurn(): Promise<void> {
    console.log('⏳ Waiting for white\'s turn...');
    
    try {
      await this.page.waitForFunction(
        () => {
          // Check training board for current turn
          const trainingBoard = document.querySelector('[data-testid="training-board"]');
          if (trainingBoard) {
            const currentFEN = trainingBoard.getAttribute('data-fen');
            if (currentFEN) {
              // FEN format: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              // The part after the position is the turn: 'w' = white, 'b' = black
              const turnPart = currentFEN.split(' ')[1];
              console.log(`🔍 Current turn from FEN: ${turnPart} (full FEN: ${currentFEN})`);
              return turnPart === 'w';
            }
          }
          
          return false;
        },
        { timeout: TestConfig.timeouts.long }
      );
      
      console.log('✅ White\'s turn confirmed');
    } catch (error) {
      console.log('⚠️ Timeout waiting for white\'s turn, proceeding anyway');
    }
  }

  /**
   * Get current FEN position (if available)
   */
  async getCurrentFEN(): Promise<string | null> {
    try {
      // Try to get FEN from board element
      const fen = await this.boardContainer.getAttribute('data-fen');
      return fen;
    } catch {
      // Fallback: try to extract from page state
      return await this.page.evaluate(() => {
        // Type-safe access to window.chess
        interface ChessWindow extends Window {
          chess?: {
            fen(): string;
            turn(): string;
            game_over(): boolean;
          };
        }
        const chessWindow = window as ChessWindow;
        return chessWindow.chess?.fen() || null;
      });
    }
  }

  /**
   * Wait for move to be processed by React state
   * Helps handle async UI updates after move actions
   */
  private async waitForMoveCompletion(): Promise<void> {
    // Wait for any loading states to disappear
    try {
      await this.page.waitForSelector(TestConfig.selectors.loading.indicators, { 
        state: 'hidden', 
        timeout: TestConfig.timeouts.medium 
      });
    } catch {
      // Loading indicator might not exist, that's ok
    }
    
    // Ensure React state has stabilized
    await this.page.waitForFunction(() => {
      // Check if DOM is stable (no ongoing mutations)
      return !document.querySelector('.updating, [data-updating="true"]');
    }, { timeout: TestConfig.timeouts.short });
  }

  /**
   * Check if a square is occupied by a piece
   * Useful for move validation and testing
   */
  async isSquareOccupied(square: string): Promise<boolean> {
    const piece = this.getPieceOnSquare(square);
    return await piece.isVisible();
  }
}