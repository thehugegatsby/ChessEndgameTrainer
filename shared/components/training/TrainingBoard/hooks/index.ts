/**
 * TrainingBoard Hooks Index
 * Centralized exports for all custom hooks used in TrainingBoard
 */

export { useScenarioEngine } from './useScenarioEngine';
export { useTrainingState } from './useTrainingState';
export { useEnhancedMoveHandler } from './useEnhancedMoveHandler';

// Re-export types if needed
export type { 
  UseScenarioEngineOptions, 
  UseScenarioEngineReturn 
} from './useScenarioEngine';

export type { 
  UseTrainingStateReturn 
} from './useTrainingState';

export type { 
  UseEnhancedMoveHandlerOptions, 
  UseEnhancedMoveHandlerReturn 
} from './useEnhancedMoveHandler'; 