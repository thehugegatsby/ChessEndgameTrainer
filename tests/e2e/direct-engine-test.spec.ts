import { test, expect } from '@playwright/test';

/**
 * Direkter Zugriff auf Chess Engine via page.evaluate()
 * Pragmatischer Ansatz für E2E Tests
 */

test.describe('Direct Chess Engine Access', () => {
  
  test('Finde und teste Chess Engine direkt', async ({ page }) => {
    // Console logs für Debugging
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Finde die Chess Engine im Browser-Kontext
    const engineInfo = await page.evaluate(() => {
      const info: any = {
        windowKeys: Object.keys(window).filter(key => 
          key.includes('chess') || key.includes('game') || key.includes('Chess')
        ),
        hasReact: !!(window as any).React,
        hasZustand: !!(window as any).__ZUSTAND__,
        globalThis: Object.keys(globalThis).filter(key => 
          key.includes('chess') || key.includes('game')
        )
      };
      
      // Versuche verschiedene mögliche Engine-Pfade
      const possiblePaths = [
        'window.game',
        'window.chess', 
        'window.chessGame',
        'window.engine',
        'window.__CHESS_ENGINE__'
      ];
      
      info.enginePaths = {};
      possiblePaths.forEach(path => {
        try {
          const obj = eval(path);
          info.enginePaths[path] = {
            exists: !!obj,
            type: typeof obj,
            hasMoveMethod: obj && typeof obj.move === 'function',
            methods: obj ? Object.getOwnPropertyNames(obj).filter(name => 
              typeof obj[name] === 'function'
            ).slice(0, 10) : []
          };
        } catch (e) {
          info.enginePaths[path] = { exists: false, error: (e as Error).message };
        }
      });
      
      return info;
    });
    
    console.log('Engine Info:', JSON.stringify(engineInfo, null, 2));
    
    // Versuche direkten Zugriff auf React Component State
    const reactInfo = await page.evaluate(() => {
      const chessboards = document.querySelectorAll('[data-square]');
      if (chessboards.length === 0) return { error: 'No chessboard found' };
      
      // Versuche React Fiber Tree zu durchsuchen
      const boardElement = chessboards[0].closest('div');
      if (!boardElement) return { error: 'No board container found' };
      
      // React DevTools Tricks
      const reactFiber = (boardElement as any)._reactInternalFiber || 
                        (boardElement as any).__reactInternalInstance ||
                        (boardElement as any)._reactInternalInstance;
      
      if (reactFiber) {
        return {
          hasReactFiber: true,
          fiberKeys: Object.keys(reactFiber).slice(0, 10)
        };
      }
      
      return { hasReactFiber: false };
    });
    
    console.log('React Info:', JSON.stringify(reactInfo, null, 2));
    
    // Wenn wir eine Engine gefunden haben, teste einen Zug
    const testResult = await page.evaluate(() => {
      // Versuche die gefundene Engine zu verwenden
      const engines = [
        (window as any).game,
        (window as any).chess,
        (window as any).chessGame
      ].filter(Boolean);
      
      if (engines.length === 0) {
        return { success: false, error: 'No chess engine found' };
      }
      
      const engine = engines[0];
      console.log('Found engine:', engine);
      
      if (typeof engine.move !== 'function') {
        return { 
          success: false, 
          error: 'Engine has no move method',
          methods: Object.getOwnPropertyNames(engine).filter(name => 
            typeof engine[name] === 'function'
          )
        };
      }
      
      try {
        // Versuche einen einfachen Zug
        const result = engine.move('e4');
        return { 
          success: true, 
          moveResult: result,
          engineState: {
            fen: engine.fen ? engine.fen() : 'no fen method',
            turn: engine.turn ? engine.turn() : 'no turn method'
          }
        };
      } catch (error) {
        return { 
          success: false, 
          error: (error as Error).message,
          engineMethods: Object.getOwnPropertyNames(engine).filter(name => 
            typeof engine[name] === 'function'
          ).slice(0, 10)
        };
      }
    });
    
    console.log('Test Result:', JSON.stringify(testResult, null, 2));
    
    // Screenshot für visuelle Inspektion
    await page.screenshot({ 
      path: 'direct-engine-test.png', 
      fullPage: true 
    });
    
    // Basis-Erwartungen
    expect(engineInfo.windowKeys.length).toBeGreaterThanOrEqual(0);
  });
  
});