/**
 * @file Analysis Panel types
 * @module components/training/AnalysisPanel/types
 *
 * @description
 * Centralized type definitions for the Analysis Panel component system.
 * Prevents duplicate interface definitions across multiple files.
 */

import type { Move } from 'chess.js';

/**
 * Move analysis data interface
 *
 * @interface MoveAnalysisData
 * @property {Move} move - The chess move object
 * @property {number} [evaluation] - Position evaluation after the move (optional)
 * @property {string} [bestMove] - Best move according to analysis (optional)
 * @property {string} [classification] - Move quality classification (optional)
 */
export interface MoveAnalysisData {
  move: Move;
  evaluation?: number;
  bestMove?: string;
  classification?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}
