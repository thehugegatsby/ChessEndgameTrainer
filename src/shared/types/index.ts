/**
 * @file Centralized type exports for the Chess Endgame Trainer application
 * @module types/index
 *
 * @description
 * Central entry point for all TypeScript type definitions used throughout
 * the Chess Endgame Trainer application. Provides organized re-exports
 * of types from various modules for consistent importing and better
 * maintainability.
 *
 * @remarks
 * Type categories:
 * - Chess types: Core chess logic types (moves, positions, pieces)
 * - Analysis types: Position analysis and evaluation types
 * - Evaluation types: Move quality and scoring types
 * - Endgame types: Training scenario and position types
 * - Tablebase types: Lichess API integration types
 *
 * Import from this module instead of individual type files to maintain
 * consistent imports and benefit from centralized type management.
 *
 * @example
 * ```typescript
 * import { Move, PositionAnalysis, EndgamePosition } from '@shared/types';
 * ```
 */

// Core chess types
export * from "./chess";

// Analysis and evaluation types
export * from "./analysisTypes";
export * from "./evaluation";

// Endgame types
export * from "./endgame";

// Tablebase types (specific exports to avoid conflicts)
export type {
  LichessTablebaseResponse,
  LichessMove,
  TablebaseCategory,
  TablebaseEntry,
  PositionEvaluation,
  TablebaseMoveInternal,
  TablebaseCacheEntry,
  TablebaseMove,
} from "./tablebase";
export * from "./tablebaseSchemas";

// Re-export for backwards compatibility
export type { Move } from "./chess";
