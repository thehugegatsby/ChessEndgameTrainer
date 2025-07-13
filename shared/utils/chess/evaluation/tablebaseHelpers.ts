import type { EvaluationDisplay } from '@shared/types';

/**
 * Helper function to access getCategory outside of getMoveQualityByTablebaseComparison
 */
export const getCategory = (wdl: number): 'win' | 'draw' | 'loss' => {
  if (wdl >= 1) return 'win';    // Both win and cursed-win are wins
  if (wdl <= -1) return 'loss';  // Both loss and blessed-loss are losses  
  return 'draw';
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
  _playerSide: 'w' | 'b'
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