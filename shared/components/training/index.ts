// Training Components - Centralized Exports
export { TrainingBoardZustand } from './TrainingBoard/TrainingBoardZustand';
export { TrainingBoardZustand as TrainingBoard } from './TrainingBoard/TrainingBoardZustand'; // Alias for backward compatibility
export { MovePanelZustand } from './MovePanelZustand';
export { MovePanelZustand as MovePanel } from './MovePanelZustand'; // Alias for backward compatibility
export { AnalysisPanel } from './AnalysisPanel';
// TODO: Re-enable when DualEvaluationPanel is refactored for clean architecture
// export { DualEvaluationPanel, SidebarEngineSection } from './DualEvaluationPanel';
export { DualEvaluationSidebar } from './DualEvaluationPanel/DualEvaluationSidebar';
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
  TrainingPosition
} from './types';

// Re-export centralized types
export type { EvaluationData, MoveEvaluation } from '@shared/types'; 