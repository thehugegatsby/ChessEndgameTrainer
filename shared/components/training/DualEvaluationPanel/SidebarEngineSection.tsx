/**
 * Sidebar Engine Section - Integrated engine evaluation display
 * Designed to fit seamlessly into the existing chess.com-style sidebar
 */

import React from 'react';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';
import { isTablebaseAvailable } from '@shared/utils/tablebaseHelpers';

interface SidebarEngineSectionProps {
  evaluation: DualEvaluation | null;
  isLoading?: boolean;
  isWhiteTurn?: boolean;
}

export const SidebarEngineSection: React.FC<SidebarEngineSectionProps> = ({
  evaluation,
  isLoading = false,
  isWhiteTurn = true
}) => {
  const getEvaluationColor = (score: number) => {
    if (Math.abs(score) < 50) return 'text-yellow-400';
    return score > 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatScore = (score: number, mate?: number | null) => {
    if (mate !== null && mate !== undefined) {
      return `M${Math.abs(mate)}`;
    }
    const formatted = (score / 100).toFixed(1);
    return score >= 0 ? `+${formatted}` : formatted;
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.min(100, Math.max(0, confidence));
    return (
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const getWinProbability = (wdl?: number) => {
    if (wdl === undefined) return null;
    
    // Convert WDL to win probability percentage
    const winProb = wdl === 2 ? 100 : wdl === -2 ? 0 : 50;
    return winProb;
  };

  return (
    <div className="border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          Engine Analysis
        </h3>
        {isLoading && (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
        )}
      </div>

      {!isLoading && evaluation ? (
        <div className="space-y-3">
          {/* Main evaluation display */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">Evaluation:</span>
              <span className={`text-2xl font-bold font-mono ${getEvaluationColor(evaluation.engine.score)}`}>
                {formatScore(evaluation.engine.score, evaluation.engine.mate)}
              </span>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Confidence</span>
              <span className="text-gray-400">95%</span>
            </div>
            {getConfidenceBar(95)}
          </div>

          {/* Win prediction for tablebase positions */}
          {isTablebaseAvailable(evaluation.tablebase) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Result:</span>
              <span className={`font-medium ${
                evaluation.tablebase.result.wdl === 2 ? 'text-green-400' : 
                evaluation.tablebase.result.wdl === -2 ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {evaluation.tablebase.result.wdl === 2 ? 'Win' : 
                 evaluation.tablebase.result.wdl === -2 ? 'Loss' : 
                 'Draw'}
                {evaluation.tablebase.result.dtz && ` in ${Math.abs(evaluation.tablebase.result.dtz)}`}
              </span>
            </div>
          )}

          {/* Best move suggestion (if available) */}
          {evaluation.engine.evaluation && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400 leading-relaxed">
                {evaluation.engine.evaluation}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          {isLoading ? 'Analyzing position...' : 'No evaluation available'}
        </div>
      )}
    </div>
  );
};