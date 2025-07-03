import { getMoveQualityByTablebaseComparison } from '../evaluationHelpers';

describe('getMoveQualityByTablebaseComparison - Player Perspective Tests', () => {
  describe('White perspective - when White makes moves', () => {
    it('should show blunder when White throws away a win (Win -> Draw)', () => {
      const result = getMoveQualityByTablebaseComparison(2, 0, 'w');
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });

    it('should show catastrophe when White throws away a win completely (Win -> Loss)', () => {
      const result = getMoveQualityByTablebaseComparison(2, -2, 'w');
      expect(result.text).toBe('💥');
      expect(result.className).toBe('eval-blunder');
    });

    it('should show excellent when White maintains a win', () => {
      const result = getMoveQualityByTablebaseComparison(2, 2, 'w');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('Black perspective - when Black makes moves', () => {
    it('should show blunder when Black throws away a win (Loss -> Draw from Black perspective)', () => {
      // From Black's perspective: -2 (winning for Black) -> 0 (draw)
      const result = getMoveQualityByTablebaseComparison(-2, 0, 'b');
      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-blunder');
    });

    it('should show catastrophe when Black throws away a win completely (Loss -> Win from Black perspective)', () => {
      // From Black's perspective: -2 (winning for Black) -> 2 (losing for Black)
      const result = getMoveQualityByTablebaseComparison(-2, 2, 'b');
      expect(result.text).toBe('💥');
      expect(result.className).toBe('eval-blunder');
    });

    it('should show excellent when Black maintains a win', () => {
      // From Black's perspective: -2 (winning for Black) -> -2 (still winning)
      const result = getMoveQualityByTablebaseComparison(-2, -2, 'b');
      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-excellent');
    });
  });

  describe('Critical scenario: White blunders, Black exploits', () => {
    it('White move: Win -> Draw should be blunder', () => {
      const whiteMove = getMoveQualityByTablebaseComparison(2, 0, 'w');
      expect(whiteMove.text).toBe('🚨');
      expect(whiteMove.className).toBe('eval-blunder');
    });

    it('Black response: Draw -> Draw should be neutral (not blunder!)', () => {
      // After White's blunder, position is draw (0)
      // Black maintains the draw - this is correct play, not a blunder
      const blackMove = getMoveQualityByTablebaseComparison(0, 0, 'b');
      expect(blackMove.text).toBe('➖');
      expect(blackMove.className).toBe('eval-neutral');
    });

    it('Alternative: Black could even improve from Draw -> Win for Black', () => {
      // If Black finds a way to win from the draw position
      const blackMove = getMoveQualityByTablebaseComparison(0, -2, 'b');
      expect(blackMove.text).toBe('🎯');
      expect(blackMove.className).toBe('eval-excellent');
    });
  });

  describe('Another scenario: White in losing position plays best defense', () => {
    it('White in lost position maintains the loss - should be defensive', () => {
      const whiteMove = getMoveQualityByTablebaseComparison(-2, -2, 'w');
      expect(whiteMove.text).toBe('🛡️');
      expect(whiteMove.className).toBe('eval-neutral');
    });

    it('Black winning maintains the win - should be excellent', () => {
      const blackMove = getMoveQualityByTablebaseComparison(-2, -2, 'b');
      expect(blackMove.text).toBe('✅');
      expect(blackMove.className).toBe('eval-excellent');
    });
  });

  describe('Edge case: Perspective affects evaluation interpretation', () => {
    it('WDL 2 is good for White, bad for Black', () => {
      // White improves from draw to win
      const whiteImproves = getMoveQualityByTablebaseComparison(0, 2, 'w');
      expect(whiteImproves.text).toBe('🎯');
      expect(whiteImproves.className).toBe('eval-excellent');

      // Black allows position to go from draw to losing (for Black)
      const blackAllows = getMoveQualityByTablebaseComparison(0, 2, 'b');
      expect(blackAllows.text).toBe('❌');
      expect(blackAllows.className).toBe('eval-mistake');
    });

    it('WDL -2 is bad for White, good for Black', () => {
      // White allows position to go from draw to losing (for White)
      const whiteAllows = getMoveQualityByTablebaseComparison(0, -2, 'w');
      expect(whiteAllows.text).toBe('❌');
      expect(whiteAllows.className).toBe('eval-mistake');

      // Black improves from draw to win (for Black)
      const blackImproves = getMoveQualityByTablebaseComparison(0, -2, 'b');
      expect(blackImproves.text).toBe('🎯');
      expect(blackImproves.className).toBe('eval-excellent');
    });
  });
});