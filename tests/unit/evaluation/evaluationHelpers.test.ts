import {
  getMoveQualityDisplay,
  getMoveQualityByTablebaseComparison,
  getEvaluationDisplay,
  formatEvaluation,
  getEvaluationColor,
  getEvaluationBarWidth,
  getCategory,
  classifyWinToWin,
  classifyRobustness,
  getEducationalTip,
  getEnhancedMoveQuality,
  TABLEBASE_LEGEND,
  ENGINE_LEGEND
} from '@/utils/chess/evaluationHelpers';

describe('evaluationHelpers', () => {
  describe('getMoveQualityDisplay', () => {
    test('should handle mate evaluations', () => {
      // Positive mate (player delivering mate)
      expect(getMoveQualityDisplay(0, 3)).toEqual({
        text: '#3',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });

      // Negative mate (getting mated)
      expect(getMoveQualityDisplay(0, -2)).toEqual({
        text: '#2',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });
    });

    test('should evaluate strong moves', () => {
      expect(getMoveQualityDisplay(6)).toEqual({
        text: '⭐',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });

      expect(getMoveQualityDisplay(3)).toEqual({
        text: '✨',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });
    });

    test('should evaluate good moves', () => {
      expect(getMoveQualityDisplay(0.8)).toEqual({
        text: '👌',
        className: 'eval-good',
        color: 'var(--info-text)',
        bgColor: 'var(--info-bg)'
      });
    });

    test('should evaluate neutral moves', () => {
      expect(getMoveQualityDisplay(0.2)).toEqual({
        text: '⚪',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });

      expect(getMoveQualityDisplay(-0.3)).toEqual({
        text: '⚪',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });
    });

    test('should handle edge cases', () => {
      expect(getMoveQualityDisplay(-0.5)).toEqual({
        text: '👌',
        className: 'eval-good',
        color: 'var(--info-text)',
        bgColor: 'var(--info-bg)'
      });

      expect(getMoveQualityDisplay(-1)).toEqual({
        text: '👌',
        className: 'eval-good',
        color: 'var(--info-text)',
        bgColor: 'var(--info-bg)'
      });
    });
  });

  describe('getMoveQualityByTablebaseComparison', () => {
    test('should detect thrown away wins', () => {
      // Win to draw
      expect(getMoveQualityByTablebaseComparison(2, 0, 'w')).toEqual({
        text: '🚨',
        className: 'eval-blunder',
        color: 'var(--error-text)',
        bgColor: 'var(--error-bg)'
      });

      // Win to loss
      expect(getMoveQualityByTablebaseComparison(2, -2, 'w')).toEqual({
        text: '💥',
        className: 'eval-blunder',
        color: 'var(--error-text)',
        bgColor: 'var(--error-bg)'
      });
    });

    test('should detect thrown away draws', () => {
      expect(getMoveQualityByTablebaseComparison(0, -1, 'w')).toEqual({
        text: '❌',
        className: 'eval-mistake',
        color: '#fb923c',
        bgColor: '#c2410c'
      });
    });

    test('should evaluate maintained wins', () => {
      // Win maintained
      expect(getMoveQualityByTablebaseComparison(2, 2, 'w')).toEqual({
        text: '✅',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });

      // Win improved (cursed win to win)
      expect(getMoveQualityByTablebaseComparison(1, 2, 'w')).toEqual({
        text: '🌟',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });
    });

    test('should evaluate draws', () => {
      expect(getMoveQualityByTablebaseComparison(0, 0, 'w')).toEqual({
        text: '➖',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });
    });

    test('should evaluate improvements from losing', () => {
      // Loss to draw from White's perspective
      expect(getMoveQualityByTablebaseComparison(-2, 0, 'w')).toEqual({
        text: '👍',
        className: 'eval-good',
        color: 'var(--info-text)',
        bgColor: 'var(--info-bg)'
      });

      // Loss to win from White's perspective
      expect(getMoveQualityByTablebaseComparison(-1, 2, 'w')).toEqual({
        text: '🎯',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });
    });

    test('should evaluate defensive moves', () => {
      // Better defense from White's perspective (losing position but improving)
      expect(getMoveQualityByTablebaseComparison(-2, -1, 'w')).toEqual({
        text: '🛡️',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });

      // Worse defense from White's perspective (making the loss worse)
      expect(getMoveQualityByTablebaseComparison(-1, -2, 'w')).toEqual({
        text: '🔻',
        className: 'eval-inaccurate',
        color: 'var(--warning-text)',
        bgColor: 'var(--warning-bg)'
      });
    });

    test('should handle edge cases', () => {
      // Draw to win (should now be recognized as excellent)
      expect(getMoveQualityByTablebaseComparison(0, 2, 'w')).toEqual({
        text: '🎯',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });
    });
  });

  describe('getEvaluationDisplay', () => {
    test('should handle mate evaluations', () => {
      expect(getEvaluationDisplay(0, 5)).toEqual({
        text: '#5',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });

      expect(getEvaluationDisplay(0, -3)).toEqual({
        text: '#3',
        className: 'eval-blunder',
        color: 'var(--error-text)',
        bgColor: 'var(--error-bg)'
      });
    });

    test('should evaluate winning positions', () => {
      expect(getEvaluationDisplay(7)).toEqual({
        text: '⭐',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });

      expect(getEvaluationDisplay(3)).toEqual({
        text: '✨',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      });
    });

    test('should evaluate slight advantages', () => {
      expect(getEvaluationDisplay(0.7)).toEqual({
        text: '👌',
        className: 'eval-good',
        color: 'var(--info-text)',
        bgColor: 'var(--info-bg)'
      });
    });

    test('should evaluate equal positions', () => {
      expect(getEvaluationDisplay(0)).toEqual({
        text: '⚪',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });

      expect(getEvaluationDisplay(-0.3)).toEqual({
        text: '⚪',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      });
    });

    test('should evaluate disadvantages', () => {
      expect(getEvaluationDisplay(-1)).toEqual({
        text: '⚠️',
        className: 'eval-inaccurate',
        color: 'var(--warning-text)',
        bgColor: 'var(--warning-bg)'
      });

      expect(getEvaluationDisplay(-3)).toEqual({
        text: '🔶',
        className: 'eval-mistake',
        color: '#fb923c',
        bgColor: '#c2410c'
      });

      expect(getEvaluationDisplay(-8)).toEqual({
        text: '🔴',
        className: 'eval-blunder',
        color: 'var(--error-text)',
        bgColor: 'var(--error-bg)'
      });
    });
  });

  describe('formatEvaluation', () => {
    test('should format mate evaluations', () => {
      expect(formatEvaluation({ evaluation: 0, mateInMoves: 3 })).toBe('#3');
      expect(formatEvaluation({ evaluation: 0, mateInMoves: -5 })).toBe('#5');
    });

    test('should format numeric evaluations', () => {
      expect(formatEvaluation({ evaluation: 2.5, mateInMoves: undefined })).toBe('+2.5');
      expect(formatEvaluation({ evaluation: -1.3, mateInMoves: undefined })).toBe('-1.3');
      expect(formatEvaluation({ evaluation: 0.05, mateInMoves: undefined })).toBe('0.0');
    });

    test('should handle undefined input', () => {
      expect(formatEvaluation(undefined)).toBe('0.00');
    });
  });

  describe('getEvaluationColor', () => {
    test('should return colors for mate evaluations', () => {
      expect(getEvaluationColor({ evaluation: 0, mateInMoves: 3 })).toBe('text-green-700');
      expect(getEvaluationColor({ evaluation: 0, mateInMoves: -2 })).toBe('text-red-700');
    });

    test('should return colors for numeric evaluations', () => {
      expect(getEvaluationColor({ evaluation: 3, mateInMoves: undefined })).toBe('text-green-700');
      expect(getEvaluationColor({ evaluation: 0.7, mateInMoves: undefined })).toBe('text-green-600');
      expect(getEvaluationColor({ evaluation: 0, mateInMoves: undefined })).toBe('text-gray-600');
      expect(getEvaluationColor({ evaluation: -1, mateInMoves: undefined })).toBe('text-orange-600');
      expect(getEvaluationColor({ evaluation: -3, mateInMoves: undefined })).toBe('text-red-600');
    });

    test('should handle undefined input', () => {
      expect(getEvaluationColor(undefined)).toBe('text-gray-600');
    });
  });

  describe('getEvaluationBarWidth', () => {
    test('should calculate bar width', () => {
      expect(getEvaluationBarWidth(0)).toBe(50);
      expect(getEvaluationBarWidth(5)).toBe(100);
      expect(getEvaluationBarWidth(-5)).toBe(0);
      expect(getEvaluationBarWidth(2)).toBe(70);
      expect(getEvaluationBarWidth(-2)).toBe(30);
    });

    test('should clamp values', () => {
      expect(getEvaluationBarWidth(10)).toBe(100);
      expect(getEvaluationBarWidth(-10)).toBe(0);
    });

    test('should handle undefined', () => {
      expect(getEvaluationBarWidth(undefined)).toBe(50);
    });
  });

  describe('getCategory', () => {
    test('should categorize WDL values', () => {
      expect(getCategory(2)).toBe('win');
      expect(getCategory(1)).toBe('win');
      expect(getCategory(0)).toBe('draw');
      expect(getCategory(-1)).toBe('loss');
      expect(getCategory(-2)).toBe('loss');
    });
  });

  describe('classifyWinToWin', () => {
    test('should classify DTM differences', () => {
      expect(classifyWinToWin(0)).toBe('optimal');
      expect(classifyWinToWin(1)).toBe('optimal');
      expect(classifyWinToWin(3)).toBe('sicher');
      expect(classifyWinToWin(5)).toBe('sicher');
      expect(classifyWinToWin(10)).toBe('umweg');
      expect(classifyWinToWin(15)).toBe('umweg');
      expect(classifyWinToWin(20)).toBe('riskant');
    });

    test('should handle negative DTM differences', () => {
      expect(classifyWinToWin(-1)).toBe('optimal');
      expect(classifyWinToWin(-5)).toBe('optimal');
    });
  });

  describe('classifyRobustness', () => {
    test('should classify robustness levels', () => {
      expect(classifyRobustness(5)).toBe('robust');
      expect(classifyRobustness(3)).toBe('robust');
      expect(classifyRobustness(2)).toBe('präzise');
      expect(classifyRobustness(1)).toBe('haarig');
      expect(classifyRobustness(0)).toBe('haarig');
    });
  });

  describe('getEducationalTip', () => {
    test('should provide tips for optimal moves', () => {
      expect(getEducationalTip('optimal', 'robust'))
        .toBe('Perfekt! Viele gute Alternativen vorhanden.');
      expect(getEducationalTip('optimal', 'präzise'))
        .toBe('Sehr gut! Eine von wenigen optimalen Lösungen.');
      expect(getEducationalTip('optimal', 'haarig'))
        .toBe('Exzellent! Der einzige optimale Zug gefunden.');
      expect(getEducationalTip('optimal'))
        .toBe('Kürzester Weg zum Sieg.');
    });

    test('should provide tips for safe moves', () => {
      expect(getEducationalTip('sicher', 'robust'))
        .toBe('Solide Technik mit vielen Alternativen.');
    });

    test('should provide tips for detour moves', () => {
      expect(getEducationalTip('umweg', 'haarig'))
        .toBe('Kompliziert, aber der einzige Gewinnzug!');
    });

    test('should provide tips for risky moves', () => {
      expect(getEducationalTip('riskant', 'präzise'))
        .toBe('Riskant! Nur wenige Züge halten noch den Gewinn.');
    });

    test('should provide tips for errors', () => {
      expect(getEducationalTip('fehler'))
        .toBe('Gewinn verspielt - zurück zum Anfang!');
    });
  });

  describe('getEnhancedMoveQuality', () => {
    test('should enhance Win→Win moves with DTM analysis', () => {
      const result = getEnhancedMoveQuality(
        2, // Win before
        2, // Win after
        10, // DTM before
        11, // DTM after
        3, // Winning moves
        'w'
      );

      expect(result.text).toBe('🟢');
      expect(result.qualityClass).toBe('optimal');
      expect(result.robustnessTag).toBe('robust');
      expect(result.dtmDifference).toBe(1);
      expect(result.educationalTip).toBe('Perfekt! Viele gute Alternativen vorhanden.');
    });

    test('should classify safe Win→Win moves', () => {
      const result = getEnhancedMoveQuality(2, 2, 10, 14, 2, 'w');
      
      expect(result.qualityClass).toBe('sicher');
      expect(result.robustnessTag).toBe('präzise');
      expect(result.text).toBe('✅');
    });

    test('should classify detour Win→Win moves', () => {
      const result = getEnhancedMoveQuality(2, 2, 10, 22, 1, 'w');
      
      expect(result.qualityClass).toBe('umweg');
      expect(result.robustnessTag).toBe('haarig');
      expect(result.text).toBe('🟡');
    });

    test('should classify risky Win→Win moves', () => {
      const result = getEnhancedMoveQuality(2, 2, 10, 30, 1, 'w');
      
      expect(result.qualityClass).toBe('riskant');
      expect(result.robustnessTag).toBe('haarig');
      expect(result.text).toBe('⚠️');
    });

    test('should handle non Win→Win moves', () => {
      const result = getEnhancedMoveQuality(2, 0, 10, 0, 5, 'w');
      
      expect(result.text).toBe('🚨');
      expect(result.qualityClass).toBe('fehler');
      expect(result.robustnessTag).toBeUndefined();
    });

    test('should handle missing DTM values', () => {
      const result = getEnhancedMoveQuality(2, 2, undefined, undefined, 3, 'w');
      
      expect(result.text).toBe('✅');
      expect(result.qualityClass).toBe('sicher');
      expect(result.dtmDifference).toBeUndefined();
    });

    test('should handle draw positions', () => {
      const result = getEnhancedMoveQuality(0, 0, 0, 0, 10, 'w');
      
      expect(result.text).toBe('➖');
      expect(result.qualityClass).toBe('sicher');
    });
  });

  describe('Legend exports', () => {
    test('should export TABLEBASE_LEGEND', () => {
      expect(TABLEBASE_LEGEND).toBeDefined();
      expect(TABLEBASE_LEGEND['🚨']).toBe('Sieg → Remis weggeworfen');
      expect(TABLEBASE_LEGEND['✅']).toBe('Sieg gehalten');
    });

    test('should export ENGINE_LEGEND', () => {
      expect(ENGINE_LEGEND).toBeDefined();
      expect(ENGINE_LEGEND['⭐']).toBe('Dominierend (5+ Bauern)');
      expect(ENGINE_LEGEND['⚪']).toBe('Ausgeglichen/Solide');
    });
  });
});