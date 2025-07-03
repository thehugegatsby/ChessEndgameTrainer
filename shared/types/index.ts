/**
 * Centralized type exports for the chess application
 * Import from here instead of individual files
 */

// Core chess types
export * from './chess';

// Analysis and evaluation types  
export * from './analysisTypes';
export * from './evaluation';

// Re-export for backwards compatibility
export type { Move } from './chess';