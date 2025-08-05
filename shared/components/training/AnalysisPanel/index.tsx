/**
 * @file Game analysis panel component
 * @module components/training/AnalysisPanel
 *
 * @description
 * Sliding panel component that displays comprehensive move-by-move analysis
 * of a completed chess game. Shows move quality, evaluations, and detailed
 * insights for training review. Currently uses simulated data for demo
 * purposes.
 *
 * @remarks
 * Key features:
 * - Sliding animation from bottom of screen
 * - Two-column layout: move list and detailed analysis
 * - Move quality classification (excellent/good/inaccuracy/mistake/blunder)
 * - Simulated evaluation data (to be replaced with real tablebase data)
 * - Dark mode support
 * - Responsive height based on constants
 *
 * The component is designed to work with the training interface,
 * providing post-game analysis for learning purposes.
 */

import React, { useState, useMemo } from "react";
import { Move } from "chess.js";
import { MoveAnalysis } from "./MoveAnalysis";
import { AnalysisDetails } from "./AnalysisDetails";
import { DIMENSIONS } from "@shared/constants";

/**
 * Props for the AnalysisPanel component
 *
 * @interface AnalysisPanelProps
 *
 * @property {Move[]} history - Array of moves played in the game
 * @property {string} [initialFen] - Starting position FEN (currently unused)
 * @property {() => void} onClose - Callback to close the panel
 * @property {boolean} isVisible - Controls panel visibility with animation
 */
interface AnalysisPanelProps {
  history: Move[];
  initialFen?: string;
  onClose: () => void;
  isVisible: boolean;
}

/**
 * Internal data structure for move analysis
 *
 * @interface MoveAnalysisData
 * @private
 *
 * @property {Move} move - The chess move object
 * @property {number} [evaluation] - Position evaluation after the move
 * @property {string} [bestMove] - Best move according to analysis
 * @property {string} [classification] - Quality classification of the move
 */
interface MoveAnalysisData {
  move: Move;
  evaluation?: number;
  bestMove?: string;
  classification?: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
}

/**
 * Game analysis panel component
 *
 * @component
 * @description
 * Provides a comprehensive post-game analysis interface that slides up from
 * the bottom of the screen. Displays move-by-move analysis with quality
 * indicators and detailed insights for each move.
 *
 * @remarks
 * Current implementation uses simulated data for demonstration.
 * In production, this would integrate with:
 * - TablebaseService for endgame evaluations
 * - Move quality analysis from the training session
 * - Actual best move suggestions from tablebase data
 *
 * The panel height is controlled by DIMENSIONS.ANALYSIS_PANEL_HEIGHT
 * for consistent layout across the application.
 *
 * @example
 * ```tsx
 * <AnalysisPanel
 *   history={gameHistory}
 *   onClose={() => setShowAnalysis(false)}
 *   isVisible={showAnalysis}
 * />
 * ```
 *
 * @param {AnalysisPanelProps} props - Component props
 * @returns {JSX.Element} Rendered analysis panel
 */
export const AnalysisPanel: React.FC<AnalysisPanelProps> = React.memo(
  ({ history, onClose, isVisible }) => {
    const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(
      null,
    );

    /**
     * Memoized analysis data generation
     *
     * @description
     * Generates simulated analysis data for each move in the history.
     * This is a placeholder implementation that creates realistic-looking
     * data for UI development and testing.
     *
     * @todo Replace with actual tablebase evaluation data
     */
    const analysisData = useMemo((): MoveAnalysisData[] => {
      return history.map((move, index): MoveAnalysisData => {
        /**
         * Simulate evaluation scores for demo purposes
         * @todo Replace with real tablebase evaluations
         */
        const baseEval = Math.sin(index * 0.5) * 2;
        const noise = (Math.random() - 0.5) * 0.5;
        const evaluation = baseEval + noise;

        /**
         * Classify moves based on simulated evaluation changes
         * @todo Replace with actual move quality analysis
         */
        let classification: MoveAnalysisData["classification"] = "good";
        if (index > 0) {
          const prevEval = Math.sin((index - 1) * 0.5) * 2;
          const evalChange = Math.abs(evaluation - prevEval);
          if (evalChange > 1.5) classification = "blunder";
          else if (evalChange > 1.0) classification = "mistake";
          else if (evalChange > 0.5) classification = "inaccuracy";
          else if (evalChange < 0.2) classification = "excellent";
        }

        return {
          move,
          evaluation,
          classification,
          bestMove: index % 3 === 0 ? "Nf3" : undefined, // @todo: Get from tablebase
        };
      });
    }, [history]);

    return (
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-lg border-t border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out z-50 ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: `${DIMENSIONS.ANALYSIS_PANEL_HEIGHT}px` }}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Spielanalyse
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({history.length} Züge)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Move Analysis List */}
          <MoveAnalysis
            analysisData={analysisData}
            selectedMoveIndex={selectedMoveIndex}
            onMoveSelect={setSelectedMoveIndex}
          />

          {/* Analysis Details */}
          <AnalysisDetails
            selectedMoveIndex={selectedMoveIndex}
            analysisData={analysisData}
          />
        </div>
      </div>
    );
  },
);

AnalysisPanel.displayName = "AnalysisPanel";
