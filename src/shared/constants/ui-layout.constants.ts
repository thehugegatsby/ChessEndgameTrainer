/**
 * @fileoverview UI layout and styling constants
 * @module constants/ui-layout
 *
 * @description
 * Centralized UI constants for consistent styling across the application.
 * Includes Tailwind class combinations, component dimensions, and layout values.
 * Designed for optimal LLM readability with semantic naming.
 */

/**
 * Loading spinner configuration
 *
 * @description
 * Consistent spinner styling across the application.
 * Uses Tailwind classes with semantic grouping.
 */
export const SPINNER = {
  /**
   * Spinner size classes
   */
  SIZE: {
    SMALL: 'h-8 w-8',
    MEDIUM: 'h-12 w-12',
    LARGE: 'h-16 w-16',
    XLARGE: 'h-20 w-20',
  },

  /**
   * Spinner border width
   */
  BORDER: {
    THIN: 'border-b-2',
    MEDIUM: 'border-b-4',
    THICK: 'border-b-6',
  },

  /**
   * Spinner colors
   */
  COLOR: {
    PRIMARY: 'border-blue-600',
    SECONDARY: 'border-gray-600',
    SUCCESS: 'border-green-600',
    ERROR: 'border-red-600',
  },

  /**
   * Animation classes
   */
  ANIMATION: 'animate-spin rounded-full',
} as const;

/**
 * Page layout configuration
 *
 * @description
 * Standard page layouts and container configurations.
 */
export const PAGE_LAYOUT = {
  /**
   * Full screen centered layout
   */
  CENTERED_SCREEN: 'flex items-center justify-center min-h-screen',

  /**
   * Background color schemes
   */
  BACKGROUND: {
    LIGHT: 'bg-gray-50',
    DARK: 'dark:bg-gray-900',
    COMBINED: 'bg-gray-50 dark:bg-gray-900',
  },

  /**
   * Container widths
   */
  CONTAINER: {
    NARROW: 'max-w-2xl',
    MEDIUM: 'max-w-4xl',
    WIDE: 'max-w-6xl',
    FULL: 'max-w-full',
  },

  /**
   * Padding presets
   */
  PADDING: {
    NONE: 'p-0',
    SMALL: 'p-2',
    MEDIUM: 'p-4',
    LARGE: 'p-8',
    XLARGE: 'p-12',
  },
} as const;

/**
 * Typography configuration
 *
 * @description
 * Text styling constants for consistent typography.
 */
export const TYPOGRAPHY = {
  /**
   * Text sizes (Tailwind classes)
   */
  SIZE: {
    XS: 'text-xs',
    SM: 'text-sm',
    BASE: 'text-base',
    LG: 'text-lg',
    XL: 'text-xl',
    XXL: 'text-2xl',
    XXXL: 'text-3xl',
  },

  /**
   * Font weights
   */
  WEIGHT: {
    NORMAL: 'font-normal',
    MEDIUM: 'font-medium',
    SEMIBOLD: 'font-semibold',
    BOLD: 'font-bold',
  },

  /**
   * Text colors
   */
  COLOR: {
    PRIMARY: 'text-gray-900 dark:text-gray-100',
    SECONDARY: 'text-gray-700 dark:text-gray-300',
    MUTED: 'text-gray-500 dark:text-gray-400',
    ERROR: 'text-red-600 dark:text-red-400',
    SUCCESS: 'text-green-600 dark:text-green-400',
  },
} as const;

/**
 * Spacing configuration
 *
 * @description
 * Consistent spacing values for margins and gaps.
 */
export const SPACING = {
  /**
   * Margin bottom values
   */
  MARGIN_BOTTOM: {
    NONE: 'mb-0',
    XS: 'mb-1',
    SM: 'mb-2',
    MD: 'mb-4',
    LG: 'mb-6',
    XL: 'mb-8',
  },

  /**
   * Margin top values
   */
  MARGIN_TOP: {
    NONE: 'mt-0',
    XS: 'mt-1',
    SM: 'mt-2',
    MD: 'mt-4',
    LG: 'mt-6',
    XL: 'mt-8',
  },

  /**
   * Gap values for flex/grid
   */
  GAP: {
    NONE: 'gap-0',
    XS: 'gap-1',
    SM: 'gap-2',
    MD: 'gap-4',
    LG: 'gap-6',
    XL: 'gap-8',
  },
} as const;

/**
 * Component dimensions
 *
 * @description
 * Standard dimensions for UI components in pixels.
 */
export const COMPONENT_DIMENSIONS = {
  /**
   * Button heights
   */
  BUTTON_HEIGHT: {
    SMALL: 32,
    MEDIUM: 40,
    LARGE: 48,
  },

  /**
   * Icon sizes
   */
  ICON_SIZE: {
    SMALL: 16,
    MEDIUM: 20,
    LARGE: 24,
    XLARGE: 32,
  },

  /**
   * Touch target minimum size (accessibility)
   */
  TOUCH_TARGET_MIN: 44,

  /**
   * Board sizes for chess display
   */
  BOARD_SIZE: {
    SMALL: 300,
    MEDIUM: 400,
    LARGE: 600,
    TRAINING: 800,
  },
} as const;

/**
 * Responsive breakpoints
 *
 * @description
 * Standard breakpoints for responsive design.
 * Matches common device sizes and framework conventions.
 */
export const BREAKPOINTS = {
  /**
   * Mobile devices (< 640px)
   */
  MOBILE: {
    MAX: 640,
    NAME: 'mobile' as const,
  },

  /**
   * Tablet devices (641px - 1024px)
   */
  TABLET: {
    MIN: 641,
    MAX: 1024,
    TYPICAL: 768,
    NAME: 'tablet' as const,
  },

  /**
   * Desktop devices (1025px - 1920px)
   */
  DESKTOP: {
    MIN: 1025,
    MAX: 1920,
    TYPICAL: 1280,
    NAME: 'desktop' as const,
  },

  /**
   * Wide desktop (> 1920px)
   */
  WIDE: {
    MIN: 1921,
    NAME: 'wide' as const,
  },

  /**
   * Common viewport sizes for testing
   */
  VIEWPORT: {
    MOBILE_PORTRAIT: { width: 375, height: 667 },
    MOBILE_LANDSCAPE: { width: 667, height: 375 },
    TABLET_PORTRAIT: { width: 768, height: 1024 },
    TABLET_LANDSCAPE: { width: 1024, height: 768 },
    DESKTOP_HD: { width: 1920, height: 1080 },
    DESKTOP_STANDARD: { width: 1280, height: 720 },
  },
} as const;

/**
 * Z-index layering system
 *
 * @description
 * Consistent z-index values for proper element stacking.
 * Higher values appear on top.
 */
export const Z_INDEX = {
  /**
   * Base level elements
   */
  BASE: 0,

  /**
   * Dropdown menus
   */
  DROPDOWN: 50,

  /**
   * Sticky elements
   */
  STICKY: 100,

  /**
   * Fixed headers
   */
  FIXED: 200,

  /**
   * Overlay/backdrop
   */
  OVERLAY: 300,

  /**
   * Modal dialogs
   */
  MODAL: 400,

  /**
   * Popover/tooltip
   */
  POPOVER: 500,

  /**
   * Toast notifications
   */
  TOAST: 600,

  /**
   * Maximum z-index
   */
  MAX: 9999,
} as const;

/**
 * Border radius presets
 *
 * @description
 * Consistent border radius values for rounded corners.
 */
export const BORDER_RADIUS = {
  NONE: 'rounded-none',
  SMALL: 'rounded-sm',
  MEDIUM: 'rounded-md',
  LARGE: 'rounded-lg',
  XLARGE: 'rounded-xl',
  FULL: 'rounded-full',
} as const;

/**
 * Shadow presets
 *
 * @description
 * Box shadow configurations for depth and elevation.
 */
export const SHADOWS = {
  NONE: 'shadow-none',
  SMALL: 'shadow-sm',
  MEDIUM: 'shadow-md',
  LARGE: 'shadow-lg',
  XLARGE: 'shadow-xl',
  INNER: 'shadow-inner',
} as const;

/**
 * Type exports for strict typing
 */
export type SpinnerConstants = typeof SPINNER;
export type PageLayoutConstants = typeof PAGE_LAYOUT;
export type TypographyConstants = typeof TYPOGRAPHY;
export type SpacingConstants = typeof SPACING;
export type ComponentDimensionConstants = typeof COMPONENT_DIMENSIONS;
export type ZIndexConstants = typeof Z_INDEX;
export type BorderRadiusConstants = typeof BORDER_RADIUS;
export type ShadowConstants = typeof SHADOWS;
