/**
 * Centralized type exports for the chess application
 * Import from here instead of individual files
 */

// Core chess types
export * from './chess';

// Analysis and evaluation types  
export * from './analysisTypes';
export * from './evaluation';

// Endgame types
export type { 
  EndgamePosition, 
  EndgameCategory, 
  EndgameChapter,
  EndgameSubcategory,
  TrainingSession,
  UserProgress,
  MobileAppConfig,
  TrainingAnalytics
} from '../data/endgames/types';

// Re-export for backwards compatibility
export type { Move } from './chess';