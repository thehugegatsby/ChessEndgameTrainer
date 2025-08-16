/**
 * @file Tablebase analysis panel with interactive move selection
 * @module components/training/TablebaseAnalysisPanel
 *
 * @description
 * Integration component that connects the tablebase analysis display with
 * the game state. Provides an interactive interface for exploring tablebase
 * moves and directly playing them on the board. Acts as a bridge between
 * the analysis UI and the Zustand store.
 *
 * @remarks
 * Key features:
 * - Real-time position analysis using tablebase API
 * - Interactive move selection that updates the game state
 * - Loading state management during API calls
 * - Conditional rendering based on visibility
 * - Integration with usePositionAnalysis hook for data fetching
 * - Direct store integration for move execution
 *
 * This component handles the complexity of coordinating between the
 * analysis display and the game logic, ensuring moves are properly
 * validated and executed through the store's action system.
 */

'use client';

import React from 'react';
import { usePositionAnalysis } from '@shared/hooks/usePositionAnalysis';
import { TablebasePanel } from '@shared/components/tablebase/TablebasePanel';
import { useTrainingStore } from '@shared/store/hooks';

/**
 * Props for the TablebaseAnalysisPanel component
 *
 * @interface TablebaseAnalysisPanelProps
 *
 * @property {string} fen - Current position in FEN notation to analyze
 * @property {boolean} isVisible - Controls panel visibility and API calls
 * @property {string} [previousFen] - Previous position for move context
 */
interface TablebaseAnalysisPanelProps {
  fen: string;
  isVisible: boolean;
  previousFen?: string;
}

/**
 * Tablebase analysis panel component
 *
 * @component
 * @description
 * Provides an interactive tablebase analysis interface that allows users to
 * explore optimal moves and directly play them. The component manages the
 * connection between the tablebase UI and the game state through the Zustand
 * store.
 *
 * @remarks
 * Component behavior:
 * - Only fetches tablebase data when visible (performance optimization)
 * - Displays loading state during API calls
 * - Allows direct move selection that updates the game
 * - Returns null when not visible (conditional rendering)
 *
 * The handleMoveSelect callback converts the selected move from the
 * tablebase panel into a game action through the store's handlePlayerMove.
 *
 * @example
 * ```tsx
 * <TablebaseAnalysisPanel
 *   fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4"
 *   isVisible={showAnalysis}
 *   previousFen={previousPosition}
 * />
 * ```
 *
 * @param {TablebaseAnalysisPanelProps} props - Component configuration
 * @returns {JSX.Element | null} Rendered panel or null if not visible
 */
export const TablebaseAnalysisPanel: React.FC<TablebaseAnalysisPanelProps> = ({
  fen,
  isVisible,
  previousFen,
}) => {
  const { lastEvaluation, isEvaluating, error } = usePositionAnalysis({
    fen,
    isEnabled: isVisible,
    ...(previousFen !== undefined && { previousFen }),
  });

  const [, trainingActions] = useTrainingStore();

  /**
   * Handle move selection from tablebase panel
   *
   * @private
   * @param {string} moveSan - Move in Standard Algebraic Notation
   *
   * @description
   * Bridges the gap between the tablebase UI and the game logic.
   * When a user clicks on a move in the tablebase panel, this handler
   * executes that move through the store's action system.
   *
   * @remarks
   * The store's handlePlayerMove action accepts SAN strings directly
   * and handles all validation, state updates, and side effects.
   */
  const handleMoveSelect = (moveSan: string): void => {
    // The store action accepts SAN strings directly
    // MoveResultGroup passes move.san, which chess.js can parse
    trainingActions.handlePlayerMove(moveSan);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="tablebase-analysis-panel" data-testid="tablebase-analysis-panel">
      <TablebasePanel
        tablebaseData={lastEvaluation?.tablebase || { isTablebasePosition: false }}
        onMoveSelect={handleMoveSelect}
        loading={isEvaluating}
        {...(error && { error })}
        compact={false}
      />
    </div>
  );
};
