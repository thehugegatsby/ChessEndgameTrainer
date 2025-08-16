/**
 * Text Constants - String lengths and formatting
 * Centralized text-related constants
 */

/**
 * Title and text length constraints
 */
export const TEXT_LENGTHS = {
  /** Maximum length for main titles */
  TITLE_MAX_LENGTH: 30,

  /** Maximum length for subtitles */
  SUBTITLE_MAX_LENGTH: 27,

  /** Default text truncation length */
  DEFAULT_TRUNCATE: 100,

  /** Short text truncation */
  SHORT_TRUNCATE: 50,

  /** Long text truncation */
  LONG_TRUNCATE: 200,
} as const;
