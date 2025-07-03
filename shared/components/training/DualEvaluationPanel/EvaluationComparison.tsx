/**
 * Evaluation Comparison Component
 * Shows side-by-side comparison and analysis of Engine vs Tablebase
 */

import React from 'react';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';

interface EvaluationComparisonProps {
  evaluation: DualEvaluation;
}

export const EvaluationComparison: React.FC<EvaluationComparisonProps> = ({
  evaluation
}) => {
  const getAgreementStatus = () => {
    if (!evaluation.tablebase?.isAvailable) {
      return {
        status: 'no-comparison',
        text: 'No tablebase data available',
        color: 'text-gray-500'
      };
    }

    const engineWin = evaluation.engine.score > 200 || (evaluation.engine.mate && evaluation.engine.mate > 0);
    const engineLoss = evaluation.engine.score < -200 || (evaluation.engine.mate && evaluation.engine.mate < 0);
    const engineDraw = Math.abs(evaluation.engine.score) <= 200 && !evaluation.engine.mate;

    const tablebaseWin = evaluation.tablebase?.result.category === 'win' || evaluation.tablebase?.result.category === 'cursed-win';
    const tablebaseLoss = evaluation.tablebase?.result.category === 'loss' || evaluation.tablebase?.result.category === 'blessed-loss';
    const tablebaseDraw = evaluation.tablebase?.result.category === 'draw';

    if ((engineWin && tablebaseWin) || (engineLoss && tablebaseLoss) || (engineDraw && tablebaseDraw)) {
      return {
        status: 'agreement',
        text: 'Engine and tablebase agree',
        color: 'text-green-600'
      };
    }

    return {
      status: 'disagreement',
      text: 'Engine and tablebase disagree',
      color: 'text-red-600'
    };
  };

  const agreement = getAgreementStatus();

  const getConfidenceLevel = () => {
    if (!evaluation.tablebase?.isAvailable) {
      return 'Engine evaluation only';
    }

    if (agreement.status === 'agreement') {
      return 'High confidence (both sources agree)';
    }

    return 'Theoretical result differs from engine assessment';
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
          Analysis Comparison
        </h3>
        <div className={`text-xs font-medium ${agreement.color}`}>
          {agreement.text}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
          <span className="text-gray-800 dark:text-gray-200">
            {getConfidenceLevel()}
          </span>
        </div>

        {evaluation.tablebase?.isAvailable && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Theory:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {evaluation.tablebase.result.category?.toUpperCase() || 'Unknown'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Practice:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {evaluation.engine.score > 200 ? 'WINNING' :
                 evaluation.engine.score < -200 ? 'LOSING' : 'EQUAL'}
              </span>
            </div>
          </>
        )}
      </div>

      {agreement.status === 'disagreement' && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-300">
          ⚠️ Engine evaluation may not reflect perfect play. Tablebase shows theoretical result.
        </div>
      )}
    </div>
  );
};