/**
 * Utility functions for move quality formatting and display
 * 
 * Pure functions for UI representation of move quality results
 * Separated from business logic for better code organization
 * 
 * @module moveQualityFormatters
 */

import type { MoveQualityResult } from '../types/evaluation';

/**
 * Get CSS color class for move quality
 * 
 * @param quality - Move quality classification
 * @returns Tailwind CSS class for quality color
 */
export const getQualityColor = (quality: MoveQualityResult['quality']): string => {
  switch (quality) {
    case 'excellent':
      return 'text-green-500';
    case 'good':
      return 'text-blue-500';
    case 'inaccuracy':
      return 'text-yellow-500';
    case 'mistake':
      return 'text-orange-500';
    case 'blunder':
      return 'text-red-500';
    case 'unknown':
    default:
      return 'text-gray-400';
  }
};

/**
 * Get background color class for move quality
 * 
 * @param quality - Move quality classification
 * @returns Tailwind CSS class for quality background
 */
export const getQualityBgColor = (quality: MoveQualityResult['quality']): string => {
  switch (quality) {
    case 'excellent':
      return 'bg-green-100 dark:bg-green-900';
    case 'good':
      return 'bg-blue-100 dark:bg-blue-900';
    case 'inaccuracy':
      return 'bg-yellow-100 dark:bg-yellow-900';
    case 'mistake':
      return 'bg-orange-100 dark:bg-orange-900';
    case 'blunder':
      return 'bg-red-100 dark:bg-red-900';
    case 'unknown':
    default:
      return 'bg-gray-100 dark:bg-gray-800';
  }
};

/**
 * Get emoji representation for move quality
 * 
 * @param quality - Move quality classification
 * @returns Emoji representing the quality
 */
export const getQualityEmoji = (quality: MoveQualityResult['quality']): string => {
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
export const getQualityLabel = (quality: MoveQualityResult['quality']): string => {
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
export const formatQualityTooltip = (result: MoveQualityResult): string => {
  const emoji = getQualityEmoji(result.quality);
  const label = getQualityLabel(result.quality);
  
  return `${emoji} ${label}: ${result.reason}`;
};

/**
 * Get quality score for sorting purposes
 * 
 * @param quality - Move quality classification
 * @returns Numeric score (higher = better quality)
 */
export const getQualityScore = (quality: MoveQualityResult['quality']): number => {
  switch (quality) {
    case 'excellent':
      return 5;
    case 'good':
      return 4;
    case 'inaccuracy':
      return 3;
    case 'mistake':
      return 2;
    case 'blunder':
      return 1;
    case 'unknown':
    default:
      return 0;
  }
};