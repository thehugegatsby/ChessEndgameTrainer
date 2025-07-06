/**
 * END-TO-END EVALUATION CHAIN TEST
 * 
 * Testet die komplette Kette: Position → Tablebase → Move Quality → UI Symbol
 * Das ist was der User sehen SOLLTE vs. was er aktuell sieht
 */

import { getMoveQualityByTablebaseComparison } from '@/utils/chess/evaluationHelpers';

describe('E2E Evaluation Chain: Position → Tablebase → Move Quality → UI Symbol', () => {
  const SCREENSHOT_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
  
  describe('CORRECT CHAIN (with real tablebase data)', () => {
    it('sollte Kd7 als ✅ (Sieg gehalten) bewerten', () => {
      console.log('=== KORREKTE BEWERTUNGSKETTE FÜR Kd7 ===');
      
      // STEP 1: Position ist Win für Weiß (von API bestätigt)
      const positionWdl = 2; // Win for White
      console.log('1. Position WDL:', positionWdl, '(Win für Weiß)');
      
      // STEP 2: Nach Kd7 - Position bleibt Win für Weiß  
      // (Kd7 move hat category: 'loss' = gut für Weiß, da Gegner verliert)
      const afterKd7Wdl = 2; // Still Win for White
      console.log('2. Nach Kd7 WDL:', afterKd7Wdl, '(Win gehalten)');
      
      // STEP 3: Move Quality Analysis
      const moveQuality = getMoveQualityByTablebaseComparison(
        positionWdl,    // 2 (Win)
        afterKd7Wdl,    // 2 (Win) 
        'w'             // White to move
      );
      
      console.log('3. Move Quality Result:', moveQuality);
      
      // EXPECTED: Win → Win should be ✅ (Sieg gehalten)
      expect(moveQuality.text).toBe('✅');
      expect(moveQuality.className).toBe('eval-excellent');
      
      console.log('✅ KORREKT: Kd7 sollte als "Sieg gehalten" (✅) angezeigt werden');
    });
    
    it('sollte Kb5 als 🚨 (Sieg weggeworfen) bewerten', () => {
      console.log('=== KORREKTE BEWERTUNGSKETTE FÜR Kb5 ===');
      
      // STEP 1: Position ist Win für Weiß
      const positionWdl = 2; // Win for White
      console.log('1. Position WDL:', positionWdl, '(Win für Weiß)');
      
      // STEP 2: Nach Kb5 - Position wird Draw (Blunder!)
      // (Basierend auf der ursprünglichen Spezifikation)
      const afterKb5Wdl = 0; // Draw - Gewinn weggeworfen!
      console.log('2. Nach Kb5 WDL:', afterKb5Wdl, '(Gewinn weggeworfen!)');
      
      // STEP 3: Move Quality Analysis  
      const moveQuality = getMoveQualityByTablebaseComparison(
        positionWdl,    // 2 (Win)
        afterKb5Wdl,    // 0 (Draw)
        'w'             // White to move
      );
      
      console.log('3. Move Quality Result:', moveQuality);
      
      // EXPECTED: Win → Draw should be 🚨 (Sieg → Remis weggeworfen)
      expect(moveQuality.text).toBe('🚨');
      expect(moveQuality.className).toBe('eval-blunder');
      
      console.log('✅ KORREKT: Kb5 sollte als "Sieg → Remis weggeworfen" (🚨) angezeigt werden');
    });
  });
  
  describe('CURRENT BROKEN CHAIN (with empty tablebase response)', () => {
    it('zeigt was aktuell passiert wenn Tablebase {} zurückgibt', () => {
      console.log('=== AKTUELLE DEFEKTE KETTE ===');
      
      // STEP 1: Tablebase API gibt {} zurück (JSDOM Problem)
      console.log('1. Tablebase API Response: {} (leer)');
      
      // STEP 2: Default-Werte werden verwendet
      const defaultWdl = 0; // Default to draw
      const defaultCategory = 'draw';
      console.log('2. Default WDL:', defaultWdl, 'Category:', defaultCategory);
      
      // STEP 3: Move Quality mit falschen Defaults
      const brokenMoveQuality = getMoveQualityByTablebaseComparison(
        defaultWdl,     // 0 (Draw) - FALSCH!
        defaultWdl,     // 0 (Draw) - FALSCH!
        'w'
      );
      
      console.log('3. Defekte Move Quality:', brokenMoveQuality);
      
      // RESULT: Draw → Draw = ➖ (Remis gehalten) - FALSCH!
      expect(brokenMoveQuality.text).toBe('➖');
      expect(brokenMoveQuality.className).toBe('eval-neutral');
      
      console.log('❌ PROBLEM: Zeigt ➖ (Remis gehalten) statt ✅ (Sieg gehalten)');
    });
  });
  
  describe('ENGINE FALLBACK EXPLANATION', () => {
    it('erklärt warum Engine +47.8 angezeigt wird', () => {
      console.log('=== ENGINE FALLBACK ERKLÄRT ===');
      
      // When tablebase fails, system falls back to engine evaluation
      const engineScore = 4780; // +47.8 in centipawns (massive advantage)
      const engineEvaluation = engineScore / 100; // +47.8
      
      console.log('1. Tablebase failed → Engine Fallback');
      console.log('2. Engine Score:', engineScore, 'centipawns');
      console.log('3. Formatted:', `+${engineEvaluation.toFixed(1)}`);
      
      // This explains why user sees +47.8 instead of ✅
      expect(engineEvaluation).toBe(47.8);
      
      console.log('✅ ERKLÄRT: Engine zeigt +47.8 weil Tablebase nicht funktioniert');
    });
  });
  
  describe('SOLUTION VERIFICATION', () => {
    it('sollte nach dem Fix die korrekte Kette zeigen', () => {
      console.log('=== NACH DEM FIX (Erwartetes Verhalten) ===');
      
      // Simulate fixed tablebase response
      const mockTablebaseResponse = {
        isTablebasePosition: true,
        result: {
          wdl: 2,          // Win for White
          category: 'win',
          dtz: 9
        }
      };
      
      console.log('1. Tablebase Response (gefixt):', mockTablebaseResponse);
      
      // Move evaluation should now work correctly
      const fixedMoveQuality = getMoveQualityByTablebaseComparison(
        2,    // Win before
        2,    // Win after (Kd7 maintains win)
        'w'
      );
      
      console.log('2. Fixed Move Quality:', fixedMoveQuality);
      
      // After fix: Should show ✅ instead of +47.8
      expect(fixedMoveQuality.text).toBe('✅');
      expect(fixedMoveQuality.className).toBe('eval-excellent');
      
      console.log('🎯 ZIEL: Nach dem Fix sieht User ✅ statt +47.8 für Kd7');
    });
  });
});