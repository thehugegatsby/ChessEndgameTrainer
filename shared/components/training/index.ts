// Training Components - Centralized Exports
export { TrainingBoard } from './TrainingBoard';
export { MovePanel } from './MovePanel';
export { AnalysisPanel } from './AnalysisPanel';
export { DualEvaluationPanel, SidebarEngineSection } from './DualEvaluationPanel';
export { DualEvaluationSidebar } from './DualEvaluationPanel/DualEvaluationSidebar';
export { TrainingControls } from './TrainingControls';
export { MoveHistory } from './MoveHistory';
export { WikiPanel } from './WikiPanel';
export { EvaluationLegend } from './EvaluationLegend';

// Types
export type {
  TrainingBoardProps,
  MovePanelProps,
  AnalysisPanelProps,
  TrainingPosition
} from './types';

// Re-export centralized types
export type { EvaluationData, MoveEvaluation } from '@shared/types'; 