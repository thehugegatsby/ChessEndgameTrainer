import { Move } from 'chess.js';

/**
 * Common interfaces for Training components
 */

export interface TrainingBoardProps {
  fen: string;
  onComplete?: (success: boolean) => void;
  onHistoryChange?: (moves: Move[]) => void;
  onEvaluationsChange?: (evaluations: Array<{ evaluation: number; mateInMoves?: number }>) => void;
  onPositionChange?: (fen: string, pgn: string) => void;
  onJumpToMove?: (func: (moveIndex: number) => void) => void;
  currentMoveIndex?: number;
}

export interface MovePanelProps {
  moves: Move[];
  showEvaluations?: boolean;
  evaluations?: Array<{ evaluation: number; mateInMoves?: number }>;
  onMoveClick?: (moveIndex: number) => void;
  currentMoveIndex?: number;
}

export interface AnalysisPanelProps {
  history: Move[];
  initialFen: string;
  onClose?: () => void;
  isVisible?: boolean;
}

export interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
}

export interface TrainingPosition {
  id: string;
  fen: string;
  title: string;
  description?: string;
  category: string;
  difficulty: number;
} 