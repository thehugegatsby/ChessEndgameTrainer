/**
 * @fileoverview UI and display-related constants for layout and styling
 * @module constants/ui
 *
 * @description
 * Centralizes UI constants including animations, breakpoints, device thresholds,
 * display defaults, and layout dimensions. Merged from multiple UI constant files.
 *
 * @remarks
 * All constants use `as const` assertion for type safety and immutability.
 * Constants are grouped by logical UI domain for easy discovery and maintenance.
 */

/**
 * Standard screen resolutions
 * Merged from src/constants/display.constants.ts
 */
export const RESOLUTIONS = {
  FHD: {
    WIDTH_PX: 1920,
    HEIGHT_PX: 1080,
  },
} as const;

/**
 * Default display values for fallback when window/screen APIs are unavailable
 * Merged from src/constants/display.constants.ts
 */
export const DISPLAY_DEFAULTS = {
  SCREEN_FALLBACK_WIDTH_PX: RESOLUTIONS.FHD.WIDTH_PX,
  SCREEN_FALLBACK_HEIGHT_PX: RESOLUTIONS.FHD.HEIGHT_PX,
} as const;

/**
 * Device classification thresholds
 * Merged from src/constants/display.constants.ts
 */
export const DEVICE_THRESHOLDS = {
  TABLET_MIN_SHORT_EDGE_PX: 768,
} as const;

/**
 * UI layout constants
 * Merged from src/shared/constants/ui-layout.constants.ts
 */
export const UI_LAYOUT = {
  /**
   * Standard spacing units for consistent layout
   */
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },

  /**
   * Border radius values for consistent styling
   */
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    ROUND: 9999, // Fully rounded
  },

  /**
   * Z-index values for consistent layering
   */
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1010,
    FIXED: 1020,
    MODAL_BACKDROP: 1030,
    MODAL: 1040,
    POPOVER: 1050,
    TOOLTIP: 1060,
    TOAST: 1070,
  },

  /**
   * Common component dimensions
   */
  DIMENSIONS: {
    BUTTON_HEIGHT: 40,
    INPUT_HEIGHT: 40,
    NAVBAR_HEIGHT: 64,
    SIDEBAR_WIDTH: 280,
    SIDEBAR_WIDTH_COLLAPSED: 80,
  },
} as const;

/**
 * Animation duration constants
 * Merged from src/shared/constants/animation.constants.ts
 */
export const ANIMATIONS = {
  /**
   * Duration constants for consistent animations
   */
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
  },

  /**
   * Easing functions for smooth animations
   */
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    SPRING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  /**
   * Transform values for common animations
   */
  TRANSFORM: {
    SCALE_UP: 'scale(1.05)',
    SCALE_DOWN: 'scale(0.95)',
    TRANSLATE_UP: 'translateY(-10px)',
    TRANSLATE_DOWN: 'translateY(10px)',
  },
} as const;

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  /**
   * Mobile devices (up to 640px)
   */
  MOBILE: 640,

  /**
   * Tablet devices (641px to 1024px)
   */
  TABLET: 1024,

  /**
   * Desktop devices (1025px and up)
   */
  DESKTOP: 1280,

  /**
   * Large desktop devices (1281px and up)
   */
  LARGE_DESKTOP: 1920,
} as const;

/**
 * Touch target sizes for accessibility
 */
export const TOUCH_TARGETS = {
  /**
   * Minimum touch target size (44px)
   * WCAG 2.1 AA requirement
   */
  MIN_SIZE: 44,

  /**
   * Recommended touch target size (48px)
   * Better for usability
   */
  RECOMMENDED_SIZE: 48,

  /**
   * Large touch target size (56px)
   * For primary actions
   */
  LARGE_SIZE: 56,
} as const;

/**
 * Color system constants
 */
export const COLORS = {
  /**
   * Semantic color names
   */
  SEMANTIC: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
  },

  /**
   * Neutral color scale
   */
  NEUTRAL: {
    WHITE: '#ffffff',
    BLACK: '#000000',
    TRANSPARENT: 'transparent',
  },
} as const;

/**
 * Typography scale constants
 */
export const TYPOGRAPHY = {
  /**
   * Font size scale
   */
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    BASE: 16,
    LG: 18,
    XL: 20,
    '2XL': 24,
    '3XL': 30,
    '4XL': 36,
  },

  /**
   * Font weight scale
   */
  FONT_WEIGHT: {
    THIN: 100,
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800,
    BLACK: 900,
  },

  /**
   * Line height scale
   */
  LINE_HEIGHT: {
    TIGHT: 1.25,
    SNUG: 1.375,
    NORMAL: 1.5,
    RELAXED: 1.625,
    LOOSE: 2,
  },
} as const;

/**
 * Type exports for strict typing
 */
export type ResolutionsConstants = typeof RESOLUTIONS;
export type DisplayDefaultsConstants = typeof DISPLAY_DEFAULTS;
export type DeviceThresholdsConstants = typeof DEVICE_THRESHOLDS;
export type UiLayoutConstants = typeof UI_LAYOUT;
export type AnimationsConstants = typeof ANIMATIONS;
export type BreakpointsConstants = typeof BREAKPOINTS;
export type TouchTargetsConstants = typeof TOUCH_TARGETS;
export type ColorsConstants = typeof COLORS;
export type TypographyConstants = typeof TYPOGRAPHY;