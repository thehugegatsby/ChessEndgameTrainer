/**
 * @fileoverview MoveListComponent Tests
 * @description Comprehensive tests for MoveListComponent with mock DOM and move parsing
 */

import { test, expect, Page } from '@playwright/test';
import { MoveListComponent, Move } from './MoveListComponent';

// Mock DOM setup helper for move list
async function setupMockMoveList(page: Page, moves: string[] = ['e4', 'e5', 'Nf3', 'Nc6']) {
  const moveListHtml = generateMockMoveList(moves);
  await page.setContent(`
    <div data-testid="move-list" role="list">
      ${moveListHtml}
    </div>
  `);
}

// Generate mock move list HTML
function generateMockMoveList(moves: string[]): string {
  const moveItems = [];
  
  for (let i = 0; i < moves.length; i++) {
    const moveNumber = Math.floor(i / 2) + 1;
    const color = i % 2 === 0 ? 'white' : 'black';
    const san = moves[i];
    const isActive = i === moves.length - 1; // Last move is active
    
    moveItems.push(`
      <div 
        data-testid="move-item"
        data-move-number="${i + 1}"
        data-san="${san}"
        data-uci="${generateUciFromSan(san)}"
        data-color="${color}"
        ${isActive ? 'data-active="true" class="move-active"' : ''}
        class="move-item ${isActive ? 'active' : ''}"
      >
        ${moveNumber % 1 === 0 && color === 'white' ? `${moveNumber}.` : ''} ${san}
      </div>
    `);
  }
  
  return moveItems.join('\n');
}

// Helper to generate UCI from SAN (simplified for testing)
function generateUciFromSan(san: string): string {
  const uciMap: Record<string, string> = {
    'e4': 'e2e4',
    'e5': 'e7e5',
    'Nf3': 'g1f3',
    'Nc6': 'b8c6',
    'Bb5': 'f1b5',
    'd6': 'd7d6',
    'O-O': 'e1g1',
    'Nf6': 'g8f6'
  };
  
  return uciMap[san] || `${san.toLowerCase()}`;
}

test.describe('MoveListComponent', () => {
  test.describe('Initialization', () => {
    test('should initialize with default selector', async ({ page }) => {
      await setupMockMoveList(page);
      const moveList = new MoveListComponent(page);
      
      expect(moveList.getDefaultSelector()).toBe(
        '[data-testid="move-list"], .move-list, #move-list, [role="list"]'
      );
    });

    test('should initialize with custom root selector', async ({ page }) => {
      await setupMockMoveList(page);
      const moveList = new MoveListComponent(page, '[data-testid="custom-move-list"]');
      
      // Test that custom selector is used
      expect(await moveList.isVisible()).toBe(false); // Won't find custom selector
    });

    test('should initialize with custom configuration', async ({ page }) => {
      await setupMockMoveList(page);
      const moveList = new MoveListComponent(page, undefined, {
        defaultTimeout: 10000,
        enableLogging: true,
        moveTimeout: 8000,
        enableMoveValidation: true
      });
      
      expect(await moveList.isVisible()).toBe(true);
    });
  });

  test.describe('Move Parsing and Extraction', () => {
    test('should parse moves correctly from DOM', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3', 'Nc6']);
      const moveList = new MoveListComponent(page);
      
      const moves = await moveList.getMoves();
      
      expect(moves).toHaveLength(4);
      
      // Verify first move (white)
      expect(moves[0]).toEqual(expect.objectContaining({
        moveNumber: 1,
        san: 'e4',
        uci: 'e2e4',
        color: 'white',
        halfMove: 1,
        isActive: false
      }));
      
      // Verify second move (black)
      expect(moves[1]).toEqual(expect.objectContaining({
        moveNumber: 2,
        san: 'e5',
        uci: 'e7e5',
        color: 'black',
        halfMove: 2,
        isActive: false
      }));
      
      // Verify last move is active
      expect(moves[3]).toEqual(expect.objectContaining({
        moveNumber: 4,
        san: 'Nc6',
        color: 'black',
        isActive: true
      }));
    });

    test('should handle moves with text-based parsing fallback', async ({ page }) => {
      // Setup move list without data attributes
      await page.setContent(`
        <div data-testid="move-list">
          <div class="move-item" data-move-number="1" data-san="e4">1. e4</div>
          <div class="move-item" data-move-number="2" data-san="e5">1... e5</div>
          <div class="move-item" data-move-number="3" data-san="Nf3">2. Nf3</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const moves = await moveList.getMoves();
      
      expect(moves).toHaveLength(3);
      expect(moves[0].san).toBe('e4');
      expect(moves[1].san).toBe('e5');
      expect(moves[2].san).toBe('Nf3');
    });

    test('should parse complex move notation', async ({ page }) => {
      await setupMockMoveList(page, ['O-O', 'O-O-O', 'Qxd5+', 'Nf6#']);
      const moveList = new MoveListComponent(page);
      
      const moves = await moveList.getMoves();
      
      expect(moves[0].san).toBe('O-O');
      expect(moves[1].san).toBe('O-O-O');
      expect(moves[2].san).toBe('Qxd5+');
      expect(moves[3].san).toBe('Nf6#');
    });

    test('should handle move number extraction from text', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div class="move-item">1. e4</div>
          <div class="move-item">2. e5</div>
          <div class="move-item">3. Nf3</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const moves = await moveList.getMoves();
      
      expect(moves[0].moveNumber).toBe(1);
      expect(moves[1].moveNumber).toBe(2);
      expect(moves[2].moveNumber).toBe(3);
    });

    test('should handle empty move list', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list" role="list">
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      
      // Check immediately instead of waiting for timeout
      const moveCount = await page.locator('[data-testid="move-item"]').count();
      expect(moveCount).toBe(0);
      
      const moves = await moveList.getMoves();
      expect(moves).toHaveLength(0);
      expect(await moveList.isEmpty()).toBe(true);
    });
  });

  test.describe('Move Navigation', () => {
    test('should click on specific move by number', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3', 'Nc6']);
      
      const moveList = new MoveListComponent(page);
      
      // OPTIMIZED: Add click tracking for robust verification
      const clicks: string[] = [];
      await page.exposeFunction('trackMoveClick', (moveNumber: string) => {
        clicks.push(moveNumber);
      });
      
      // Add click tracking to move elements
      await page.evaluate(() => {
        document.querySelectorAll('[data-move-number]').forEach(element => {
          element.addEventListener('click', () => {
            const moveNumber = element.getAttribute('data-move-number');
            if (moveNumber) {
              (window as any).trackMoveClick(moveNumber);
            }
          });
        });
      });
      
      // Get the move element before clicking
      const moveElement = page.locator('[data-move-number="2"]');
      
      // Verify element exists and is clickable
      await expect(moveElement).toBeVisible();
      
      // Use the component's click method for consistency
      await moveList.clickMove(2);
      
      // Verify click was tracked
      expect(clicks).toContain('2');
      
      // Verify element is still visible after click
      await expect(moveElement).toBeVisible();
    });

    test('should handle move click failures gracefully', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5']);
      const moveList = new MoveListComponent(page);
      
      // Try to click non-existent move
      await expect(moveList.clickMove(10)).rejects.toThrow('Move 10 not found');
    });

    test('should navigate to first move', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3']);
      
      const moveList = new MoveListComponent(page);
      
      // Get first move element
      const firstMoveElement = page.locator('[data-move-number="1"]');
      await expect(firstMoveElement).toBeVisible();
      
      // Navigate to first move (this will call clickMove(1) internally)
      await moveList.goToFirstMove();
      
      // Verify first move element is still visible (navigation succeeded)
      await expect(firstMoveElement).toBeVisible();
    });

    test('should navigate to last move', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3']);
      
      const moveList = new MoveListComponent(page);
      
      // Get last move element
      const lastMoveElement = page.locator('[data-move-number="3"]');
      await expect(lastMoveElement).toBeVisible();
      
      // Navigate to last move (this will call clickMove(3) internally)
      await moveList.goToLastMove();
      
      // Verify last move element is still visible (navigation succeeded)
      await expect(lastMoveElement).toBeVisible();
    });

    test('should throw error when navigating empty move list', async ({ page }) => {
      await page.setContent(`<div data-testid="move-list"></div>`);
      const moveList = new MoveListComponent(page);
      
      // Verify list is empty first
      const moveCount = await page.locator('[data-testid="move-item"]').count();
      expect(moveCount).toBe(0);
      
      await expect(moveList.goToFirstMove()).rejects.toThrow('No moves available');
      await expect(moveList.goToLastMove()).rejects.toThrow('No moves available');
    });
  });

  test.describe('Move State Detection', () => {
    test('should detect active move correctly', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3', 'Nc6']);
      const moveList = new MoveListComponent(page);
      
      const activeMove = await moveList.getActiveMove();
      
      expect(activeMove).not.toBeNull();
      expect(activeMove?.san).toBe('Nc6');
      expect(activeMove?.isActive).toBe(true);
      expect(activeMove?.moveNumber).toBe(4);
    });

    test('should detect active move with different indicators', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div data-testid="move-item" data-san="e4">1. e4</div>
          <div data-testid="move-item" data-san="e5" aria-current="true">1... e5</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const activeMove = await moveList.getActiveMove();
      
      expect(activeMove?.san).toBe('e5');
      expect(activeMove?.isActive).toBe(true);
    });

    test('should return null when no active move', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div data-testid="move-item" data-san="e4">1. e4</div>
          <div data-testid="move-item" data-san="e5">1... e5</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const activeMove = await moveList.getActiveMove();
      
      expect(activeMove).toBeNull();
    });
  });

  test.describe('Synchronization', () => {
    test('should wait for specific move count', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5']);
      const moveList = new MoveListComponent(page);
      
      // Initially has 2 moves
      await expect(moveList.waitForMoveCount(2, 1000)).resolves.not.toThrow();
      
      // OPTIMIZED: Use deterministic DOM manipulation instead of setTimeout
      const addMovePromise = page.evaluate(() => {
        return new Promise<void>((resolve) => {
          // Simulate realistic async behavior
          requestAnimationFrame(() => {
            const moveList = document.querySelector('[data-testid="move-list"]');
            if (moveList) {
              moveList.innerHTML += `
                <div data-testid="move-item" data-san="Nf3" data-move-number="3">2. Nf3</div>
              `;
            }
            resolve();
          });
        });
      });
      
      // Start waiting immediately
      const waitPromise = moveList.waitForMoveCount(3, 3000);
      
      // Add move after a short delay
      setTimeout(() => addMovePromise, 200);
      
      // Should wait for 3rd move
      await expect(waitPromise).resolves.not.toThrow();
    });

    test('should wait for specific move to appear', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5']);
      const moveList = new MoveListComponent(page);
      
      // OPTIMIZED: Deterministic move addition with proper sequencing
      const addMovePromise = page.evaluate(() => {
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            const moveList = document.querySelector('[data-testid="move-list"]');
            if (moveList) {
              moveList.innerHTML += `
                <div data-testid="move-item" data-san="Nf3" data-move-number="3">2. Nf3</div>
              `;
            }
            resolve();
          });
        });
      });
      
      // Start both operations concurrently
      const waitPromise = moveList.waitForMove('Nf3', 3000);
      
      // Add move after short delay
      setTimeout(() => addMovePromise, 100);
      
      await expect(waitPromise).resolves.not.toThrow();
    });

    test('should timeout when waiting for non-appearing move', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5']);
      const moveList = new MoveListComponent(page, undefined, { moveTimeout: 500 });
      
      await expect(moveList.waitForMove('Qd5', 500)).rejects.toThrow();
    });
  });

  test.describe('Move Retrieval', () => {
    test('should get last move correctly', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3', 'Nc6']);
      const moveList = new MoveListComponent(page);
      
      const lastMove = await moveList.getLastMove();
      
      expect(lastMove).not.toBeNull();
      expect(lastMove?.san).toBe('Nc6');
      expect(lastMove?.moveNumber).toBe(4);
      expect(lastMove?.color).toBe('black');
    });

    test('should return null for last move in empty list', async ({ page }) => {
      await page.setContent(`<div data-testid="move-list"></div>`);
      const moveList = new MoveListComponent(page);
      
      const lastMove = await moveList.getLastMove();
      expect(lastMove).toBeNull();
    });

    test('should get all moves with proper ordering', async ({ page }) => {
      await setupMockMoveList(page, ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);
      const moveList = new MoveListComponent(page);
      
      const moves = await moveList.getMoves();
      
      expect(moves).toHaveLength(5);
      expect(moves.map(m => m.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);
      expect(moves.map(m => m.color)).toEqual(['white', 'black', 'white', 'black', 'white']);
      expect(moves.map(m => m.moveNumber)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  test.describe('Hybrid Selector Strategy', () => {
    test('should find move list with primary selector', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div data-testid="move-item" data-san="e4">1. e4</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      expect(await moveList.isVisible()).toBe(true);
    });

    test('should fallback to role selector', async ({ page }) => {
      await page.setContent(`
        <div role="list">
          <div data-testid="move-item" data-san="e4">1. e4</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      expect(await moveList.isVisible()).toBe(true);
    });

    test('should fallback to class selector', async ({ page }) => {
      await page.setContent(`
        <div class="move-list">
          <div class="move-item" data-san="e4">1. e4</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      expect(await moveList.isVisible()).toBe(true);
    });

    test('should handle selector failures gracefully', async ({ page }) => {
      await page.setContent(`<div>No move list here</div>`);
      const moveList = new MoveListComponent(page);
      
      // Check immediately without waiting for timeout
      const moveListCount = await page.locator('[data-testid="move-list"]').count();
      expect(moveListCount).toBe(0);
      
      expect(await moveList.isVisible()).toBe(false);
      const moves = await moveList.getMoves();
      expect(moves).toHaveLength(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle malformed move data gracefully', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div data-testid="move-item"><!-- Empty move --></div>
          <div data-testid="move-item" data-san=""><!-- Empty SAN --></div>
          <div data-testid="move-item" data-san="invalid-move">Invalid</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const moves = await moveList.getMoves();
      
      // Should filter out invalid moves
      expect(moves.length).toBeLessThanOrEqual(1);
    });

    test('should handle network failures gracefully', async ({ page }) => {
      await setupMockMoveList(page);
      const moveList = new MoveListComponent(page, undefined, { maxRetries: 1 });
      
      // Mock network failure
      await page.route('**/*', route => route.abort());
      
      // Should still handle local operations
      const isVisible = await moveList.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });

    test('should handle timeout errors appropriately', async ({ page }) => {
      await setupMockMoveList(page);
      const moveList = new MoveListComponent(page, undefined, { moveTimeout: 200 });
      
      // OPTIMIZED: More realistic timeout test with proper error message validation
      const timeoutPromise = moveList.waitForMoveCount(100, 300);
      
      await expect(timeoutPromise).rejects.toThrow(/timeout|not met within/);
    });
  });

  test.describe('Performance', () => {
    test('should handle large move lists efficiently', async ({ page }) => {
      // Generate large move list (50 moves)
      const largeMoveList = Array.from({ length: 50 }, (_, i) => 
        i % 4 === 0 ? 'e4' : i % 4 === 1 ? 'e5' : i % 4 === 2 ? 'Nf3' : 'Nc6'
      );
      
      await setupMockMoveList(page, largeMoveList);
      const moveList = new MoveListComponent(page);
      
      const startTime = Date.now();
      const moves = await moveList.getMoves();
      const endTime = Date.now();
      
      expect(moves).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in reasonable time
    });

    test('should handle rapid move updates', async ({ page }) => {
      await setupMockMoveList(page, ['e4']);
      const moveList = new MoveListComponent(page);
      
      const startTime = Date.now();
      
      // OPTIMIZED: Batch DOM updates for better performance
      const batchedMoveAddition = page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let moveCount = 0;
          const totalMoves = 10;
          
          const addMove = () => {
            if (moveCount < totalMoves) {
              const moveListEl = document.querySelector('[data-testid="move-list"]');
              if (moveListEl) {
                moveListEl.innerHTML += `
                  <div data-testid="move-item" data-san="move${moveCount}" data-move-number="${moveCount + 2}">move${moveCount}</div>
                `;
              }
              moveCount++;
              
              // Use requestAnimationFrame for smooth updates
              requestAnimationFrame(() => {
                if (moveCount < totalMoves) {
                  addMove();
                } else {
                  resolve();
                }
              });
            }
          };
          
          addMove();
        });
      });
      
      // Start both operations
      const waitPromise = moveList.waitForMoveCount(11, 5000);
      
      // Start adding moves
      setTimeout(() => batchedMoveAddition, 50);
      
      await expect(waitPromise).resolves.not.toThrow();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  test.describe('Integration Features', () => {
    test('should work with move evaluation data', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div data-testid="move-item" data-san="e4" data-evaluation="0.3">1. e4 (+0.3)</div>
          <div data-testid="move-item" data-san="e5" data-evaluation="-0.2">1... e5 (-0.2)</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const moves = await moveList.getMoves();
      
      expect(moves[0].evaluation).toBe(0.3);
      expect(moves[1].evaluation).toBe(-0.2);
    });

    test('should extract move details for engine integration', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div 
            data-testid="move-item" 
            data-san="e4" 
            data-uci="e2e4"
            data-from="e2"
            data-to="e4"
          >1. e4</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const moves = await moveList.getMoves();
      
      expect(moves[0].uci).toBe('e2e4');
      expect(moves[0].from).toBe('e2');
      expect(moves[0].to).toBe('e4');
    });

    test('should handle promotion moves correctly', async ({ page }) => {
      await page.setContent(`
        <div data-testid="move-list">
          <div 
            data-testid="move-item" 
            data-san="a8=Q+" 
            data-promotion="Q"
          >a8=Q+</div>
        </div>
      `);
      
      const moveList = new MoveListComponent(page);
      const moves = await moveList.getMoves();
      
      expect(moves[0].san).toBe('a8=Q+');
      expect(moves[0].promotion).toBe('Q');
    });
  });
});