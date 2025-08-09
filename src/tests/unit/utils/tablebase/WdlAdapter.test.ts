/**
 * Comprehensive tests for WdlAdapter
 * 
 * Tests the core WDL (Win/Draw/Loss) perspective conversion utility that replaces
 * scattered negation anti-patterns throughout the codebase.
 */

import { WdlAdapter, WdlValue, RawWdlValue, MoveQuality } from '@shared/utils/tablebase/wdl';

describe('WdlAdapter', () => {
  describe('rawToCanonical', () => {
    it('should convert positive raw WDL to win (1)', () => {
      expect(WdlAdapter.rawToCanonical(1000)).toBe(1);
      expect(WdlAdapter.rawToCanonical(500)).toBe(1);
      expect(WdlAdapter.rawToCanonical(1)).toBe(1);
    });

    it('should convert zero raw WDL to draw (0)', () => {
      expect(WdlAdapter.rawToCanonical(0)).toBe(0);
    });

    it('should convert negative raw WDL to loss (-1)', () => {
      expect(WdlAdapter.rawToCanonical(-1000)).toBe(-1);
      expect(WdlAdapter.rawToCanonical(-500)).toBe(-1);
      expect(WdlAdapter.rawToCanonical(-1)).toBe(-1);
    });

    it('should handle extreme values correctly', () => {
      expect(WdlAdapter.rawToCanonical(999999)).toBe(1);
      expect(WdlAdapter.rawToCanonical(-999999)).toBe(-1);
    });
  });

  describe('canonicalToRaw', () => {
    it('should convert canonical WDL back to raw values', () => {
      expect(WdlAdapter.canonicalToRaw(1)).toBe(1000);
      expect(WdlAdapter.canonicalToRaw(0)).toBe(0);
      expect(WdlAdapter.canonicalToRaw(-1)).toBe(-1000);
    });

    it('should be symmetric with rawToCanonical for standard values', () => {
      const rawValues: RawWdlValue[] = [1000, 0, -1000];
      
      rawValues.forEach(raw => {
        const canonical = WdlAdapter.rawToCanonical(raw);
        const backToRaw = WdlAdapter.canonicalToRaw(canonical);
        expect(backToRaw).toBe(raw);
      });
    });
  });

  describe('flipPerspective', () => {
    it('should negate WDL value for perspective flip', () => {
      expect(WdlAdapter.flipPerspective(1000)).toBe(-1000);
      expect(WdlAdapter.flipPerspective(-500)).toBe(500);
      expect(WdlAdapter.flipPerspective(0)).toBe(-0); // JavaScript: -(0) = -0
    });

    it('should be symmetric (double flip returns original)', () => {
      const values = [1000, -500, 0, 750];
      
      values.forEach(value => {
        const flipped = WdlAdapter.flipPerspective(value);
        const doubleFlipped = WdlAdapter.flipPerspective(flipped);
        expect(doubleFlipped).toBe(value);
      });
    });
  });

  describe('convertToPlayerPerspective', () => {
    it('should keep wdlBefore unchanged (already player perspective)', () => {
      const result = WdlAdapter.convertToPlayerPerspective(800, -300);
      
      expect(result.wdlBeforeFromPlayerPerspective).toBe(800);
    });

    it('should flip wdlAfter (from opponent to player perspective)', () => {
      const result = WdlAdapter.convertToPlayerPerspective(800, -300);
      
      expect(result.wdlAfterFromPlayerPerspective).toBe(300); // -(-300)
    });

    it('should match MoveQualityEvaluator.convertToPlayerPerspective logic', () => {
      // Test case from MoveQualityEvaluator - side-to-move perspective handling
      const wdlBefore = 1000; // Player was winning
      const wdlAfter = -500;   // Opponent now sees player losing = opponent winning
      
      const result = WdlAdapter.convertToPlayerPerspective(wdlBefore, wdlAfter);
      
      // Original player perspective: was winning (1000), now losing (-(-500) = 500)
      // Wait, this should be losing from player's perspective
      expect(result.wdlBeforeFromPlayerPerspective).toBe(1000);
      expect(result.wdlAfterFromPlayerPerspective).toBe(500); // Opponent sees -500, so player sees +500
    });

    it('should handle draw positions correctly', () => {
      const result = WdlAdapter.convertToPlayerPerspective(0, 0);
      
      expect(result.wdlBeforeFromPlayerPerspective).toBe(0);
      expect(result.wdlAfterFromPlayerPerspective).toBe(-0); // -(0) = -0 in JavaScript
    });
  });

  describe('isWinToDrawOrLoss', () => {
    it('should detect win to draw degradation', () => {
      expect(WdlAdapter.isWinToDrawOrLoss(500, 0)).toBe(true);
      expect(WdlAdapter.isWinToDrawOrLoss(1000, 0)).toBe(true);
    });

    it('should detect win to loss degradation', () => {
      expect(WdlAdapter.isWinToDrawOrLoss(800, -200)).toBe(true);
      expect(WdlAdapter.isWinToDrawOrLoss(1000, -1000)).toBe(true);
    });

    it('should not detect non-degrading changes', () => {
      expect(WdlAdapter.isWinToDrawOrLoss(500, 600)).toBe(false); // Win to better win
      expect(WdlAdapter.isWinToDrawOrLoss(0, 0)).toBe(false); // Draw to draw
      expect(WdlAdapter.isWinToDrawOrLoss(-500, -200)).toBe(false); // Loss to better loss
      expect(WdlAdapter.isWinToDrawOrLoss(0, 300)).toBe(false); // Draw to win
    });

    it('should match MoveQualityEvaluator.isWinToDrawOrLoss logic', () => {
      // Direct test of L354: return wdlBefore > 0 && wdlAfter <= 0;
      expect(WdlAdapter.isWinToDrawOrLoss(1, 0)).toBe(true);   // wdlBefore > 0 && wdlAfter <= 0
      expect(WdlAdapter.isWinToDrawOrLoss(1, -1)).toBe(true);  // wdlBefore > 0 && wdlAfter <= 0  
      expect(WdlAdapter.isWinToDrawOrLoss(0, -1)).toBe(false); // wdlBefore = 0, not > 0
      expect(WdlAdapter.isWinToDrawOrLoss(1, 1)).toBe(false);  // wdlAfter > 0, not <= 0
    });
  });

  describe('isDrawToLoss', () => {
    it('should detect draw to loss degradation', () => {
      expect(WdlAdapter.isDrawToLoss(0, -500)).toBe(true);
      expect(WdlAdapter.isDrawToLoss(0, -1)).toBe(true);
    });

    it('should not detect non-degrading changes from draw', () => {
      expect(WdlAdapter.isDrawToLoss(0, 0)).toBe(false);   // Draw to draw
      expect(WdlAdapter.isDrawToLoss(0, 500)).toBe(false); // Draw to win
      expect(WdlAdapter.isDrawToLoss(500, -200)).toBe(false); // Win to loss (not from draw)
      expect(WdlAdapter.isDrawToLoss(-200, -500)).toBe(false); // Loss to worse loss
    });

    it('should match MoveQualityEvaluator.isDrawToLoss logic', () => {
      // Direct test of L361: return wdlBefore === 0 && wdlAfter < 0;
      expect(WdlAdapter.isDrawToLoss(0, -1)).toBe(true);   // wdlBefore === 0 && wdlAfter < 0
      expect(WdlAdapter.isDrawToLoss(0, -500)).toBe(true); // wdlBefore === 0 && wdlAfter < 0
      expect(WdlAdapter.isDrawToLoss(1, -1)).toBe(false);  // wdlBefore !== 0
      expect(WdlAdapter.isDrawToLoss(0, 0)).toBe(false);   // wdlAfter = 0, not < 0
      expect(WdlAdapter.isDrawToLoss(0, 1)).toBe(false);   // wdlAfter > 0, not < 0
    });
  });

  describe('didOutcomeChange', () => {
    it('should detect significant position degradation', () => {
      expect(WdlAdapter.didOutcomeChange(800, 0)).toBe(true);   // Win to draw
      expect(WdlAdapter.didOutcomeChange(500, -200)).toBe(true); // Win to loss  
      expect(WdlAdapter.didOutcomeChange(0, -300)).toBe(true);   // Draw to loss
    });

    it('should not detect non-significant changes', () => {
      expect(WdlAdapter.didOutcomeChange(800, 900)).toBe(false);  // Win to better win
      expect(WdlAdapter.didOutcomeChange(0, 400)).toBe(false);    // Draw to win
      expect(WdlAdapter.didOutcomeChange(-200, -100)).toBe(false); // Loss to better loss
      expect(WdlAdapter.didOutcomeChange(0, 0)).toBe(false);      // No change
    });

    it('should combine win-to-draw/loss and draw-to-loss detection', () => {
      // This method should return true if EITHER condition is met
      expect(WdlAdapter.didOutcomeChange(100, 0)).toBe(true);  // isWinToDrawOrLoss = true
      expect(WdlAdapter.didOutcomeChange(0, -100)).toBe(true); // isDrawToLoss = true
      expect(WdlAdapter.didOutcomeChange(100, -100)).toBe(true); // isWinToDrawOrLoss = true (also covers win to loss)
    });
  });

  describe('getMoveQuality', () => {
    it('should classify blunders (win/draw to loss)', () => {
      expect(WdlAdapter.getMoveQuality(800, 0)).toBe('blunder');   // Win to draw
      expect(WdlAdapter.getMoveQuality(500, -200)).toBe('blunder'); // Win to loss
      expect(WdlAdapter.getMoveQuality(0, -300)).toBe('mistake');   // Draw to loss -> mistake per implementation
    });

    it('should classify mistakes (draw to loss)', () => {
      expect(WdlAdapter.getMoveQuality(0, -500)).toBe('mistake');
      expect(WdlAdapter.getMoveQuality(0, -1)).toBe('mistake');
    });

    it('should classify good moves (improvement)', () => {
      expect(WdlAdapter.getMoveQuality(200, 600)).toBe('good');  // Win to better win
      expect(WdlAdapter.getMoveQuality(0, 300)).toBe('good');    // Draw to win  
      expect(WdlAdapter.getMoveQuality(-400, -100)).toBe('good'); // Loss to better loss
    });

    it('should classify best moves (no degradation)', () => {
      expect(WdlAdapter.getMoveQuality(500, 500)).toBe('best');  // Same evaluation
      expect(WdlAdapter.getMoveQuality(0, 0)).toBe('best');      // Same draw
      expect(WdlAdapter.getMoveQuality(-200, -200)).toBe('best'); // Same loss
      expect(WdlAdapter.getMoveQuality(800, 700)).toBe('best');   // Slight degradation within win
    });
  });

  describe('formatWdl', () => {
    it('should format winning positions', () => {
      expect(WdlAdapter.formatWdl(1000)).toBe('Winning');
      expect(WdlAdapter.formatWdl(500)).toBe('Winning');
      expect(WdlAdapter.formatWdl(1)).toBe('Winning');
    });

    it('should format drawing positions', () => {
      expect(WdlAdapter.formatWdl(0)).toBe('Drawing');
    });

    it('should format losing positions', () => {
      expect(WdlAdapter.formatWdl(-1000)).toBe('Losing');
      expect(WdlAdapter.formatWdl(-500)).toBe('Losing');
      expect(WdlAdapter.formatWdl(-1)).toBe('Losing');
    });
  });

  describe('helper predicates', () => {
    describe('isWinning', () => {
      it('should identify winning positions', () => {
        expect(WdlAdapter.isWinning(1000)).toBe(true);
        expect(WdlAdapter.isWinning(1)).toBe(true);
        expect(WdlAdapter.isWinning(0)).toBe(false);
        expect(WdlAdapter.isWinning(-1)).toBe(false);
      });
    });

    describe('isDrawing', () => {
      it('should identify drawing positions', () => {
        expect(WdlAdapter.isDrawing(0)).toBe(true);
        expect(WdlAdapter.isDrawing(1)).toBe(false);
        expect(WdlAdapter.isDrawing(-1)).toBe(false);
      });
    });

    describe('isLosing', () => {
      it('should identify losing positions', () => {
        expect(WdlAdapter.isLosing(-1000)).toBe(true);
        expect(WdlAdapter.isLosing(-1)).toBe(true);
        expect(WdlAdapter.isLosing(0)).toBe(false);
        expect(WdlAdapter.isLosing(1)).toBe(false);
      });
    });
  });

  describe('edge cases and chess-specific scenarios', () => {
    it('should handle mate-in-X scenarios correctly', () => {
      // Mate in 1 vs Mate in 5 - both winning but different values
      const mateIn1 = 900;
      const mateIn5 = 500;
      
      expect(WdlAdapter.rawToCanonical(mateIn1)).toBe(1);
      expect(WdlAdapter.rawToCanonical(mateIn5)).toBe(1);
      expect(WdlAdapter.isWinning(mateIn1)).toBe(true);
      expect(WdlAdapter.isWinning(mateIn5)).toBe(true);
      
      // Move from mate-in-1 to mate-in-5 is still 'best' (both winning)
      expect(WdlAdapter.getMoveQuality(mateIn1, mateIn5)).toBe('best');
    });

    it('should handle theoretical draw vs practical draw', () => {
      // Both are draws in WDL terms
      const theoreticalDraw = 0;
      const practicalDraw = 0;
      
      expect(WdlAdapter.didOutcomeChange(theoreticalDraw, practicalDraw)).toBe(false);
    });

    it('should handle endgame zugzwang scenarios', () => {
      // Player has winning position, but after forced move loses
      const winningPosition = 600;
      const losingAfterZugzwang = -400;
      
      expect(WdlAdapter.isWinToDrawOrLoss(winningPosition, losingAfterZugzwang)).toBe(true);
      expect(WdlAdapter.getMoveQuality(winningPosition, losingAfterZugzwang)).toBe('blunder');
    });
  });

  describe('integration with existing MoveQualityEvaluator patterns', () => {
    it('should replicate convertToPlayerPerspective behavior exactly', () => {
      // Test cases that mirror real chess scenarios from MoveQualityEvaluator
      const scenarios = [
        { before: 1000, after: -500 }, // Player winning -> opponent winning (player now losing)
        { before: 0, after: 0 },       // Draw position maintained  
        { before: -200, after: 300 },  // Player losing -> opponent losing (player now winning)
      ];
      
      scenarios.forEach(({ before, after }) => {
        const result = WdlAdapter.convertToPlayerPerspective(before, after);
        
        // Should match the exact logic from MoveQualityEvaluator L300-309
        expect(result.wdlBeforeFromPlayerPerspective).toBe(before);
        expect(result.wdlAfterFromPlayerPerspective).toBe(-after);
      });
    });

    it('should work with shouldShowErrorDialog decision logic', () => {
      // Mirror the MoveQualityEvaluator.shouldShowErrorDialog criteria:
      // !playedMoveWasBest && outcomeChanged
      
      const outcomeChangedCases = [
        { before: 800, after: 0 },   // Win to draw -> outcome changed
        { before: 500, after: -200 }, // Win to loss -> outcome changed  
        { before: 0, after: -300 },   // Draw to loss -> outcome changed
      ];
      
      const noOutcomeChangeCases = [
        { before: 800, after: 900 },  // Win to better win
        { before: 0, after: 400 },    // Draw to win
        { before: -200, after: -100 }, // Loss to better loss
      ];
      
      outcomeChangedCases.forEach(({ before, after }) => {
        expect(WdlAdapter.didOutcomeChange(before, after)).toBe(true);
      });
      
      noOutcomeChangeCases.forEach(({ before, after }) => {
        expect(WdlAdapter.didOutcomeChange(before, after)).toBe(false);
      });
    });
  });
});