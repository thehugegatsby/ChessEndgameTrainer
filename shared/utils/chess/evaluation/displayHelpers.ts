import type { EvaluationDisplay } from '@shared/types';
import { EVALUATION, UI } from '@shared/constants';

/**
 * Get move quality evaluation (how good was this specific move)
 * This compares the played move with the best available alternative
 * 
 * SIMPLIFIED: Uses engine evaluation only (tablebase helpers removed)
 * This function uses absolute values because a "good move" is good regardless of color.
 * 
 * QUIRK: isPlayerMove parameter is unused - legacy from earlier version.
 */
export const getMoveQualityDisplay = (
  evaluation: number, 
  mate?: number,
  _isPlayerMove: boolean = true
): EvaluationDisplay => {
  // For move quality, we want to show how good the move was
  // regardless of who played it
  
  // Matt-Bewertungen sind immer excellent wenn man Matt setzt
  if (mate !== undefined) {
    if (mate > 0) {
      return { 
        text: `#${mate}`, 
        className: 'eval-excellent',
        color: UI.EVALUATION_COLORS.EXCELLENT.text, 
        bgColor: UI.EVALUATION_COLORS.EXCELLENT.background 
      };
    }
    if (mate < 0) {
      // Even when getting mated, if it's the best defense, show it neutrally
      return { 
        text: `#${Math.abs(mate)}`, 
        className: 'eval-neutral',
        color: UI.EVALUATION_COLORS.NEUTRAL.text, 
        bgColor: UI.EVALUATION_COLORS.NEUTRAL.background 
      };
    }
  }
  
  // Für Zugqualität verwenden wir den absoluten Wert
  // Ein starker Zug ist stark, egal für welche Seite
  const absEval = Math.abs(evaluation);
  
  // Sehr starke Züge (leading to winning positions)
  if (absEval >= EVALUATION.COLOR_THRESHOLDS.DOMINATING) {
    return { 
      text: '⭐', 
      className: 'eval-excellent',
      color: UI.EVALUATION_COLORS.EXCELLENT.text, 
      bgColor: UI.EVALUATION_COLORS.EXCELLENT.background 
    };
  }
  if (absEval >= EVALUATION.COLOR_THRESHOLDS.EXCELLENT) {
    return { 
      text: '✨', 
      className: 'eval-excellent',
      color: UI.EVALUATION_COLORS.EXCELLENT.text, 
      bgColor: UI.EVALUATION_COLORS.EXCELLENT.background 
    };
  }
  if (absEval >= EVALUATION.COLOR_THRESHOLDS.GOOD) {
    return { 
      text: '👌', 
      className: 'eval-good',
      color: UI.EVALUATION_COLORS.GOOD.text, 
      bgColor: UI.EVALUATION_COLORS.GOOD.background 
    };
  }
  if (absEval >= Math.abs(EVALUATION.COLOR_THRESHOLDS.NEUTRAL_LOWER)) {
    return { 
      text: '⚪', 
      className: 'eval-neutral',
      color: UI.EVALUATION_COLORS.NEUTRAL.text, 
      bgColor: UI.EVALUATION_COLORS.NEUTRAL.background 
    };
  }
  
  // This shouldn't happen in move quality evaluation,
  // but keeping for safety
  return { 
    text: '⚪', 
    className: 'eval-neutral',
    color: UI.EVALUATION_COLORS.NEUTRAL.text, 
    bgColor: UI.EVALUATION_COLORS.NEUTRAL.background 
  };
};

/**
 * Original position evaluation (who is better)
 */
export const getEvaluationDisplay = (evaluation: number, mate?: number): EvaluationDisplay => {
  // Matt-Bewertungen mit Zuganzahl
  if (mate !== undefined) {
    if (mate > 0) {
      return { 
        text: `#${mate}`, 
        className: 'eval-excellent',
        color: UI.EVALUATION_COLORS.EXCELLENT.text, 
        bgColor: UI.EVALUATION_COLORS.EXCELLENT.background 
      };
    }
    if (mate < 0) {
      return { 
        text: `#${Math.abs(mate)}`, 
        className: 'eval-blunder',
        color: UI.EVALUATION_COLORS.BLUNDER.text, 
        bgColor: UI.EVALUATION_COLORS.BLUNDER.background 
      };
    }
  }
  
  // Normale Bewertungen mit Symbolen
  if (evaluation >= EVALUATION.COLOR_THRESHOLDS.DOMINATING) {
    return { 
      text: '⭐', 
      className: 'eval-excellent',
      color: UI.EVALUATION_COLORS.EXCELLENT.text, 
      bgColor: UI.EVALUATION_COLORS.EXCELLENT.background 
    };
  }
  if (evaluation >= EVALUATION.COLOR_THRESHOLDS.EXCELLENT) {
    return { 
      text: '✨', 
      className: 'eval-excellent',
      color: UI.EVALUATION_COLORS.EXCELLENT.text, 
      bgColor: UI.EVALUATION_COLORS.EXCELLENT.background 
    };
  }
  if (evaluation >= EVALUATION.COLOR_THRESHOLDS.GOOD) {
    return { 
      text: '👌', 
      className: 'eval-good',
      color: UI.EVALUATION_COLORS.GOOD.text, 
      bgColor: UI.EVALUATION_COLORS.GOOD.background 
    };
  }
  if (evaluation >= EVALUATION.COLOR_THRESHOLDS.NEUTRAL_LOWER) {
    return { 
      text: '⚪', 
      className: 'eval-neutral',
      color: UI.EVALUATION_COLORS.NEUTRAL.text, 
      bgColor: UI.EVALUATION_COLORS.NEUTRAL.background 
    };
  }
  if (evaluation >= EVALUATION.COLOR_THRESHOLDS.INACCURATE) {
    return { 
      text: '⚠️', 
      className: 'eval-inaccurate',
      color: UI.EVALUATION_COLORS.INACCURATE.text, 
      bgColor: UI.EVALUATION_COLORS.INACCURATE.background 
    };
  }
  if (evaluation >= EVALUATION.COLOR_THRESHOLDS.MISTAKE) {
    return { 
      text: '🔶', 
      className: 'eval-mistake',
      color: UI.EVALUATION_COLORS.MISTAKE.text, 
      bgColor: UI.EVALUATION_COLORS.MISTAKE.background 
    };
  }
  
  return { 
    text: '🔴', 
    className: 'eval-blunder',
    color: UI.EVALUATION_COLORS.BLUNDER.text, 
    bgColor: UI.EVALUATION_COLORS.BLUNDER.background 
  };
};