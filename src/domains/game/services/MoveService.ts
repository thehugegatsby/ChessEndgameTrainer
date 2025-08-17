/**
 * @file Move Service Implementation
 * @module domains/game/services/MoveService
 * @description Stateless move service following "Fat Service, Thin Slice" pattern
 */

import type { ChessEngineInterface } from '@domains/game/engine/types';
import type { IMoveService } from './MoveServiceInterface';

/**
 * STATELESS Move Service implementation
 * 
 * Follows "Fat Service, Thin Slice" pattern:
 * - Service handles complex chess logic and returns rich data
 * - TrainingSlice only manages state updates from service results
 * - No internal state - all data flows through method parameters
 */
export class MoveService implements IMoveService {
  private chessEngine: ChessEngineInterface;

  constructor(chessEngine: ChessEngineInterface) {
    this.chessEngine = chessEngine;
  }

  // Methods will be added incrementally in B5.2-B5.6
  // Following atomic commit pattern for safe implementation
  
  // @ts-expect-error - Used in future implementation steps
  private _unused = this.chessEngine;
}