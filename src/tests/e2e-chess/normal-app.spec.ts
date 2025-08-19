/**
 * @file normal-app.spec.ts  
 * @description Test der normalen App - wie ein echter Benutzer
 */

import { test, expect } from '@playwright/test';

test.describe('Normale App Nutzung', () => {
  
  test('App öffnen und schauen was passiert', async ({ page }) => {
    
    console.log('🎯 Öffne normale App...');
    
    // Ganz normale URL ohne Parameter
    await page.goto('http://localhost:3002');
    
    // Warten bis Seite geladen ist
    await page.waitForLoadState('networkidle');
    console.log('✅ Seite geladen');
    
    // Screenshot machen um zu sehen was da ist
    await page.screenshot({ path: 'normal-app-start.png' });
    
    // Schauen ob ein Schachbrett da ist
    const board = page.locator('[data-testid="training-board"]');
    if (await board.count() > 0) {
      console.log('✅ Schachbrett gefunden!');
      const fen = await board.getAttribute('data-fen');
      console.log(`🔍 Aktuelle FEN: ${fen}`);
    } else {
      console.log('❌ Kein Schachbrett gefunden');
    }
    
    // Alle verfügbaren Buttons/Links loggen
    const links = await page.locator('a, button').all();
    console.log(`🔍 ${links.length} Links/Buttons gefunden:`);
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const text = await links[i].textContent();
      console.log(`  - ${text || '[kein Text]'}`);
    }
    
    console.log('🎯 Test COMPLETE - Screenshot: normal-app-start.png');
  });
});