/**
 * @file Move quality indicator component
 * @module components/analysis/MoveQualityIndicator
 * 
 * @description
 * Isolated component for displaying move quality assessment indicators.
 * Each instance manages its own state independently to avoid shared state
 * issues and provides clean separation of concerns with minimal UI footprint.
 * 
 * @remarks
 * Key features:
 * - Independent state management per move
 * - Real-time move quality analysis using tablebase data
 * - Visual quality indicators with emoji feedback
 * - Tooltip support for detailed quality explanations
 * - Error handling with graceful degradation
 * - Clean architecture with isolated responsibilities
 * - Optimized performance with per-move analysis
 * 
 * The component integrates with the move quality analysis system to provide
 * immediate feedback on chess move quality without affecting other moves.
 */

import React from "react";
import { useMoveQuality } from "../../hooks/useMoveQuality";
import {
  getQualityEmoji,
  formatQualityTooltip,
} from "../../utils/moveQualityFormatters";
import { getLogger } from "../../services/logging/Logger";
import { ErrorService } from "../../services/ErrorService";

const logger = getLogger().setContext("MoveQualityIndicator");

/**
 * Props for the MoveQualityIndicator component
 * 
 * @interface MoveQualityIndicatorProps
 * 
 * @property {number} moveIndex - Index of the move in the game history
 * @property {string} moveSan - Move in Standard Algebraic Notation (e.g., "Nf3")
 * @property {'w' | 'b'} player - Player who made the move (white or black)
 * @property {(moveIndex: number) => string} getFenBefore - Function to get FEN position before the move
 */
interface MoveQualityIndicatorProps {
  /** Index of the move in the game history */
  moveIndex: number;
  /** Move in SAN notation */
  moveSan: string;
  /** Player who made the move */
  player: "w" | "b";
  /** Function to get FEN before the move */
  getFenBefore: (moveIndex: number) => string;
}

/**
 * Move quality indicator component
 * 
 * @component
 * @description
 * Displays a visual indicator for chess move quality assessment.
 * Each instance independently analyzes and displays the quality of a specific
 * move using tablebase data, providing immediate feedback to users about
 * their move choices.
 * 
 * @remarks
 * Component behavior:
 * - Analyzes move quality using useMoveQuality hook
 * - Displays emoji indicators for quality levels (🏆, 👍, ⚠️, ❌, 💥)
 * - Shows tooltips with detailed quality explanations
 * - Handles loading states during analysis
 * - Gracefully handles errors with fallback display
 * - Each instance maintains independent state
 * 
 * Quality levels:
 * - Excellent: 🏆 (best possible move)
 * - Good: 👍 (solid move)
 * - Inaccuracy: ⚠️ (minor error)
 * - Mistake: ❌ (significant error)
 * - Blunder: 💥 (critical error)
 * 
 * The component integrates seamlessly with move lists and provides
 * non-intrusive visual feedback about move quality.
 * 
 * @example
 * ```tsx
 * // Basic usage in move list
 * <MoveQualityIndicator
 *   moveIndex={0}
 *   moveSan="e4"
 *   player="w"
 *   getFenBefore={(index) => gameHistory[index].fenBefore}
 * />
 * 
 * // In a move panel component
 * {moveHistory.map((move, index) => (
 *   <div key={index} className="move-item">
 *     <span>{move.san}</span>
 *     <MoveQualityIndicator
 *       moveIndex={index}
 *       moveSan={move.san}
 *       player={move.color}
 *       getFenBefore={getFenBeforeMove}
 *     />
 *   </div>
 * ))}
 * ```
 * 
 * @param {MoveQualityIndicatorProps} props - Component configuration
 * @returns {JSX.Element} Move quality indicator with emoji feedback
 */
export const MoveQualityIndicator: React.FC<MoveQualityIndicatorProps> = ({
  moveIndex,
  moveSan,
  player,
  getFenBefore,
}) => {
  const { data, isLoading, error, assessMove } = useMoveQuality();

  /**
   * Handle move assessment
   */
  const handleAssess = React.useCallback(async () => {
    try {
      const fenBefore = getFenBefore(moveIndex);
      logger.debug(`Assessing move ${moveSan} at index ${moveIndex}`, {
        fenBefore,
        player,
      });
      await assessMove(fenBefore, moveSan, player);
    } catch (err) {
      // Check if this is just a cancelled assessment (not a real error)
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.message?.includes("Assessment cancelled") || 
          error.message?.includes("aborted")) {
        // This is normal when a new assessment starts - just log debug
        logger.debug("Assessment cancelled - this is normal behavior");
      } else {
        // Only log real errors
        ErrorService.handleUIError(
          error,
          "MoveQualityIndicator",
          {
            action: "assess-move",
            additionalData: {
              moveIndex,
              moveSan,
              player,
            },
          },
        );
      }
    }
  }, [moveIndex, moveSan, player, getFenBefore, assessMove]);

  // Automatically assess move on mount
  React.useEffect(() => {
    // Only assess if we haven't already and not currently loading
    if (!data && !isLoading && !error) {
      handleAssess();
    }
  }, [data, isLoading, error, handleAssess]);

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
        onClick={handleAssess}
        className="ml-1 text-xs hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
        title={`Error: ${error.message}. Click to retry.`}
      >
        ❗️
      </button>
    );
  }

  // Result state
  if (data) {
    return (
      <span
        className="ml-1 text-xs cursor-help"
        title={formatQualityTooltip(data)}
      >
        {getQualityEmoji(data.quality)}
      </span>
    );
  }

  // Initial state
  return (
    <button
      onClick={handleAssess}
      className="ml-1 text-xs hover:text-blue-400 transition-colors opacity-60 hover:opacity-100"
      title="Assess move quality"
    >
      🔍
    </button>
  );
};

MoveQualityIndicator.displayName = "MoveQualityIndicator";
