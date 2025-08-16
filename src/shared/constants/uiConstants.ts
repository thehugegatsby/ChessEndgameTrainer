export const UI_CONSTANTS = {
  // Component-specific UI constants organized by component
  PRINCIPAL_VARIATION: {
    MAX_MOVES_DISPLAY: 10, // Maximum moves shown in PV component
    TRUNCATION_THRESHOLD: 8, // When to show "..." indicator
  },

  NAVIGATION: {
    ICON_SIZE: 20, // Standard icon size in pixels
    TOUCH_TARGET_SIZE: 44, // Minimum touch target (accessibility)
  },

  TRAINING_CONTROLS: {
    MOBILE_MARGIN_TOP: 'mt-16', // Mobile top margin (Tailwind class)
    MOBILE_SPACING: 'space-y-2', // Mobile component spacing
    DESKTOP_SPACING: 'space-y-3', // Desktop component spacing
  },

  MOVE_HISTORY: {
    MAX_HEIGHT: '600px', // Maximum height before scrolling
    SCROLL_THRESHOLD: '400px', // Height threshold for scroll indicators
  },

  // Shared UI constants
  SHARED: {
    BORDER_RADIUS: '8px', // Standard border radius
    ANIMATION_DURATION: '150ms', // Standard transition duration
    Z_INDEX_MODAL: 1000, // Modal overlay z-index
    Z_INDEX_TOOLTIP: 1010, // Tooltip z-index
  },

  // Responsive breakpoints (for future use)
  BREAKPOINTS: {
    MOBILE_MAX: '768px',
    TABLET_MAX: '1024px',
    DESKTOP_MIN: '1025px',
  },

  // Human-readable descriptions
  DESCRIPTIONS: {
    PV_MOVES: 'Principal variation move display limits for mobile optimization',
    ICONS: 'Standard icon sizing for consistent visual hierarchy',
    SPACING: 'Component spacing following 8px grid system',
    SCROLL: 'Scroll container limits for optimal UX',
  },
} as const;

// Type definitions for TypeScript strict mode
export type UIConstantsType = typeof UI_CONSTANTS;
export type ComponentConstants = keyof UIConstantsType;
