import { getMoveQualityByTablebaseComparison } from '../evaluationHelpers';

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

    it('should detect Cursed Win → Draw as CATASTROPHIC', () => {
      const result = getMoveQualityByTablebaseComparison(1, 0, 'b'); // Cursed Win to Draw
      
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });
  });

  describe('MAJOR MISTAKES - throwing away draws', () => {
    it('should detect Draw → Loss as MISTAKE', () => {
      const result = getMoveQualityByTablebaseComparison(0, -2, 'w'); // Draw to Loss
      
      expect(result.text).toBe('❌');
      expect(result.className).toBe('eval-mistake');
    });

    it('should detect Draw → Blessed Loss as MISTAKE', () => {
      const result = getMoveQualityByTablebaseComparison(0, -1, 'b'); // Draw to Blessed Loss
      
      expect(result.text).toBe('❌');
      expect(result.className).toBe('eval-mistake');
    });
  });

  describe('EXCELLENT moves - maintaining or improving position', () => {
    it('should detect Win → Win as EXCELLENT (maintained)', () => {
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w'); // Win to Win
      
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('should detect improved win (Cursed Win → Win) as EXCELLENT', () => {
      const result = getMoveQualityByTablebaseComparison(1, 2, 'b'); // Cursed Win to Win
      
      expect(result.text).toBe('🌟');
      expect(result.className).toBe('eval-excellent');
    });

    it('should detect Loss → Win as BRILLIANT', () => {
      const result = getMoveQualityByTablebaseComparison(-2, 2, 'w'); // Loss to Win
      
      expect(result.text).toBe('🎯');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('GOOD moves - improving from bad positions', () => {
    it('should detect Loss → Draw as GOOD', () => {
      const result = getMoveQualityByTablebaseComparison(-2, 0, 'b'); // Loss to Draw
      
      expect(result.text).toBe('👍');
      expect(result.className).toBe('eval-good');
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
    it('should detect Loss → Loss (improved) as BEST DEFENSE', () => {
      const result = getMoveQualityByTablebaseComparison(-2, -1, 'b'); // Loss to Blessed Loss (improvement)
      
      expect(result.text).toBe('🛡️');
      expect(result.className).toBe('eval-neutral');
    });

    it('should detect Loss → Loss (same) as DEFENSE', () => {
      const result = getMoveQualityByTablebaseComparison(-2, -2, 'w'); // Loss to Loss (no change)
      
      expect(result.text).toBe('🔻');
      expect(result.className).toBe('eval-inaccurate');
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
        
        console.log(`✅ ${scenario.description}: ${result.text}`);
      });
    });

    it('should correctly handle both sides playing', () => {
      // Same tablebase transition, different sides
      const winToDrawWhite = getMoveQualityByTablebaseComparison(2, 0, 'w');
      const winToDrawBlack = getMoveQualityByTablebaseComparison(2, 0, 'b');
      
      // Both should be equally catastrophic
      expect(winToDrawWhite.text).toBe(winToDrawBlack.text);
      expect(winToDrawWhite.className).toBe(winToDrawBlack.className);
    });
  });
}); 