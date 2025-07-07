import { 
  EvaluationData, 
  EvaluationDisplay, 
  MoveQuality
} from '@shared/types';

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
 * @param wdlBefore - WDL value before the move (from perspective of side to move)
 * @param wdlAfter - WDL value after the move (from perspective of side to move) 
 * @param playerSide - which side played the move ('w' or 'b')
 * 
 * AI_NOTE: CRITICAL PERSPECTIVE UNDERSTANDING (2025-01-06)
 * WDL values from tablebase API are from the perspective of the player TO MOVE:
 * - Before a move: WDL is from the mover's perspective
 * - After a move: WDL is from the opponent's perspective
 * 
 * Example: White plays Kd7
 * - Before: wdl = 2 (White to move, White wins)
 * - After: wdl = -2 (Black to move, Black loses = White still wins!)
 * 
 * To compare properly, we need to convert both to the same perspective.
 */
export const getMoveQualityByTablebaseComparison = (
  wdlBefore: number,
  wdlAfter: number,
  playerSide: 'w' | 'b'
): EvaluationDisplay => {
  // CRITICAL CHECK: If wdlAfter is undefined, we can't compare
  if (wdlBefore === undefined || wdlAfter === undefined) {
    // Fallback to neutral when we don't have complete data
    return {
      text: '⚪',
      className: 'eval-neutral',
      color: 'var(--text-secondary)',
      bgColor: 'var(--bg-accent)'
    };
  }
  
  // CRITICAL: Convert WDL values to a consistent perspective
  // wdlBefore is from the mover's perspective
  // wdlAfter is from the opponent's perspective - we need to flip it!
  const wdlBeforeFromPlayerPerspective = wdlBefore;
  const wdlAfterFromPlayerPerspective = -wdlAfter; // Flip because it's opponent's turn
  
  
  // Convert WDL to simplified categories for clearer logic
  const getCategory = (wdl: number) => {
    if (wdl >= 1) return 'win';    // Both win and cursed-win are wins
    if (wdl <= -1) return 'loss';  // Both loss and blessed-loss are losses  
    return 'draw';
  };
  
  const categoryBefore = getCategory(wdlBeforeFromPlayerPerspective);
  const categoryAfter = getCategory(wdlAfterFromPlayerPerspective);
  
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
    // Check if we improved (higher WDL is better win from player's perspective)
    if (wdlAfterFromPlayerPerspective > wdlBeforeFromPlayerPerspective) {
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

  // EXCELLENT: Improved from draw to win
  if (categoryBefore === 'draw' && categoryAfter === 'win') {
    return {
      text: '🎯',
      className: 'eval-excellent',
      color: 'var(--success-text)',
      bgColor: 'var(--success-bg)'
    };
  }
  
  // DEFENSIVE: Best try in losing position
  if (categoryBefore === 'loss' && categoryAfter === 'loss') {
    // Check if we made the loss "better" (less negative WDL from player's perspective)
    if (wdlAfterFromPlayerPerspective > wdlBeforeFromPlayerPerspective) {
      return {
        text: '🛡️',
        className: 'eval-neutral',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-accent)'
      };
    }
    // Check if we made the loss worse (more negative WDL from player's perspective)
    if (wdlAfterFromPlayerPerspective < wdlBeforeFromPlayerPerspective) {
      return {
        text: '🔻',
        className: 'eval-inaccurate',
        color: 'var(--warning-text)',
        bgColor: 'var(--warning-bg)'
      };
    }
    // When WDL stays exactly the same in a losing position (e.g., -2 to -2),
    // it means optimal defense - maintaining the best possible resistance
    return {
      text: '🛡️',
      className: 'eval-neutral',
      color: 'var(--text-secondary)',
      bgColor: 'var(--bg-accent)'
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

// Helper function to access getCategory outside of getMoveQualityByTablebaseComparison
export const getCategory = (wdl: number): 'win' | 'draw' | 'loss' => {
  if (wdl >= 1) return 'win';    // Both win and cursed-win are wins
  if (wdl <= -1) return 'loss';  // Both loss and blessed-loss are losses  
  return 'draw';
}; 