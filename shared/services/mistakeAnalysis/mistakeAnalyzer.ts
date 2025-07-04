/**
 * Pure Logic Functions for Chess Move Mistake Analysis
 * Implements TDD-driven core functionality for adaptive mistake classification
 */

import type { 
  MistakeType, 
  MistakeClassificationResult, 
  SkillLevel,
  AdaptiveConfig,
  MistakeTheme
} from './types';

/**
 * Thresholds for mistake classification based on skill level
 */
interface AdaptiveThresholds {
  inaccuracyThreshold: number;
  mistakeThreshold: number;
  blunderThreshold: number;
  criticalBlunderThreshold: number;
}

/**
 * Calculate the centipawn delta between two evaluations
 * Positive = improvement, Negative = worsening
 */
export function calculateCentipawnDelta(beforeEval: number, afterEval: number): number {
  if (beforeEval == null || afterEval == null) {
    return 0;
  }
  return afterEval - beforeEval;
}

/**
 * Create adaptive thresholds based on skill level
 * Beginners get more forgiving thresholds, experts get stricter ones
 */
export function createAdaptiveThresholds(skillLevel: SkillLevel): AdaptiveThresholds {
  switch (skillLevel) {
    case 'BEGINNER':
      return {
        inaccuracyThreshold: 75,    // More forgiving for beginners
        mistakeThreshold: 150,
        blunderThreshold: 350,
        criticalBlunderThreshold: 800
      };
    
    case 'INTERMEDIATE':
      return {
        inaccuracyThreshold: 10,    // Standard thresholds
        mistakeThreshold: 50,
        blunderThreshold: 200,
        criticalBlunderThreshold: 600
      };
    
    case 'ADVANCED':
      return {
        inaccuracyThreshold: 35,    // Stricter for advanced players
        mistakeThreshold: 75,
        blunderThreshold: 200,
        criticalBlunderThreshold: 500
      };
    
    case 'EXPERT':
      return {
        inaccuracyThreshold: 5,     // Very strict for experts
        mistakeThreshold: 25,
        blunderThreshold: 150,
        criticalBlunderThreshold: 400
      };
    
    default:
      // Fallback to intermediate
      return createAdaptiveThresholds('INTERMEDIATE');
  }
}

/**
 * Determine if position context affects mistake classification
 */
function analyzePositionContext(centipawnDelta: number, config: AdaptiveConfig) {
  const absLoss = Math.abs(centipawnDelta);
  
  return {
    isEndgame: config.focusAreas.includes('ENDGAME_TECHNIQUE'),
    isComplexPosition: absLoss > 100, // Larger swings suggest complexity
    hasTimelinePressure: false // Placeholder for future time analysis
  };
}

/**
 * Core function to classify a chess move based on evaluation change
 * Uses adaptive thresholds and contextual analysis
 */
export function classifyMove(
  beforeEval: number, 
  afterEval: number, 
  config: AdaptiveConfig
): MistakeClassificationResult {
  
  const centipawnDelta = calculateCentipawnDelta(beforeEval, afterEval);
  const thresholds = createAdaptiveThresholds(config.skillLevel);
  const context = analyzePositionContext(centipawnDelta, config);
  
  // Determine base classification
  let type: MistakeType;
  let confidence: number;
  
  if (centipawnDelta >= 50) {
    type = 'PERFECT';
    confidence = Math.min(0.9, 0.7 + (centipawnDelta - 50) / 200);
  } else if (centipawnDelta >= 0) {
    type = 'CORRECT';
    confidence = 0.7 + centipawnDelta / 100;
  } else {
    const absLoss = Math.abs(centipawnDelta);
    
    // Apply adaptive thresholds with endgame adjustment
    const endgameMultiplier = context.isEndgame ? 0.5 : 1.0; // Much more strict in endgames
    
    if (absLoss >= thresholds.criticalBlunderThreshold * endgameMultiplier) {
      type = 'CRITICAL_ERROR';
      confidence = 1.0;
    } else if (absLoss >= thresholds.blunderThreshold * endgameMultiplier) {
      type = 'BLUNDER';
      confidence = Math.min(1.0, 0.9 + (absLoss - thresholds.blunderThreshold) / 200);
    } else if (absLoss >= thresholds.mistakeThreshold * endgameMultiplier) {
      type = 'ERROR';
      confidence = 0.8 + (absLoss - thresholds.mistakeThreshold) / 300;
    } else if (absLoss >= thresholds.inaccuracyThreshold * endgameMultiplier) {
      type = 'IMPRECISE';
      confidence = 0.6 + (absLoss - thresholds.inaccuracyThreshold) / 200;
    } else {
      type = 'CORRECT'; // Very small loss, treat as acceptable
      confidence = 0.5;
    }
  }
  
  // Additional confidence adjustment for adaptive features
  const isAdaptive = config.skillLevel !== 'INTERMEDIATE' || context.isEndgame;
  if (isAdaptive) {
    confidence = Math.min(1.0, confidence + 0.1); // Boost confidence for adaptive classifications
  }
  
  return {
    type,
    confidence: Math.min(1.0, Math.max(0.1, confidence)),
    isAdaptive,
    centipawnDelta,
    context
  };
}

/**
 * Generate human-readable explanation for a mistake
 * Adapts language complexity based on skill level
 */
export function generateMistakeExplanation(
  mistakeType: MistakeType,
  centipawnDelta: number,
  themes: MistakeTheme[],
  skillLevel: SkillLevel
): string {
  
  const absLoss = Math.abs(centipawnDelta);
  const isPositive = centipawnDelta > 0;
  const isBeginner = skillLevel === 'BEGINNER';
  
  // Build explanation components
  let explanation = '';
  
  // Opening based on mistake type
  switch (mistakeType) {
    case 'PERFECT':
      explanation = isBeginner 
        ? 'Perfect move! This is the best possible choice.'
        : `Perfect choice! This move gains approximately ${centipawnDelta} centipawns.`;
      break;
      
    case 'CORRECT':
      explanation = isBeginner
        ? 'Good move! This keeps your position solid.'
        : `Solid move maintaining the position.`;
      break;
      
    case 'IMPRECISE':
      explanation = isBeginner
        ? 'This move could be improved. Look for better alternatives.'
        : `Minor inaccuracy costing ${absLoss} centipawns.`;
      break;
      
    case 'ERROR':
      explanation = isBeginner
        ? 'This move weakens your position. Take more time to consider alternatives.'
        : `Significant mistake resulting in a ${absLoss} centipawn loss.`;
      break;
      
    case 'BLUNDER':
      explanation = isBeginner
        ? 'This move damages your position badly. Keep practicing and you\'ll improve!'
        : `Major blunder costing ${absLoss} centipawns - this significantly worsens your position.`;
      break;
      
    case 'CRITICAL_ERROR':
      explanation = isBeginner
        ? 'This move is very damaging. Focus on basic tactical patterns and take your time.'
        : `Critical blunder with ${absLoss} centipawn loss - this may have changed the game outcome.`;
      break;
  }
  
  // Add theme-specific advice
  if (themes.length > 0) {
    const themeAdvice = generateThemeAdvice(themes, skillLevel);
    if (themeAdvice) {
      explanation += ` ${themeAdvice}`;
    }
  }
  
  // Add encouraging note for beginners making mistakes
  if (isBeginner && (mistakeType === 'ERROR' || mistakeType === 'BLUNDER' || mistakeType === 'CRITICAL_ERROR')) {
    explanation += ' Remember, mistakes are part of learning - keep practicing!';
  }
  
  return explanation;
}

/**
 * Generate theme-specific advice for mistakes
 */
function generateThemeAdvice(themes: MistakeTheme[], skillLevel: SkillLevel): string {
  const isAdvanced = skillLevel === 'ADVANCED' || skillLevel === 'EXPERT';
  const advicePoints: string[] = [];
  
  if (themes.includes('TACTICS')) {
    advicePoints.push(isAdvanced 
      ? 'Consider tactical motifs like pins, forks, and discovered attacks'
      : 'Look for tactical opportunities before moving');
  }
  
  if (themes.includes('ENDGAME_TECHNIQUE')) {
    advicePoints.push(isAdvanced
      ? 'Review fundamental endgame principles and key square concepts'
      : 'Practice basic endgame techniques');
  }
  
  if (themes.includes('KING_SAFETY')) {
    advicePoints.push(isAdvanced
      ? 'Assess king safety and potential attacking patterns'
      : 'Focus on king safety concerns');
  }
  
  if (themes.includes('PIECE_ACTIVITY')) {
    advicePoints.push(isAdvanced
      ? 'Focus on piece coordination and activity optimization'
      : 'Improve your piece activity and coordination');
  }
  
  if (themes.includes('CALCULATION')) {
    advicePoints.push(isAdvanced
      ? 'Verify your calculations and consider candidate moves systematically'
      : 'Take more time to calculate variations');
  }
  
  // Combine advice points
  if (advicePoints.length === 0) {
    return '';
  } else if (advicePoints.length === 1) {
    return advicePoints[0] + '.';
  } else {
    // For multiple themes, join them intelligently
    if (isAdvanced) {
      return advicePoints.join('. ') + '.';
    } else {
      // For beginners, keep it simpler but mention key areas
      return advicePoints.slice(0, 2).join(' and ') + '.';
    }
  }
}

/**
 * Validate that the mistake analysis configuration is reasonable
 */
export function validateConfig(config: AdaptiveConfig): boolean {
  if (!config) return false;
  
  const validSkillLevels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  if (!validSkillLevels.includes(config.skillLevel)) return false;
  
  if (config.sensitivityThreshold < 0 || config.sensitivityThreshold > 100) return false;
  if (config.analysisDepth < 1 || config.analysisDepth > 20) return false;
  
  return true;
}