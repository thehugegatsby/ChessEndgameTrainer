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

interface TablebaseAnalysisPanelProps {
  fen: string;
  isVisible: boolean;
  previousFen?: string;
}

export const TablebaseAnalysisPanel: React.FC<TablebaseAnalysisPanelProps> = ({
  fen,
  isVisible,
  previousFen,
}) => {
  const { lastEvaluation, isEvaluating } = usePositionAnalysis({
    fen,
    isEnabled: isVisible,
    previousFen,
  });

  const makeMove = useStore((state) => state.makeMove);

  const handleMoveSelect = (moveUci: string) => {
    // Parse UCI move format (e.g., "a1a8" or "e7e8q")
    const from = moveUci.slice(0, 2);
    const to = moveUci.slice(2, 4);
    const promotion = moveUci.length > 4 ? moveUci.slice(4) : undefined;

    // Make the move using the store action
    makeMove({ from, to, promotion });
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
