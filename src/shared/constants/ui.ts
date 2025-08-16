/**
 * UI-specific constants
 * @module constants/ui
 *
 * @description
 * Constants for UI interactions, animations, and display settings
 */

/**
 * Animation duration constants in milliseconds
 */
export const ANIMATION_DURATIONS = {
  INSTANT: 0,
  QUICK: 100,
  SHORT: 200,
  MEDIUM: 300,
  STANDARD: 400,
  LONG: 500,
  SLOW: 800,
  EXTRA_SLOW: 1000,
  TOAST_SHORT: 2000,
  TOAST_STANDARD: 2500,
  TOAST_LONG: 4000,
  TOAST_ERROR: 5000,
  TOAST_SUCCESS: 6000,
} as const;

/**
 * UI delay and debounce constants
 */
export const UI_DELAYS = {
  DEBOUNCE_QUICK: 150,
  DEBOUNCE_STANDARD: 300,
  DEBOUNCE_SEARCH: 500,
  THROTTLE_SCROLL: 100,
  THROTTLE_RESIZE: 200,
  HOVER_DELAY: 50,
  TOOLTIP_DELAY: 500,
  DROPDOWN_CLOSE_DELAY: 200,
} as const;

/**
 * Display thresholds and limits
 */
export const UI_LIMITS = {
  MAX_TOASTS: 3,
  MAX_NOTIFICATIONS: 5,
  MAX_HINTS: 3,
  MAX_RETRIES: 3,
  MAX_HISTORY_ITEMS: 100,
  MAX_UNDO_STACK: 50,
  MAX_LOG_ENTRIES: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_USERNAME_LENGTH: 30,
  MAX_TITLE_LENGTH: 27,
} as const;

/**
 * Z-index layers for proper stacking
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  OVERLAY: 300,
  MODAL: 400,
  POPOVER: 500,
  TOOLTIP: 600,
  TOAST: 700,
  NOTIFICATION: 800,
  CRITICAL: 900,
  MAX: 999,
} as const;

/**
 * Opacity values for consistent transparency
 */
export const OPACITY = {
  TRANSPARENT: 0,
  FAINT: 0.1,
  LIGHT: 0.3,
  MEDIUM: 0.5,
  HEAVY: 0.8,
  OPAQUE: 1,
} as const;

/**
 * Screen breakpoints for responsive design
 */
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
  ULTRA_WIDE: 1920,
} as const;

/**
 * Default dimensions
 */
export const DEFAULT_DIMENSIONS = {
  AVATAR_SIZE: 36,
  ICON_SIZE: 24,
  BUTTON_HEIGHT: 40,
  INPUT_HEIGHT: 36,
  MODAL_WIDTH: 500,
  SIDEBAR_WIDTH: 250,
  HEADER_HEIGHT: 60,
  FOOTER_HEIGHT: 40,
  DEFAULT_WIDTH: 1920,
  DEFAULT_HEIGHT: 1080,
} as const;
