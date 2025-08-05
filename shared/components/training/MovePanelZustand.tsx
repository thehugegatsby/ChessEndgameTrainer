/**
 * @file Move panel component using Zustand store
 * @module components/training/MovePanelZustand
 * 
 * @description
 * Move history display panel that integrates directly with the Zustand store
 * for state management. Shows chess moves in standard notation with optional
 * evaluations and move quality indicators. Supports interactive move navigation
 * for game review.
 * 
 * @remarks
 * Key features:
 * - Direct Zustand store integration for move history
 * - Two-column layout (white/black moves)
 * - Move quality indicators with visual feedback
 * - Optional evaluation display
 * - Interactive move selection for navigation
 * - E2E testing support with data attributes
 * - Dark theme optimized design
 * 
 * The component efficiently handles the offset between move indices
 * and evaluation indices (evaluations array has one extra initial entry).
 */

import React, { useMemo } from "react";
import type { ValidatedMove } from "@shared/types/chess";
import {
  getSmartMoveEvaluation,
  type MoveEvaluation,
} from "../../utils/chess/evaluationHelpers";
import { useStore } from "@shared/store/rootStore";
import { TEST_IDS, getTestId } from "@shared/constants/testIds";
import { MoveQualityIndicator } from "../analysis/MoveQualityIndicator";

/**
 * Props for the MovePanelZustand component
 * 
 * @interface MovePanelZustandProps
 * 
 * @property {boolean} [showEvaluations=false] - Whether to display numerical evaluations
 * @property {(moveIndex: number) => void} [onMoveClick] - Callback when a move is clicked
 * @property {number} [currentMoveIndex=-1] - Index of the currently selected move
 */
interface MovePanelZustandProps {
  showEvaluations?: boolean;
  onMoveClick?: (moveIndex: number) => void;
  currentMoveIndex?: number;
}

/**
 * Internal structure for organizing moves into pairs
 * 
 * @interface MovePair
 * @private
 * 
 * @property {number} moveNumber - Full move number (1, 2, 3...)
 * @property {ValidatedMove} whiteMove - White's move for this pair
 * @property {ValidatedMove} [blackMove] - Black's move (may be undefined for last move)
 * @property {MoveEvaluation} [whiteEval] - Evaluation after white's move
 * @property {MoveEvaluation} [blackEval] - Evaluation after black's move
 */
interface MovePair {
  moveNumber: number;
  whiteMove: ValidatedMove;
  blackMove?: ValidatedMove;
  whiteEval?: MoveEvaluation;
  blackEval?: MoveEvaluation;
}

/**
 * Move panel component with Zustand store integration
 * 
 * @component
 * @description
 * Displays the move history in a traditional chess notation format with
 * two columns (white and black moves). Retrieves data directly from the
 * Zustand store, eliminating the need for prop drilling. Supports move
 * quality indicators and optional evaluation display.
 * 
 * @remarks
 * The component handles the complexity of evaluation array indexing:
 * - moveHistory[0] = first move
 * - evaluations[0] = initial position
 * - evaluations[1] = position after first move
 * 
 * This offset is critical for correctly displaying evaluations alongside moves.
 * 
 * @example
 * ```tsx
 * <MovePanelZustand
 *   showEvaluations={true}
 *   onMoveClick={(index) => navigateToMove(index)}
 *   currentMoveIndex={5}
 * />
 * ```
 * 
 * @param {MovePanelZustandProps} props - Component configuration
 * @returns {JSX.Element} Rendered move panel
 */
export const MovePanelZustand: React.FC<MovePanelZustandProps> = React.memo(
  ({ showEvaluations = false, onMoveClick, currentMoveIndex = -1 }) => {
    // Get data from Zustand store
    const { moveHistory, evaluations } = useStore((state) => ({
      moveHistory: state.moveHistory,
      evaluations: state.evaluations,
    }));

    /**
     * Helper to get FEN position before a specific move
     * 
     * @private
     * @param {number} moveIndex - Index of the move in history
     * @returns {string} FEN string before the move was played
     * 
     * @description
     * Retrieves the board position FEN before a move was made.
     * Used by MoveQualityIndicator to analyze move quality.
     * Returns initial position FEN for invalid indices.
     */
    const getFenBeforeMove = (moveIndex: number): string => {
      // moveHistory contains ValidatedMove objects with 'before' and 'after' FEN fields
      if (moveIndex < 0 || moveIndex >= moveHistory.length) {
        return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      }

      const move = moveHistory[moveIndex];
      // Each ValidatedMove has a 'fenBefore' field with the FEN before the move
      return move.fenBefore;
    };

    /**
     * Memoized calculation of move pairs for display
     * 
     * @description
     * Organizes the linear move history into white/black pairs for
     * traditional chess notation display. Handles the evaluation array
     * offset correctly to match evaluations with their corresponding moves.
     * 
     * @remarks
     * Critical offset handling:
     * - evaluations[0] = initial position
     * - evaluations[i+1] = position after moveHistory[i]
     * 
     * This ensures evaluations are correctly paired with moves.
     */
    const movePairs = useMemo((): MovePair[] => {
      const pairs: MovePair[] = [];
      for (let i = 0; i < moveHistory.length; i += 2) {
        const whiteMove = moveHistory[i];
        const blackMove = moveHistory[i + 1];
        // CRITICAL: evaluations array has one extra entry at the beginning (initial position)
        // So we need to offset by 1 to get the evaluation AFTER each move
        const whiteEval = evaluations[i + 1]; // +1 offset for evaluation after move
        const blackEval = evaluations[i + 2]; // +2 for evaluation after black's move

        pairs.push({
          moveNumber: Math.floor(i / 2) + 1,
          whiteMove,
          blackMove,
          whiteEval,
          blackEval,
        });
      }
      return pairs;
    }, [moveHistory, evaluations]);

    const hasContent = movePairs.length > 0 || currentMoveIndex === 0;
    const showE2ESignals = process.env.NEXT_PUBLIC_E2E_SIGNALS === "true";

    if (moveHistory.length === 0) {
      return (
        <div
          className="text-gray-400"
          data-testid={TEST_IDS.MOVE_PANEL.CONTAINER}
          data-move-count={moveHistory.length}
          {...(showE2ESignals && {
            "data-component-ready": hasContent ? "true" : "false",
          })}
        >
          Noch keine Züge gespielt
        </div>
      );
    }

    return (
      <div
        className="space-y-1"
        data-testid={TEST_IDS.MOVE_PANEL.CONTAINER}
        data-move-count={moveHistory.length}
        {...(showE2ESignals && {
          "data-component-ready": hasContent ? "true" : "false",
        })}
      >
        {movePairs.map((pair) => (
          <div
            key={pair.moveNumber}
            className="flex items-center gap-4 py-1 hover:bg-gray-800 rounded px-2"
          >
            {/* Move Number */}
            <span className="text-sm text-gray-400 w-6 text-center font-mono">
              {pair.moveNumber}.
            </span>

            {/* White Move with evaluation */}
            <div className="flex items-center gap-1 min-w-[80px] justify-center">
              <button
                onClick={() => onMoveClick?.((pair.moveNumber - 1) * 2)}
                className={`font-mono text-sm hover:text-blue-400 px-1 py-0.5 rounded transition-colors ${
                  currentMoveIndex === (pair.moveNumber - 1) * 2
                    ? "text-blue-400 bg-blue-900/30"
                    : "text-white"
                }`}
                data-testid={getTestId(
                  TEST_IDS.MOVE_PANEL.ITEM,
                  (pair.moveNumber - 1) * 2,
                )}
                data-move-number={(pair.moveNumber - 1) * 2 + 1}
              >
                {pair.whiteMove.san}
              </button>
              <MoveQualityIndicator
                moveIndex={(pair.moveNumber - 1) * 2}
                moveSan={pair.whiteMove.san}
                player="w"
                getFenBefore={getFenBeforeMove}
              />
              {showEvaluations &&
                pair.whiteEval &&
                (() => {
                  const evalDisplay = getSmartMoveEvaluation(
                    pair.whiteEval,
                    true,
                    (pair.moveNumber - 1) * 2,
                  );
                  return (
                    <span
                      className={`text-xs px-1 py-0.5 rounded ${evalDisplay.className}`}
                      data-testid={TEST_IDS.MOVE_PANEL.EVALUATION}
                    >
                      <span data-testid={TEST_IDS.MOVE_PANEL.EVAL_SCORE}>
                        {evalDisplay.text}
                      </span>
                    </span>
                  );
                })()}
            </div>

            {/* Black Move with evaluation - always reserve space */}
            <div className="flex items-center gap-1 min-w-[80px] justify-center">
              {pair.blackMove ? (
                <>
                  <button
                    onClick={() => onMoveClick?.((pair.moveNumber - 1) * 2 + 1)}
                    className={`font-mono text-sm hover:text-blue-400 px-1 py-0.5 rounded transition-colors ${
                      currentMoveIndex === (pair.moveNumber - 1) * 2 + 1
                        ? "text-blue-400 bg-blue-900/30"
                        : "text-white"
                    }`}
                    data-testid={getTestId(
                      TEST_IDS.MOVE_PANEL.ITEM,
                      (pair.moveNumber - 1) * 2 + 1,
                    )}
                    data-move-number={(pair.moveNumber - 1) * 2 + 2}
                  >
                    {pair.blackMove.san}
                  </button>
                  <MoveQualityIndicator
                    moveIndex={(pair.moveNumber - 1) * 2 + 1}
                    moveSan={pair.blackMove.san}
                    player="b"
                    getFenBefore={getFenBeforeMove}
                  />
                  {showEvaluations &&
                    pair.blackEval &&
                    (() => {
                      const evalDisplay = getSmartMoveEvaluation(
                        pair.blackEval,
                        false,
                        (pair.moveNumber - 1) * 2 + 1,
                      );
                      return (
                        <span
                          className={`text-xs px-1 py-0.5 rounded ${evalDisplay.className}`}
                          data-testid={TEST_IDS.MOVE_PANEL.EVALUATION}
                        >
                          <span data-testid={TEST_IDS.MOVE_PANEL.EVAL_SCORE}>
                            {evalDisplay.text}
                          </span>
                        </span>
                      );
                    })()}
                </>
              ) : (
                // Empty placeholder to reserve space
                <div className="w-full h-6"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  },
);

MovePanelZustand.displayName = "MovePanelZustand";
