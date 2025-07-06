/**
 * ACTUAL BUG TEST: Screenshot vom 2025-07-06
 * 
 * PROBLEM: Kd7 sollte ✅ (Sieg gehalten) zeigen, zeigt aber +47.8 (Engine)
 * 
 * POSITION: 2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1
 * - Weiß König c8, Bauer c7, Turm e4
 * - Schwarz König f7, Turm b2
 * - Weiß am Zug, Gewinnstellung für Weiß
 * 
 * ERWARTUNG: Da Tablebase verfügbar ist, sollte Kd7 als "Sieg gehalten" (✅) erscheinen
 * REALITÄT: System zeigt Engine-Bewertung +47.8 statt Tablebase-Symbol
 */

import { ScenarioEngine } from '@/lib/chess/ScenarioEngine';
import { getMoveQualityByTablebaseComparison } from '@/utils/chess/evaluationHelpers';

describe('ACTUAL BUG: Screenshot Kd7 zeigt +47.8 statt ✅', () => {
  const SCREENSHOT_FEN = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
  let engine: ScenarioEngine;

  beforeEach(() => {
    engine = new ScenarioEngine(SCREENSHOT_FEN);
  });

  afterEach(() => {
    engine.quit();
  });

  describe('Was passiert AKTUELL (Reproduktion)', () => {
    it('sollte zeigen was getDualEvaluation für diese Position liefert', async () => {
      const dualEval = await engine.getDualEvaluation(SCREENSHOT_FEN);
      
      console.log('=== AKTUELLE AUSGABE ===');
      console.log('Engine:', dualEval.engine);
      console.log('Tablebase:', dualEval.tablebase);
      
      // Dokumentiere die aktuelle (defekte) Ausgabe
      expect(dualEval.engine).toBeDefined();
      
      // FRAGE: Ist Tablebase verfügbar?
      if (dualEval.tablebase) {
        console.log('✓ Tablebase IST verfügbar:', dualEval.tablebase);
        expect(dualEval.tablebase.isAvailable).toBe(true);
      } else {
        console.log('✗ Tablebase ist NICHT verfügbar');
      }
    }, 10000);

    it('sollte testen ob Tablebase für diese spezifische Position funktioniert', async () => {
      const tablebaseInfo = await engine.getTablebaseInfo(SCREENSHOT_FEN);
      
      console.log('=== TABLEBASE INFO ===');
      console.log('Tablebase verfügbar:', tablebaseInfo.isTablebasePosition);
      console.log('WDL:', tablebaseInfo.result?.wdl);
      console.log('DTZ:', tablebaseInfo.result?.dtz);
      console.log('Category:', tablebaseInfo.result?.category);
      
      // Wenn Tablebase verfügbar ist, dokumentiere WDL-Werte
      if (tablebaseInfo.isTablebasePosition && tablebaseInfo.result) {
        expect(tablebaseInfo.result.wdl).toBeDefined();
        expect(tablebaseInfo.result.category).toBeDefined();
      }
    }, 10000);
  });

  describe('Was SOLLTE passieren (Erwartetes Verhalten)', () => {
    it('sollte Kd7 als "Sieg gehalten" klassifizieren wenn Tablebase verfügbar', async () => {
      // Simuliere Kd7 Zug: Kc8→Kd7
      const afterKd7 = '3K4/2P2k2/8/8/4R3/8/1r6/8 b - - 1 1';
      
      // Teste Tablebase für beide Positionen
      const beforeTablebase = await engine.getTablebaseInfo(SCREENSHOT_FEN);
      const afterTablebase = await engine.getTablebaseInfo(afterKd7);
      
      console.log('=== Kd7 MOVE ANALYSIS ===');
      console.log('Vor Kd7 - WDL:', beforeTablebase.result?.wdl, 'Category:', beforeTablebase.result?.category);
      console.log('Nach Kd7 - WDL:', afterTablebase.result?.wdl, 'Category:', afterTablebase.result?.category);
      
      if (beforeTablebase.isTablebasePosition && afterTablebase.isTablebasePosition) {
        const beforeWdl = beforeTablebase.result?.wdl || 0;
        const afterWdl = afterTablebase.result?.wdl || 0;
        
        // Teste was evaluationHelpers für Win→Win sagen
        const moveQuality = getMoveQualityByTablebaseComparison(beforeWdl, afterWdl, 'w');
        
        console.log('Move Quality Result:', moveQuality);
        
        // ERWARTUNG: Win→Win sollte ✅ ergeben
        if (beforeWdl === 2 && afterWdl === 2) {
          expect(moveQuality.text).toBe('✅');
          expect(moveQuality.className).toBe('eval-excellent');
        }
      }
    }, 10000);

    it('sollte bestätigen dass Position Gewinn für Weiß ist', async () => {
      const tablebaseInfo = await engine.getTablebaseInfo(SCREENSHOT_FEN);
      
      if (tablebaseInfo.isTablebasePosition && tablebaseInfo.result) {
        console.log('=== POSITION BEWERTUNG ===');
        console.log('WDL:', tablebaseInfo.result.wdl);
        console.log('Category:', tablebaseInfo.result.category);
        
        // Diese Position sollte Gewinn für Weiß sein (WDL = 2)
        expect(tablebaseInfo.result.category).toBe('win');
        expect(tablebaseInfo.result.wdl).toBe(2);
      }
    }, 10000);
  });

  describe('Root Cause Investigation', () => {
    it('sollte prüfen ob das Problem in der UI oder in der Evaluation liegt', async () => {
      const dualEval = await engine.getDualEvaluation(SCREENSHOT_FEN);
      
      // DIAGNOSE: Wo liegt das Problem?
      const diagnosis = {
        tablebaseAvailable: !!dualEval.tablebase,
        tablebaseWorking: dualEval.tablebase?.isAvailable || false,
        engineFallback: !dualEval.tablebase && !!dualEval.engine,
        engineScore: dualEval.engine?.score,
        tablebaseWdl: dualEval.tablebase?.result?.wdl
      };
      
      console.log('=== DIAGNOSE ===');
      console.log(diagnosis);
      
      // Dokumentiere für Debugging
      expect(diagnosis).toBeDefined();
    }, 10000);
  });
});