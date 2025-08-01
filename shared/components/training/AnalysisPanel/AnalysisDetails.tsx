import React from 'react';
import { Move } from 'chess.js';
import { getEvaluationBarWidth } from '../../../utils/chess/evaluationHelpers';
import { PrincipalVariation } from '../PrincipalVariation';

interface MoveAnalysisData {
  move: Move;
  evaluation?: number;
  bestMove?: string;
  classification?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  // PHASE 2.2: Enhanced evaluation data
  pv?: string[];
  pvString?: string;
  depth?: number;
}

interface AnalysisDetailsProps {
  selectedMoveIndex: number | null;
  analysisData: MoveAnalysisData[];
}

const formatEvaluation = (evaluation?: number) => {
  if (evaluation === undefined) return '0.00';
  return evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2);
};

export const AnalysisDetails: React.FC<AnalysisDetailsProps> = React.memo(({
  selectedMoveIndex,
  analysisData
}) => {
  const selectedAnalysis = selectedMoveIndex !== null ? analysisData[selectedMoveIndex] : null;

  return (
    <div className="w-3/5 flex flex-col">
      <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedMoveIndex !== null && selectedAnalysis ? (
            `Zug ${selectedMoveIndex + 1}: ${selectedAnalysis.move.san}`
          ) : (
            'Wähle einen Zug'
          )}
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {selectedMoveIndex !== null && selectedAnalysis ? (
          <div className="space-y-3">
            {/* Compact Evaluation Bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Bewertung</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {formatEvaluation(selectedAnalysis.evaluation)}
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
                  style={{ 
                    width: `${getEvaluationBarWidth(selectedAnalysis.evaluation)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Schwarz führt</span>
                <span>Ausgeglichen</span>
                <span>Weiß führt</span>
              </div>
            </div>

            {/* Best Move */}
            {selectedAnalysis.bestMove && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Bester Zug</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                    Engine
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {selectedAnalysis.bestMove}
                </span>
              </div>
            )}

            {/* Principal Variation - PHASE 2.2 Enhancement */}
            {selectedAnalysis.pv && selectedAnalysis.pv.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <PrincipalVariation
                  pv={selectedAnalysis.pv}
                  pvString={selectedAnalysis.pvString}
                  evaluation={selectedAnalysis.evaluation}
                  depth={selectedAnalysis.depth}
                  interactive={true}
                  maxMoves={8} // Limit for mobile UI
                  onMoveClick={() => {
                    // TODO: Implement board preview functionality
                  }}
                  className="w-full"
                />
              </div>
            )}

            {/* Move Classification Details */}
            {selectedAnalysis.classification && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Zugbewertung</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Kategorie:</span>
                    <span className={`text-xs font-medium capitalize ${
                      selectedAnalysis.classification === 'excellent' ? 'text-green-600 dark:text-green-400' :
                      selectedAnalysis.classification === 'good' ? 'text-blue-600 dark:text-blue-400' :
                      selectedAnalysis.classification === 'inaccuracy' ? 'text-yellow-600 dark:text-yellow-400' :
                      selectedAnalysis.classification === 'mistake' ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {selectedAnalysis.classification === 'excellent' ? 'Ausgezeichnet' :
                       selectedAnalysis.classification === 'good' ? 'Gut' :
                       selectedAnalysis.classification === 'inaccuracy' ? 'Ungenauigkeit' :
                       selectedAnalysis.classification === 'mistake' ? 'Fehler' :
                       'Patzer'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Analysis Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Positionseinschätzung</h5>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {selectedAnalysis.evaluation !== undefined ? (
                  selectedAnalysis.evaluation > 2 ? "Weiß steht deutlich besser. Die Position sollte gewonnen werden können." :
                  selectedAnalysis.evaluation > 0.5 ? "Weiß hat einen kleinen Vorteil. Präzises Spiel ist erforderlich." :
                  selectedAnalysis.evaluation > -0.5 ? "Die Position ist ausgeglichen. Beide Seiten haben gleiche Chancen." :
                  selectedAnalysis.evaluation > -2 ? "Schwarz hat einen kleinen Vorteil. Vorsichtiges Spiel ist angebracht." :
                  "Schwarz steht deutlich besser. Die Position ist schwierig zu verteidigen."
                ) : (
                  "Keine detaillierte Bewertung verfügbar."
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wähle einen Zug aus der Liste um die Analyse zu sehen
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

AnalysisDetails.displayName = 'AnalysisDetails'; 