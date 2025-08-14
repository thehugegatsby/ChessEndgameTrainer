/**
 * Display and device-related constants
 * Provides semantic constants for screen resolutions, display defaults, and device thresholds
 */

/**
 * Standard screen resolutions
 */
export const RESOLUTIONS = {
  FHD: {
    WIDTH_PX: 1920,
    HEIGHT_PX: 1080,
  },
} as const;

/**
 * Default display values for fallback when window/screen APIs are unavailable
 */
export const DISPLAY_DEFAULTS = {
  SCREEN_FALLBACK_WIDTH_PX: RESOLUTIONS.FHD.WIDTH_PX,
  SCREEN_FALLBACK_HEIGHT_PX: RESOLUTIONS.FHD.HEIGHT_PX,
} as const;

/**
 * Device classification thresholds
 */
export const DEVICE_THRESHOLDS = {
  TABLET_MIN_SHORT_EDGE_PX: 768,
} as const;