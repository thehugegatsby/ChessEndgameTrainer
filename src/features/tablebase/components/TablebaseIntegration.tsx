/**
 * Tablebase Integration Component
 * 
 * @description
 * A comprehensive integration component that connects the event-driven tablebase
 * panel with move feedback and the training system. This component serves as
 * the main entry point for tablebase functionality in the training UI.
 */

"use client";

import React from 'react';
import { EventDrivenTablebasePanel } from './EventDrivenTablebasePanel';
import { MoveFeedbackPanel } from './MoveFeedbackPanel';
import { useEventDrivenTraining } from '../../training/hooks/useEventDrivenTraining';
import { useTrainingStore } from '@shared/store/hooks';
import { trainingEvents } from '../../training/events/EventEmitter';
import type { TablebaseMove } from '../types/interfaces';

/**
 * Props for the TablebaseIntegration component
 */
interface TablebaseIntegrationProps {
  /** Current position in FEN notation */
  fen: string | null;
  /** Whether tablebase analysis should be shown */
  showAnalysis?: boolean;
  /** Whether move feedback should be shown */
  showFeedback?: boolean;
  /** Maximum number of moves to display in analysis */
  moveLimit?: number;
  /** Layout configuration */
  layout?: 'stacked' | 'side-by-side' | 'tabs';
  /** Custom CSS classes */
  className?: string;
}

/**
 * Tablebase integration component
 * 
 * @description
 * This component provides a complete tablebase integration for the training
 * interface. It includes both the analysis panel and move feedback, with
 * event-driven communication between components.
 * 
 * Features:
 * - Event-driven tablebase analysis display
 * - Move feedback with suggestions
 * - Automatic move execution through training store
 * - Responsive layout options
 * - Integration with feature flags
 * 
 * @example
 * ```tsx
 * <TablebaseIntegration
 *   fen={currentFen}
 *   showAnalysis={showTablebase}
 *   showFeedback={enableFeedback}
 *   layout="stacked"
 *   moveLimit={5}
 * />
 * ```
 */
export const TablebaseIntegration: React.FC<TablebaseIntegrationProps> = ({
  fen,
  showAnalysis = true,
  showFeedback = true,
  moveLimit = 5,
  layout = 'stacked',
  className = '',
}) => {
  const isEventDriven = useEventDrivenTraining();
  const [, trainingActions] = useTrainingStore();
  const [activeTab, setActiveTab] = React.useState<'analysis' | 'feedback'>('analysis');

  // Handle move selection from tablebase analysis
  const handleMoveSelect = React.useCallback((move: TablebaseMove) => {
    const from = move.uci.substring(0, 2);
    const to = move.uci.substring(2, 4);
    const promotion = move.uci.length > 4 ? move.uci.substring(4) : undefined;
    
    if (!isEventDriven) {
      // Fallback to direct store action
      const moveData = promotion 
        ? { from, to, promotion }
        : { from, to };
      trainingActions.handlePlayerMove(moveData);
      return;
    }

    // Emit move attempted event for event-driven handling
    const eventData = promotion
      ? { from, to, promotion }
      : { from, to };
    trainingEvents.emit('move:attempted', eventData);
  }, [isEventDriven, trainingActions]);

  // Show suggestions by switching to analysis tab
  const handleShowSuggestions = React.useCallback(() => {
    if (layout === 'tabs') {
      setActiveTab('analysis');
    }
  }, [layout]);

  // Don't render if not event-driven and no fallback needed
  if (!isEventDriven && !showAnalysis) {
    return null;
  }

  const analysisPanel = showAnalysis && (
    <EventDrivenTablebasePanel
      fen={fen}
      moveLimit={moveLimit}
      isVisible={showAnalysis}
      onMoveSelect={handleMoveSelect}
      className="flex-1"
    />
  );

  const feedbackPanel = showFeedback && (
    <MoveFeedbackPanel
      isVisible={showFeedback}
      onMoveSelect={handleMoveSelect}
      onShowSuggestions={handleShowSuggestions}
      className="flex-1"
    />
  );

  // Stacked layout (default)
  if (layout === 'stacked') {
    return (
      <div className={`tablebase-integration space-y-4 ${className}`}>
        {analysisPanel}
        {feedbackPanel}
      </div>
    );
  }

  // Side-by-side layout
  if (layout === 'side-by-side') {
    return (
      <div className={`tablebase-integration flex gap-4 ${className}`}>
        {analysisPanel}
        {feedbackPanel}
      </div>
    );
  }

  // Tabbed layout
  if (layout === 'tabs') {
    return (
      <div className={`tablebase-integration ${className}`}>
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          {showAnalysis && (
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Analysis
            </button>
          )}
          {showFeedback && (
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Feedback
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'analysis' && analysisPanel}
          {activeTab === 'feedback' && feedbackPanel}
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Simplified tablebase integration for basic usage
 * 
 * @example
 * ```tsx
 * <SimpleTablebaseIntegration fen={currentFen} />
 * ```
 */
export const SimpleTablebaseIntegration: React.FC<{
  fen: string | null;
  className?: string;
}> = ({ fen, className }) => {
  return (
    <TablebaseIntegration
      fen={fen}
      showAnalysis={true}
      showFeedback={true}
      layout="stacked"
      {...(className && { className })}
    />
  );
};