/**
 * @fileoverview Test Data Builders Index
 * @description Exports all builders and types for easy import
 */

// Export all types
export * from './types';

// Export builders
export { GameStateBuilder } from './GameStateBuilder';
export { PositionBuilder } from './PositionBuilder';
export { TrainingSessionBuilder } from './TrainingSessionBuilder';

// Export base builder for potential extension
export { BaseBuilder } from './BaseBuilder';

// Convenience factory functions
import { GameStateBuilder } from './GameStateBuilder';
import { PositionBuilder } from './PositionBuilder';
import { TrainingSessionBuilder } from './TrainingSessionBuilder';

/**
 * Factory function for GameStateBuilder
 */
export function aGameState(): GameStateBuilder {
  return new GameStateBuilder();
}

/**
 * Factory function for PositionBuilder
 */
export function aPosition(): PositionBuilder {
  return new PositionBuilder();
}

/**
 * Factory function for TrainingSessionBuilder
 */
export function aTrainingSession(): TrainingSessionBuilder {
  return new TrainingSessionBuilder();
}

// Common test scenarios as ready-to-use builders
export const TestScenarios = {
  /**
   * Standard starting position game state
   */
  newGame: () => aGameState().fromPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  
  /**
   * Game after 1.e4 e5
   */
  afterE4E5: () => aGameState().afterMoves(['e4', 'e5']),
  
  /**
   * Basic king opposition position
   */
  kingOpposition: () => aPosition().kingOpposition(),
  
  /**
   * Bridge building endgame
   */
  bridgeBuilding: () => aPosition().bridgeBuilding(),
  
  /**
   * Complete opposition training session
   */
  oppositionTraining: () => aTrainingSession().oppositionTraining(),
  
  /**
   * Quick single-position test session
   */
  quickTest: () => aTrainingSession().quickTest(),
} as const;