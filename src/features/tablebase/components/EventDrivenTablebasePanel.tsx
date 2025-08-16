/**
 * Event-driven Tablebase Panel Component
 *
 * @description
 * A React component that provides tablebase analysis with event-driven
 * communication. This component emits events for tablebase evaluations
 * and moves, allowing other parts of the UI to react to tablebase data
 * without tight coupling.
 */

'use client';

import React, { useEffect } from 'react';
import { useTablebase } from '../hooks/useTablebase';
import { trainingEvents } from '../../training/events/EventEmitter';
// Event-driven is now standard - no feature flag needed
import type { TablebaseMove } from '../types/interfaces';

/**
 * Props for the EventDrivenTablebasePanel component
 */
interface EventDrivenTablebasePanelProps {
  /** Current position in FEN notation */
  fen: string | null;
  /** Maximum number of moves to display */
  moveLimit?: number;
  /** Whether the panel is visible (affects data fetching) */
  isVisible?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Optional callback when user selects a move */
  onMoveSelect?: (move: TablebaseMove) => void;
}

/**
 * Event-driven tablebase analysis panel
 *
 * @description
 * This component fetches tablebase data and emits events for both evaluations
 * and moves. Other components can subscribe to these events to update their
 * state accordingly. The component also provides a traditional UI for
 * displaying the analysis results.
 *
 * Events emitted:
 * - 'tablebase:evaluation' - When evaluation data changes
 * - 'tablebase:moves' - When move data changes
 *
 * @example
 * ```tsx
 * <EventDrivenTablebasePanel
 *   fen={currentFen}
 *   moveLimit={5}
 *   isVisible={showTablebase}
 *   onMoveSelect={(move) => playMove(move.uci)}
 * />
 * ```
 */
export const EventDrivenTablebasePanel: React.FC<EventDrivenTablebasePanelProps> = ({
  fen,
  moveLimit = 5,
  isVisible = true,
  className = '',
  onMoveSelect,
}) => {
  // Event-driven is now always enabled

  const { evaluation, moves, isLoading, isEvaluationLoading, isMovesLoading, error } = useTablebase(
    isVisible ? fen : null,
    moveLimit
  );

  // Emit evaluation events
  useEffect(() => {
    if (!fen) return;

    trainingEvents.emit('tablebase:evaluation', {
      fen,
      outcome: evaluation?.outcome || 'draw',
      ...(evaluation?.dtm !== undefined && { dtm: evaluation.dtm }),
      ...(evaluation?.dtz !== undefined && { dtz: evaluation.dtz }),
      isLoading: isEvaluationLoading,
    });
  }, [evaluation, isEvaluationLoading, fen]);

  // Emit moves events
  useEffect(() => {
    if (!fen) return;

    trainingEvents.emit('tablebase:moves', {
      fen,
      moves:
        moves?.map(move => ({
          uci: move.uci,
          san: move.san,
          outcome: move.outcome,
          ...(move.dtm !== undefined && { dtm: move.dtm }),
        })) || [],
      isLoading: isMovesLoading,
    });
  }, [moves, isMovesLoading, fen]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className={`tablebase-panel tablebase-panel--error ${className}`}>
        <div className="tablebase-panel__header">
          <h3 className="tablebase-panel__title">Tablebase Analysis</h3>
        </div>
        <div className="tablebase-panel__content">
          <div className="tablebase-error">
            <p className="tablebase-error__message">
              {error.code === 'NOT_FOUND'
                ? 'Position not in tablebase'
                : 'Tablebase temporarily unavailable'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !evaluation && !moves) {
    return (
      <div className={`tablebase-panel tablebase-panel--loading ${className}`}>
        <div className="tablebase-panel__header">
          <h3 className="tablebase-panel__title">Tablebase Analysis</h3>
        </div>
        <div className="tablebase-panel__content">
          <div className="tablebase-loading">
            <div className="tablebase-loading__spinner"></div>
            <p className="tablebase-loading__text">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tablebase-panel ${className}`}>
      <div className="tablebase-panel__header">
        <h3 className="tablebase-panel__title">Tablebase Analysis</h3>
      </div>

      <div className="tablebase-panel__content">
        {/* Position Evaluation */}
        {evaluation && (
          <div className="tablebase-evaluation">
            <div className="tablebase-evaluation__header">
              <span className="tablebase-evaluation__label">Position:</span>
              <span
                className={`tablebase-evaluation__outcome tablebase-evaluation__outcome--${evaluation.outcome}`}
              >
                {evaluation.outcome.toUpperCase()}
              </span>
            </div>

            {evaluation.dtm !== undefined && (
              <div className="tablebase-evaluation__detail">
                <span className="tablebase-evaluation__detail-label">DTM:</span>
                <span className="tablebase-evaluation__detail-value">
                  {Math.abs(evaluation.dtm)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Best Moves */}
        {moves && moves.length > 0 && (
          <div className="tablebase-moves">
            <h4 className="tablebase-moves__title">Best Moves</h4>
            <div className="tablebase-moves__list">
              {moves.map(move => (
                <button
                  key={move.uci}
                  className={`tablebase-move tablebase-move--${move.outcome}`}
                  onClick={() => onMoveSelect?.(move)}
                  title={`${move.san} leads to ${move.outcome}${move.dtm ? ` in ${Math.abs(move.dtm)} moves` : ''}`}
                >
                  <span className="tablebase-move__notation">{move.san}</span>
                  <span className="tablebase-move__outcome">
                    {move.outcome === 'win' ? '+' : move.outcome === 'loss' ? '-' : '='}
                  </span>
                  {move.dtm !== undefined && (
                    <span className="tablebase-move__dtm">{Math.abs(move.dtm)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No data state */}
        {!evaluation && !moves && !isLoading && (
          <div className="tablebase-empty">
            <p className="tablebase-empty__message">
              No tablebase data available for this position.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
