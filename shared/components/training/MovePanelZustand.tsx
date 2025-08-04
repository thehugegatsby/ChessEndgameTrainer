import React, { useMemo } from "react";
import { Move } from "chess.js";
import {
  getSmartMoveEvaluation,
  type MoveEvaluation,
} from "../../utils/chess/evaluationHelpers";
import { useEndgameState } from "@shared/store/store";
import { TEST_IDS, getTestId } from "@shared/constants/testIds";
import { MoveQualityIndicator } from "../analysis/MoveQualityIndicator";

/**
 *
 */
interface MovePanelZustandProps {
  showEvaluations?: boolean;
  onMoveClick?: (moveIndex: number) => void;
  currentMoveIndex?: number;
}

/**
 *
 */
interface MovePair {
  moveNumber: number;
  whiteMove: Move;
  blackMove?: Move;
  whiteEval?: MoveEvaluation;
  blackEval?: MoveEvaluation;
}

/**
 * MovePanel component that uses Zustand store for state management
 * Gets moves and evaluations directly from the global store
 */
export /**
 *
 */
const MovePanelZustand: React.FC<MovePanelZustandProps> = React.memo(
  ({ showEvaluations = false, onMoveClick, currentMoveIndex = -1 }) => {
    // Get data from Zustand store
    const { moveHistory, evaluations } = useEndgameState();

    // Helper to get FEN before a move
    /**
     *
     * @param moveIndex
     */
    const getFenBeforeMove = (moveIndex: number): string => {
      // moveHistory contains ValidatedMove objects with 'before' and 'after' FEN fields
      if (moveIndex < 0 || moveIndex >= moveHistory.length) {
        return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      }

      const move = moveHistory[moveIndex];
      // Each ValidatedMove has a 'before' field with the FEN before the move
      return move.before;
    };

    // Memoize move pairs calculation for performance
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
