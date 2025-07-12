/**
 * Tablebase-First Move Classification for Endgame Training
 * Prioritizes objective tablebase truth over engine evaluation nuances
 */

import type { 
  MistakeType, 
  TablebaseResult, 
  MoveAnalysis,
  AdaptiveConfig 
} from './types';

/**
 * Classify a move based primarily on tablebase results
 * This is the core logic for endgame mistake analysis
 */
export function classifyMoveTablebaseFirst(
  beforeTablebase: TablebaseResult,
  afterTablebase: TablebaseResult,
  engineBefore?: number,
  engineAfter?: number,
  config?: AdaptiveConfig
): MistakeType {
  
  // If tablebase data unavailable for either position, fallback to engine
  if (!beforeTablebase.isTablebase || !afterTablebase.isTablebase) {
    // But first check if we can still determine position type changes from available data
    if (beforeTablebase.isTablebase && beforeTablebase.result === 'win' && 
        !afterTablebase.isTablebase) {
      // Use engine to classify, but we know we went from winning to unknown
      const engineDelta = (engineAfter || 0) - (engineBefore || 0);
      if (engineDelta < -200) {
        return 'BLUNDER'; // Significant drop from known winning position
      }
    }
    return classifyMoveEngineOnly(engineBefore || 0, engineAfter || 0, config);
  }
  
  const beforeResult = beforeTablebase.result;
  const afterResult = afterTablebase.result;
  const beforeDTM = beforeTablebase.dtm || 999;
  const afterDTM = afterTablebase.dtm || 999;
  
  // Critical: Check for position type changes (worst mistakes)
  if (beforeResult === 'win' && afterResult === 'loss') {
    return 'CRITICAL_ERROR'; // Win to loss is catastrophic
  }
  
  if (beforeResult === 'win' && afterResult === 'draw') {
    return 'BLUNDER'; // Win to draw is a blunder
  }
  
  if (beforeResult === 'draw' && afterResult === 'loss') {
    return 'BLUNDER'; // Draw to loss is also a blunder
  }
  
  // Position type maintained - now check optimality
  if (beforeResult === afterResult) {
    
    if (beforeResult === 'win') {
      return classifyWinningMoveOptimality(beforeDTM, afterDTM);
    }
    
    if (beforeResult === 'draw') {
      return classifyDrawingMoveOptimality(beforeDTM, afterDTM);
    }
    
    if (beforeResult === 'loss') {
      // In losing positions, extending the loss is actually good (defensive)
      return afterDTM > beforeDTM ? 'CORRECT' : 'SUBOPTIMAL';
    }
  }
  
  // Position improved
  if (isImprovement(beforeResult, afterResult)) {
    return classifyPositionImprovement(beforeResult, afterResult, beforeDTM, afterDTM);
  }
  
  // Default fallback
  return 'CORRECT';
}

/**
 * Classify moves in winning positions based on DTM efficiency
 */
function classifyWinningMoveOptimality(beforeDTM: number, afterDTM: number): MistakeType {
  // If both DTM values are undefined (both set to 999), we can't determine optimality
  if (beforeDTM === 999 && afterDTM === 999) {
    return 'CORRECT';
  }
  
  const dtmDelta = afterDTM - beforeDTM;
  
  // Perfect: Maintains optimal path or improves it
  if (dtmDelta <= 0) {
    return 'PERFECT';
  }
  
  // Correct: Minor extension (1-3 moves)
  if (dtmDelta <= 3) {
    return 'CORRECT';
  }
  
  // Suboptimal: Significant extension (4-10 moves)
  if (dtmDelta <= 10) {
    return 'SUBOPTIMAL';
  }
  
  // Error: Major extension but still winning
  if (dtmDelta <= 20) {
    return 'ERROR';
  }
  
  // Very bad extension
  return 'BLUNDER';
}

/**
 * Classify moves in drawing positions
 */
function classifyDrawingMoveOptimality(beforeDTM: number, afterDTM: number): MistakeType {
  // In draws, DTM often represents distance to conversion
  // Positive changes in DTM might be defensive improvements
  
  if (afterDTM >= beforeDTM) {
    return 'CORRECT'; // Maintaining or improving the draw
  }
  
  const dtmLoss = beforeDTM - afterDTM;
  
  if (dtmLoss <= 2) {
    return 'CORRECT'; // Minor defensive concession
  }
  
  if (dtmLoss <= 5) {
    return 'SUBOPTIMAL'; // Some defensive ground lost
  }
  
  return 'ERROR'; // Significant defensive weakening
}

/**
 * Check if the move represents a position improvement
 */
function isImprovement(before: 'win' | 'draw' | 'loss', after: 'win' | 'draw' | 'loss'): boolean {
  if (before === 'loss' && (after === 'draw' || after === 'win')) return true;
  if (before === 'draw' && after === 'win') return true;
  return false;
}

/**
 * Classify moves that improve the position type
 */
function classifyPositionImprovement(
  before: 'win' | 'draw' | 'loss', 
  after: 'win' | 'draw' | 'loss',
  beforeDTM: number,
  afterDTM: number
): MistakeType {
  
  // Any improvement in position type is at least CORRECT
  if (before === 'loss' && after === 'draw') {
    return 'CORRECT'; // Escaping loss to draw
  }
  
  if (before === 'loss' && after === 'win') {
    return 'PERFECT'; // Complete turnaround!
  }
  
  if (before === 'draw' && after === 'win') {
    return afterDTM <= 10 ? 'PERFECT' : 'CORRECT'; // Converting draw to win
  }
  
  return 'CORRECT';
}

/**
 * Fallback classification when tablebase unavailable (8+ pieces)
 * Uses traditional engine evaluation but with endgame-aware thresholds
 */
function classifyMoveEngineOnly(
  beforeEval: number, 
  afterEval: number,
  config?: AdaptiveConfig
): MistakeType {
  
  const centipawnDelta = afterEval - beforeEval;
  
  // Endgame-specific thresholds (more forgiving than middlegame)
  if (centipawnDelta >= 100) return 'PERFECT';
  if (centipawnDelta >= 0) return 'CORRECT';
  if (centipawnDelta >= -50) return 'SUBOPTIMAL';
  if (centipawnDelta >= -150) return 'ERROR';
  if (centipawnDelta >= -400) return 'BLUNDER';
  
  return 'CRITICAL_ERROR';
}

/**
 * Generate educational explanation for tablebase-based classification
 */
export function generateTablebaseExplanation(
  mistakeType: MistakeType,
  beforeTablebase: TablebaseResult,
  afterTablebase: TablebaseResult,
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' = 'INTERMEDIATE'
): string {
  
  const isBeginner = skillLevel === 'BEGINNER';
  const beforeResult = beforeTablebase.result;
  const afterResult = afterTablebase.result;
  const beforeDTM = beforeTablebase.dtm;
  const afterDTM = afterTablebase.dtm;
  
  // Position type changes (most important)
  if (beforeResult !== afterResult) {
    
    if (beforeResult === 'win' && afterResult === 'loss') {
      return isBeginner 
        ? 'This move loses a winning position completely. Take your time and look for better moves.'
        : `Critical error: This move throws away a winning position (DTM was ${beforeDTM}). The position is now lost.`;
    }
    
    if (beforeResult === 'win' && afterResult === 'draw') {
      return isBeginner
        ? 'This move lets your opponent escape to a draw from a winning position. Look for forcing moves.'
        : `Blunder: This move allows the opponent to escape from a lost position (DTM ${beforeDTM}) to a theoretical draw.`;
    }
    
    if (beforeResult === 'draw' && afterResult === 'loss') {
      return isBeginner
        ? 'This move loses from an equal position. Be more careful with your moves.'
        : `Blunder: This move loses from a drawn position. The position was holdable.`;
    }
    
    // Improvements
    if (beforeResult === 'loss' && afterResult === 'draw') {
      return isBeginner
        ? 'Great defensive move! You saved a difficult position.'
        : `Excellent defense: You converted a losing position into a theoretical draw.`;
    }
    
    if (beforeResult === 'draw' && afterResult === 'win') {
      return isBeginner
        ? 'Excellent! You found a way to win from an equal position.'
        : `Perfect technique: You converted a drawn position into a win (DTM ${afterDTM}).`;
    }
  }
  
  // Same position type - check efficiency
  if (beforeResult === afterResult) {
    
    if (beforeResult === 'win') {
      const dtmDelta = (afterDTM || 999) - (beforeDTM || 999);
      
      if (mistakeType === 'PERFECT') {
        return isBeginner
          ? 'Perfect! This is the fastest way to win.'
          : afterDTM !== undefined 
            ? `Optimal move: This maintains or improves the shortest path to mate (DTM ${afterDTM}).`
            : 'Optimal move: This maintains the winning position.';
      }
      
      if (mistakeType === 'CORRECT') {
        return isBeginner
          ? 'Good move! This keeps your winning advantage.'
          : afterDTM !== undefined
            ? `Solid choice: This maintains the win, though not the fastest route (+${dtmDelta} moves to DTM ${afterDTM}).`
            : 'Solid choice: This maintains the winning position.';
      }
      
      if (mistakeType === 'SUBOPTIMAL') {
        return isBeginner
          ? 'This move still wins, but takes longer. Try to find more direct paths.'
          : afterDTM !== undefined
            ? `Suboptimal: This significantly extends the win (+${dtmDelta} moves to DTM ${afterDTM}). Look for more forcing continuations.`
            : 'Suboptimal: This maintains the win but not efficiently.';
      }
    }
    
    if (beforeResult === 'draw') {
      return isBeginner
        ? 'This move maintains the balance. Keep looking for opportunities.'
        : `This move maintains the theoretical draw. The position remains balanced.`;
    }
  }
  
  return 'Position analysis complete.';
}

/**
 * Determine if a position likely has tablebase coverage
 */
export function hasTablebaseCoverage(pieceCount: number): boolean {
  // Standard Syzygy tablebases cover up to 7 pieces
  return pieceCount <= 7;
}

/**
 * Create a tablebase result from position analysis
 */
export function createTablebaseResult(
  result: 'win' | 'draw' | 'loss',
  dtm?: number
): TablebaseResult {
  return {
    result,
    dtm,
    isTablebase: true
  };
}

/**
 * Create a fallback "tablebase" result from engine evaluation
 */
export function createEngineTablebaseResult(evaluation: number): TablebaseResult {
  let result: 'win' | 'draw' | 'loss';
  
  if (evaluation > 200) {
    result = 'win';
  } else if (evaluation < -200) {
    result = 'loss';  
  } else {
    result = 'draw';
  }
  
  return {
    result,
    dtm: undefined, // No DTM data from engine alone
    isTablebase: false
  };
}