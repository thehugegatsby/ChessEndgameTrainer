interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
}

interface EvaluationDisplay {
  text: string;
  className: string;
  color: string;
  bgColor: string;
}

/**
 * Get move quality evaluation (how good was this specific move)
 * This compares the played move with the best available alternative
 */
export const getMoveQualityDisplay = (
  evaluation: number, 
  mate?: number,
  isPlayerMove: boolean = true
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
 * NEW: Move quality based on tablebase WDL comparison
 * This is the REAL training value - detecting when players throw away wins!
 * 
 * @param wdlBefore - WDL value before the move (-2=loss, -1=blessed loss, 0=draw, 1=cursed win, 2=win)
 * @param wdlAfter - WDL value after the move 
 * @param playerSide - which side played the move ('w' or 'b')
 */
export const getMoveQualityByTablebaseComparison = (
  wdlBefore: number,
  wdlAfter: number,
  playerSide: 'w' | 'b'
): EvaluationDisplay => {
  // Convert WDL to simplified categories for clearer logic
  const getCategory = (wdl: number) => {
    if (wdl >= 1) return 'win';    // Both win and cursed-win are wins
    if (wdl <= -1) return 'loss';  // Both loss and blessed-loss are losses  
    return 'draw';
  };
  
  const categoryBefore = getCategory(wdlBefore);
  const categoryAfter = getCategory(wdlAfter);
  
  // CATASTROPHIC: Threw away a winning position
  if (categoryBefore === 'win' && categoryAfter === 'draw') {
    return {
      text: '🚨',
      className: 'eval-blunder',
      color: 'var(--error-text)',
      bgColor: 'var(--error-bg)'
    };
  }
  
  if (categoryBefore === 'win' && categoryAfter === 'loss') {
    return {
      text: '💥',
      className: 'eval-blunder', 
      color: 'var(--error-text)',
      bgColor: 'var(--error-bg)'
    };
  }
  
  // MAJOR MISTAKE: Threw away a draw
  if (categoryBefore === 'draw' && categoryAfter === 'loss') {
    return {
      text: '❌',
      className: 'eval-mistake',
      color: '#fb923c',
      bgColor: '#c2410c'
    };
  }
  
  // EXCELLENT: Maintained or improved position
  if (categoryBefore === 'win' && categoryAfter === 'win') {
    // Check if we improved (higher WDL is better win)
    if (wdlAfter > wdlBefore) {
      return {
        text: '🌟',
        className: 'eval-excellent',
        color: 'var(--success-text)',
        bgColor: 'var(--success-bg)'
      };
    }
    return {
      text: '✅',
      className: 'eval-excellent', 
      color: 'var(--success-text)',
      bgColor: 'var(--success-bg)'
    };
  }
  
  // GOOD: Maintained draw or improved from losing
  if (categoryBefore === 'draw' && categoryAfter === 'draw') {
    return {
      text: '➖',
      className: 'eval-neutral',
      color: 'var(--text-secondary)',
      bgColor: 'var(--bg-accent)'
    };
  }
  
  if (categoryBefore === 'loss' && categoryAfter === 'draw') {
    return {
      text: '👍',
      className: 'eval-good',
      color: 'var(--info-text)', 
      bgColor: 'var(--info-bg)'
    };
  }
  
  if (categoryBefore === 'loss' && categoryAfter === 'win') {
    return {
      text: '🎯',
      className: 'eval-excellent',
      color: 'var(--success-text)',
      bgColor: 'var(--success-bg)'
    };
  }
  
  // DEFENSIVE: Best try in losing position
  if (categoryBefore === 'loss' && categoryAfter === 'loss') {
    // Check if we made the loss "better" (less negative WDL)
    if (wdlAfter > wdlBefore) {
      return {
        text: '🛡️',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      };
    }
    return {
      text: '🔻',
      className: 'eval-inaccurate',
      color: 'var(--warning-text)',
      bgColor: 'var(--warning-bg)'
    };
  }
  
  // Fallback (shouldn't happen)
  return {
    text: '❓',
    className: 'eval-neutral',
    color: 'var(--text-secondary)',
    bgColor: 'var(--bg-accent)'
  };
};

/**
 * Legend for tablebase move quality symbols
 */
export const TABLEBASE_LEGEND = {
  '🚨': 'Sieg → Remis weggeworfen',
  '💥': 'Sieg → Verlust weggeworfen', 
  '❌': 'Remis → Verlust weggeworfen',
  '🌟': 'Sieg verbessert',
  '✅': 'Sieg gehalten',
  '🎯': 'Sieg aus verlorener Stellung',
  '👍': 'Remis aus verlorener Stellung',
  '➖': 'Remis gehalten',
  '🛡️': 'Beste Verteidigung',
  '🔻': 'Schwache Verteidigung',
  '❓': 'Unbekannt'
};

/**
 * Legend for engine evaluation symbols
 */
export const ENGINE_LEGEND = {
  '⭐': 'Dominierend (5+ Bauern)',
  '✨': 'Ausgezeichnet (2+ Bauern)',
  '👌': 'Gut (0.5+ Bauern)',
  '⚪': 'Ausgeglichen/Solide',
  '⚠️': 'Ungenau (-0.5 bis -2 Bauern)',
  '🔶': 'Fehler (-2 bis -5 Bauern)',
  '🔴': 'Katastrophal (-5+ Bauern)',
  '#': 'Matt in X Zügen'
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

export const formatEvaluation = (evalData?: EvaluationData): string => {
  if (!evalData) return '0.00';
  
  if (evalData.mateInMoves !== undefined) {
    return `#${Math.abs(evalData.mateInMoves)}`;
  }
  
  const eval_ = evalData.evaluation;
  if (Math.abs(eval_) < 0.1) return '0.0';
  return eval_ > 0 ? `+${eval_.toFixed(1)}` : eval_.toFixed(1);
};

export const getEvaluationColor = (evalData?: EvaluationData): string => {
  if (!evalData) return 'text-gray-600';
  
  if (evalData.mateInMoves !== undefined) {
    return evalData.mateInMoves > 0 ? 'text-green-700' : 'text-red-700';
  }
  
  const eval_ = evalData.evaluation;
  if (eval_ > 2) return 'text-green-700';
  if (eval_ > 0.5) return 'text-green-600';
  if (eval_ > -0.5) return 'text-gray-600';
  if (eval_ > -2) return 'text-orange-600';
  return 'text-red-600';
};

export const getEvaluationBarWidth = (evaluation?: number): number => {
  if (evaluation === undefined) return 50;
  // Convert evaluation to percentage (clamped between 0-100)
  return Math.max(0, Math.min(100, 50 + (evaluation * 10)));
}; 