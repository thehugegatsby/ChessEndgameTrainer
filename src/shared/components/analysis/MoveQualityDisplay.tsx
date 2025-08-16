/**
 * @file Move quality display component
 * @module components/analysis/MoveQualityDisplay
 *
 * @description
 * Pure presentation component for displaying chess move quality assessment results.
 * Focuses exclusively on rendering without any data fetching or business logic,
 * following clean architecture principles with clear separation of concerns.
 *
 * @remarks
 * Key features:
 * - Pure presentation component (no side effects)
 * - Handles all display states (loading, error, success, empty)
 * - Emoji-based quality indicators for intuitive feedback
 * - Tooltip support for detailed quality explanations
 * - Error handling with retry functionality
 * - Consistent styling with move components
 * - Accessible design with proper hover states
 *
 * This component is designed to be reusable across different contexts
 * where move quality needs to be displayed, maintaining consistency
 * in the user interface while allowing flexible data sources.
 */

import React from 'react';
import type { SimplifiedMoveQualityResult } from '../../types/evaluation';
import { getQualityEmoji, formatQualityTooltip } from '../../utils/moveQualityFormatters';

/**
 * Props for the MoveQualityDisplay component
 *
 * @interface MoveQualityDisplayProps
 *
 * @property {SimplifiedMoveQualityResult | null} quality - Move quality result to display, null if no result
 * @property {boolean} [isLoading] - Whether analysis is currently in progress (shows loading indicator)
 * @property {Error | null} [error] - Error from analysis process if analysis failed
 * @property {() => void} [onRetry] - Callback function when user clicks to retry failed analysis
 */
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
 * @component
 * @description
 * Displays chess move quality assessment with emoji indicators and tooltips.
 * Handles all possible display states including loading, error, success, and
 * empty states. Designed as a pure presentation component without side effects.
 *
 * @remarks
 * Display states:
 * - Loading: Shows ⏳ with "Analyzing move..." tooltip
 * - Error: Shows ❗️ with error message and retry functionality
 * - Success: Shows quality emoji (🏆, 👍, ⚠️, ❌, 💥) with detailed tooltip
 * - Empty: Returns null (no display)
 *
 * Quality indicators:
 * - 🏆 Excellent move (best choice)
 * - 👍 Good move (solid choice)
 * - ⚠️ Inaccuracy (minor error)
 * - ❌ Mistake (significant error)
 * - 💥 Blunder (critical error)
 *
 * The component uses utility functions for consistent emoji mapping
 * and tooltip formatting across the application.
 *
 * @example
 * ```tsx
 * // Basic usage with quality result
 * <MoveQualityDisplay quality={qualityResult} />
 *
 * // With loading state
 * <MoveQualityDisplay
 *   quality={null}
 *   isLoading={true}
 * />
 *
 * // With error handling
 * <MoveQualityDisplay
 *   quality={null}
 *   error={analysisError}
 *   onRetry={() => retryAnalysis()}
 * />
 *
 * // In move list component
 * {moves.map(move => (
 *   <div key={move.index}>
 *     <span>{move.san}</span>
 *     <MoveQualityDisplay
 *       quality={move.quality}
 *       isLoading={move.analyzing}
 *       error={move.error}
 *       onRetry={() => reanalyzeMove(move.index)}
 *     />
 *   </div>
 * ))}
 * ```
 *
 * @param {MoveQualityDisplayProps} props - Component configuration
 * @returns {JSX.Element | null} Quality indicator or null if no display needed
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
      <span className="ml-1 text-xs" title="Analyzing move...">
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
      <span className="ml-1 text-xs cursor-help" title={formatQualityTooltip(quality)}>
        {getQualityEmoji(quality.quality)}
      </span>
    );
  }

  // No result (empty state)
  return null;
};

MoveQualityDisplay.displayName = 'MoveQualityDisplay';
