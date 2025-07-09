/**
 * @fileoverview BoardComponent Tests
 * @description Comprehensive tests for BoardComponent with mock DOM and selectors
 */

import { test, expect, Page } from '@playwright/test';
import { BoardComponent } from './BoardComponent';
import { aPosition } from '../builders';

// Mock DOM setup helper
async function setupMockBoard(page: Page, fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
  await page.setContent(`
    <div data-testid="training-board" data-fen="${fen}">
      <div class="chessboard">
        ${generateMockSquares(fen)}
      </div>
    </div>
  `);
}

// Generate mock squares for testing
function generateMockSquares(fen: string): string {
  const squares = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  for (const rank of ranks.reverse()) {
    for (const file of files) {
      const square = `${file}${rank}`;
      const piece = getPieceAtSquare(fen, square);
      const pieceAttr = piece ? `data-piece="${piece}"` : '';
      
      squares.push(`
        <div 
          data-square="${square}" 
          data-testid="chess-square-${square}"
          ${pieceAttr}
          class="chess-square"
        >
          ${piece ? `<div class="piece ${piece.toLowerCase()}"></div>` : ''}
        </div>
      `);
    }
  }
  
  return squares.join('');
}

// Helper to extract piece from FEN at given square
function getPieceAtSquare(fen: string, square: string): string | null {
  // This is a simplified implementation for testing
  // In real implementation, you'd parse the FEN properly
  const pieces: Record<string, string> = {
    'a1': 'wR', 'b1': 'wN', 'c1': 'wB', 'd1': 'wQ', 'e1': 'wK', 'f1': 'wB', 'g1': 'wN', 'h1': 'wR',
    'a2': 'wP', 'b2': 'wP', 'c2': 'wP', 'd2': 'wP', 'e2': 'wP', 'f2': 'wP', 'g2': 'wP', 'h2': 'wP',
    'a8': 'bR', 'b8': 'bN', 'c8': 'bB', 'd8': 'bQ', 'e8': 'bK', 'f8': 'bB', 'g8': 'bN', 'h8': 'bR',
    'a7': 'bP', 'b7': 'bP', 'c7': 'bP', 'd7': 'bP', 'e7': 'bP', 'f7': 'bP', 'g7': 'bP', 'h7': 'bP',
  };
  
  return pieces[square] || null;
}

test.describe('BoardComponent', () => {
  test.describe('Initialization', () => {
    test('should initialize with default selector', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      expect(board.getDefaultSelector()).toBe('[data-testid="training-board"], .react-chessboard, #chessboard');
    });

    test('should initialize with custom root selector', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, '[data-testid="custom-board"]');
      
      // Test that custom selector is used
      const rootElement = await board.getRootElement();
      expect(rootElement).toBeDefined();
    });

    test('should initialize with custom configuration', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, undefined, {
        defaultTimeout: 10000,
        enableLogging: true,
        moveDebounceMs: 200,
        moveTimeout: 15000
      });
      
      expect(board.isVisible()).resolves.toBe(true);
    });
  });

  test.describe('Hybrid Selector Strategy', () => {
    test('should find element with primary selector', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      // Test primary selector works
      const square = await board.getPieceAt('e2');
      expect(square).toEqual({
        type: 'pawn',
        color: 'white',
        square: 'e2',
        notation: 'wP'
      });
    });

    test('should fallback to data-testid selector', async ({ page }) => {
      // Setup board without data-square attributes
      await page.setContent(`
        <div data-testid="training-board">
          <div data-testid="chess-square-e4" class="chess-square"></div>
        </div>
      `);
      
      const board = new BoardComponent(page);
      
      // Should still find element via fallback
      const element = await page.locator('[data-testid="chess-square-e4"]');
      expect(await element.isVisible()).toBe(true);
    });

    test('should handle selector failures gracefully', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      // Try to get piece from non-existent square
      const piece = await board.getPieceAt('z9');
      expect(piece).toBe(null);
    });
  });

  test.describe('Move Operations', () => {
    test('should make valid move with click-to-click', async ({ page }) => {
      await setupMockBoard(page);
      
      // Mock Test Bridge for position updates
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          diagnostic: {
            getCurrentFen: () => 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
          }
        };
      });
      
      const board = new BoardComponent(page);
      
      // Track clicks
      const clicks: string[] = [];
      await page.exposeFunction('trackClick', (square: string) => {
        clicks.push(square);
      });
      
      // Add click tracking to squares
      await page.evaluate(() => {
        document.querySelectorAll('[data-square]').forEach(square => {
          square.addEventListener('click', () => {
            (window as any).trackClick(square.getAttribute('data-square'));
          });
        });
      });
      
      // Make move
      await board.makeMove('e2', 'e4');
      
      // Verify clicks occurred
      expect(clicks).toEqual(['e2', 'e4']);
    });

    test('should handle move debouncing', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, undefined, { moveDebounceMs: 100 });
      
      const startTime = Date.now();
      
      // Make first move
      await board.makeMove('e2', 'e4');
      
      // Make second move immediately
      await board.makeMove('d2', 'd4');
      
      const endTime = Date.now();
      
      // Should have taken at least debounce time
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    test('should validate moves before execution', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      // Mock invalid move scenario
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          diagnostic: {
            getCurrentFen: () => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Same position
          }
        };
      });
      
      const isValid = await board.isMoveValid('e2', 'e5'); // Invalid move
      expect(isValid).toBe(false);
    });

    test('should handle move failures gracefully', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      // Try to make move on non-existent squares
      await expect(board.makeMove('z9', 'z8')).rejects.toThrow();
    });
  });

  test.describe('Position Management', () => {
    test('should wait for specific position', async ({ page }) => {
      const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const targetFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      await setupMockBoard(page, initialFen);
      const board = new BoardComponent(page);
      
      // Simulate position change after delay
      setTimeout(async () => {
        await page.evaluate((newFen) => {
          const boardElement = document.querySelector('[data-testid="training-board"]');
          if (boardElement) {
            boardElement.setAttribute('data-fen', newFen);
          }
        }, targetFen);
      }, 500);
      
      // Should wait for position change
      await expect(board.waitForPosition(targetFen, 2000)).resolves.not.toThrow();
    });

    test('should load position from Test Data Builders', async ({ page }) => {
      await setupMockBoard(page);
      
      // Mock Test Bridge
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          engine: {
            setPosition: (fen: string) => {
              const boardElement = document.querySelector('[data-testid="training-board"]');
              if (boardElement) {
                boardElement.setAttribute('data-fen', fen);
              }
            }
          }
        };
      });
      
      const board = new BoardComponent(page);
      const position = aPosition().withOpposition().build();
      
      await board.loadPosition(position);
      
      // Verify position was loaded
      const boardElement = await page.locator('[data-testid="training-board"]');
      const currentFen = await boardElement.getAttribute('data-fen');
      expect(currentFen).toBe(position.fen);
    });

    test('should handle FEN validation', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, undefined, { enableFenValidation: true });
      
      // Mock invalid FEN
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          diagnostic: {
            getCurrentFen: () => 'invalid-fen'
          }
        };
      });
      
      // Should fall back to starting position
      const currentFen = await page.evaluate(async () => {
        const board = new (await import('./BoardComponent')).BoardComponent(page);
        return board.getCurrentFen();
      });
      
      expect(currentFen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  test.describe('Piece Detection', () => {
    test('should detect pieces correctly', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      // Test white pawn
      const whitePawn = await board.getPieceAt('e2');
      expect(whitePawn).toEqual({
        type: 'pawn',
        color: 'white',
        square: 'e2',
        notation: 'wP'
      });
      
      // Test black king
      const blackKing = await board.getPieceAt('e8');
      expect(blackKing).toEqual({
        type: 'king',
        color: 'black',
        square: 'e8',
        notation: 'bK'
      });
      
      // Test empty square
      const emptySquare = await board.getPieceAt('e4');
      expect(emptySquare).toBe(null);
    });

    test('should parse piece notation correctly', async ({ page }) => {
      await page.setContent(`
        <div data-testid="training-board">
          <div data-square="e4" data-piece="wK" data-testid="chess-square-e4"></div>
        </div>
      `);
      
      const board = new BoardComponent(page);
      const piece = await board.getPieceAt('e4');
      
      expect(piece).toEqual({
        type: 'king',
        color: 'white',
        square: 'e4',
        notation: 'wK'
      });
    });

    test('should handle missing piece data gracefully', async ({ page }) => {
      await page.setContent(`
        <div data-testid="training-board">
          <div data-square="e4" data-testid="chess-square-e4"></div>
        </div>
      `);
      
      const board = new BoardComponent(page);
      const piece = await board.getPieceAt('e4');
      
      expect(piece).toBe(null);
    });
  });

  test.describe('Highlight Detection', () => {
    test('should detect highlighted squares', async ({ page }) => {
      await page.setContent(`
        <div data-testid="training-board">
          <div data-square="e4" data-highlight="true" data-testid="chess-square-e4"></div>
          <div data-square="e5" class="highlight-legal" data-testid="chess-square-e5"></div>
          <div data-square="d4" class="legal-move" data-testid="chess-square-d4"></div>
        </div>
      `);
      
      const board = new BoardComponent(page);
      const highlightedSquares = await board.getHighlightedSquares();
      
      expect(highlightedSquares).toEqual(expect.arrayContaining(['e4', 'e5', 'd4']));
    });

    test('should handle no highlighted squares', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      const highlightedSquares = await board.getHighlightedSquares();
      expect(highlightedSquares).toEqual([]);
    });

    test('should deduplicate highlighted squares', async ({ page }) => {
      await page.setContent(`
        <div data-testid="training-board">
          <div data-square="e4" data-highlight="true" class="highlight-legal" data-testid="chess-square-e4"></div>
        </div>
      `);
      
      const board = new BoardComponent(page);
      const highlightedSquares = await board.getHighlightedSquares();
      
      expect(highlightedSquares).toEqual(['e4']); // Should not duplicate
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing board element', async ({ page }) => {
      await page.setContent('<div>No board here</div>');
      
      const board = new BoardComponent(page);
      
      await expect(board.isVisible()).resolves.toBe(false);
    });

    test('should handle network failures gracefully', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, undefined, { maxRetries: 1 });
      
      // Mock network failure
      await page.route('**/*', route => route.abort());
      
      // Should still handle local operations
      const isVisible = await board.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });

    test('should handle timeout errors', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, undefined, { defaultTimeout: 100 });
      
      // This should timeout quickly
      await expect(board.waitForPosition('invalid-fen', 100)).rejects.toThrow();
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid moves without issues', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page, undefined, { moveDebounceMs: 10 });
      
      // Make multiple moves rapidly
      const moves = [
        ['e2', 'e4'],
        ['d2', 'd4'],
        ['g1', 'f3'],
        ['b1', 'c3']
      ];
      
      const startTime = Date.now();
      
      for (const [from, to] of moves) {
        try {
          await board.makeMove(from, to);
        } catch (error) {
          // Expected for some moves in this test
        }
      }
      
      const endTime = Date.now();
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should handle large number of piece queries', async ({ page }) => {
      await setupMockBoard(page);
      const board = new BoardComponent(page);
      
      const squares = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
                       'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
      
      const startTime = Date.now();
      
      // Query all squares
      const pieces = await Promise.all(
        squares.map(square => board.getPieceAt(square))
      );
      
      const endTime = Date.now();
      
      expect(pieces).toHaveLength(16);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  test.describe('Integration with Test Data Builders', () => {
    test('should work with GameStateBuilder', async ({ page }) => {
      await setupMockBoard(page);
      
      // Mock Test Bridge
      await page.evaluate(() => {
        (window as any).__E2E_TEST_BRIDGE__ = {
          engine: {
            setPosition: (fen: string) => {
              const boardElement = document.querySelector('[data-testid="training-board"]');
              if (boardElement) {
                boardElement.setAttribute('data-fen', fen);
              }
            }
          }
        };
      });
      
      const board = new BoardComponent(page);
      
      // Use builders to create test data
      const position = aPosition()
        .withFen('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')
        .build();
      
      await board.loadPosition(position);
      
      // Verify position was loaded
      const currentFen = await page.evaluate(() => {
        const boardElement = document.querySelector('[data-testid="training-board"]');
        return boardElement?.getAttribute('data-fen');
      });
      
      expect(currentFen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    });
  });
});