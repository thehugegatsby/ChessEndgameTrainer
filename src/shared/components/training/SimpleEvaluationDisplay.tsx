/**
 * @file Simple evaluation display component
 * @module components/training/SimpleEvaluationDisplay
 * 
 * @description
 * Minimal component for displaying tablebase move evaluations without
 * complex UI elements. Focuses on showing essential move information
 * in a clean, straightforward format suitable for basic analysis needs.
 * 
 * @remarks
 * Key features:
 * - Minimal, clean interface design
 * - Tablebase-only move display (engine support removed)
 * - Conditional rendering based on visibility prop
 * - Integration with usePositionAnalysis hook
 * - Client-side rendering for interactive features
 * - Responsive design for various screen sizes
 * 
 * The component serves as a lightweight alternative to more complex
 * analysis panels when only basic move evaluation is needed.
 */

"use client";

import React from "react";
import { usePositionAnalysis } from "@shared/hooks/usePositionAnalysis";
import { formatDtzDisplay } from "@shared/utils/tablebase/resultClassification";

/**
 * Props for the SimpleEvaluationDisplay component
 * 
 * @interface SimpleEvaluationDisplayProps
 * 
 * @property {string} fen - FEN string of the position to analyze
 * @property {boolean} [isVisible=true] - Whether the component should be visible and active
 */
interface SimpleEvaluationDisplayProps {
  fen: string;
  isVisible?: boolean;
}

/**
 * Simple evaluation display component
 * 
 * @component
 * @description
 * Displays tablebase move evaluations in a minimal, clean format.
 * Focuses on essential information without complex UI elements or
 * overwhelming details. Perfect for basic analysis or learning scenarios.
 * 
 * @remarks
 * Component behavior:
 * - Fetches position analysis using the provided FEN
 * - Conditionally renders based on visibility prop
 * - Shows only tablebase moves (engine analysis removed)
 * - Uses clean, simple styling for easy readability
 * - Automatically handles loading and error states
 * 
 * The component is designed to be lightweight and performant,
 * making it suitable for situations where minimal UI overhead
 * is preferred over feature-rich analysis displays.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SimpleEvaluationDisplay fen={currentPosition} />
 * 
 * // With visibility control
 * <SimpleEvaluationDisplay
 *   fen={analysisPosition}
 *   isVisible={showAnalysis}
 * />
 * 
 * // In a training interface
 * <div className="analysis-section">
 *   <SimpleEvaluationDisplay
 *     fen={gameState.currentFen}
 *     isVisible={!gameState.isPlaying}
 *   />
 * </div>
 * ```
 * 
 * @param {SimpleEvaluationDisplayProps} props - Component configuration
 * @returns {JSX.Element | null} Rendered evaluation display or null if not visible
 */
export const SimpleEvaluationDisplay: React.FC<
  SimpleEvaluationDisplayProps
> = ({ fen, isVisible = true }) => {
  const { lastEvaluation } = usePositionAnalysis({
    fen,
    isEnabled: isVisible,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div className="simple-evaluation-display p-4 space-y-4" data-testid="evaluation-display">
      {/* Tablebase Moves Only - Engine removed */}
      <div>
        <div className="text-sm font-bold mb-2">📚 Tablebase</div>
        {lastEvaluation?.tablebase?.topMoves &&
        lastEvaluation.tablebase.topMoves.length > 0 ? (
          <div className="space-y-1">
            {lastEvaluation.tablebase.topMoves
              .slice(0, 3)
              .map((move, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-mono">{move.san}</span>
                  <span className="text-sm">{formatDtzDisplay(move.dtz)}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-sm">Keine Tablebase-Daten</div>
        )}
      </div>
    </div>
  );
};
