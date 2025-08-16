import { test } from '@playwright/test';

test('debug useEffect and mount behavior', async ({ page }) => {
  await page.goto('/training');

  // Check if useEffect runs at all
  const mountResult = await page.evaluate(() => {
    console.log('Browser evaluation starting...');

    // Check if React is available
    const hasReact = typeof window !== 'undefined' && (window as any).React;
    console.log('React available:', hasReact);

    // Check DOM ready state
    console.log('Document ready state:', document.readyState);

    // Check if any React components mounted
    const reactFiberRoots = Object.keys(window).filter(key => key.includes('__reactFiber'));
    console.log('React fiber roots:', reactFiberRoots.length);

    // Try to manually trigger what should happen in useEffect
    const board = document.querySelector('[data-chessboard-hydrated="false"]');
    console.log('Found loading board:', !!board);

    if (board) {
      // Simulate the mount effect
      board.setAttribute('data-manual-mount-test', 'true');
      console.log('Set manual mount test attribute');
    }

    return {
      hasReact,
      readyState: document.readyState,
      reactRoots: reactFiberRoots.length,
      foundBoard: !!board,
    };
  });

  console.log('Mount debug result:', mountResult);

  // Wait a bit and check again
  await page.waitForTimeout(2000);

  const afterWait = await page.evaluate(() => {
    const board = document.querySelector('[data-chessboard-hydrated]');
    return {
      hydratedValue: board?.getAttribute('data-chessboard-hydrated'),
      manualTest: board?.getAttribute('data-manual-mount-test'),
      allAttributes: board
        ? Array.from(board.attributes).map(attr => `${attr.name}=${attr.value}`)
        : [],
    };
  });

  console.log('After wait result:', afterWait);
});
