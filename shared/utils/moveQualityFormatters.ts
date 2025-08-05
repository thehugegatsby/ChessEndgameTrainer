/**
 * @file Move quality formatting utilities
 * @module utils/moveQualityFormatters
 * 
 * @description
 * Pure utility functions for formatting and displaying move quality
 * analysis results in the UI. Provides consistent visual representation
 * of move quality through emojis, labels, and tooltips.
 * 
 * @remarks
 * Key features:
 * - Quality-to-emoji mapping for visual feedback
 * - Localized quality labels (currently English)
 * - Tooltip formatting for detailed move feedback
 * - Type-safe quality classifications
 * 
 * These formatters are separated from business logic to maintain
 * clean architecture and enable easy UI customization.
 */

import type { SimplifiedMoveQualityResult } from '../types/evaluation';

/**
 * Gets emoji representation for move quality
 * 
 * @param {SimplifiedMoveQualityResult['quality']} quality - Move quality classification
 * @returns {string} Emoji representing the quality
 * 
 * @description
 * Maps move quality classifications to intuitive emoji representations
 * for quick visual feedback in the UI.
 * 
 * @example
 * ```typescript
 * getQualityEmoji('excellent'); // '🏆'
 * getQualityEmoji('blunder');   // '💥'
 * getQualityEmoji('unknown');   // '❓'
 * ```
 * 
 * @remarks
 * Emoji mappings:
 * - excellent: 🏆 (trophy - best possible move)
 * - good: 👍 (thumbs up - solid move)
 * - inaccuracy: ⚠️ (warning - minor error)
 * - mistake: ❌ (cross - significant error)
 * - blunder: 💥 (explosion - critical error)
 * - unknown: ❓ (question - no evaluation available)
 */
export const getQualityEmoji = (quality: SimplifiedMoveQualityResult['quality']): string => {
  switch (quality) {
    case 'excellent':
      return '🏆';
    case 'good':
      return '👍';
    case 'inaccuracy':
      return '⚠️';
    case 'mistake':
      return '❌';
    case 'blunder':
      return '💥';
    case 'unknown':
    default:
      return '❓';
  }
};

/**
 * Gets human-readable quality label
 * 
 * @param {SimplifiedMoveQualityResult['quality']} quality - Move quality classification
 * @returns {string} Localized quality label
 * 
 * @description
 * Converts technical quality classifications into user-friendly
 * labels suitable for display in the UI.
 * 
 * @example
 * ```typescript
 * getQualityLabel('excellent'); // "Excellent"
 * getQualityLabel('blunder');   // "Blunder"
 * getQualityLabel('unknown');   // "Unknown"
 * ```
 * 
 * @remarks
 * Labels are currently in English. Future versions may support
 * localization based on user language preferences.
 */
export const getQualityLabel = (quality: SimplifiedMoveQualityResult['quality']): string => {
  switch (quality) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'inaccuracy':
      return 'Inaccuracy';
    case 'mistake':
      return 'Mistake';
    case 'blunder':
      return 'Blunder';
    case 'unknown':
    default:
      return 'Unknown';
  }
};

/**
 * Formats move quality result for tooltip display
 * 
 * @param {SimplifiedMoveQualityResult} result - Move quality analysis result
 * @returns {string} Formatted string for tooltip
 * 
 * @description
 * Creates a comprehensive tooltip string combining emoji, label,
 * and detailed reason for the quality assessment. Provides users
 * with complete feedback about their move quality.
 * 
 * @example
 * ```typescript
 * const result = {
 *   quality: 'mistake',
 *   reason: 'Loses material without compensation'
 * };
 * formatQualityTooltip(result);
 * // "❌ Mistake: Loses material without compensation"
 * ```
 * 
 * @remarks
 * The tooltip format is designed to be concise yet informative,
 * suitable for hover interactions without overwhelming the user.
 */
export const formatQualityTooltip = (result: SimplifiedMoveQualityResult): string => {
  const emoji = getQualityEmoji(result.quality);
  const label = getQualityLabel(result.quality);
  
  return `${emoji} ${label}: ${result.reason}`;
};

