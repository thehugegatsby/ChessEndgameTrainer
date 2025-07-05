import { 
  EvaluationData, 
  EvaluationDisplay, 
  MoveQuality,
  MoveQualityClass,
  RobustnessTag,
  EnhancedTablebaseData,
  EnhancedEvaluationDisplay
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
 * @param wdlBefore - WDL value before the move (-2=loss, -1=blessed loss, 0=draw, 1=cursed win, 2=win)
 * @param wdlAfter - WDL value after the move 
 * @param playerSide - which side played the move ('w' or 'b')
 * 
 * AI_NOTE: CRITICAL PERSPECTIVE BUG FIXED (2025-01-11)
 * WDL values from tablebase API are ALWAYS from White's perspective!
 * Lines 107-108: We convert to player's perspective by negating for Black.
 * This bug caused Black's optimal defensive moves to show red triangles.
 * 
 * KNOWN ISSUE: Line 229 - When WDL stays exactly -2 to -2 for Black in losing position,
 * it's actually optimal defense (maintaining tablebase loss). We show shield (🛡️).
 * 
 * See: /shared/utils/chess/EVALUATION_LOGIC_LEARNINGS.md for full debugging story.
 */
export const getMoveQualityByTablebaseComparison = (
  wdlBefore: number,
  wdlAfter: number,
  playerSide: 'w' | 'b'
): EvaluationDisplay => {
  // CRITICAL: Convert WDL values to player's perspective
  // For Black, we need to flip the values since WDL is from White's perspective
  const wdlBeforeFromPlayerPerspective = playerSide === 'w' ? wdlBefore : -wdlBefore;
  const wdlAfterFromPlayerPerspective = playerSide === 'w' ? wdlAfter : -wdlAfter;
  
  
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

/**
 * Enhanced Move Quality for Brückenbau-Trainer
 * Classifies Win→Win moves based on DTM difference
 */
export const classifyWinToWin = (dtmDiff: number): MoveQualityClass => {
  if (dtmDiff <= 1) return 'optimal';
  if (dtmDiff <= 5) return 'sicher';
  if (dtmDiff <= 15) return 'umweg';
  return 'riskant';
};

/**
 * Classify robustness based on number of winning moves
 */
export const classifyRobustness = (winningMovesCount: number): RobustnessTag => {
  if (winningMovesCount >= 3) return 'robust';
  if (winningMovesCount === 2) return 'präzise';
  return 'haarig';
};

/**
 * Get educational tip based on move quality and robustness
 */
export const getEducationalTip = (
  qualityClass: MoveQualityClass, 
  robustness?: RobustnessTag
): string => {
  const tips: Record<MoveQualityClass, Record<RobustnessTag | 'default', string>> = {
    optimal: {
      robust: 'Perfekt! Viele gute Alternativen vorhanden.',
      präzise: 'Sehr gut! Eine von wenigen optimalen Lösungen.',
      haarig: 'Exzellent! Der einzige optimale Zug gefunden.',
      default: 'Kürzester Weg zum Sieg.'
    },
    sicher: {
      robust: 'Solide Technik mit vielen Alternativen.',
      präzise: 'Gute Wahl aus wenigen sicheren Optionen.',
      haarig: 'Wichtiger Zug - nur dieser hält den Gewinn sicher.',
      default: 'Sichere Gewinntechnik angewendet.'
    },
    umweg: {
      robust: 'Funktioniert, aber es gibt effizientere Wege.',
      präzise: 'Umständlich, aber einer der wenigen gewinnenden Züge.',
      haarig: 'Kompliziert, aber der einzige Gewinnzug!',
      default: 'Gewinn bleibt, aber dauert länger.'
    },
    riskant: {
      robust: 'Sehr kompliziert trotz vieler Alternativen.',
      präzise: 'Riskant! Nur wenige Züge halten noch den Gewinn.',
      haarig: 'Kritisch! Nur dieser Zug gewinnt noch.',
      default: 'Gewinn noch möglich, aber sehr schwierig.'
    },
    fehler: {
      robust: 'Gewinn verspielt - zurück zum Anfang!',
      präzise: 'Gewinn verspielt - zurück zum Anfang!',
      haarig: 'Gewinn verspielt - zurück zum Anfang!',
      default: 'Gewinn verspielt - zurück zum Anfang!'
    }
  };
  
  return tips[qualityClass][robustness || 'default'];
};

/**
 * Enhanced Move Quality Evaluation for Brückenbau-Trainer
 * Provides detailed classification for Win→Win moves based on DTM
 * 
 * AI_NOTE: NEW FEATURE (2025-01) - Not yet integrated in UI!
 * This is the planned enhancement for didactic endgame training.
 * DTM (Distance to Mate) differences classify move quality:
 * - ≤1: optimal (shortest path)
 * - ≤5: sicher (safe technique)
 * - ≤15: umweg (detour but works)
 * - >15: riskant (fragile win)
 * 
 * IMPLEMENTATION STATUS: Types defined, logic implemented, UI integration pending.
 * See: /docs/features/brueckenbau-trainer.md for full specification.
 */
export const getEnhancedMoveQuality = (
  wdlBefore: number,
  wdlAfter: number, 
  dtmBefore: number | undefined,
  dtmAfter: number | undefined,
  winningMovesCount: number,
  playerSide: 'w' | 'b'
): EnhancedEvaluationDisplay => {
  // 1. Get base WDL evaluation (existing logic)
  const baseEval = getMoveQualityByTablebaseComparison(wdlBefore, wdlAfter, playerSide);
  
  // 2. For Win→Win: Refined classification
  if (getCategory(wdlBefore) === 'win' && getCategory(wdlAfter) === 'win' && 
      dtmBefore !== undefined && dtmAfter !== undefined) {
    const dtmDiff = dtmAfter - dtmBefore;
    const qualityClass = classifyWinToWin(dtmDiff);
    const robustness = classifyRobustness(winningMovesCount);
    const educationalTip = getEducationalTip(qualityClass, robustness);
    
    // Map quality class to display properties
    const qualityDisplayMap: Record<MoveQualityClass, Partial<EvaluationDisplay>> = {
      optimal: { text: '🟢', className: 'eval-optimal' },
      sicher: { text: '✅', className: 'eval-sicher' },
      umweg: { text: '🟡', className: 'eval-umweg' },
      riskant: { text: '⚠️', className: 'eval-riskant' },
      fehler: { text: '🚨', className: 'eval-fehler' }
    };
    
    const display = qualityDisplayMap[qualityClass];
    
    return {
      ...baseEval,
      text: display.text || baseEval.text,
      className: display.className || baseEval.className,
      qualityClass,
      robustnessTag: robustness,
      dtmDifference: dtmDiff,
      educationalTip
    };
  }
  
  // 3. For non Win→Win moves, map to enhanced format
  const qualityClassMap: Record<string, MoveQualityClass> = {
    '🚨': 'fehler',
    '💥': 'fehler',
    '❌': 'fehler',
    '🌟': 'optimal',
    '✅': 'sicher',
    '🎯': 'optimal',
    '👍': 'sicher',
    '➖': 'sicher',
    '🛡️': 'sicher',
    '🔻': 'umweg',
    '❓': 'umweg'
  };
  
  return {
    ...baseEval,
    qualityClass: qualityClassMap[baseEval.text] || 'umweg',
    educationalTip: getEducationalTip(qualityClassMap[baseEval.text] || 'umweg')
  };
}; 