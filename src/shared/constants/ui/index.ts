/**
 * @fileoverview UI constants barrel export
 * @module constants/ui
 */

export * from './ui.constants';
export * from '../animation.constants';

// Import for creating consolidated exports
import { ANIMATIONS, UI_LAYOUT } from './ui.constants';
import { 
  PIECE_ANIMATION,
  UI_TRANSITIONS, 
  EASING_FUNCTIONS,
  ANIMATION_DELAYS 
} from '../animation.constants';

// Create consolidated exports for backward compatibility
export const ANIMATION = {
  ...ANIMATIONS,
  PIECE: PIECE_ANIMATION,
  TRANSITIONS: UI_TRANSITIONS,
  EASING: EASING_FUNCTIONS,
  DELAYS: ANIMATION_DELAYS,
  ERROR_TOAST_DURATION: 3000, // Add missing constant
} as const;
export const DIMENSIONS = UI_LAYOUT.DIMENSIONS;
export const UI = {
  LAYOUT: UI_LAYOUT,
  ANIMATIONS: ANIMATIONS,
  COLORS: {
    SEMANTIC: {
      PRIMARY: 'primary',
      SECONDARY: 'secondary',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      INFO: 'info',
    },
  },
} as const;