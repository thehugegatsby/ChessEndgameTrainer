import type { EvaluationDisplay } from '@shared/types';

/**
 * Get move quality evaluation (how good was this specific move)
 * This compares the played move with the best available alternative
 * 
 * AI_NOTE: This is the ENGINE-based evaluation, not tablebase!
 * For endgame training, prefer getMoveQualityByTablebaseComparison() when available.
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
        color: 'var(--success-text)', 
        bgColor: 'var(--success-bg)' 
      };
    }
    if (mate < 0) {
      // Even when getting mated, if it's the best defense, show it neutrally
      return { 
        text: `#${Math.abs(mate)}`, 
        className: 'eval-neutral',
        color: 'var(--text-secondary)', 
        bgColor: 'var(--bg-accent)' 
      };
    }
  }
  
  // Für Zugqualität verwenden wir den absoluten Wert
  // Ein starker Zug ist stark, egal für welche Seite
  const absEval = Math.abs(evaluation);
  
  // Sehr starke Züge (leading to winning positions)
  if (absEval >= 5) {
    return { 
      text: '⭐', 
      className: 'eval-excellent',
      color: 'var(--success-text)', 
      bgColor: 'var(--success-bg)' 
    };
  }
  if (absEval >= 2) {
    return { 
      text: '✨', 
      className: 'eval-excellent',
      color: 'var(--success-text)', 
      bgColor: 'var(--success-bg)' 
    };
  }
  if (absEval >= 0.5) {
    return { 
      text: '👌', 
      className: 'eval-good',
      color: 'var(--info-text)', 
      bgColor: 'var(--info-bg)' 
    };
  }
  if (absEval >= -0.5) {
    return { 
      text: '⚪', 
      className: 'eval-neutral',
      color: 'var(--text-secondary)', 
      bgColor: 'var(--bg-accent)' 
    };
  }
  
  // This shouldn't happen in move quality evaluation,
  // but keeping for safety
  return { 
    text: '⚪', 
    className: 'eval-neutral',
    color: 'var(--text-secondary)', 
    bgColor: 'var(--bg-accent)' 
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
        color: 'var(--success-text)', 
        bgColor: 'var(--success-bg)' 
      };
    }
    if (mate < 0) {
      return { 
        text: `#${Math.abs(mate)}`, 
        className: 'eval-blunder',
        color: 'var(--error-text)', 
        bgColor: 'var(--error-bg)' 
      };
    }
  }
  
  // Normale Bewertungen mit Symbolen
  if (evaluation >= 5) {
    return { 
      text: '⭐', 
      className: 'eval-excellent',
      color: 'var(--success-text)', 
      bgColor: 'var(--success-bg)' 
    };
  }
  if (evaluation >= 2) {
    return { 
      text: '✨', 
      className: 'eval-excellent',
      color: 'var(--success-text)', 
      bgColor: 'var(--success-bg)' 
    };
  }
  if (evaluation >= 0.5) {
    return { 
      text: '👌', 
      className: 'eval-good',
      color: 'var(--info-text)', 
      bgColor: 'var(--info-bg)' 
    };
  }
  if (evaluation >= -0.5) {
    return { 
      text: '⚪', 
      className: 'eval-neutral',
      color: 'var(--text-secondary)', 
      bgColor: 'var(--bg-accent)' 
    };
  }
  if (evaluation >= -2) {
    return { 
      text: '⚠️', 
      className: 'eval-inaccurate',
      color: 'var(--warning-text)', 
      bgColor: 'var(--warning-bg)' 
    };
  }
  if (evaluation >= -5) {
    return { 
      text: '🔶', 
      className: 'eval-mistake',
      color: '#fb923c', 
      bgColor: '#c2410c' 
    };
  }
  
  return { 
    text: '🔴', 
    className: 'eval-blunder',
    color: 'var(--error-text)', 
    bgColor: 'var(--error-bg)' 
  };
};