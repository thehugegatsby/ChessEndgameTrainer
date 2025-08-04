// Training Components - Centralized Exports
export { EndgameBoard } from "./TrainingBoard/EndgameBoard";
export { MovePanelZustand } from "./MovePanelZustand";
export { MovePanelZustand as MovePanel } from "./MovePanelZustand"; // Alias for backward compatibility
export { AnalysisPanel } from "./AnalysisPanel";
export { TablebaseAnalysisPanel } from "./TablebaseAnalysisPanel";
export { EndgameControls } from "./EndgameControls";
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
export type { EvaluationData, MoveEvaluation } from "@shared/types";
