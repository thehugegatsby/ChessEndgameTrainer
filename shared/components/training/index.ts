// Training Components - Centralized Exports
export { TrainingBoard } from "./TrainingBoard/TrainingBoard";
export { TrainingBoard as EndgameBoard } from "./TrainingBoard/TrainingBoard"; // Alias for backward compatibility
export { MovePanelZustand } from "./MovePanelZustand";
export { MovePanelZustand as MovePanel } from "./MovePanelZustand"; // Alias for backward compatibility
export { AnalysisPanel } from "./AnalysisPanel";
export { TablebaseAnalysisPanel } from "./TablebaseAnalysisPanel";
export { TrainingControls } from "./TrainingControls";
export { TrainingControls as EndgameControls } from "./TrainingControls"; // Alias for backward compatibility
export { MoveHistory } from "./MoveHistory";
export { WikiPanel } from "./WikiPanel";
export { EvaluationLegend } from "./EvaluationLegend";
export { NavigationControls } from "./NavigationControls";

// Types
export type {
  TrainingBoardProps,
  MovePanelProps,
  AnalysisPanelProps,
  TrainingPosition,
} from "./types";

// Re-export centralized types
export type { PositionAnalysis, MoveEvaluation } from "@shared/types";
