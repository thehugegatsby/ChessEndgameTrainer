/**
 * MoveQualityDisplay - Pure presentation component for move quality
 * 
 * Displays move quality assessment results without any data fetching logic
 * Following clean architecture with clear separation of concerns
 * 
 * @module MoveQualityDisplay
 */

import React from 'react';
import type { SimplifiedMoveQualityResult } from '../../types/evaluation';
import { getQualityEmoji, formatQualityTooltip } from '../../utils/moveQualityFormatters';

interface MoveQualityDisplayProps {
  /** Move quality result to display */
  quality: SimplifiedMoveQualityResult | null;
  /** Whether analysis is in progress */
  isLoading?: boolean;
  /** Error from analysis */
  error?: Error | null;
  /** Callback when user clicks to retry analysis */
  onRetry?: () => void;
}

/**
 * Pure presentation component for move quality display
 * 
 * Shows quality emoji and tooltip based on analysis result
 * Handles loading, error, and empty states
 */
export const MoveQualityDisplay: React.FC<MoveQualityDisplayProps> = ({
  quality,
  isLoading = false,
  error,
  onRetry,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <span 
        className="ml-1 text-xs" 
        title="Analyzing move..."
      >
        ⏳
      </span>
    );
  }

  // Error state
  if (error) {
    return (
      <button
        onClick={onRetry}
        className="ml-1 text-xs hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
        title={`Error: ${error.message}. Click to retry.`}
      >
        ❗️
      </button>
    );
  }

  // Result state
  if (quality) {
    return (
      <span 
        className="ml-1 text-xs cursor-help" 
        title={formatQualityTooltip(quality)}
      >
        {getQualityEmoji(quality.quality)}
      </span>
    );
  }

  // No result (empty state)
  return null;
};

MoveQualityDisplay.displayName = 'MoveQualityDisplay';