/**
 * @file Game Services Barrel Export
 * @module domains/game/services
 * @description Central export point for all game services
 */

// Service Interfaces
export type { PositionServiceInterface } from './PositionServiceInterface';

// Service Implementations
// export { PositionService } from './PositionService'; // Moved to _legacy

// Export new core services
export { ChessService } from '../../../core/services/chess.service';
export { TablebaseService } from '../../../core/services/tablebase.service';
export { PositionService as CorePositionService } from '../../../core/services/position.service';

// Types from core
export type {
  ChessSnapshot,
  ChessMove,
  Position,
  TablebaseResult,
  TrainingSnapshot,
  TrainingState
} from '../../../core/types';