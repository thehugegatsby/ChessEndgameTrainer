/**
 * Utility functions for move quality formatting and display
 * 
 * Pure functions for UI representation of move quality results
 * Separated from business logic for better code organization
 * 
 * @module moveQualityFormatters
 */

import type { SimplifiedMoveQualityResult } from '../types/evaluation';

/**
 * Get emoji representation for move quality
 * 
 * @param quality - Move quality classification
 * @returns Emoji representing the quality
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
 * Get human-readable quality label
 * 
 * @param quality - Move quality classification
 * @returns Localized quality label
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
 * Format move quality result for tooltip display
 * 
 * @param result - Move quality analysis result
 * @returns Formatted string for tooltip
 */
export const formatQualityTooltip = (result: SimplifiedMoveQualityResult): string => {
  const emoji = getQualityEmoji(result.quality);
  const label = getQualityLabel(result.quality);
  
  return `${emoji} ${label}: ${result.reason}`;
};

