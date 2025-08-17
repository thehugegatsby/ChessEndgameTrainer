/**
 * @file Game Domain - Public API
 * @description Chess game logic domain exports
 * 
 * This domain handles core chess game mechanics including:
 * - Chess engine abstraction (chess.js wrapper)
 * - Position and move management
 * - Game state and flow control
 * - German chess notation support
 */

// Chess Engine (chess.js abstraction)
export { ChessEngine } from './engine/ChessEngine';
export type { ChessEngineInterface, MoveInput, GamePosition } from './engine/types';

// Game Services (business logic)
// TODO: Implement during service extraction phase
// export { PositionService } from './services/PositionService';
// export { MoveService } from './services/MoveService';
// export { GameStateService } from './services/GameStateService';

// Game Store (Zustand slice)
// TODO: Refactor existing GameSlice to use services
// export { gameSlice } from './store/gameSlice';
// export { gameSelectors } from './store/selectors';

// Game Utilities
// TODO: Migrate from /shared/utils/chess/
// export * from './utils/fenUtils';
// export * from './utils/moveUtils';
// export * from './utils/localization';

// Placeholder exports to prevent TypeScript errors during development
export const GAME_DOMAIN_VERSION = '0.1.0-alpha';
export const GAME_DOMAIN_STATUS = 'under_construction';