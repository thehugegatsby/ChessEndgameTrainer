/**
 * @file animation.constants.ts
 * @brief Defines constants related to UI animations and transitions in the chess endgame trainer.
 *
 * These constants govern piece animations, UI transitions, and easing functions,
 * providing a consistent and customizable animation experience across the application.
 */

/**
 * Constants for chess piece animations on the board.
 * These values define how pieces move, capture, and transform during gameplay.
 */
export const PIECE_ANIMATION = {
  /**
   * Duration for standard piece movement animation in milliseconds.
   * Applied when pieces move from one square to another.
   */
  MOVE_DURATION_MS: 300,

  /**
   * Duration for piece capture animation in milliseconds.
   * May include additional effects like fading out the captured piece.
   */
  CAPTURE_DURATION_MS: 400,

  /**
   * Duration for pawn promotion animation in milliseconds.
   * Applied when a pawn reaches the opposite end of the board.
   */
  PROMOTION_DURATION_MS: 500,

  /**
   * Delay before starting a piece animation in milliseconds.
   * Useful for sequencing multiple animations.
   */
  ANIMATION_DELAY_MS: 50,

  /**
   * Duration for highlighting squares (e.g., showing legal moves) in milliseconds.
   */
  HIGHLIGHT_DURATION_MS: 200,

  /**
   * Duration for the piece drag preview animation in milliseconds.
   */
  DRAG_PREVIEW_DURATION_MS: 150,
} as const;

/**
 * Constants for general UI transitions and panel animations.
 * These values control how UI elements appear, disappear, and transition.
 */
export const UI_TRANSITIONS = {
  /**
   * Duration for panel slide animations in milliseconds.
   * Applied when sidebars, drawers, or panels slide in/out.
   */
  PANEL_SLIDE_DURATION_MS: 250,

  /**
   * Duration for modal fade in/out animations in milliseconds.
   * Applied to dialog boxes, overlays, and modal windows.
   */
  MODAL_FADE_DURATION_MS: 200,

  /**
   * Duration for toast notification animations in milliseconds.
   * Applied when toast messages appear and disappear.
   */
  TOAST_ANIMATION_DURATION_MS: 300,

  /**
   * Duration for tooltip fade animations in milliseconds.
   * Applied when tooltips appear on hover.
   */
  TOOLTIP_FADE_DURATION_MS: 150,

  /**
   * Duration for button hover/active state transitions in milliseconds.
   */
  BUTTON_TRANSITION_DURATION_MS: 150,

  /**
   * Duration for tab switching animations in milliseconds.
   */
  TAB_SWITCH_DURATION_MS: 200,

  /**
   * Duration for accordion expand/collapse animations in milliseconds.
   */
  ACCORDION_DURATION_MS: 250,

  /**
   * Duration for progress bar fill animations in milliseconds.
   */
  PROGRESS_BAR_DURATION_MS: 500,
} as const;

/**
 * Standard easing functions for animations.
 * These CSS-compatible strings define the acceleration curves for transitions.
 */
export const EASING_FUNCTIONS = {
  /**
   * Linear easing - constant speed throughout the animation.
   */
  LINEAR: "linear",

  /**
   * Ease-in - starts slowly and accelerates.
   */
  EASE_IN: "ease-in",

  /**
   * Ease-out - starts quickly and decelerates.
   */
  EASE_OUT: "ease-out",

  /**
   * Ease-in-out - starts slowly, accelerates in the middle, then decelerates.
   * Standard for most UI transitions.
   */
  EASE_IN_OUT: "ease-in-out",

  /**
   * Custom cubic bezier for smooth, natural-feeling animations.
   * Similar to Material Design's standard curve.
   */
  SMOOTH: "cubic-bezier(0.4, 0.0, 0.2, 1)",

  /**
   * Custom cubic bezier for snappy, responsive animations.
   * Good for small UI elements that need to feel quick.
   */
  SNAPPY: "cubic-bezier(0.4, 0.0, 0.6, 1)",

  /**
   * Custom cubic bezier for elastic/bounce effects.
   * Use sparingly for emphasis or playful interactions.
   */
  ELASTIC: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",

  /**
   * Custom cubic bezier for deceleration emphasis.
   * Good for elements entering the viewport.
   */
  DECELERATE: "cubic-bezier(0.0, 0.0, 0.2, 1)",

  /**
   * Custom cubic bezier for acceleration emphasis.
   * Good for elements leaving the viewport.
   */
  ACCELERATE: "cubic-bezier(0.4, 0.0, 1, 1)",
} as const;

/**
 * Animation delays and stagger configurations.
 * Used for orchestrating multiple animations in sequence.
 */
export const ANIMATION_DELAYS = {
  /**
   * Delay between staggered list item animations in milliseconds.
   */
  STAGGER_DELAY_MS: 50,

  /**
   * Delay before showing loading spinners in milliseconds.
   * Prevents spinner flash for quick operations.
   */
  LOADING_SPINNER_DELAY_MS: 200,

  /**
   * Delay before auto-hiding success messages in milliseconds.
   */
  SUCCESS_MESSAGE_AUTO_HIDE_DELAY_MS: 3000,

  /**
   * Delay before auto-hiding error messages in milliseconds.
   * Longer than success to ensure users see errors.
   */
  ERROR_MESSAGE_AUTO_HIDE_DELAY_MS: 5000,

  /**
   * Debounce delay for search input animations in milliseconds.
   */
  SEARCH_DEBOUNCE_DELAY_MS: 300,

  /**
   * Delay before showing hover effects in milliseconds.
   * Prevents accidental triggers.
   */
  HOVER_INTENT_DELAY_MS: 100,
} as const;