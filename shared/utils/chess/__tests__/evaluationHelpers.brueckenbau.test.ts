import { getMoveQualityByTablebaseComparison } from '../evaluationHelpers';

describe('Brückenbau specific scenario - User bug report', () => {
  // Position: "2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1"
  // Sequence: Kd7 (should be good), Rd2+ (should be good), Kc6 (ok), Rc2+ (good), Kb5 (should be BLUNDER)
  
  describe('Move sequence evaluation', () => {
    it('1. Kd7 - White maintains winning position (Win -> Win)', () => {
      // White: Win -> Win = Good move
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('2. Rd2+ - Black defends correctly (Win -> Win from Black perspective)', () => {
      // From Black's perspective: Loss -> Loss = Neutral/Good defensive move
      const result = getMoveQualityByTablebaseComparison(-2, -2, 'b');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('3. Kc6 - White continues correctly (Win -> Win)', () => {
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('4. Rc2+ - Black continues defending (Win -> Win from Black perspective)', () => {
      // From Black's perspective: Loss -> Loss = Good defensive move
      const result = getMoveQualityByTablebaseComparison(-2, -2, 'b');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('5. Kb5 - White BLUNDERS! (Win -> Draw)', () => {
      // This is the critical bug: Kb5 allows Black to draw
      // White: Win -> Draw = BLUNDER
      const result = getMoveQualityByTablebaseComparison(2, 0, 'w');
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
      expect(result.className).not.toBe('eval-good'); // Explicitly verify it's NOT good
    });
  });

  describe('Alternative correct moves instead of Kb5', () => {
    it('Kb6 would maintain the win (Win -> Win)', () => {
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });

    it('Kd5 would maintain the win (Win -> Win)', () => {
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('After Kb5 blunder, Black can force a draw', () => {
    it('Rc5+ - Black exploits the blunder (Draw -> Draw)', () => {
      // From Black's perspective after Kb5: Draw -> Draw = Good move to secure draw
      const result = getMoveQualityByTablebaseComparison(0, 0, 'b');
      expect(result.text).toBe('➖');
      expect(result.className).toBe('eval-neutral');
    });
  });
});