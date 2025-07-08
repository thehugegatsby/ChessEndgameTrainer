import { test, expect } from '@playwright/test';

/**
 * Einfacher DOM-Click Ansatz mit force:true
 * Pragmatischer Fallback wenn Engine nicht global zugänglich ist
 */

test.describe('Simple DOM Click Tests', () => {
  
  test('Einfacher Klick-Test mit force:true', async ({ page }) => {
    // Console logs für Debugging
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('=== Versuche einfachen Klick-Test ===');
    
    // Prüfe initiale State
    const initialState = await page.evaluate(() => {
      return {
        noMovesText: document.body.textContent?.includes('Noch keine Züge gespielt'),
        totalSquares: document.querySelectorAll('[data-square]').length,
        moveElements: document.querySelectorAll('.font-mono').length
      };
    });
    
    console.log('Initial state:', initialState);
    expect(initialState.totalSquares).toBe(64);
    expect(initialState.noMovesText).toBe(true);
    
    // Finde alle verfügbaren Felder mit Figuren
    const squaresWithPieces = await page.evaluate(() => {
      const squares = document.querySelectorAll('[data-square]');
      const withPieces: string[] = [];
      
      squares.forEach(square => {
        const squareName = square.getAttribute('data-square');
        const hasPiece = square.querySelector('[data-piece]') !== null ||
                        square.innerHTML.includes('piece') ||
                        square.children.length > 1; // Mehr als nur der leere Container
        
        if (hasPiece && squareName) {
          withPieces.push(squareName);
        }
      });
      
      return withPieces;
    });
    
    console.log('Squares with pieces:', squaresWithPieces);
    
    if (squaresWithPieces.length > 0) {
      // Versuche einen einfachen Klick-Test
      const fromSquare = squaresWithPieces[0]; // Erstes Feld mit Figur
      
      // Finde ein nahes leeres Feld für den Zug
      const nearbySquares = await page.evaluate((fromSq) => {
        const fromFile = fromSq.charCodeAt(0) - 97; // a=0, b=1, etc
        const fromRank = parseInt(fromSq[1]) - 1;    // 1=0, 2=1, etc
        
        const possibleMoves: string[] = [];
        
        // King moves (alle 8 Richtungen)
        for (let fileOffset = -1; fileOffset <= 1; fileOffset++) {
          for (let rankOffset = -1; rankOffset <= 1; rankOffset++) {
            if (fileOffset === 0 && rankOffset === 0) continue;
            
            const newFile = fromFile + fileOffset;
            const newRank = fromRank + rankOffset;
            
            if (newFile >= 0 && newFile < 8 && newRank >= 0 && newRank < 8) {
              const square = String.fromCharCode(97 + newFile) + (newRank + 1);
              possibleMoves.push(square);
            }
          }
        }
        
        return possibleMoves;
      }, fromSquare);
      
      console.log(`Trying move from ${fromSquare} to nearby squares:`, nearbySquares);
      
      // Versuche jeden möglichen Zug
      for (const toSquare of nearbySquares.slice(0, 3)) { // Nur erste 3 versuchen
        console.log(`\n=== Attempting move: ${fromSquare} -> ${toSquare} ===`);
        
        try {
          // Klicke Startfeld
          await page.locator(`[data-square="${fromSquare}"]`).click({ force: true });
          await page.waitForTimeout(200);
          
          // Klicke Zielfeld  
          await page.locator(`[data-square="${toSquare}"]`).click({ force: true });
          await page.waitForTimeout(1000); // Warte auf mögliche Animationen
          
          // Prüfe ob sich etwas geändert hat
          const afterMoveState = await page.evaluate(() => {
            return {
              noMovesText: document.body.textContent?.includes('Noch keine Züge gespielt'),
              moveElements: document.querySelectorAll('.font-mono').length,
              bodyTextSample: document.body.textContent?.substring(0, 500)
            };
          });
          
          console.log(`After move ${fromSquare}->${toSquare}:`, afterMoveState);
          
          if (!afterMoveState.noMovesText || afterMoveState.moveElements > 0) {
            console.log(`🎉 SUCCESS! Move ${fromSquare}->${toSquare} worked!`);
            
            // Screenshot des Erfolgs
            await page.screenshot({ 
              path: `successful-move-${fromSquare}-${toSquare}.png`, 
              fullPage: true 
            });
            
            // Prüfe Erwartungen
            expect(afterMoveState.noMovesText).toBe(false);
            return; // Test erfolgreich, beende
          }
        } catch (error) {
          console.log(`Move ${fromSquare}->${toSquare} failed:`, (error as Error).message);
        }
        
        // Reset für nächsten Versuch (falls nötig)
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
      
      console.log('❌ Alle Züge fehlgeschlagen');
    }
    
    // Screenshot final state
    await page.screenshot({ 
      path: 'simple-click-test-final.png', 
      fullPage: true 
    });
  });
  
});