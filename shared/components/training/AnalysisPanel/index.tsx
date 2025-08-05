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

import React, { useState, useEffect } from "react";
import { Move } from "chess.js";
import { Chess } from "chess.js";
import { MoveAnalysis } from "./MoveAnalysis";
import { AnalysisDetails } from "./AnalysisDetails";
import { DIMENSIONS } from "@shared/constants";
import { tablebaseService } from "@shared/services/TablebaseService";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("AnalysisPanel");

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
  ({ history, initialFen, onClose, isVisible }) => {
    const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(
      null,
    );
    const [analysisData, setAnalysisData] = useState<MoveAnalysisData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Load analysis data from tablebase for all positions
     */
    useEffect(() => {
      if (!isVisible || history.length === 0) return;

      const loadAnalysisData = async () => {
        setIsLoading(true);
        try {
          // Reconstruct all FENs from move history
          const startFen = initialFen || "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1";
          const chess = new Chess(startFen);
          const positions: string[] = [startFen];

          // Apply each move to get FEN after each move
          for (const move of history) {
            chess.move(move);
            positions.push(chess.fen());
          }

          // Fetch tablebase analysis for all positions in parallel
          const analysisPromises = history.map(async (move, index) => {
            const fenBefore = positions[index];
            const fenAfter = positions[index + 1];

            const [evalBefore, evalAfter, topMoves] = await Promise.all([
              tablebaseService.getEvaluation(fenBefore),
              tablebaseService.getEvaluation(fenAfter),
              tablebaseService.getTopMoves(fenBefore, 1),
            ]);

            // Calculate move quality based on WDL change
            let classification: MoveAnalysisData["classification"] = "good";
            if (
              evalBefore.isAvailable &&
              evalAfter.isAvailable &&
              evalBefore.result &&
              evalAfter.result
            ) {
              const wdlBefore = evalBefore.result.wdl;
              const wdlAfter = evalAfter.result.wdl;
              const wdlChange = wdlBefore - wdlAfter; // From player's perspective

              if (wdlChange >= 2)
                classification = "blunder"; // Win to loss
              else if (wdlChange >= 1)
                classification = "mistake"; // Win to draw or draw to loss
              else if (wdlChange > 0)
                classification = "inaccuracy"; // Small loss
              else if (wdlChange === 0)
                classification = "excellent"; // Maintained evaluation
              else classification = "good"; // Improved position
            }

            return {
              move,
              evaluation:
                evalAfter.isAvailable && evalAfter.result
                  ? evalAfter.result.wdl
                  : 0,
              classification,
              bestMove:
                topMoves.isAvailable &&
                topMoves.moves &&
                topMoves.moves.length > 0
                  ? topMoves.moves[0].san
                  : undefined,
            };
          });

          const results = await Promise.all(analysisPromises);
          setAnalysisData(results);
        } catch (error) {
          logger.error("Failed to load analysis data:", error);
          // Fallback to empty analysis
          setAnalysisData(
            history.map((move) => ({
              move,
              evaluation: 0,
              classification: "good" as const,
              bestMove: undefined,
            })),
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadAnalysisData();
    }, [history, initialFen, isVisible]);

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
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Lade Analyse...
                </p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  },
);

AnalysisPanel.displayName = "AnalysisPanel";
