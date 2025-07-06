import { getMoveQualityByTablebaseComparison } from '@/utils/chess/evaluationHelpers';

describe('getMoveQualityByTablebaseComparison', () => {
  describe('CATASTROPHIC moves - throwing away wins', () => {
    it('should detect Win → Draw as CATASTROPHIC', () => {
      const result = getMoveQualityByTablebaseComparison(2, 0, 'w'); // Win to Draw
      
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });

    it('should detect Win → Loss as CATASTROPHIC', () => {
      const result = getMoveQualityByTablebaseComparison(2, -2, 'w'); // Win to Loss
      
      expect(result.text).toBe('💥');
      expect(result.className).toBe('eval-blunder');
    });

    it('should detect Cursed Win → Draw from Black perspective as GOOD', () => {
      // WDL 1 = cursed win for White = Black is losing
      // WDL 0 = draw = improvement for Black
      const result = getMoveQualityByTablebaseComparison(1, 0, 'b');
      
      expect(result.text).toBe('👍');
      expect(result.className).toBe('eval-good');
    });
  });

  describe('MAJOR MISTAKES - throwing away draws', () => {
    it('should detect Draw → Loss as MISTAKE', () => {
      const result = getMoveQualityByTablebaseComparison(0, -2, 'w'); // Draw to Loss
      
      expect(result.text).toBe('❌');
      expect(result.className).toBe('eval-mistake');
    });

    it('should detect Draw → Blessed Loss from Black perspective as EXCELLENT', () => {
      // WDL 0 = draw
      // WDL -1 = blessed loss for White = cursed win for Black = improvement
      const result = getMoveQualityByTablebaseComparison(0, -1, 'b');
      
      expect(result.text).toBe('🎯');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('EXCELLENT moves - maintaining or improving position', () => {
    it('should detect Win → Win as EXCELLENT (maintained)', () => {
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w'); // Win to Win
      
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('should detect worsened loss from Black perspective as WEAK DEFENSE', () => {
      // WDL 1 = cursed win for White = Black is losing
      // WDL 2 = win for White = Black is losing worse
      const result = getMoveQualityByTablebaseComparison(1, 2, 'b');
      
      expect(result.text).toBe('🔻');
      expect(result.className).toBe('eval-inaccurate');
    });

    it('should detect Loss → Win as BRILLIANT', () => {
      const result = getMoveQualityByTablebaseComparison(-2, 2, 'w'); // Loss to Win
      
      expect(result.text).toBe('🎯');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('GOOD moves - improving from bad positions', () => {
    it('should detect Win → Draw from Black perspective as CATASTROPHIC', () => {
      // WDL -2 = loss for White = win for Black
      // WDL 0 = draw = throwing away win
      const result = getMoveQualityByTablebaseComparison(-2, 0, 'b');
      
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });
  });

  describe('SOLID moves - maintaining position', () => {
    it('should detect Draw → Draw as SOLID', () => {
      const result = getMoveQualityByTablebaseComparison(0, 0, 'w'); // Draw to Draw
      
      expect(result.text).toBe('➖');
      expect(result.className).toBe('eval-neutral');
    });
  });

  describe('DEFENSIVE moves - best try in losing positions', () => {
    it('should detect Win → Better Win from Black perspective as EXCELLENT', () => {
      // WDL -2 = loss for White = win for Black
      // WDL -1 = blessed loss for White = cursed win for Black = still winning
      const result = getMoveQualityByTablebaseComparison(-2, -1, 'b');
      
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('should detect Loss → Loss (same) as OPTIMAL DEFENSE', () => {
      const result = getMoveQualityByTablebaseComparison(-2, -2, 'w'); // Loss to Loss (no change)
      
      expect(result.text).toBe('🛡️');
      expect(result.className).toBe('eval-neutral');
    });
  });

  describe('Real training scenarios', () => {
    it('should prioritize detecting thrown away wins (the core training value)', () => {
      // This is the main training insight: players throwing away winning endgames
      const scenarios = [
        { before: 2, after: 0, expectedSymbol: '🚨', description: 'Perfect Win → Draw' },
        { before: 1, after: 0, expectedSymbol: '🚨', description: 'Cursed Win → Draw' },
        { before: 2, after: -1, expectedSymbol: '💥', description: 'Win → Blessed Loss' },
        { before: 1, after: -2, expectedSymbol: '💥', description: 'Cursed Win → Loss' }
      ];

      scenarios.forEach(scenario => {
        const result = getMoveQualityByTablebaseComparison(scenario.before, scenario.after, 'w');
        
        // All should be CATASTROPHIC
        expect(result.className).toBe('eval-blunder');
        expect(result.text).toBe(scenario.expectedSymbol);
        
      });
    });

    it('should correctly handle both sides playing', () => {
      // Same WDL values, different perspectives
      const winToDrawWhite = getMoveQualityByTablebaseComparison(2, 0, 'w'); // White throws away win
      const winToDrawBlack = getMoveQualityByTablebaseComparison(2, 0, 'b'); // Black improves from loss to draw
      
      // White throws away win - catastrophic
      expect(winToDrawWhite.text).toBe('🚨');
      expect(winToDrawWhite.className).toBe('eval-blunder');
      
      // Black improves position - good
      expect(winToDrawBlack.text).toBe('👍');
      expect(winToDrawBlack.className).toBe('eval-good');
    });
  });
}); 