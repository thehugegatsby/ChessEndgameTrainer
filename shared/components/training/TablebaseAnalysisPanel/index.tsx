/**
 * TablebaseAnalysisPanel - Tablebase analysis with move selection
 *
 * Displays tablebase evaluation and allows selecting moves to play on the board
 */

"use client";

import React from "react";
import { usePositionAnalysis } from "@shared/hooks/usePositionAnalysis";
import { TablebasePanel } from "@shared/components/tablebase/TablebasePanel";
import { useStore } from "@shared/store";

/**
 *
 */
interface TablebaseAnalysisPanelProps {
  fen: string;
  isVisible: boolean;
  previousFen?: string;
}

/**
 *
 * @param root0
 * @param root0.fen
 * @param root0.isVisible
 * @param root0.previousFen
 */
export /**
 *
 */
const TablebaseAnalysisPanel: React.FC<TablebaseAnalysisPanelProps> = ({
  fen,
  isVisible,
  previousFen,
}) => {
  const { lastEvaluation, isEvaluating } = usePositionAnalysis({
    fen,
    isEnabled: isVisible,
    previousFen,
  });

  const makeUserMove = useStore((state) => state.makeUserMove);

  /**
   *
   * @param moveSan
   */
  const handleMoveSelect = (moveSan: string) => {
    // The store action accepts SAN strings directly
    // MoveResultGroup passes move.san, which chess.js can parse
    makeUserMove(moveSan);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="tablebase-analysis-panel"
      data-testid="tablebase-analysis-panel"
    >
      <TablebasePanel
        tablebaseData={
          lastEvaluation?.tablebase || { isTablebasePosition: false }
        }
        onMoveSelect={handleMoveSelect}
        selectedMove={undefined}
        loading={isEvaluating}
        compact={false}
      />
    </div>
  );
};
