/**
 * Refactored DualEvaluationPanel - Main Container Component
 * Uses EngineService for proper resource management
 * Split into smaller, focused sub-components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useEngine } from '@shared/hooks';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';
import { EngineErrorBoundary } from '@shared/components/ui';
import { EngineEvaluationCard } from './EngineEvaluationCard';
import { TablebaseEvaluationCard } from './TablebaseEvaluationCard';
import { EvaluationComparison } from './EvaluationComparison';

interface DualEvaluationPanelProps {
  fen: string;
  onEvaluationUpdate?: (evaluation: DualEvaluation) => void;
  isVisible: boolean;
}

export const DualEvaluationPanel: React.FC<DualEvaluationPanelProps> = ({ 
  fen, 
  onEvaluationUpdate,
  isVisible 
}) => {
  const [evaluation, setEvaluation] = useState<DualEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use managed engine service
  const { engine, isLoading: engineLoading, error: engineError } = useEngine({
    id: 'dual-evaluation',
    autoCleanup: true
  });

  useEffect(() => {
    if (!isVisible || !fen || !engine || engineLoading) return;

    let isMounted = true;

    const evaluatePosition = async () => {
      try {
        setIsEvaluating(true);
        setError(null);

        // Update engine position before evaluation
        engine.updatePosition(fen);
        const result = await engine.getDualEvaluation(fen);
        
        if (isMounted) {
          setEvaluation(result);
          onEvaluationUpdate?.(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Evaluation failed');
        }
      } finally {
        if (isMounted) {
          setIsEvaluating(false);
        }
      }
    };

    evaluatePosition();

    return () => {
      isMounted = false;
    };
  }, [fen, engine, engineLoading, isVisible, onEvaluationUpdate]);

  if (!isVisible) {
    return null;
  }

  if (engineError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="text-red-800 dark:text-red-300 text-sm">
          Engine Error: {engineError}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="text-red-800 dark:text-red-300 text-sm">
          Evaluation Error: {error}
        </div>
      </div>
    );
  }

  const isLoading = engineLoading || isEvaluating;

  return (
    <EngineErrorBoundary engineId="dual-evaluation">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EngineEvaluationCard 
            evaluation={evaluation?.engine || { score: 0, evaluation: 'Loading...', mate: null }}
            isLoading={isLoading}
          />
          
          <TablebaseEvaluationCard 
            evaluation={evaluation?.tablebase}
            isLoading={isLoading}
          />
        </div>

        {evaluation && (
          <EvaluationComparison evaluation={evaluation} />
        )}
      </div>
    </EngineErrorBoundary>
  );
};

// Re-export sub-components for direct use if needed
export { EngineEvaluationCard } from './EngineEvaluationCard';
export { TablebaseEvaluationCard } from './TablebaseEvaluationCard';
export { EvaluationComparison } from './EvaluationComparison';
export { SidebarEngineSection } from './SidebarEngineSection';