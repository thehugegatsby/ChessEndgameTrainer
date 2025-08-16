// Training Components - Centralized Exports
export { TrainingBoard } from './TrainingBoard/TrainingBoard';
export { MovePanelZustand } from './MovePanelZustand';
export { AnalysisPanel } from './AnalysisPanel';
export { TablebaseAnalysisPanel } from './TablebaseAnalysisPanel';
export { TrainingControls } from './TrainingControls';
export { MoveHistory } from './MoveHistory';
export { WikiPanel } from './WikiPanel';
export { EvaluationLegend } from './EvaluationLegend';
export { NavigationControls } from './NavigationControls';

// Types
export type {
  TrainingBoardProps,
  MovePanelProps,
  AnalysisPanelProps,
  TrainingPosition,
} from './types';

// Re-export centralized types
export type { PositionAnalysis, MoveEvaluation } from '@shared/types';
