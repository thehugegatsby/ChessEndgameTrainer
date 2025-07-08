import { test, expect, Page } from '@playwright/test';

/**
 * Debug-Test um herauszufinden warum Züge nicht in der History registriert werden
 */

test.describe('Debug Move Handling', () => {
  
  test('untersuche Event-Handler und Store-Updates', async ({ page }) => {
    // Aktiviere Konsolen-Logs
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser console:', msg.text());
      }
    });
    
    // Navigiere zur Trainingsseite
    await page.goto('/train/12');
    
    // Warte auf Brett
    await expect(page.locator('[data-square="c8"]')).toBeVisible();
    
    // Injiziere Debug-Code in die Seite
    await page.evaluate(() => {
      console.log('=== DEBUG: Injecting monitoring code ===');
      
      // Überwache alle Klick-Events
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const square = target.closest('[data-square]');
        if (square) {
          console.log('DEBUG: Click on square:', square.getAttribute('data-square'));
          console.log('DEBUG: Event phase:', e.eventPhase);
          console.log('DEBUG: Event bubbles:', e.bubbles);
        }
      }, true); // Capture phase
      
      // Versuche den Store zu finden (wenn global verfügbar)
      if ((window as any).store) {
        console.log('DEBUG: Store found!');
        const store = (window as any).store;
        const unsubscribe = store.subscribe((state: any) => {
          console.log('DEBUG: Store updated:', JSON.stringify(state, null, 2));
        });
      }
      
      // Versuche chess.js Instanz zu finden
      if ((window as any).chess || (window as any).game) {
        console.log('DEBUG: Chess instance found!');
      }
    });
    
    // Mache einen Zug mit verschiedenen Methoden
    console.log('\n=== Versuche Zug mit force click ===');
    await page.locator('[data-square="c8"]').click({ force: true });
    await page.waitForTimeout(500);
    await page.locator('[data-square="d7"]').click({ force: true });
    await page.waitForTimeout(2000);
    
    // Prüfe Zustand
    let moveCount = await page.locator('.font-mono').count();
    console.log('Züge nach force click:', moveCount);
    
    // Versuche alternativen Ansatz: Drag and Drop
    console.log('\n=== Versuche Drag and Drop ===');
    const c8 = page.locator('[data-square="c8"]');
    const d7 = page.locator('[data-square="d7"]');
    
    await c8.dragTo(d7);
    await page.waitForTimeout(2000);
    
    moveCount = await page.locator('.font-mono').count();
    console.log('Züge nach drag and drop:', moveCount);
    
    // Versuche mit dispatchEvent
    console.log('\n=== Versuche mit dispatchEvent ===');
    await page.evaluate(() => {
      const c8 = document.querySelector('[data-square="c8"]') as HTMLElement;
      const d7 = document.querySelector('[data-square="d7"]') as HTMLElement;
      
      if (c8 && d7) {
        // Simuliere mousedown auf c8
        const mouseDown = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        c8.dispatchEvent(mouseDown);
        console.log('DEBUG: Dispatched mousedown on c8');
        
        // Simuliere mouseup auf d7
        setTimeout(() => {
          const mouseUp = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          d7.dispatchEvent(mouseUp);
          console.log('DEBUG: Dispatched mouseup on d7');
        }, 100);
      }
    });
    
    await page.waitForTimeout(2000);
    moveCount = await page.locator('.font-mono').count();
    console.log('Züge nach dispatchEvent:', moveCount);
    
    // Untersuche die react-chessboard Bibliothek
    console.log('\n=== Untersuche react-chessboard ===');
    const boardInfo = await page.evaluate(() => {
      // Suche nach React Fiber nodes
      const findReactProps = (element: Element) => {
        const keys = Object.keys(element);
        const reactKey = keys.find(key => key.startsWith('__reactFiber') || key.startsWith('__reactProps'));
        return reactKey ? (element as any)[reactKey] : null;
      };
      
      const board = document.querySelector('[data-testid="chess-board"]') || 
                   document.querySelector('.board') ||
                   document.querySelector('[class*="chessboard"]');
      
      if (board) {
        const props = findReactProps(board);
        return {
          found: true,
          hasProps: !!props,
          className: board.className
        };
      }
      
      return { found: false };
    });
    
    console.log('Board info:', boardInfo);
    
    // Screenshot für visuelle Inspektion
    await page.screenshot({ path: 'debug-move-handling.png', fullPage: true });
  });
  
  test('teste mit Puppeteer-style Events', async ({ page }) => {
    await page.goto('/train/12');
    await expect(page.locator('[data-square="c8"]')).toBeVisible();
    
    // Versuche Puppeteer-style mouse events
    const c8Box = await page.locator('[data-square="c8"]').boundingBox();
    const d7Box = await page.locator('[data-square="d7"]').boundingBox();
    
    if (c8Box && d7Box) {
      // Mouse down auf c8
      await page.mouse.move(c8Box.x + c8Box.width / 2, c8Box.y + c8Box.height / 2);
      await page.mouse.down();
      
      // Drag zu d7
      await page.mouse.move(d7Box.x + d7Box.width / 2, d7Box.y + d7Box.height / 2, { steps: 10 });
      
      // Mouse up
      await page.mouse.up();
      
      await page.waitForTimeout(2000);
      
      const moveCount = await page.locator('.font-mono').count();
      console.log('Züge nach mouse events:', moveCount);
    }
  });
});