/**
 * MoveQualityIndicator - Isolated move quality assessment component
 *
 * Each instance manages its own state to avoid shared state issues
 * Provides clean separation of concerns and reusability
 *
 * @module MoveQualityIndicator
 */

import React from "react";
import { useMoveQuality } from "../../hooks/useMoveQuality";
import {
  getQualityEmoji,
  formatQualityTooltip,
} from "../../utils/moveQualityFormatters";

/**
 *
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
 * Isolated component for move quality assessment
 *
 * Each instance has its own state and can display results independently
 * Follows clean architecture with minimal UI footprint
 * @param root0
 * @param root0.moveIndex
 * @param root0.moveSan
 * @param root0.player
 * @param root0.getFenBefore
 */
export /**
 *
 */
const MoveQualityIndicator: React.FC<MoveQualityIndicatorProps> = ({
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
      console.log(
        `[MoveQualityIndicator] Assessing move ${moveSan} at index ${moveIndex}`,
        {
          fenBefore,
          player,
        },
      );
      await assessMove(fenBefore, moveSan, player);
    } catch (err) {
      console.error(
        `[MoveQualityIndicator] Assessment for move ${moveSan} failed:`,
        {
          error: err,
          moveIndex,
          player,
          message: err instanceof Error ? err.message : "Unknown error",
        },
      );
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
