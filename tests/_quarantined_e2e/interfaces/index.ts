/**
 * @fileoverview E2E Test Interfaces - Central export
 * @description Exports all interface contracts for E2E test components
 */

export * from './IMovePanelPOM';
export * from './IBoardComponent';
export * from './IEvaluationPanel';

// Re-export common types
export type { GameState } from '../components/IModernDriver';
export type { Move, NavigationState } from './IMovePanelPOM';
export type { EvaluationInfo } from './IEvaluationPanel';