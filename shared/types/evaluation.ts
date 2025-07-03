/**
 * Centralized evaluation types for chess analysis
 * Consolidates all evaluation-related interfaces from across the codebase
 */

export interface TablebaseData {
  isTablebasePosition: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  category?: string;
  dtz?: number;
}

// Enhanced types for Brückenbau-Trainer
export type MoveQualityClass = 'optimal' | 'sicher' | 'umweg' | 'riskant' | 'fehler';
export type RobustnessTag = 'robust' | 'präzise' | 'haarig';

export interface EnhancedTablebaseData extends TablebaseData {
  // Existing fields remain:
  isTablebasePosition: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  category?: string;
  dtz?: number;
  
  // NEW for Brückenbau-Trainer:
  dtmBefore?: number;        // Distance to Mate before move
  dtmAfter?: number;         // Distance to Mate after move
  moveQuality?: MoveQualityClass;
  robustness?: RobustnessTag;
  winningMovesCount?: number; // Number of winning moves in position
}

export interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: TablebaseData;
}

export interface EvaluationDisplay {
  text: string;
  className: string;
  color: string;
  bgColor: string;
}

export interface EnhancedEvaluationDisplay extends EvaluationDisplay {
  // Existing fields remain:
  text: string;
  className: string;
  color: string;
  bgColor: string;
  
  // NEW for Brückenbau-Trainer:
  qualityClass: MoveQualityClass;
  robustnessTag?: RobustnessTag;
  dtmDifference?: number;
  educationalTip: string;
}

export interface MoveEvaluation {
  evaluation: number;
  mateInMoves?: number;
}

export type MoveQuality = 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface DualEvaluation {
  engine: {
    score: number;
    mate?: number | null;
    evaluation: string;
  };
  tablebase?: {
    isTablebasePosition: boolean;
    wdl?: number;
    dtz?: number;
    category?: string;
    evaluation?: string;
  };
}