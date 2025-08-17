/**
 * @file Game Services Barrel Export
 * @module domains/game/services
 * @description Central export point for all game services and interfaces
 */

// Service Interfaces
export type { PositionServiceInterface } from './PositionServiceInterface';
export type { IMoveService } from './MoveServiceInterface';
export type { GameStateServiceInterface } from './GameStateServiceInterface';

// Service Implementations
export { PositionService } from './PositionService';
export { MoveService } from './MoveService';
export { GameStateService } from './GameStateService';

// Types from interfaces
export type {
  PositionEvaluationResult,
  EvaluationBaseline,
  MoveQualityResult
} from './PositionServiceInterface';

export type {
  MakeMoveResult,
  MoveValidationResult,
  MoveInput
} from './MoveServiceInterface';

export type {
  GameStateInfo,
  GameTerminationReason,
  TrainingCompletionResult
} from './GameStateServiceInterface';