/**
 * @file Hook for managing chess analysis data
 * @module hooks/useAnalysisData
 *
 * @description
 * Simple state management hook for chess position analysis data.
 * Provides a clean interface for components that need to display or update analysis results.
 */

import { useState } from 'react';
import { type AnalysisData } from '@shared/types/analysisTypes';

/**
 * Return type for useAnalysisData hook
 */
export type UseAnalysisDataReturn = {
  readonly analysisData: AnalysisData | null;
  readonly setAnalysisData: (data: AnalysisData | null) => void;
};

/**
 * Hook for managing chess analysis data state
 *
 * @description
 * Provides a simple state container for analysis data with getter and setter.
 * Used by components that display position evaluations, best moves, and analysis results.
 *
 * @returns {Object} Hook return object
 * @returns {AnalysisData | null} returns.analysisData - Current analysis data or null
 * @returns {Function} returns.setAnalysisData - Function to update analysis data
 *
 * @example
 * ```tsx
 * function AnalysisPanel() {
 *   const { analysisData, setAnalysisData } = useAnalysisData();
 *
 *   useEffect(() => {
 *     // Fetch analysis when position changes
 *     fetchAnalysis(currentFen).then(setAnalysisData);
 *   }, [currentFen]);
 *
 *   if (!analysisData) return <div>No analysis available</div>;
 *
 *   return (
 *     <div>
 *       <div>Evaluation: {analysisData.evaluation}</div>
 *       <div>Best move: {analysisData.bestMove}</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link AnalysisData} for the data structure
 */
export function useAnalysisData(): UseAnalysisDataReturn {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  return { analysisData, setAnalysisData } as const;
}
