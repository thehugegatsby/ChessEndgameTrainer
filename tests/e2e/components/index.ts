/**
 * @fileoverview Central export for all E2E test components
 * @description Provides a single entry point for importing test components
 */

// Core components
export { BaseComponent } from './BaseComponent';
export type { BaseComponentConfig } from './BaseComponent';

// UI components
export { BoardComponent } from './BoardComponent';
export type { BoardComponentConfig, ChessPiece } from './BoardComponent';

export { MoveListComponent } from './MoveListComponent';
export type { MoveListComponentConfig, Move } from './MoveListComponent';

export { EvaluationPanel } from './EvaluationPanel';
export type { EvaluationPanelConfig, EngineEvaluation } from './EvaluationPanel';

export { NavigationControls } from './NavigationControls';
export type { NavigationControlsConfig, NavigationButtonType } from './NavigationControls';

// Orchestrator
export { AppDriver, createAppDriver } from './AppDriver';
export type { 
  AppDriverConfig, 
  GameState, 
  RetryConfig,
  DisposableComponent,
  AppDriverError,
  ComponentInitializationError,
  NavigationError,
  SynchronizationError
} from './AppDriver';