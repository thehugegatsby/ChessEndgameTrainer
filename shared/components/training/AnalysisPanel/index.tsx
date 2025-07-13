import React, { useState, useMemo } from 'react';
import { Move } from 'chess.js';
import { MoveAnalysis } from './MoveAnalysis';
import { AnalysisDetails } from './AnalysisDetails';

interface AnalysisPanelProps {
  history: Move[];
  initialFen?: string;
  onClose: () => void;
  isVisible: boolean;
}

interface MoveAnalysisData {
  move: Move;
  evaluation?: number;
  bestMove?: string;
  classification?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = React.memo(({ 
  history, 
  onClose,
  isVisible 
}) => {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);

  // Memoize analysis data generation for performance
  const analysisData = useMemo((): MoveAnalysisData[] => {
    return history.map((move, index): MoveAnalysisData => {
      // Simulate some evaluation scores for demo purposes
      // In production, this would come from a real engine
      const baseEval = Math.sin(index * 0.5) * 2;
      const noise = (Math.random() - 0.5) * 0.5;
      const evaluation = baseEval + noise;
      
      // Classify moves based on evaluation change
      let classification: MoveAnalysisData['classification'] = 'good';
      if (index > 0) {
        const prevEval = Math.sin((index - 1) * 0.5) * 2;
        const evalChange = Math.abs(evaluation - prevEval);
        if (evalChange > 1.5) classification = 'blunder';
        else if (evalChange > 1.0) classification = 'mistake';
        else if (evalChange > 0.5) classification = 'inaccuracy';
        else if (evalChange < 0.2) classification = 'excellent';
      }

      return {
        move,
        evaluation,
        classification,
        bestMove: index % 3 === 0 ? 'Nf3' : undefined // Simulate some best moves
      };
    });
  }, [history]);

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-lg border-t border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out z-50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`} 
      style={{ height: '400px' }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Spielanalyse</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">({history.length} Züge)</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Move Analysis List */}
        <MoveAnalysis
          analysisData={analysisData}
          selectedMoveIndex={selectedMoveIndex}
          onMoveSelect={setSelectedMoveIndex}
        />

        {/* Analysis Details */}
        <AnalysisDetails
          selectedMoveIndex={selectedMoveIndex}
          analysisData={analysisData}
        />
      </div>
    </div>
  );
});

AnalysisPanel.displayName = 'AnalysisPanel'; 