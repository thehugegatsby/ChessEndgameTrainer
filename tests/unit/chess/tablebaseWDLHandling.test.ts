import { getMoveQualityByTablebaseComparison } from '@shared/utils/chess/evaluationHelpers';

describe('Tablebase WDL 0 Handling - Regression Test', () => {
  describe('The Kb5 Bug - WDL 0 should not become undefined', () => {
    it('should correctly evaluate Kb5 blunder (Win->Draw)', () => {
      // The exact case that was failing
      const wdlBefore = 2;  // Win for White
      const wdlAfter = 0;   // Draw (this was becoming undefined!)
      
      const result = getMoveQualityByTablebaseComparison(wdlBefore, wdlAfter, 'w');
      
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });

    it('should handle the JavaScript falsy value trap', () => {
      // Demonstrate the bug
      const wdlValue = 0;
      
      // The bug: using || with 0
      const buggyPattern = wdlValue || undefined;
      expect(buggyPattern).toBeUndefined(); // 0 becomes undefined!
      
      // The fix: explicit undefined check
      const fixedPattern = wdlValue !== undefined ? wdlValue : undefined;
      expect(fixedPattern).toBe(0); // 0 stays 0!
    });
  });

  describe('All positions involving WDL 0', () => {
    it('should handle all transitions involving 0 (draw)', () => {
      const testCases = [
        // From draw
        { from: 0, to: 0, expected: '➖', desc: 'Draw maintained' },
        { from: 0, to: -2, expected: '🎯', desc: 'Draw to win (opponent loses)' },
        { from: 0, to: 2, expected: '❌', desc: 'Draw to loss (opponent wins)' },
        
        // To draw
        { from: 2, to: 0, expected: '🚨', desc: 'Win to draw (blunder!)' },
        { from: -2, to: 0, expected: '👍', desc: 'Loss to draw (good defense)' },
        
        // Cursed wins and blessed losses
        { from: 1, to: 0, expected: '🚨', desc: 'Cursed win to draw' },
        { from: -1, to: 0, expected: '👍', desc: 'Blessed loss to draw' },
      ];

      testCases.forEach(({ from, to, expected, desc }) => {
        const result = getMoveQualityByTablebaseComparison(from, to, 'w');
        expect(result.text).toBe(expected);
      });
    });
  });

  describe('Data validation', () => {
    it('should validate that 0 is a valid WDL value', () => {
      // WDL values according to tablebase API
      const validWDLValues = [-2, -1, 0, 1, 2];
      
      validWDLValues.forEach(wdl => {
        expect(typeof wdl).toBe('number');
        expect(wdl).toBeDefined();
        
        // None should become undefined with proper check
        const checked = wdl !== undefined ? wdl : undefined;
        expect(checked).toBe(wdl);
      });
    });

    it('should handle undefined WDL values gracefully', () => {
      // When tablebase data is missing
      const result = getMoveQualityByTablebaseComparison(
        2, 
        undefined as any, 
        'w'
      );
      
      expect(result.text).toBe('⚪'); // Fallback to neutral
      expect(result.className).toBe('eval-neutral');
    });
  });

  describe('useEvaluation Hook Integration', () => {
    it('should preserve WDL 0 through the data flow', () => {
      // Simulate the data structure from useEvaluation
      const evaluationData = {
        evaluation: 0,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          wdlAfter: 0, // This must not become undefined!
          category: 'draw'
        }
      };

      // What MovePanel's getSmartMoveEvaluation would do
      if (evaluationData.tablebase?.isTablebasePosition && 
          evaluationData.tablebase.wdlBefore !== undefined && 
          evaluationData.tablebase.wdlAfter !== undefined) {
        
        const result = getMoveQualityByTablebaseComparison(
          evaluationData.tablebase.wdlBefore,
          evaluationData.tablebase.wdlAfter,
          'w'
        );
        
        expect(result.text).toBe('🚨');
      }
    });
  });
});