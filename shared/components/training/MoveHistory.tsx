/**
 * @file Move history display component
 * @module components/training/MoveHistory
 * 
 * @description
 * Displays chess move history in a traditional two-column format with
 * optional evaluations. Shows moves in algebraic notation with visual
 * styling and supports both engine and tablebase evaluations.
 * 
 * @remarks
 * Key features:
 * - Two-column layout (white/black moves) with move numbering
 * - Optional evaluation display with color coding
 * - Tablebase evaluation support with emoji indicators
 * - Scrollable container with maximum height constraints
 * - Hover effects and responsive design
 * - Empty state messaging for no moves
 * - German language interface
 * 
 * The component handles both engine evaluations (centipawn values) and
 * tablebase evaluations (win/draw/loss categories) with appropriate
 * visual indicators and color coding.
 */

import React from "react";
import { Move } from "chess.js";
import { UI_CONSTANTS } from "@shared/constants/uiConstants";

/**
 * Evaluation data structure for move analysis
 * 
 * @interface EvaluationData
 * 
 * @property {number} evaluation - Engine evaluation in centipawns
 * @property {number} [mateInMoves] - Mate in X moves (positive for white advantage)
 * @property {object} [tablebase] - Tablebase evaluation data
 * @property {boolean} tablebase.isTablebasePosition - Whether position is in tablebase
 * @property {'win' | 'loss' | 'draw'} [tablebase.category] - Result category
 * @property {number} [tablebase.wdl] - Win/Draw/Loss numeric value
 * @property {number} [tablebase.dtm] - Distance to mate in plies
 */
interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: {
    isTablebasePosition: boolean;
    category?: "win" | "loss" | "draw";
    wdl?: number;
    dtm?: number;
  };
}

/**
 * Props for the MoveHistory component
 * 
 * @interface MoveHistoryProps
 * 
 * @property {Move[]} moves - Array of chess moves in chess.js format
 * @property {boolean} [showEvaluations=false] - Whether to display evaluations
 * @property {EvaluationData[]} [evaluations] - Optional evaluation data for each move
 */
interface MoveHistoryProps {
  moves: Move[];
  showEvaluations?: boolean;
  evaluations?: EvaluationData[];
}

/**
 * Move history display component
 * 
 * @component
 * @description
 * Renders chess move history in a traditional chess scorecard format.
 * Displays moves in two columns (white and black) with move numbers,
 * and optionally shows position evaluations with color-coded indicators.
 * 
 * @remarks
 * Component features:
 * - Traditional chess notation display (1. e4 e5 2. Nf3 Nc6)
 * - Tablebase integration with emoji indicators (🏆 Win, ❌ Loss, ⚖️ Draw)
 * - Engine evaluation display with centipawn values
 * - Mate-in-X detection and display
 * - Color-coded evaluation feedback
 * - Responsive design with scrollable content
 * - Hover effects for better user interaction
 * 
 * Evaluation priority:
 * 1. Tablebase evaluations (exact results)
 * 2. Mate-in-X evaluations
 * 3. Standard engine evaluations (centipawns)
 * 
 * @example
 * ```tsx
 * // Basic move history without evaluations
 * <MoveHistory moves={gameHistory} />
 * 
 * // With evaluation display
 * <MoveHistory
 *   moves={gameHistory}
 *   showEvaluations={true}
 *   evaluations={positionEvaluations}
 * />
 * 
 * // In a game interface
 * <div className="game-sidebar">
 *   <MoveHistory
 *     moves={currentGame.moves}
 *     showEvaluations={showAnalysis}
 *     evaluations={analysisData}
 *   />
 * </div>
 * ```
 * 
 * @param {MoveHistoryProps} props - Move history configuration
 * @returns {JSX.Element} Rendered move history component
 */
export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  showEvaluations = false,
  evaluations = [],
}) => {
  // Erstelle Zugpaare mit korrekter sofortiger Positionierung
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];

    movePairs.push({
      number: moveNumber,
      white: whiteMove,
      black: blackMove,
      whiteEval: evaluations[i],
      blackEval: evaluations[i + 1],
    });
  }

  const formatEvaluation = (evalData?: {
    evaluation: number;
    mateInMoves?: number;
    tablebase?: {
      isTablebasePosition: boolean;
      category?: "win" | "loss" | "draw";
      wdl?: number;
      dtm?: number;
    };
  }) => {
    if (!evalData) return "";

    // Tablebase evaluation with emojis
    if (evalData.tablebase?.isTablebasePosition) {
      const { category, wdl, dtm } = evalData.tablebase;
      let emoji = "";
      let text = "";

      if (category) {
        switch (category) {
          case "win":
            emoji = "🏆";
            text = dtm ? `W${dtm}` : "Win";
            break;
          case "loss":
            emoji = "❌";
            text = dtm ? `L${dtm}` : "Loss";
            break;
          case "draw":
            emoji = "⚖️";
            text = "Draw";
            break;
        }
      } else if (wdl !== undefined) {
        if (wdl === 2) {
          emoji = "🏆";
          text = dtm ? `W${dtm}` : "Win";
        } else if (wdl === -2) {
          emoji = "❌";
          text = dtm ? `L${dtm}` : "Loss";
        } else {
          emoji = "⚖️";
          text = "Draw";
        }
      }

      return `${emoji} ${text}`;
    }

    if (evalData.mateInMoves !== undefined) {
      return `#${Math.abs(evalData.mateInMoves)}`;
    }

    const eval_ = evalData.evaluation;
    if (Math.abs(eval_) < 0.1) return "0.0";
    return eval_ > 0 ? `+${eval_.toFixed(1)}` : eval_.toFixed(1);
  };

  const getEvaluationColor = (evalData?: {
    evaluation: number;
    mateInMoves?: number;
    tablebase?: {
      isTablebasePosition: boolean;
      category?: "win" | "loss" | "draw";
      wdl?: number;
    };
  }) => {
    if (!evalData) return "";

    // Tablebase evaluation colors
    if (evalData.tablebase?.isTablebasePosition) {
      const { category, wdl } = evalData.tablebase;

      if (category) {
        switch (category) {
          case "win":
            return "text-green-700";
          case "loss":
            return "text-red-700";
          case "draw":
            return "text-yellow-600";
        }
      } else if (wdl !== undefined) {
        if (wdl === 2) return "text-green-700";
        if (wdl === -2) return "text-red-700";
        return "text-yellow-600";
      }
    }

    if (evalData.mateInMoves !== undefined) {
      return evalData.mateInMoves > 0 ? "text-green-700" : "text-red-700";
    }

    const eval_ = evalData.evaluation;
    if (eval_ > 2) return "text-green-700";
    if (eval_ > 0.5) return "text-green-600";
    if (eval_ > -0.5) return "text-gray-600";
    if (eval_ > -2) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg h-full overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📋</span>
          <span>Züge{showEvaluations ? " & Bewertungen" : ""}</span>
        </h2>
      </div>

      <div className="p-3">
        {moves.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <span className="text-xl">🎯</span>
            </div>
            <p className="text-gray-500 text-base italic">
              Noch keine Züge gespielt
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Ziehe eine Figur um zu beginnen
            </p>
          </div>
        ) : (
          <div
            className="overflow-y-auto"
            style={{ maxHeight: UI_CONSTANTS.MOVE_HISTORY.MAX_HEIGHT }}
          >
            <div className="space-y-0.5">
              {movePairs.map((pair) => (
                <div
                  key={pair.number}
                  className="group flex items-center py-1.5 px-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-transparent hover:border-blue-100"
                >
                  <span className="font-bold text-emerald-600 w-6 text-right text-sm">
                    {pair.number}.
                  </span>
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Weißer Zug - links */}
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <span className="font-mono text-sm text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded group-hover:bg-white transition-colors truncate w-full text-center">
                          {pair.white.san}
                        </span>
                        {showEvaluations && (
                          <span
                            className={`text-xs font-mono ${getEvaluationColor(pair.whiteEval)} mt-0.5`}
                          >
                            {formatEvaluation(pair.whiteEval)}
                          </span>
                        )}
                      </div>

                      {/* Schwarzer Zug - rechts */}
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        {pair.black ? (
                          <>
                            <span className="font-mono text-sm text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded group-hover:bg-white transition-colors truncate w-full text-center">
                              {pair.black.san}
                            </span>
                            {showEvaluations && (
                              <span
                                className={`text-xs font-mono ${getEvaluationColor(pair.blackEval)} mt-0.5`}
                              >
                                {formatEvaluation(pair.blackEval)}
                              </span>
                            )}
                          </>
                        ) : (
                          // Empty placeholder to maintain consistent spacing
                          <div className="h-6"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
